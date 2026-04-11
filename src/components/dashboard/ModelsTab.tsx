import { useState, useEffect, useRef } from 'react';
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

interface ModelPair {
  id: number;
  model1_email: string;
  model2_email: string;
  pair_photo_url: string | null;
  created_by: string;
  model1_name: string;
  model1_photo: string | null;
  model2_name: string;
  model2_photo: string | null;
  model_percentage: number;
  operator_percentage: number;
  producer_percentage: number;
  operator_email: string | null;
  operator_name: string | null;
}

interface ModelsTabProps {
  models: Model[];
  operatorAssignments?: number[];
  producerAssignments?: number[];
  assignedProducer?: string;
  onViewFinances?: (modelId: number, modelName: string) => void;
  userRole?: string;
}

const PAIRS_API_URL = 'https://functions.poehali.dev/cdf24c81-2f72-4f88-bddc-77533a2d119f';
const AUTH_API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';

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
  const [modelAccounts, setModelAccounts] = useState<Record<number, Record<string, unknown>>>({});
  const [producerAssignmentsData, setProducerAssignmentsData] = useState<ProducerAssignment[]>([]);
  const [users, setUsers] = useState<Record<string, string>[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const [pairs, setPairs] = useState<ModelPair[]>([]);
  const [pairDialogOpen, setPairDialogOpen] = useState(false);
  const [pairModel1, setPairModel1] = useState<string>('');
  const [pairModel2, setPairModel2] = useState<string>('');
  const [pairLoading, setPairLoading] = useState(false);
  const [uploadingPairPhoto, setUploadingPairPhoto] = useState<number | null>(null);
  const pairPhotoInputRef = useRef<HTMLInputElement>(null);
  const [activePairPhotoId, setActivePairPhotoId] = useState<number | null>(null);

  // Настройки пары (проценты + оператор)
  const [settingsDialogPair, setSettingsDialogPair] = useState<ModelPair | null>(null);
  const [settingsModelPct, setSettingsModelPct] = useState<string>('17.5');
  const [settingsOperatorPct, setSettingsOperatorPct] = useState<string>('15');
  const [settingsProducerPct, setSettingsProducerPct] = useState<string>('10');
  const [settingsOperatorEmail, setSettingsOperatorEmail] = useState<string>('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [operators, setOperators] = useState<Record<string, string>[]>([]);

  const BACKEND_URL = 'https://functions.poehali.dev/6eb743de-2cae-499d-8e8f-4aa975cb470c';
  const PRODUCER_API_URL = 'https://functions.poehali.dev/a480fde5-8cc8-42e8-a535-626e393f6fa6';
  const USERS_API_URL = AUTH_API_URL;
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      loadCurrentUser();
      await loadUsers();
      if (userRole) {
        await loadProducerAssignments();
      }
      if (models.length > 0) {
        await loadAllModelAccounts();
      }
      if (userRole === 'director' || userRole === 'producer') {
        await loadPairs();
      }
      setLoading(false);
    };
    init();
  }, [userRole, models]);

  const loadPairs = async () => {
    try {
      const response = await fetch(PAIRS_API_URL, {
        headers: {
          'X-User-Email': localStorage.getItem('userEmail') || '',
          'X-User-Role': userRole || '',
          'X-Auth-Token': localStorage.getItem('authToken') || ''
        }
      });
      const data = await response.json();
      setPairs(data.pairs || []);
    } catch (error) {
      console.error('Error loading pairs:', error);
    }
  };

  const loadOperators = async () => {
    try {
      const response = await fetch(USERS_API_URL, {
        headers: { 'X-Auth-Token': localStorage.getItem('authToken') || '' },
        credentials: 'include'
      });
      if (!response.ok) return;
      const data = await response.json();
      const ops = (Array.isArray(data) ? data : []).filter((u: Record<string, string>) => u.role === 'operator');
      setOperators(ops);
    } catch (_) {
      setOperators([]);
    }
  };

  const openPairSettings = async (pair: ModelPair) => {
    setSettingsDialogPair(pair);
    setSettingsModelPct(String(pair.model_percentage ?? 17.5));
    setSettingsOperatorPct(String(pair.operator_percentage ?? 15));
    setSettingsProducerPct(String(pair.producer_percentage ?? 10));
    setSettingsOperatorEmail(pair.operator_email || '');
    await loadOperators();
  };

  const handleSavePairSettings = async () => {
    if (!settingsDialogPair) return;
    setSettingsSaving(true);
    try {
      const mp = parseFloat(settingsModelPct) || 0;
      const op = parseFloat(settingsOperatorPct) || 0;
      const pp = parseFloat(settingsProducerPct) || 0;
      const response = await fetch(PAIRS_API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': currentUserEmail,
          'X-User-Role': userRole || '',
          'X-Auth-Token': localStorage.getItem('authToken') || ''
        },
        body: JSON.stringify({
          pair_id: settingsDialogPair.id,
          model_percentage: mp,
          operator_percentage: op,
          producer_percentage: pp,
          operator_email: settingsOperatorEmail || null
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка');
      toast({ title: 'Настройки сохранены' });
      setSettingsDialogPair(null);
      await loadPairs();
    } catch (error) {
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось сохранить', variant: 'destructive' });
    } finally {
      setSettingsSaving(false);
    }
  };

  const settingsTotal = () => {
    const mp = parseFloat(settingsModelPct) || 0;
    const op = parseFloat(settingsOperatorPct) || 0;
    const pp = parseFloat(settingsProducerPct) || 0;
    return Math.round((mp * 2 + op + pp) * 100) / 100;
  };

  const loadAllModelAccounts = async () => {
    const accountsData: Record<number, Record<string, unknown>> = {};
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
      const response = await fetch(USERS_API_URL, {
        method: 'GET',
        headers: {
          'X-Auth-Token': localStorage.getItem('authToken') || ''
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        setUsers([]);
        return;
      }
      
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      setUsers([]);
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
      
      toast({ title: 'Продюсер откреплен', description: `Модель ${modelName} откреплена от продюсера` });
      await loadProducerAssignments();
    } catch (error) {
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось открепить продюсера', variant: 'destructive' });
    }
  };

  const fetchModelAccounts = async (modelId: number) => {
    try {
      const response = await fetch(`${BACKEND_URL}?model_id=${modelId}`, {
        headers: { 'X-User-Role': userRole || 'operator' }
      });
      const data = await response.json();
      return data.accounts || {};
    } catch (error) {
      return {};
    }
  };

  const handleSaveAccounts = async (accounts: Record<string, unknown>) => {
    if (!selectedModel) return;
    try {
      const response = await fetch(BACKEND_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-User-Role': userRole || 'operator' },
        body: JSON.stringify({ model_id: selectedModel.id, model_name: selectedModel.name, accounts })
      });
      if (response.ok) {
        setModelAccounts({ ...modelAccounts, [selectedModel.id]: accounts });
        toast({ title: 'Успешно', description: 'Аккаунты сохранены' });
        setAccountsDialogOpen(false);
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось сохранить аккаунты', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить аккаунты', variant: 'destructive' });
    }
  };

  const handleCreatePair = async () => {
    if (!pairModel1 || !pairModel2) return;
    setPairLoading(true);
    try {
      const response = await fetch(PAIRS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': currentUserEmail,
          'X-User-Role': userRole || '',
          'X-Auth-Token': localStorage.getItem('authToken') || ''
        },
        body: JSON.stringify({ model1_email: pairModel1, model2_email: pairModel2 })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка');
      toast({ title: 'Пара создана', description: 'Модели объединены в пару' });
      setPairDialogOpen(false);
      setPairModel1('');
      setPairModel2('');
      await loadPairs();
    } catch (error) {
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось создать пару', variant: 'destructive' });
    } finally {
      setPairLoading(false);
    }
  };

  const handleDeletePair = async (pairId: number) => {
    try {
      const response = await fetch(`${PAIRS_API_URL}?pair_id=${pairId}`, {
        method: 'DELETE',
        headers: {
          'X-User-Email': currentUserEmail,
          'X-User-Role': userRole || '',
          'X-Auth-Token': localStorage.getItem('authToken') || ''
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка');
      toast({ title: 'Пара расформирована' });
      await loadPairs();
    } catch (error) {
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось удалить пару', variant: 'destructive' });
    }
  };

  const handlePairPhotoUpload = async (pairId: number, file: File) => {
    setUploadingPairPhoto(pairId);
    try {
      const toBase64 = (f: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(f);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
      });
      const base64 = await toBase64(file);

      const uploadResponse = await fetch('https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066'.replace('67fd6902-6170-487e-bb46-f6d14ec99066', '67fd6902-6170-487e-bb46-f6d14ec99066'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': localStorage.getItem('authToken') || ''
        },
        body: JSON.stringify({ action: 'upload_photo', file_base64: base64, file_name: file.name, content_type: file.type })
      });

      let photoUrl: string | null = null;
      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        photoUrl = uploadData.url || null;
      }

      if (!photoUrl) {
        photoUrl = URL.createObjectURL(file);
      }

      const response = await fetch(PAIRS_API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': currentUserEmail,
          'X-User-Role': userRole || '',
          'X-Auth-Token': localStorage.getItem('authToken') || ''
        },
        body: JSON.stringify({ pair_id: pairId, pair_photo_url: photoUrl })
      });
      if (!response.ok) throw new Error('Не удалось сохранить фото');
      toast({ title: 'Фото пары обновлено' });
      await loadPairs();
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить фото', variant: 'destructive' });
    } finally {
      setUploadingPairPhoto(null);
      setActivePairPhotoId(null);
    }
  };

  const handleRemovePairPhoto = async (pairId: number) => {
    try {
      const response = await fetch(PAIRS_API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': currentUserEmail,
          'X-User-Role': userRole || '',
          'X-Auth-Token': localStorage.getItem('authToken') || ''
        },
        body: JSON.stringify({ pair_id: pairId, pair_photo_url: null })
      });
      if (!response.ok) throw new Error('Ошибка');
      toast({ title: 'Фото удалено' });
      await loadPairs();
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить фото', variant: 'destructive' });
    }
  };

  const pairedModelEmails = new Set(pairs.flatMap(p => [p.model1_email, p.model2_email]));

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
    (m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
    !(userRole === 'director' || userRole === 'producer' ? pairedModelEmails.has(m.email) : false)
  );

  const filteredPairs = pairs.filter(p =>
    p.model1_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.model2_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.model1_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.model2_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canManagePairs = userRole === 'director' || userRole === 'producer';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Icon name="Loader2" size={48} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка моделей...</p>
        </div>
      </div>
    );
  }

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
          {canManagePairs && (
            <Button size="sm" onClick={() => setPairDialogOpen(true)} className="gap-2 shrink-0">
              <Icon name="Users" size={16} />
              Создать пару
            </Button>
          )}
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

      {/* Скрытый input для загрузки фото пары */}
      <input
        ref={pairPhotoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && activePairPhotoId !== null) {
            handlePairPhotoUpload(activePairPhotoId, file);
          }
          e.target.value = '';
        }}
      />

      {/* Диалог создания пары */}
      <Dialog open={pairDialogOpen} onOpenChange={setPairDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Объединить моделей в пару</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Первая модель</label>
              <select
                value={pairModel1}
                onChange={e => setPairModel1(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Выберите модель...</option>
                {displayModels.filter(m => !pairedModelEmails.has(m.email) && m.email !== pairModel2).map(m => (
                  <option key={m.id} value={m.email}>{m.name} ({m.email})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Вторая модель</label>
              <select
                value={pairModel2}
                onChange={e => setPairModel2(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Выберите модель...</option>
                {displayModels.filter(m => !pairedModelEmails.has(m.email) && m.email !== pairModel1).map(m => (
                  <option key={m.id} value={m.email}>{m.name} ({m.email})</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setPairDialogOpen(false)}>Отмена</Button>
              <Button className="flex-1" disabled={!pairModel1 || !pairModel2 || pairLoading} onClick={handleCreatePair}>
                {pairLoading ? <Icon name="Loader2" size={16} className="animate-spin mr-2" /> : null}
                Объединить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог настроек пары */}
      <Dialog open={!!settingsDialogPair} onOpenChange={(open) => { if (!open) setSettingsDialogPair(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Настройки пары</DialogTitle>
          </DialogHeader>
          {settingsDialogPair && (
            <div className="space-y-5 pt-2">
              <p className="text-sm text-muted-foreground">
                {settingsDialogPair.model1_name} & {settingsDialogPair.model2_name}
              </p>

              <div className="space-y-3">
                <p className="text-sm font-medium">Распределение 60% от общего чека</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Каждой модели (%)</label>
                    <Input
                      type="number"
                      min="0" max="60" step="0.5"
                      value={settingsModelPct}
                      onChange={e => setSettingsModelPct(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">× 2 = {((parseFloat(settingsModelPct)||0)*2).toFixed(1)}%</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Оператору (%)</label>
                    <Input
                      type="number"
                      min="0" max="60" step="0.5"
                      value={settingsOperatorPct}
                      onChange={e => setSettingsOperatorPct(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Продюсеру (%)</label>
                    <Input
                      type="number"
                      min="0" max="60" step="0.5"
                      value={settingsProducerPct}
                      onChange={e => setSettingsProducerPct(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 flex flex-col justify-end">
                    <label className="text-xs text-muted-foreground">Итого</label>
                    <div className={`text-lg font-bold ${settingsTotal() === 60 ? 'text-green-600' : 'text-destructive'}`}>
                      {settingsTotal()}% / 60%
                    </div>
                  </div>
                </div>

                {settingsTotal() !== 60 && (
                  <p className="text-xs text-destructive">Сумма должна быть ровно 60%</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Оператор пары</label>
                <select
                  value={settingsOperatorEmail}
                  onChange={e => setSettingsOperatorEmail(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Без оператора</option>
                  {operators.map((op) => (
                    <option key={op.email} value={op.email}>{op.fullName || op.email}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setSettingsDialogPair(null)}>Отмена</Button>
                <Button
                  className="flex-1"
                  disabled={settingsSaving || settingsTotal() !== 60}
                  onClick={handleSavePairSettings}
                >
                  {settingsSaving ? <Icon name="Loader2" size={16} className="animate-spin mr-2" /> : null}
                  Сохранить
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {(filteredModels.length === 0 && filteredPairs.length === 0) && searchQuery && (
        <Card className="p-8 text-center">
          <Icon name="Search" size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">Ничего не найдено по запросу "{searchQuery}"</p>
        </Card>
      )}

      {/* Карточки пар */}
      {filteredPairs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Icon name="Users" size={15} />
            Пары ({filteredPairs.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPairs.map((pair) => {
              const model1 = displayModels.find(m => m.email === pair.model1_email);
              const model2 = displayModels.find(m => m.email === pair.model2_email);
              const photo1 = pair.model1_photo || model1?.image;
              const photo2 = pair.model2_photo || model2?.image;

              return (
                <Card key={pair.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 border-primary/20">
                  {/* Фото блок */}
                  <div className="aspect-[4/5] relative bg-gradient-to-br from-muted/50 to-muted overflow-hidden group">
                    {pair.pair_photo_url ? (
                      /* Единое общее фото */
                      <img
                        src={pair.pair_photo_url}
                        alt="Пара"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      /* Два фото, разделённых линией */
                      <div className="flex w-full h-full">
                        <div className="w-1/2 h-full overflow-hidden relative">
                          {photo1 ? (
                            <img src={photo1} alt={pair.model1_name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Icon name="User" size={32} className="text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="w-px bg-white/60 z-10 shrink-0" />
                        <div className="w-1/2 h-full overflow-hidden relative">
                          {photo2 ? (
                            <img src={photo2} alt={pair.model2_name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Icon name="User" size={32} className="text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    <div className="absolute top-3 left-3">
                      <Badge className="bg-primary/90 text-primary-foreground text-xs gap-1">
                        <Icon name="Users" size={11} />
                        Пара
                      </Badge>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="font-bold text-lg text-white mb-0.5 drop-shadow-lg leading-tight">
                        {pair.model1_name} & {pair.model2_name}
                      </h3>
                    </div>
                  </div>

                  {/* Информация */}
                  <div className="p-5 space-y-3">
                    {canManagePairs && (
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Icon name="Mail" size={13} />
                          <span className="truncate">{pair.model1_email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Icon name="Mail" size={13} />
                          <span className="truncate">{pair.model2_email}</span>
                        </div>
                      </div>
                    )}

                    {/* Управление фото */}
                    {canManagePairs && (
                      <div className="pt-2 border-t space-y-2">
                        <p className="text-xs text-muted-foreground font-medium">Фото пары</p>
                        <div className="flex gap-2">
                          {pair.pair_photo_url ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 gap-1 text-xs"
                                disabled={uploadingPairPhoto === pair.id}
                                onClick={() => { setActivePairPhotoId(pair.id); pairPhotoInputRef.current?.click(); }}
                              >
                                {uploadingPairPhoto === pair.id ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="Upload" size={13} />}
                                Заменить
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemovePairPhoto(pair.id)}
                              >
                                <Icon name="Trash2" size={13} />
                                Удалить
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 gap-1 text-xs"
                              disabled={uploadingPairPhoto === pair.id}
                              onClick={() => { setActivePairPhotoId(pair.id); pairPhotoInputRef.current?.click(); }}
                            >
                              {uploadingPairPhoto === pair.id ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="ImagePlus" size={13} />}
                              Добавить общее фото
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Проценты и оператор */}
                    {canManagePairs && (
                      <div className="pt-2 border-t space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Каждой модели</span>
                          <span className="font-medium text-foreground">{pair.model_percentage}%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Оператор</span>
                          <span className="font-medium text-foreground">
                            {pair.operator_name || pair.operator_email || '—'} · {pair.operator_percentage}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Продюсер</span>
                          <span className="font-medium text-foreground">{pair.producer_percentage}%</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-1 text-xs mt-1"
                          onClick={() => openPairSettings(pair)}
                        >
                          <Icon name="Settings2" size={13} />
                          Настроить проценты и оператора
                        </Button>
                      </div>
                    )}

                    {/* Расформировать */}
                    {canManagePairs && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeletePair(pair.id)}
                      >
                        <Icon name="UserMinus" size={15} />
                        Расформировать пару
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Одиночные модели */}
      {filteredModels.length > 0 && (
        <div className="space-y-3">
          {canManagePairs && filteredPairs.length > 0 && (
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Icon name="User" size={15} />
              Одиночные модели ({filteredModels.length})
            </h3>
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
      )}
    </div>
  );
};

export default ModelsTab;