import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { setPendingChanges } from './unsavedGuard';

interface SaveBarProps {
  dirtyCount: number;
  saving: boolean;
  onSave: () => void;
  onReset: () => void;
}

const SaveBar = ({ dirtyCount, saving, onSave, onReset }: SaveBarProps) => {
  useEffect(() => {
    setPendingChanges(dirtyCount);
    return () => setPendingChanges(0);
  }, [dirtyCount]);

  useEffect(() => {
    if (dirtyCount === 0) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirtyCount]);

  if (dirtyCount === 0) return null;

  return (
    <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-background/95 px-4 py-3 shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.8)] backdrop-blur">
      <div className="flex items-center gap-2 text-sm text-foreground">
        <Icon name="CircleAlert" size={16} className="text-primary" />
        Несохранённых изменений: {dirtyCount}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onReset} disabled={saving}>
          Отменить
        </Button>
        <Button size="sm" onClick={onSave} disabled={saving}>
          <Icon name="Check" size={14} className="mr-1.5" />
          {saving ? 'Сохраняю...' : 'Сохранить'}
        </Button>
      </div>
    </div>
  );
};

export default SaveBar;
