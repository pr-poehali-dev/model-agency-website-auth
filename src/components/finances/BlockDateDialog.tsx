import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Icon from "@/components/ui/icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BlockDateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onBlockDate: (date: string, reason: string, platform: 'all' | 'chaturbate' | 'stripchat') => Promise<void>;
  onBlockRange: (startDate: string, endDate: string, reason: string, platform: 'all' | 'chaturbate' | 'stripchat') => Promise<void>;
}

const BlockDateDialog = ({ isOpen, onOpenChange, onBlockDate, onBlockRange }: BlockDateDialogProps) => {
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newPlatform, setNewPlatform] = useState<'all' | 'chaturbate' | 'stripchat'>('all');
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rangeReason, setRangeReason] = useState("");
  const [rangePlatform, setRangePlatform] = useState<'all' | 'chaturbate' | 'stripchat'>('all');

  const handleBlockSingle = async () => {
    await onBlockDate(newDate, newReason, newPlatform);
    setNewDate("");
    setNewReason("");
    setNewPlatform('all');
  };

  const handleBlockRangeClick = async () => {
    await onBlockRange(startDate, endDate, rangeReason, rangePlatform);
    setStartDate("");
    setEndDate("");
    setRangeReason("");
    setRangePlatform('all');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Icon name="Plus" size={16} className="mr-2" />
          Заблокировать
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Заблокировать даты</DialogTitle>
          <DialogDescription>
            Выберите одну дату или диапазон дат для блокировки
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="single" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">
              <Icon name="Calendar" size={16} className="mr-2" />
              Одна дата
            </TabsTrigger>
            <TabsTrigger value="range">
              <Icon name="CalendarRange" size={16} className="mr-2" />
              Диапазон
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Дата
              </label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Площадка
              </label>
              <Select value={newPlatform} onValueChange={(value: 'all' | 'chaturbate' | 'stripchat') => setNewPlatform(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Icon name="Globe" size={16} />
                      <span>Все площадки</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="chaturbate">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span>Chaturbate</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="stripchat">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span>Stripchat</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Причина (опционально)
              </label>
              <Textarea
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="Например: Технические работы, выходной день..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button onClick={handleBlockSingle}>
                Заблокировать
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="range" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  С (начало)
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  По (конец)
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {startDate && endDate && (() => {
              const start = new Date(startDate);
              const end = new Date(endDate);
              const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              return days > 0 && (
                <div className="bg-muted/50 p-3 rounded-lg text-sm">
                  <Icon name="Info" size={16} className="inline mr-2" />
                  Будет заблокировано дней: <span className="font-semibold">{days}</span>
                </div>
              );
            })()}

            <div>
              <label className="text-sm font-medium mb-2 block">
                Площадка
              </label>
              <Select value={rangePlatform} onValueChange={(value: 'all' | 'chaturbate' | 'stripchat') => setRangePlatform(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Icon name="Globe" size={16} />
                      <span>Все площадки</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="chaturbate">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span>Chaturbate</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="stripchat">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span>Stripchat</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Причина (опционально)
              </label>
              <Textarea
                value={rangeReason}
                onChange={(e) => setRangeReason(e.target.value)}
                placeholder="Например: Праздничные дни, отпуск..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button onClick={handleBlockRangeClick}>
                Заблокировать диапазон
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default BlockDateDialog;
