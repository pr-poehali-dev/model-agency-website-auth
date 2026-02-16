import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EditApartmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { newName: string; newAddress: string }) => void;
  currentName: string;
  currentAddress: string;
  loading?: boolean;
}

const EditApartmentDialog = ({ isOpen, onClose, onSave, currentName, currentAddress, loading }: EditApartmentDialogProps) => {
  const [name, setName] = useState(currentName);
  const [address, setAddress] = useState(currentAddress);

  useEffect(() => {
    setName(currentName);
    setAddress(currentAddress);
  }, [currentName, currentAddress]);

  const handleSave = () => {
    if (!name.trim() || !address.trim()) return;
    onSave({
      newName: name.trim(),
      newAddress: address.trim().toUpperCase()
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать квартиру</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Адрес</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Командорская 5/3"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Номер квартиры</label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Например: 42 КВАРТИРА"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || !address.trim() || loading}
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditApartmentDialog;
