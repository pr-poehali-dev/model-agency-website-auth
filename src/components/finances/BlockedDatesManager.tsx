import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Icon from "@/components/ui/icon";
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Icon name="Plus" size={16} className="mr-2" />
              Заблокировать дату
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Заблокировать дату</DialogTitle>
              <DialogDescription>
                Выберите дату, когда модели не смогут вводить токены
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
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
            </div>
          </DialogContent>
        </Dialog>
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
