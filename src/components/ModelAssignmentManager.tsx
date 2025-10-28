import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Model {
  id: number;
  name: string;
}

interface User {
  email: string;
  role: string;
}

interface Assignment {
  id: number;
  operatorEmail: string;
  modelId: number;
  assignedBy: string;
  assignedAt: string;
}

const ASSIGNMENTS_API_URL = 'https://functions.poehali.dev/b7d8dd69-ab09-460d-999b-c0a1002ced30';
const API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';

const ModelAssignmentManager = ({ currentUserEmail, currentUserRole }: { currentUserEmail: string; currentUserRole: string }) => {
  const [operators, setOperators] = useState<User[]>([]);
  const [models] = useState<Model[]>([
    { id: 1, name: 'Anastasia Ivanova' },
    { id: 2, name: 'Ekaterina Sokolova' },
    { id: 3, name: 'Maria Petrova' },
    { id: 4, name: 'Victoria Romanova' }
  ]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadOperators();
    loadAssignments();
  }, []);

  const loadOperators = async () => {
    try {
      const response = await fetch(API_URL);
      const users = await response.json();
      const ops = users.filter((u: User) => u.role === 'operator');
      setOperators(ops);
    } catch (err) {
      console.error('Failed to load operators', err);
    }
  };

  const loadAssignments = async () => {
    try {
      const response = await fetch(ASSIGNMENTS_API_URL);
      const data = await response.json();
      setAssignments(data);
    } catch (err) {
      console.error('Failed to load assignments', err);
    }
  };

  const isAssigned = (operatorEmail: string, modelId: number) => {
    return assignments.some(a => a.operatorEmail === operatorEmail && a.modelId === modelId);
  };

  const handleToggleAssignment = async (operatorEmail: string, modelId: number) => {
    const assigned = isAssigned(operatorEmail, modelId);

    try {
      if (assigned) {
        await fetch(ASSIGNMENTS_API_URL, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Email': currentUserEmail,
            'X-User-Role': currentUserRole
          },
          body: JSON.stringify({ operatorEmail, modelId })
        });
        toast({ title: 'Модель откреплена', description: 'Модель успешно откреплена от оператора' });
      } else {
        await fetch(ASSIGNMENTS_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Email': currentUserEmail,
            'X-User-Role': currentUserRole
          },
          body: JSON.stringify({ operatorEmail, modelId })
        });
        toast({ title: 'Модель назначена', description: 'Модель успешно назначена оператору' });
      }
      loadAssignments();
    } catch (err) {
      toast({ title: 'Ошибка', description: 'Не удалось выполнить операцию', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-serif font-bold text-foreground mb-2">Назначение моделей</h2>
        <p className="text-muted-foreground">Управляйте доступом операторов к моделям</p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">Выберите оператора</label>
        <select
          value={selectedOperator}
          onChange={(e) => setSelectedOperator(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-border rounded-lg bg-card text-foreground"
        >
          <option value="">-- Выберите оператора --</option>
          {operators.map(op => (
            <option key={op.email} value={op.email}>{op.email}</option>
          ))}
        </select>
      </div>

      {selectedOperator && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4">Модели для {selectedOperator}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {models.map(model => {
              const assigned = isAssigned(selectedOperator, model.id);
              return (
                <div key={model.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card/50">
                  <span className="text-foreground font-medium">{model.name}</span>
                  <Button
                    onClick={() => handleToggleAssignment(selectedOperator, model.id)}
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
      )}
    </div>
  );
};

export default ModelAssignmentManager;
