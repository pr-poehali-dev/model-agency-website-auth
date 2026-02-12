import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EditShiftTimeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shiftName: string;
  currentTime: string;
  onSave: (newTime: string) => void;
}

const EditShiftTimeDialog = ({
  isOpen,
  onClose,
  shiftName,
  currentTime,
  onSave
}: EditShiftTimeDialogProps) => {
  const [startTime, setStartTime] = useState(currentTime.split(' - ')[0] || '10:00');
  const [endTime, setEndTime] = useState(currentTime.split(' - ')[1] || '16:00');

  const handleSave = () => {
    const newTime = `${startTime} - ${endTime}`;
    onSave(newTime);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать время смены: {shiftName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Начало смены</Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">Конец смены</Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave}>
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditShiftTimeDialog;
