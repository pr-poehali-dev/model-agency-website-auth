import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

interface Team {
  operatorEmail: string;
  operatorName: string;
  modelEmail: string;
  modelName: string;
  displayName: string;
}

interface TeamManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMembers: TeamMember[];
  teams: Team[];
  onTeamsChange: () => void;
  assignmentsApiUrl: string;
}

const TeamManagementDialog = ({
  open,
  onOpenChange,
  teamMembers,
  teams,
  onTeamsChange,
  assignmentsApiUrl
}: TeamManagementDialogProps) => {
  const [operatorEmail, setOperatorEmail] = useState('');
  const [modelEmail, setModelEmail] = useState('');
  const { toast } = useToast();

  const operators = teamMembers.filter(member => member.role === 'operator' || member.role === 'solo_maker');
  const models = teamMembers.filter(member => member.role === 'content_maker');

  const handleCreateTeam = async () => {
    if (!operatorEmail || !modelEmail) {
      toast({
        title: 'Ошибка',
        description: 'Выберите оператора и модель',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(assignmentsApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorEmail, modelEmail })
      });

      if (response.ok) {
        toast({
          title: 'Команда создана',
          description: 'Новая команда успешно добавлена'
        });
        setOperatorEmail('');
        setModelEmail('');
        onTeamsChange();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать команду',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteTeam = async (team: Team) => {
    try {
      const response = await fetch(assignmentsApiUrl, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorEmail: team.operatorEmail,
          modelEmail: team.modelEmail
        })
      });

      if (response.ok) {
        toast({
          title: 'Команда удалена',
          description: `Команда ${team.displayName} удалена`
        });
        onTeamsChange();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить команду',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Управление командами</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Создать новую команду</h3>
            <div className="grid grid-cols-2 gap-4">
              <Select value={operatorEmail} onValueChange={setOperatorEmail}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите оператора" />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op.id} value={op.email}>
                      {op.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={modelEmail} onValueChange={setModelEmail}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите модель" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.email}>
                      {model.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateTeam} className="w-full">
              <Icon name="Plus" size={16} className="mr-2" />
              Создать команду
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Существующие команды ({teams.length})</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {teams.map((team, idx) => (
                <Card key={idx} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{team.displayName}</div>
                      <div className="text-xs text-muted-foreground">
                        {team.operatorName} + {team.modelName}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTeam(team)}
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamManagementDialog;
