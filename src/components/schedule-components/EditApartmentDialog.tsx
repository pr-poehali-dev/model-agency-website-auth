import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EditApartmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { newName: string; newAddress: string; visibility: string }) => void;
  currentName: string;
  currentAddress: string;
  currentVisibility: string;
  loading?: boolean;
}

const EditApartmentDialog = ({ isOpen, onClose, onSave, currentName, currentAddress, currentVisibility, loading }: EditApartmentDialogProps) => {
  const [name, setName] = useState(currentName);
  const [address, setAddress] = useState(currentAddress);
  const [visibility, setVisibility] = useState(currentVisibility);

  useEffect(() => {
    setName(currentName);
    setAddress(currentAddress);
    setVisibility(currentVisibility);
  }, [currentName, currentAddress, currentVisibility]);

  const handleSave = () => {
    if (!name.trim() || !address.trim()) return;
    onSave({
      newName: name.trim(),
      newAddress: address.trim().toUpperCase(),
      visibility
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
          <div>
            <label className="text-sm font-medium mb-2 block">Кто видит квартиру</label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все (продюсеры и операторы)</SelectItem>
                <SelectItem value="producers">Только продюсеры</SelectItem>
                <SelectItem value="operators">Только операторы</SelectItem>
              </SelectContent>
            </Select>
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
