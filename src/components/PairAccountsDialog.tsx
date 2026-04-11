import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

type PlatformAccounts = {
  stripchat?: { login: string; password: string };
  chaturbate?: { login: string; password: string };
  camsoda?: { login: string; password: string };
  cam4?: { login: string; password: string };
  email?: { login: string; password: string };
};

interface PairAccountsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model1Name: string;
  model2Name: string;
  model1Accounts: PlatformAccounts;
  model2Accounts: PlatformAccounts;
  userRole?: string;
  onSave1?: (accounts: PlatformAccounts) => void;
  onSave2?: (accounts: PlatformAccounts) => void;
}

const platformConfig = [
  { key: 'stripchat', label: 'Stripchat', icon: 'Video', color: 'bg-red-500' },
  { key: 'chaturbate', label: 'Chaturbate', icon: 'Video', color: 'bg-orange-500' },
  { key: 'camsoda', label: 'CamSoda', icon: 'Video', color: 'bg-cyan-400' },
  { key: 'cam4', label: 'Cam4', icon: 'Video', color: 'bg-purple-500' },
  { key: 'email', label: 'Email', icon: 'Mail', color: 'bg-green-500' },
];

const AccountsPanel = ({
  modelName,
  accounts: initialAccounts,
  userRole,
  onSave,
}: {
  modelName: string;
  accounts: PlatformAccounts;
  userRole?: string;
  onSave?: (accounts: PlatformAccounts) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [accounts, setAccounts] = useState<PlatformAccounts>(initialAccounts);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setAccounts(initialAccounts);
    setIsEditing(false);
    setShowPasswords({});
  }, [initialAccounts, modelName]);

  const canEdit = userRole === 'director' || userRole === 'producer';

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  const togglePassword = (key: string) =>
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleInputChange = (platform: string, field: 'login' | 'password', value: string) => {
    setAccounts((prev) => ({
      ...prev,
      [platform]: {
        ...(prev[platform as keyof PlatformAccounts] || { login: '', password: '' }),
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    onSave?.(accounts);
    setIsEditing(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-base">{modelName}</p>
        {canEdit && !isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-1 text-xs">
            <Icon name="Edit" size={13} />
            Редактировать
          </Button>
        )}
      </div>

      {platformConfig.map(({ key, label, icon, color }) => {
        const accountData = accounts[key as keyof PlatformAccounts];
        const hasData = accountData?.login || accountData?.password;

        return (
          <div key={key} className="p-3 border rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-full ${color}`}>
                <Icon name={icon as Parameters<typeof Icon>[0]['name']} size={14} className="text-white" />
              </div>
              <p className="font-medium text-sm">{label}</p>
              {!hasData && !isEditing && (
                <Badge variant="secondary" className="text-xs">Не указан</Badge>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2 ml-8">
                <div>
                  <Label className="text-xs">Логин</Label>
                  <Input
                    value={accountData?.login || ''}
                    onChange={(e) => handleInputChange(key, 'login', e.target.value)}
                    placeholder="Введите логин"
                    className="mt-1 h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Пароль</Label>
                  <div className="relative mt-1">
                    <Input
                      type={showPasswords[key] ? 'text' : 'password'}
                      value={accountData?.password || ''}
                      onChange={(e) => handleInputChange(key, 'password', e.target.value)}
                      placeholder="Введите пароль"
                      className="pr-10 h-8 text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-2"
                      onClick={() => togglePassword(key)}
                    >
                      <Icon name={showPasswords[key] ? 'EyeOff' : 'Eye'} size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ) : hasData ? (
              <div className="space-y-1 ml-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Логин</p>
                    <p className="text-xs font-mono">{accountData?.login}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(accountData?.login || '')}>
                    <Icon name="Copy" size={12} />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Пароль</p>
                    <p className="text-xs font-mono">
                      {showPasswords[key] ? accountData?.password : '••••••••'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => togglePassword(key)}>
                      <Icon name={showPasswords[key] ? 'EyeOff' : 'Eye'} size={12} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(accountData?.password || '')}>
                      <Icon name="Copy" size={12} />
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}

      {isEditing && (
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => { setAccounts(initialAccounts); setIsEditing(false); }}>
            Отмена
          </Button>
          <Button size="sm" onClick={handleSave} className="gap-1">
            <Icon name="Save" size={14} />
            Сохранить
          </Button>
        </div>
      )}
    </div>
  );
};

const PairAccountsDialog = ({
  open,
  onOpenChange,
  model1Name,
  model2Name,
  model1Accounts,
  model2Accounts,
  userRole,
  onSave1,
  onSave2,
}: PairAccountsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif flex items-center gap-2">
            <Icon name="Globe" size={20} />
            Аккаунты пары: {model1Name} & {model2Name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <AccountsPanel
            modelName={model1Name}
            accounts={model1Accounts}
            userRole={userRole}
            onSave={onSave1}
          />
          <div className="hidden md:block w-px bg-border" />
          <AccountsPanel
            modelName={model2Name}
            accounts={model2Accounts}
            userRole={userRole}
            onSave={onSave2}
          />
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PairAccountsDialog;
