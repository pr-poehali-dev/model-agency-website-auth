import { useState, useEffect } from 'react';
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
import { Team, EditCellData } from './types';

interface EditShiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editCell: EditCellData | null;
  teams: Team[];
  selectedTeam: string;
  onTeamChange: (value: string) => void;
  onSave: () => void;
}

const EditShiftDialog = ({
  isOpen,
  onClose,
  editCell,
  teams,
  selectedTeam,
  onTeamChange,
  onSave
}: EditShiftDialogProps) => {
  const [internalSelectedTeam, setInternalSelectedTeam] = useState('');

  useEffect(() => {
    if (isOpen && editCell) {
      setInternalSelectedTeam(editCell.currentValue);
    }
  }, [isOpen, editCell]);

  const handleSave = () => {
    onTeamChange(internalSelectedTeam);
    onSave();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать смену</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Выберите команду</label>
            <Select value={internalSelectedTeam} onValueChange={setInternalSelectedTeam}>
              <SelectTrigger>
                <SelectValue placeholder="Не назначено" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Не назначено</SelectItem>
                {teams.map((team, idx) => (
                  <SelectItem key={idx} value={team.displayName}>
                    {team.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={handleSave}>
              Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { EditShiftDialog };