import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BlockedDate {
  date: string;
  reason: string;
  created_by: string;
  created_at: string;
  platform: 'all' | 'chaturbate' | 'stripchat';
}

interface MassDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  blockedDates: BlockedDate[];
  selectedDates: string[];
  onToggleDateSelection: (date: string) => void;
  onSelectAllDates: () => void;
  onMassDelete: (deleteStartDate: string, deleteEndDate: string) => Promise<void>;
  formatDate: (dateString: string) => string;
}

const MassDeleteDialog = ({
  isOpen,
  onOpenChange,
  blockedDates,
  selectedDates,
  onToggleDateSelection,
  onSelectAllDates,
  onMassDelete,
  formatDate,
}: MassDeleteDialogProps) => {
  const [deleteStartDate, setDeleteStartDate] = useState("");
  const [deleteEndDate, setDeleteEndDate] = useState("");

  const handleMassDeleteClick = async () => {
    await onMassDelete(deleteStartDate, deleteEndDate);
    setDeleteStartDate("");
    setDeleteEndDate("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Icon name="Trash2" size={16} className="mr-2" />
          Массовое удаление
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Массовое удаление дат</DialogTitle>
          <DialogDescription>
            Выберите даты для разблокировки
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="range" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="range">
              <Icon name="CalendarRange" size={16} className="mr-2" />
              По диапазону
            </TabsTrigger>
            <TabsTrigger value="select">
              <Icon name="ListChecks" size={16} className="mr-2" />
              Выбрать вручную
            </TabsTrigger>
          </TabsList>

          <TabsContent value="range" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  С (начало)
                </label>
                <Input
                  type="date"
                  value={deleteStartDate}
                  onChange={(e) => setDeleteStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  По (конец)
                </label>
                <Input
                  type="date"
                  value={deleteEndDate}
                  onChange={(e) => setDeleteEndDate(e.target.value)}
                />
              </div>
            </div>

            {deleteStartDate && deleteEndDate && (() => {
              const start = new Date(deleteStartDate);
              const end = new Date(deleteEndDate);
              const count = blockedDates.filter(bd => {
                const d = new Date(bd.date);
                return d >= start && d <= end;
              }).length;
              return count > 0 && (
                <div className="bg-destructive/10 p-3 rounded-lg text-sm">
                  <Icon name="AlertTriangle" size={16} className="inline mr-2" />
                  Будет разблокировано дат: <span className="font-semibold">{count}</span>
                </div>
              );
            })()}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button variant="destructive" onClick={handleMassDeleteClick}>
                Разблокировать диапазон
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="select" className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Выбрано: {selectedDates.length} из {blockedDates.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onSelectAllDates}
              >
                {selectedDates.length === blockedDates.length ? 'Снять всё' : 'Выбрать всё'}
              </Button>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-3">
              {blockedDates.map((blocked) => (
                <div
                  key={blocked.date}
                  onClick={() => onToggleDateSelection(blocked.date)}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    selectedDates.includes(blocked.date)
                      ? 'bg-destructive/10 border-destructive'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                      selectedDates.includes(blocked.date)
                        ? 'bg-destructive border-destructive'
                        : 'border-muted-foreground'
                    }`}>
                      {selectedDates.includes(blocked.date) && (
                        <Icon name="Check" size={14} className="text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{formatDate(blocked.date)}</span>
                      {blocked.reason && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {blocked.reason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                }}
              >
                Отмена
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleMassDeleteClick}
                disabled={selectedDates.length === 0}
              >
                Разблокировать ({selectedDates.length})
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MassDeleteDialog;
