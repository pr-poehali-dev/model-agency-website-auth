import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Icon from "@/components/ui/icon";
import BlockDateDialog from "./BlockDateDialog";
import MassDeleteDialog from "./MassDeleteDialog";
import BlockedDatesList from "./BlockedDatesList";
import { authenticatedFetch } from '@/lib/api';

const BLOCKED_DATES_API = "https://functions.poehali.dev/b37e0422-df3c-42f3-9e5c-04d8f1eedd5c";

interface BlockedDate {
  date: string;
  reason: string;
  created_by: string;
  created_at: string;
  platform: 'all' | 'chaturbate' | 'stripchat';
}

interface BlockedDatesManagerProps {
  userEmail: string;
}

const BlockedDatesManager = ({ userEmail }: BlockedDatesManagerProps) => {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchBlockedDates = async () => {
    try {
      const response = await authenticatedFetch(BLOCKED_DATES_API, {
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

  const handleBlockDate = async (date: string, reason: string, platform: 'all' | 'chaturbate' | 'stripchat') => {
    if (!date) {
      toast({
        title: "Ошибка",
        description: "Выберите дату для блокировки",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await authenticatedFetch(BLOCKED_DATES_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userEmail,
        },
        body: JSON.stringify({
          date,
          reason,
          platform,
        }),
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Дата заблокирована",
        });
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

  const handleBlockRange = async (startDate: string, endDate: string, reason: string, platform: 'all' | 'chaturbate' | 'stripchat') => {
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
        const response = await authenticatedFetch(BLOCKED_DATES_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": userEmail,
          },
          body: JSON.stringify({
            date,
            reason,
            platform,
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

    setIsDialogOpen(false);
    fetchBlockedDates();
  };

  const handleUnblockDate = async (date: string, platform: string) => {
    try {
      const response = await authenticatedFetch(`${BLOCKED_DATES_API}?date=${date}&platform=${platform}`, {
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

  const handleMassDelete = async (deleteStartDate: string, deleteEndDate: string) => {
    let itemsToDelete: Array<{date: string, platform: string}> = [];

    if (selectedDates.length > 0) {
      itemsToDelete = blockedDates
        .filter(bd => selectedDates.includes(bd.date))
        .map(bd => ({ date: bd.date, platform: bd.platform }));
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

      itemsToDelete = blockedDates
        .filter(bd => {
          const d = new Date(bd.date);
          return d >= start && d <= end;
        })
        .map(bd => ({ date: bd.date, platform: bd.platform }));
    }

    if (itemsToDelete.length === 0) {
      toast({
        title: "Ошибка",
        description: "Нет дат для удаления",
        variant: "destructive",
      });
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const item of itemsToDelete) {
      try {
        const response = await authenticatedFetch(`${BLOCKED_DATES_API}?date=${item.date}&platform=${item.platform}`, {
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
          <BlockDateDialog
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onBlockDate={handleBlockDate}
            onBlockRange={handleBlockRange}
          />

          {blockedDates.length > 0 && (
            <MassDeleteDialog
              isOpen={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
              blockedDates={blockedDates}
              selectedDates={selectedDates}
              onToggleDateSelection={toggleDateSelection}
              onSelectAllDates={selectAllDates}
              onMassDelete={handleMassDelete}
              formatDate={formatDate}
            />
          )}
        </div>
      </div>

      <BlockedDatesList
        blockedDates={blockedDates}
        onUnblockDate={handleUnblockDate}
        formatDate={formatDate}
      />
    </Card>
  );
};

export default BlockedDatesManager;