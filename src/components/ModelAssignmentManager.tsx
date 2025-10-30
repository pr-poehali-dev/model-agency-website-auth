import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';



interface User {
  email: string;
  role: string;
}

interface Assignment {
  id: number;
  operatorEmail: string;
  modelEmail: string;
  assignedBy: string;
  assignedAt: string;
}

const ASSIGNMENTS_API_URL = 'https://functions.poehali.dev/b7d8dd69-ab09-460d-999b-c0a1002ced30';
const API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';
const PRODUCER_API_URL = 'https://functions.poehali.dev/a480fde5-8cc8-42e8-a535-626e393f6fa6';

interface ModelAssignmentManagerProps {
  currentUserEmail: string;
  currentUserRole: string;
  onModelAssigned?: (modelEmail: string) => void;
}

const ModelAssignmentManager = ({ currentUserEmail, currentUserRole, onModelAssigned }: ModelAssignmentManagerProps) => {
  const [operators, setOperators] = useState<User[]>([]);
  const [models, setModels] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [producerAssignments, setProducerAssignments] = useState<any[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      if (currentUserRole === 'producer') {
        const assignments = await loadProducerAssignments();
        await loadOperators(assignments);
        await loadModels(assignments);
      } else {
        await loadOperators();
        await loadModels();
      }
      await loadAssignments();
    };
    init();
  }, [currentUserRole]);

  const loadOperators = async (assignments?: any[]) => {
    try {
      const response = await fetch(API_URL);
      const users = await response.json();
      let ops = users.filter((u: User) => u.role === 'operator');
      
      if (currentUserRole === 'producer') {
        const assignmentsToUse = assignments || producerAssignments;
        const assignedOperatorEmails = assignmentsToUse
          .filter(a => a.assignmentType === 'operator')
          .map(a => a.operatorEmail);
        ops = ops.filter((op: User) => assignedOperatorEmails.includes(op.email));
      }
      
      setOperators(ops);
    } catch (err) {
      console.error('Failed to load operators', err);
    }
  };

  const loadModels = async (assignments?: any[]) => {
    try {
      const response = await fetch(API_URL);
      const users = await response.json();
      let contentMakers = users.filter((u: User) => u.role === 'content_maker');
      
      if (currentUserRole === 'producer') {
        const assignmentsToUse = assignments || producerAssignments;
        const assignedModelEmails = assignmentsToUse
          .filter(a => a.assignmentType === 'model')
          .map(a => a.modelEmail);
        contentMakers = contentMakers.filter((cm: User) => assignedModelEmails.includes(cm.email));
      }
      
      setModels(contentMakers);
    } catch (err) {
      console.error('Failed to load models', err);
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

  const loadProducerAssignments = async () => {
    try {
      const response = await fetch(`${PRODUCER_API_URL}?producer=${encodeURIComponent(currentUserEmail)}`);
      const data = await response.json();
      setProducerAssignments(data);
      return data;
    } catch (err) {
      console.error('Failed to load producer assignments', err);
      return [];
    }
  };

  const isAssigned = (operatorEmail: string, modelEmail: string) => {
    return assignments.some(a => a.operatorEmail === operatorEmail && a.modelEmail === modelEmail);
  };

  const handleToggleAssignment = async (operatorEmail: string, modelEmail: string) => {
    const assigned = isAssigned(operatorEmail, modelEmail);

    try {
      if (assigned) {
        const response = await fetch(ASSIGNMENTS_API_URL, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Email': currentUserEmail,
            'X-User-Role': currentUserRole
          },
          body: JSON.stringify({ operatorEmail, modelEmail })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Delete failed:', errorData);
          throw new Error(errorData.error || 'Failed to delete assignment');
        }
        
        toast({ title: 'Модель откреплена', description: 'Модель успешно откреплена от оператора' });
      } else {
        const response = await fetch(ASSIGNMENTS_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Email': currentUserEmail,
            'X-User-Role': currentUserRole
          },
          body: JSON.stringify({ operatorEmail, modelEmail })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Post failed:', errorData);
          throw new Error(errorData.error || 'Failed to assign');
        }
        
        toast({ title: 'Модель назначена', description: 'Модель успешно назначена оператору. Открываем финансы...' });
        
        if (onModelAssigned) {
          setTimeout(() => onModelAssigned(modelEmail), 500);
        }
      }
      await loadAssignments();
    } catch (err) {
      console.error('Assignment toggle error:', err);
      toast({ title: 'Ошибка', description: err instanceof Error ? err.message : 'Не удалось выполнить операцию', variant: 'destructive' });
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
              const assigned = isAssigned(selectedOperator, model.email);
              return (
                <div key={model.email} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card/50">
                  <span className="text-foreground font-medium">{model.email}</span>
                  <Button
                    onClick={() => handleToggleAssignment(selectedOperator, model.email)}
                    variant={assigned ? 'destructive' : 'default'}
                    size="sm">
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