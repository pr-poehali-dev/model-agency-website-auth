import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

interface BlockedDate {
  date: string;
  reason: string;
  created_by: string;
  created_at: string;
  platform: 'all' | 'chaturbate' | 'stripchat';
}

interface BlockedDatesListProps {
  blockedDates: BlockedDate[];
  onUnblockDate: (date: string, platform: string) => void;
  formatDate: (dateString: string) => string;
}

const BlockedDatesList = ({ blockedDates, onUnblockDate, formatDate }: BlockedDatesListProps) => {
  const getPlatformBadge = (platform: 'all' | 'chaturbate' | 'stripchat') => {
    if (platform === 'chaturbate') {
      return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-xs">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Chaturbate</span>
        </div>
      );
    }
    if (platform === 'stripchat') {
      return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-xs">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Stripchat</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-muted border rounded text-xs">
        <Icon name="Globe" size={12} />
        <span>Все площадки</span>
      </div>
    );
  };

  if (blockedDates.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Icon name="CalendarCheck" size={48} className="mx-auto mb-3 opacity-50" />
        <p>Нет заблокированных дат</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {blockedDates.map((blocked) => (
        <div
          key={`${blocked.date}-${blocked.platform}`}
          className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Calendar" size={16} className="text-muted-foreground" />
              <span className="font-medium">{formatDate(blocked.date)}</span>
              {getPlatformBadge(blocked.platform)}
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
            onClick={() => onUnblockDate(blocked.date, blocked.platform)}
            className="text-destructive hover:text-destructive"
          >
            <Icon name="Trash2" size={16} />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default BlockedDatesList;
