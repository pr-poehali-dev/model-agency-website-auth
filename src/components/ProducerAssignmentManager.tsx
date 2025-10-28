import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface User {
  email: string;
  role: string;
}

interface Model {
  id: number;
  name: string;
}

interface ProducerAssignment {
  id: number;
  producerEmail: string;
  modelId: number | null;
  operatorEmail: string | null;
  assignmentType: string;
}

const PRODUCER_API_URL = 'https://functions.poehali.dev/a480fde5-8cc8-42e8-a535-626e393f6fa6';
const USERS_API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';

const ProducerAssignmentManager = ({ currentUserEmail, currentUserRole }: { currentUserEmail: string; currentUserRole: string }) => {
  const [producers, setProducers] = useState<User[]>([]);
  const [operators, setOperators] = useState<User[]>([]);
  const [models] = useState<Model[]>([
    { id: 1, name: 'Anastasia Ivanova' },
    { id: 2, name: 'Ekaterina Sokolova' },
    { id: 3, name: 'Maria Petrova' },
    { id: 4, name: 'Victoria Romanova' }
  ]);
  const [assignments, setAssignments] = useState<ProducerAssignment[]>([]);
  const [selectedProducer, setSelectedProducer] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
    loadAssignments();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch(USERS_API_URL);
      const users = await response.json();
      setProducers(users.filter((u: User) => u.role === 'producer'));
      setOperators(users.filter((u: User) => u.role === 'operator'));
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  const loadAssignments = async () => {
    try {
      const response = await fetch(PRODUCER_API_URL);
      const data = await response.json();
      setAssignments(data);
    } catch (err) {
      console.error('Failed to load assignments', err);
    }
  };

  const isModelAssigned = (producerEmail: string, modelId: number) => {
    return assignments.some(
      a => a.producerEmail === producerEmail && a.modelId === modelId && a.assignmentType === 'model'
    );
  };

  const isOperatorAssigned = (producerEmail: string, operatorEmail: string) => {
    return assignments.some(
      a => a.producerEmail === producerEmail && a.operatorEmail === operatorEmail && a.assignmentType === 'operator'
    );
  };

  const handleToggleModel = async (producerEmail: string, modelId: number) => {
    const assigned = isModelAssigned(producerEmail, modelId);

    try {
      if (assigned) {
        await fetch(PRODUCER_API_URL, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Email': currentUserEmail,
            'X-User-Role': currentUserRole
          },
          body: JSON.stringify({ producerEmail, modelId, assignmentType: 'model' })
        });
        toast({ title: 'Модель откреплена', description: 'Модель убрана из доступа продюсера' });
      } else {
        await fetch(PRODUCER_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Email': currentUserEmail,
            'X-User-Role': currentUserRole
          },
          body: JSON.stringify({ producerEmail, modelId, assignmentType: 'model' })
        });
        toast({ title: 'Модель назначена', description: 'Продюсер теперь видит эту модель' });
      }
      loadAssignments();
    } catch (err) {
      toast({ title: 'Ошибка', description: 'Не удалось выполнить операцию', variant: 'destructive' });
    }
  };

  const handleToggleOperator = async (producerEmail: string, operatorEmail: string) => {
    const assigned = isOperatorAssigned(producerEmail, operatorEmail);

    try {
      if (assigned) {
        await fetch(PRODUCER_API_URL, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Email': currentUserEmail,
            'X-User-Role': currentUserRole
          },
          body: JSON.stringify({ producerEmail, operatorEmail, assignmentType: 'operator' })
        });
        toast({ title: 'Оператор откреплен', description: 'Продюсер больше не управляет этим оператором' });
      } else {
        await fetch(PRODUCER_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Email': currentUserEmail,
            'X-User-Role': currentUserRole
          },
          body: JSON.stringify({ producerEmail, operatorEmail, assignmentType: 'operator' })
        });
        toast({ title: 'Оператор назначен', description: 'Продюсер может управлять этим оператором' });
      }
      loadAssignments();
    } catch (err) {
      toast({ title: 'Ошибка', description: 'Не удалось выполнить операцию', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-serif font-bold text-foreground mb-2">Назначения продюсерам</h2>
        <p className="text-muted-foreground">Управление доступом продюсеров к моделям и операторам</p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">Выберите продюсера</label>
        <select
          value={selectedProducer}
          onChange={(e) => setSelectedProducer(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-border rounded-lg bg-card text-foreground"
        >
          <option value="">-- Выберите продюсера --</option>
          {producers.map(p => (
            <option key={p.email} value={p.email}>{p.email}</option>
          ))}
        </select>
      </div>

      {selectedProducer && (
        <Tabs defaultValue="models" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="models">Модели</TabsTrigger>
            <TabsTrigger value="operators">Операторы</TabsTrigger>
          </TabsList>

          <TabsContent value="models">
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Модели для {selectedProducer}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {models.map(model => {
                  const assigned = isModelAssigned(selectedProducer, model.id);
                  return (
                    <div key={model.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card/50">
                      <span className="text-foreground font-medium">{model.name}</span>
                      <Button
                        onClick={() => handleToggleModel(selectedProducer, model.id)}
                        variant={assigned ? 'destructive' : 'default'}
                        size="sm"
                      >
                        <Icon name={assigned ? 'UserMinus' : 'UserPlus'} size={16} className="mr-2" />
                        {assigned ? 'Открепить' : 'Назначить'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="operators">
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Операторы для {selectedProducer}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {operators.map(operator => {
                  const assigned = isOperatorAssigned(selectedProducer, operator.email);
                  return (
                    <div key={operator.email} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card/50">
                      <span className="text-foreground font-medium">{operator.email}</span>
                      <Button
                        onClick={() => handleToggleOperator(selectedProducer, operator.email)}
                        variant={assigned ? 'destructive' : 'default'}
                        size="sm"
                      >
                        <Icon name={assigned ? 'UserMinus' : 'UserPlus'} size={16} className="mr-2" />
                        {assigned ? 'Открепить' : 'Назначить'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ProducerAssignmentManager;
