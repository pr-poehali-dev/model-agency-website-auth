import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { DATA_LOAD_FAILED_EVENT } from '@/lib/api';

const DataLoadErrorBanner = () => {
  const [visible, setVisible] = useState(false);
  const dismissedAt = useRef<number>(0);
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    const handleFailure = () => {
      if (Date.now() - dismissedAt.current < 60000) return;
      if (Date.now() - startedAt.current < 3000) return;
      setVisible(true);
    };

    window.addEventListener(DATA_LOAD_FAILED_EVENT, handleFailure);
    return () => window.removeEventListener(DATA_LOAD_FAILED_EVENT, handleFailure);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md">
      <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-card p-4 shadow-lg">
        <Icon name="TriangleAlert" size={20} className="mt-0.5 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">
            Не удалось загрузить данные
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Часть информации может отображаться неполно. Обновите страницу.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => window.location.reload()}>
              Обновить страницу
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                dismissedAt.current = Date.now();
                setVisible(false);
              }}
            >
              Скрыть
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataLoadErrorBanner;