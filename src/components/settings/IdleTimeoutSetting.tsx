import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api';
import { API_URLS } from '@/lib/apiUrls';

const OPTIONS = [
  { value: '5', label: '5 минут' },
  { value: '10', label: '10 минут' },
  { value: '15', label: '15 минут' },
  { value: '30', label: '30 минут' },
  { value: '60', label: '1 час' },
  { value: '120', label: '2 часа' },
  { value: '480', label: '8 часов' },
];

const IdleTimeoutSetting = () => {
  const [value, setValue] = useState('10');
  const [initialValue, setInitialValue] = useState('10');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await authenticatedFetch(API_URLS.appSettings);
        const data = await res.json();
        if (res.ok) {
          const saved = data.settings?.idle_timeout_minutes || '10';
          setValue(saved);
          setInitialValue(saved);
        }
      } catch {
        // настройка останется со значением по умолчанию
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await authenticatedFetch(API_URLS.appSettings, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'idle_timeout_minutes',
          value: Number(value),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Не удалось сохранить');
      }

      localStorage.setItem('idle_timeout_minutes', value);
      setInitialValue(value);
      toast({
        title: 'Сохранено',
        description: 'Новое время начнёт действовать после перезагрузки страницы',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка';
      toast({ title: 'Ошибка', description: msg, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">Безопасность</h3>
      <div className="flex items-end gap-4">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">
            Автоматический выход при бездействии
          </label>
          <Select value={value} onValueChange={setValue} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Сотрудник выйдет из системы, если не пользуется ей указанное время.
            За минуту до выхода появится предупреждение. Действует для всех.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving || isLoading || value === initialValue}
          className="gap-2"
        >
          <Icon name="Save" size={16} />
          {isSaving ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>
    </Card>
  );
};

export default IdleTimeoutSetting;
