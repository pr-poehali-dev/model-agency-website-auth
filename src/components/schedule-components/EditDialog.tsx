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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Team {
  operatorEmail: string;
  operatorName: string;
  modelEmail: string;
  modelName: string;
  displayName: string;
}

interface EditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTeam: string;
  onSelectedTeamChange: (team: string) => void;
  teams: Team[];
  onSave: () => void;
}

const EditDialog = ({
  isOpen,
  onClose,
  selectedTeam,
  onSelectedTeamChange,
  teams,
  onSave
}: EditDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать смену</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Команда (оператор/модель)</label>
            <Select value={selectedTeam || 'empty'} onValueChange={(val) => onSelectedTeamChange(val === 'empty' ? '' : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите команду" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empty">Пусто</SelectItem>
                {teams.map((team, index) => (
                  <SelectItem key={index} value={team.displayName}>
                    {team.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Или введите вручную</label>
            <Input 
              value={selectedTeam} 
              onChange={(e) => onSelectedTeamChange(e.target.value)}
              placeholder="Например: Иван / Мария"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={onSave}>
              Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditDialog;
