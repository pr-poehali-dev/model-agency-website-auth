import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
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

const BLOCKED_DATES_API = "https://functions.poehali.dev/b37e0422-df3c-42f3-9e5c-04d8f1eedd5c";

interface BlockedDate {
  date: string;
  reason: string;
  created_by: string;
  created_at: string;
}

interface BlockedDatesManagerProps {
  userEmail: string;
}

const BlockedDatesManager = ({ userEmail }: BlockedDatesManagerProps) => {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rangeReason, setRangeReason] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteStartDate, setDeleteStartDate] = useState("");
  const [deleteEndDate, setDeleteEndDate] = useState("");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchBlockedDates = async () => {
    try {
      const response = await fetch(BLOCKED_DATES_API, {
        headers: {
          "X-User-Id": userEmail,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBlockedDates(data.blocked_dates || []);
      }
    } catch (error) {
      console.error("Error fetching blocked dates:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить заблокированные даты",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedDates();
  }, [userEmail]);

  const handleBlockDate = async () => {
    if (!newDate) {
      toast({
        title: "Ошибка",
        description: "Выберите дату для блокировки",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(BLOCKED_DATES_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userEmail,
        },
        body: JSON.stringify({
          date: newDate,
          reason: newReason,
        }),
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Дата заблокирована",
        });
        setNewDate("");
        setNewReason("");
        setIsDialogOpen(false);
        fetchBlockedDates();
      } else {
        const data = await response.json();
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось заблокировать дату",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error blocking date:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось заблокировать дату",
        variant: "destructive",
      });
    }
  };

  const handleBlockRange = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Ошибка",
        description: "Выберите начальную и конечную даты",
        variant: "destructive",
      });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      toast({
        title: "Ошибка",
        description: "Начальная дата должна быть раньше конечной",
        variant: "destructive",
      });
      return;
    }

    const dates: string[] = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    let successCount = 0;
    let errorCount = 0;

    for (const date of dates) {
      try {
        const response = await fetch(BLOCKED_DATES_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": userEmail,
          },
          body: JSON.stringify({
            date,
            reason: rangeReason,
          }),
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast({
        title: "Успешно",
        description: `Заблокировано дат: ${successCount}${errorCount > 0 ? `, ошибок: ${errorCount}` : ''}`,
      });
    }

    setStartDate("");
    setEndDate("");
    setRangeReason("");
    setIsDialogOpen(false);
    fetchBlockedDates();
  };

  const handleUnblockDate = async (date: string) => {
    try {
      const response = await fetch(`${BLOCKED_DATES_API}?date=${date}`, {
        method: "DELETE",
        headers: {
          "X-User-Id": userEmail,
        },
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Дата разблокирована",
        });
        fetchBlockedDates();
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось разблокировать дату",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error unblocking date:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось разблокировать дату",
        variant: "destructive",
      });
    }
  };

  const handleMassDelete = async () => {
    let datesToDelete: string[] = [];

    if (selectedDates.length > 0) {
      datesToDelete = selectedDates;
    } else if (deleteStartDate && deleteEndDate) {
      const start = new Date(deleteStartDate);
      const end = new Date(deleteEndDate);

      if (start > end) {
        toast({
          title: "Ошибка",
          description: "Начальная дата должна быть раньше конечной",
          variant: "destructive",
        });
        return;
      }

      datesToDelete = blockedDates
        .map(bd => bd.date)
        .filter(date => {
          const d = new Date(date);
          return d >= start && d <= end;
        });
    }

    if (datesToDelete.length === 0) {
      toast({
        title: "Ошибка",
        description: "Нет дат для удаления",
        variant: "destructive",
      });
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const date of datesToDelete) {
      try {
        const response = await fetch(`${BLOCKED_DATES_API}?date=${date}`, {
          method: "DELETE",
          headers: {
            "X-User-Id": userEmail,
          },
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast({
        title: "Успешно",
        description: `Разблокировано дат: ${successCount}${errorCount > 0 ? `, ошибок: ${errorCount}` : ''}`,
      });
    }

    setDeleteStartDate("");
    setDeleteEndDate("");
    setSelectedDates([]);
    setIsDeleteDialogOpen(false);
    fetchBlockedDates();
  };

  const toggleDateSelection = (date: string) => {
    setSelectedDates(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date]
    );
  };

  const selectAllDates = () => {
    if (selectedDates.length === blockedDates.length) {
      setSelectedDates([]);
    } else {
      setSelectedDates(blockedDates.map(bd => bd.date));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Icon name="Loader2" className="animate-spin" size={24} />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Icon name="CalendarX" size={20} />
            Заблокированные даты
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Модели не смогут вводить токены за заблокированные даты
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Отмена
                  </Button>
                  <Button onClick={handleBlockDate}>
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
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Отмена
                  </Button>
                  <Button onClick={handleBlockRange}>
                    Заблокировать диапазон
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {blockedDates.length > 0 && (
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
                      onClick={() => setIsDeleteDialogOpen(false)}
                    >
                      Отмена
                    </Button>
                    <Button variant="destructive" onClick={handleMassDelete}>
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
                      onClick={selectAllDates}
                    >
                      {selectedDates.length === blockedDates.length ? 'Снять всё' : 'Выбрать всё'}
                    </Button>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-3">
                    {blockedDates.map((blocked) => (
                      <div
                        key={blocked.date}
                        onClick={() => toggleDateSelection(blocked.date)}
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
                        setSelectedDates([]);
                        setIsDeleteDialogOpen(false);
                      }}
                    >
                      Отмена
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleMassDelete}
                      disabled={selectedDates.length === 0}
                    >
                      Разблокировать ({selectedDates.length})
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
        </div>
      </div>

      {blockedDates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Icon name="CalendarCheck" size={48} className="mx-auto mb-3 opacity-50" />
          <p>Нет заблокированных дат</p>
        </div>
      ) : (
        <div className="space-y-3">
          {blockedDates.map((blocked) => (
            <div
              key={blocked.date}
              className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Icon name="Calendar" size={16} className="text-muted-foreground" />
                  <span className="font-medium">{formatDate(blocked.date)}</span>
                </div>
                {blocked.reason && (
                  <p className="text-sm text-muted-foreground ml-6">
                    {blocked.reason}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2 ml-6">
                  Заблокировал: {blocked.created_by}
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUnblockDate(blocked.date)}
                className="text-destructive hover:text-destructive"
              >
                <Icon name="Trash2" size={16} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default BlockedDatesManager;