import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { authenticatedFetchNoCreds } from '@/lib/api';
import funcUrls from '../../../backend/func2url.json';

const PAST_URL = (funcUrls as Record<string, string>)['production-past'];

interface PastAccount {
  id: number;
  person_id: number;
  platform: string;
  login: string;
  password: string;
}

interface PastPerson {
  id: number;
  name: string;
  accounts: PastAccount[];
}

const PLATFORM_STYLES: Record<string, string> = {
  mail: 'bg-blue-500/20 border-blue-500/40 text-blue-200',
  chaturbate: 'bg-amber-500/20 border-amber-500/40 text-amber-200',
  stripchat: 'bg-rose-500/20 border-rose-500/40 text-rose-200',
  camsoda: 'bg-sky-500/20 border-sky-500/40 text-sky-200',
  cam4: 'bg-orange-500/20 border-orange-500/40 text-orange-200',
};

const PLATFORMS = ['Mail', 'Chaturbate', 'Stripchat', 'CamSoda', 'Cam4', 'BongaCams', 'MyFreeCams'];

const platformStyle = (platform: string) =>
  PLATFORM_STYLES[platform.trim().toLowerCase()] || 'bg-secondary/60 border-border/50 text-foreground';

const PastAccountsTable = () => {
  const { toast } = useToast();
  const [persons, setPersons] = useState<PastPerson[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetchNoCreds(PAST_URL);
      const data = await res.json();
      setPersons(Array.isArray(data.persons) ? data.persons : []);
    } catch {
      toast({ title: 'Не удалось загрузить', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async (payload: Record<string, unknown>) => {
    const res = await authenticatedFetchNoCreds(PAST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Ошибка');
    return res.json();
  };

  const run = async (payload: Record<string, unknown>, errorText: string) => {
    try {
      await send(payload);
      await load();
    } catch {
      toast({ title: errorText, variant: 'destructive' });
    }
  };

  const updatePersonLocal = (id: number, name: string) =>
    setPersons((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));

  const updateAccountLocal = (personId: number, accountId: number, patch: Partial<PastAccount>) =>
    setPersons((prev) =>
      prev.map((p) =>
        p.id === personId
          ? { ...p, accounts: p.accounts.map((a) => (a.id === accountId ? { ...a, ...patch } : a)) }
          : p,
      ),
    );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => run({ action: 'save_person' }, 'Не удалось добавить')}>
          <Icon name="Plus" size={14} className="mr-1.5" />
          Модель
        </Button>
      </div>

      {loading ? (
        <Card className="border-border/50 bg-secondary/30 backdrop-blur-sm">
          <CardContent className="py-10 text-center text-muted-foreground">Загрузка...</CardContent>
        </Card>
      ) : persons.length === 0 ? (
        <Card className="border-border/50 bg-secondary/30 backdrop-blur-sm">
          <CardContent className="py-10 text-center text-muted-foreground">
            Пока пусто — нажми «Модель», чтобы добавить карточку
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
          {persons.map((person) => (
            <Card key={person.id} className="border-border/50 bg-secondary/30 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Input
                    value={person.name || ''}
                    placeholder="Имя модели"
                    onChange={(e) => updatePersonLocal(person.id, e.target.value)}
                    onBlur={() =>
                      run({ action: 'save_person', id: person.id, name: person.name }, 'Не удалось сохранить')
                    }
                    className="h-9 border-0 bg-transparent text-center text-base font-semibold focus-visible:ring-1 focus-visible:ring-primary/40"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => run({ action: 'delete_person', id: person.id }, 'Не удалось удалить')}
                  >
                    <Icon name="Trash2" size={14} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {person.accounts.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground">Аккаунтов пока нет</p>
                )}

                {person.accounts.map((account) => (
                  <div key={account.id} className="rounded-lg border border-border/50 overflow-hidden">
                    <div className="flex items-center gap-1 pr-1">
                      <Select
                        value={account.platform || ''}
                        onValueChange={(value) => {
                          updateAccountLocal(person.id, account.id, { platform: value });
                          run(
                            { action: 'save_account', ...account, platform: value },
                            'Не удалось сохранить',
                          );
                        }}
                      >
                        <SelectTrigger
                          className={`h-9 flex-1 rounded-none border-0 border-b font-medium italic justify-center gap-2 focus:ring-1 focus:ring-primary/40 ${platformStyle(account.platform)}`}
                        >
                          <SelectValue placeholder="Площадка" />
                        </SelectTrigger>
                        <SelectContent>
                          {PLATFORMS.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => run({ action: 'delete_account', id: account.id }, 'Не удалось удалить')}
                      >
                        <Icon name="X" size={13} />
                      </Button>
                    </div>
                    <Input
                      value={account.login || ''}
                      placeholder="логин"
                      onChange={(e) => updateAccountLocal(person.id, account.id, { login: e.target.value })}
                      onBlur={() => run({ action: 'save_account', ...account }, 'Не удалось сохранить')}
                      className="h-9 rounded-none border-0 border-b border-border/40 bg-transparent text-center text-sm focus-visible:ring-1 focus-visible:ring-primary/40"
                    />
                    <Input
                      value={account.password || ''}
                      placeholder="пароль"
                      onChange={(e) =>
                        updateAccountLocal(person.id, account.id, { password: e.target.value })
                      }
                      onBlur={() => run({ action: 'save_account', ...account }, 'Не удалось сохранить')}
                      className="h-9 rounded-none border-0 bg-transparent text-center text-sm focus-visible:ring-1 focus-visible:ring-primary/40"
                    />
                  </div>
                ))}

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() =>
                    run({ action: 'save_account', person_id: person.id }, 'Не удалось добавить')
                  }
                >
                  <Icon name="Plus" size={14} className="mr-1.5" />
                  Аккаунт
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PastAccountsTable;
