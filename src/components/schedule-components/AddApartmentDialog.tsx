import { useState } from 'react';
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

interface AddApartmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; address: string; locationsCount: number; visibility: string }) => void;
  loading?: boolean;
}

const AddApartmentDialog = ({ isOpen, onClose, onSave, loading }: AddApartmentDialogProps) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [locationsCount, setLocationsCount] = useState('2');
  const [visibility, setVisibility] = useState('all');

  const handleSave = () => {
    if (!name.trim() || !address.trim()) return;
    onSave({
      name: name.trim(),
      address: address.trim().toUpperCase(),
      locationsCount: parseInt(locationsCount),
      visibility
    });
    setName('');
    setAddress('');
    setLocationsCount('2');
    setVisibility('all');
  };

  const handleClose = () => {
    setName('');
    setAddress('');
    setLocationsCount('2');
    setVisibility('all');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая квартира</DialogTitle>
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
            <label className="text-sm font-medium mb-2 block">Количество локаций</label>
            <Select value={locationsCount} onValueChange={setLocationsCount}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 локация</SelectItem>
                <SelectItem value="2">2 локации</SelectItem>
                <SelectItem value="3">3 локации</SelectItem>
                <SelectItem value="4">4 локации</SelectItem>
                <SelectItem value="5">5 локаций</SelectItem>
              </SelectContent>
            </Select>
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
            <Button variant="outline" onClick={handleClose}>
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || !address.trim() || loading}
            >
              {loading ? 'Создание...' : 'Создать'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddApartmentDialog;
