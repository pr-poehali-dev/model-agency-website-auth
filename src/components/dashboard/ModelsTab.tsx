import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import ModelAccountsDialog from '@/components/ModelAccountsDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface Model {
  id: number;
  email: string;
  name: string;
  image: string;
  height: string;
  bust: string;
  waist: string;
  hips: string;
  experience: string;
  specialty: string;
  status: string;
}

interface ProducerAssignment {
  id: number;
  producerEmail: string;
  modelEmail: string | null;
  operatorEmail: string | null;
  assignedBy: string;
  assignedAt: string;
  assignmentType: string;
}

interface ModelsTabProps {
  models: Model[];
  operatorAssignments?: number[];
  producerAssignments?: number[];
  assignedProducer?: string;
  onViewFinances?: (modelId: number, modelName: string) => void;
  userRole?: string;
}

const ModelsTab = ({ 
  models, 
  operatorAssignments = [], 
  producerAssignments = [],
  assignedProducer = '',
  onViewFinances,
  userRole 
}: ModelsTabProps) => {

  const [accountsDialogOpen, setAccountsDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [modelAccounts, setModelAccounts] = useState<any>({});
  const [producerAssignmentsData, setProducerAssignmentsData] = useState<ProducerAssignment[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const BACKEND_URL = 'https://functions.poehali.dev/6eb743de-2cae-499d-8e8f-4aa975cb470c';
  const PRODUCER_API_URL = 'https://functions.poehali.dev/a480fde5-8cc8-42e8-a535-626e393f6fa6';
  const USERS_API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (userRole) {
      loadProducerAssignments();
    }
  }, [userRole]);

  useEffect(() => {
    if (models.length > 0) {
      loadAllModelAccounts();
    }
  }, [models]);

  const loadAllModelAccounts = async () => {
    const accountsData: any = {};
    for (const model of models) {
      const accounts = await fetchModelAccounts(model.id);
      if (accounts && Object.keys(accounts).length > 0) {
        accountsData[model.id] = accounts;
      }
    }
    setModelAccounts(accountsData);
  };

  const loadCurrentUser = () => {
    const email = localStorage.getItem('userEmail') || '';
    setCurrentUserEmail(email);
  };

  const loadProducerAssignments = async () => {
    try {
      const email = localStorage.getItem('userEmail') || '';
      const url = userRole === 'producer' 
        ? `${PRODUCER_API_URL}?producer=${encodeURIComponent(email)}&type=model`
        : `${PRODUCER_API_URL}?type=model`;
      const response = await fetch(url);
      const data = await response.json();
      setProducerAssignmentsData(data);
    } catch (error) {
      console.error('Error loading producer assignments:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch(USERS_API_URL);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const getProducerName = (modelEmail: string): string => {
    const assignment = producerAssignmentsData.find(a => a.modelEmail === modelEmail);
    if (!assignment) return 'MBA Production';
    
    const producer = users.find(u => u.email === assignment.producerEmail);
    return producer?.fullName || assignment.producerEmail;
  };

  const getProducerAssignment = (modelEmail: string): ProducerAssignment | undefined => {
    return producerAssignmentsData.find(a => a.modelEmail === modelEmail);
  };

  const handleUnassignProducer = async (modelEmail: string, modelName: string) => {
    const assignment = getProducerAssignment(modelEmail);
    if (!assignment) return;

    try {
      const response = await fetch(PRODUCER_API_URL, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': currentUserEmail,
          'X-User-Role': userRole || 'director'
        },
        body: JSON.stringify({ 
          producerEmail: assignment.producerEmail, 
          modelEmail: assignment.modelEmail, 
          assignmentType: 'model' 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unassign producer');
      }
      
      toast({ 
        title: 'Продюсер откреплен', 
        description: `Модель ${modelName} откреплена от продюсера` 
      });
      
      await loadProducerAssignments();
    } catch (error) {
      console.error('Error unassigning producer:', error);
      toast({ 
        title: 'Ошибка', 
        description: error instanceof Error ? error.message : 'Не удалось открепить продюсера', 
        variant: 'destructive' 
      });
    }
  };

  const fetchModelAccounts = async (modelId: number) => {
    try {
      const response = await fetch(`${BACKEND_URL}?model_id=${modelId}`, {
        headers: {
          'X-User-Role': userRole || 'operator'
        }
      });
      const data = await response.json();
      return data.accounts || {};
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return {};
    }
  };

  const handleSaveAccounts = async (accounts: any) => {
    if (!selectedModel) return;
    
    try {
      const response = await fetch(BACKEND_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': userRole || 'operator'
        },
        body: JSON.stringify({
          model_id: selectedModel.id,
          model_name: selectedModel.name,
          accounts
        })
      });
      
      if (response.ok) {
        setModelAccounts({ ...modelAccounts, [selectedModel.id]: accounts });
        toast({
          title: 'Успешно',
          description: 'Аккаунты сохранены',
        });
        setAccountsDialogOpen(false);
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось сохранить аккаунты',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving accounts:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить аккаунты',
        variant: 'destructive',
      });
    }
  };



  const displayModels = userRole === 'content_maker'
    ? []
    : userRole === 'solo_maker'
    ? models.filter(m => m.email === currentUserEmail)
    : operatorAssignments.length > 0 
    ? models.filter(m => operatorAssignments.includes(m.id))
    : producerAssignments.length > 0
    ? models.filter(m => producerAssignments.includes(m.email))
    : models;

  const filteredModels = displayModels.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-foreground mb-2">
            {userRole === 'solo_maker' ? 'Мой профиль' : 'Наши модели'}
          </h2>
          <p className="text-muted-foreground">
            {userRole === 'solo_maker' ? 'Управляйте своими аккаунтами и следите за статистикой' : ''}
          </p>
          {operatorAssignments.length > 0 && userRole !== 'solo_maker' && (
            <Badge variant="secondary" className="mt-2">
              Назначено вам: {operatorAssignments.length} {operatorAssignments.length === 1 ? 'модель' : 'моделей'}
            </Badge>
          )}
          {producerAssignments.length > 0 && userRole !== 'solo_maker' && (
            <Badge variant="secondary" className="mt-2">
              Назначено вам: {producerAssignments.length} {producerAssignments.length === 1 ? 'модель' : 'моделей'}
            </Badge>
          )}
          {assignedProducer && userRole !== 'solo_maker' && (
            <div className="mt-2">
              <Badge variant="outline">Ваш продюсер: {assignedProducer}</Badge>
            </div>
          )}
          {userRole === 'solo_maker' && filteredModels.length > 0 && (
            <Badge variant="secondary" className="mt-2">
              <Icon name="Star" size={14} className="mr-1" />
              Соло-модель
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative flex-1 lg:w-64">
            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск моделей..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {selectedModel && (
        <ModelAccountsDialog
          open={accountsDialogOpen}
          onOpenChange={setAccountsDialogOpen}
          modelName={selectedModel.name}
          userRole={userRole}
          accounts={modelAccounts[selectedModel.id] || {}}
          onSave={handleSaveAccounts}
        />
      )}



      {filteredModels.length === 0 && searchQuery && (
        <Card className="p-8 text-center">
          <Icon name="Search" size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">Ничего не найдено по запросу "{searchQuery}"</p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModels.map((model) => {
          const producerName = getProducerName(model.email);
          const producerAssignment = getProducerAssignment(model.email);
          const accounts = modelAccounts[model.id] || {};
          const hasAccounts = Object.keys(accounts).length > 0;
          
          return (
            <Card key={model.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2">
              <div className="aspect-[4/5] relative bg-gradient-to-br from-muted/50 to-muted overflow-hidden group">
                <img
                  src={model.image}
                  alt={model.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                


                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="font-bold text-xl text-white mb-1 drop-shadow-lg">
                    {model.name}
                  </h3>
                  <p className="text-sm text-white/90 drop-shadow-md">{model.specialty}</p>
                </div>
              </div>
              
              <div className="p-5 space-y-4">
                {(userRole === 'director' || userRole === 'producer') && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon name="Mail" size={14} />
                    <span className="truncate">{model.email}</span>
                  </div>
                )}

                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon name="User" size={14} />
                      <span>Продюсер:</span>
                    </div>
                    <span className="text-sm font-medium">{producerName}</span>
                  </div>
                  
                  {userRole === 'director' && producerAssignment && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnassignProducer(model.email, model.name)}
                      className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Icon name="UserMinus" size={16} />
                      Открепить продюсера
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {onViewFinances && (
                    <Button 
                      variant="default" 
                      onClick={() => onViewFinances(model.id, model.name)}
                      className="flex-1 gap-2"
                      size="sm"
                    >
                      <Icon name="DollarSign" size={16} />
                      Финансы
                    </Button>
                  )}

                  {(userRole === 'operator' || userRole === 'producer' || userRole === 'director' || userRole === 'solo_maker') && (
                    <Button 
                      variant="outline" 
                      onClick={async () => {
                        setSelectedModel(model);
                        const accounts = await fetchModelAccounts(model.id);
                        setModelAccounts({ ...modelAccounts, [model.id]: accounts });
                        setAccountsDialogOpen(true);
                      }}
                      className="flex-1 gap-2"
                      size="sm"
                    >
                      <Icon name="Globe" size={16} />
                      {hasAccounts ? 'Аккаунты' : 'Добавить'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ModelsTab;