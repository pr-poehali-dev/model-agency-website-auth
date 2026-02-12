import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EditTimeSlotDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentTime: string;
  onSave: (newTime: string) => void;
}

const EditTimeSlotDialog = ({
  isOpen,
  onClose,
  currentTime,
  onSave
}: EditTimeSlotDialogProps) => {
  const [time, setTime] = useState(currentTime.substring(0, 5));

  const handleSave = () => {
    const formattedTime = time.length === 5 ? time : time.substring(0, 5);
    onSave(formattedTime);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Изменить время смены</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="time">Время начала смены</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
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

export default EditTimeSlotDialog;