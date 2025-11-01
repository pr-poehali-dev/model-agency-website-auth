import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

interface ModelAccountsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelName: string;
  accounts: {
    stripchat?: { login: string; password: string };
    chaturbate?: { login: string; password: string };
    camsoda?: { login: string; password: string };
    cam4?: { login: string; password: string };
    email?: { login: string; password: string };
  };
  userRole?: string;
  onSave?: (accounts: any) => void;
}

const platformConfig = [
  { key: 'stripchat', label: 'Stripchat', icon: 'Video', color: 'bg-red-500' },
  { key: 'chaturbate', label: 'Chaturbate', icon: 'Video', color: 'bg-orange-500' },
  { key: 'camsoda', label: 'CamSoda', icon: 'Video', color: 'bg-purple-500' },
  { key: 'cam4', label: 'Cam4', icon: 'Video', color: 'bg-blue-500' },
  { key: 'email', label: 'Email', icon: 'Mail', color: 'bg-green-500' }
];

const ModelAccountsDialog = ({ 
  open, 
  onOpenChange, 
  modelName, 
  accounts: initialAccounts,
  userRole,
  onSave
}: ModelAccountsDialogProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [accounts, setAccounts] = useState(initialAccounts);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setAccounts(initialAccounts);
    setIsEditing(false);
    setShowPasswords({});
  }, [initialAccounts, modelName, open]);

  const canEdit = userRole === 'director' || userRole === 'producer';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleInputChange = (platform: string, field: 'login' | 'password', value: string) => {
    setAccounts(prev => ({
      ...prev,
      [platform]: {
        ...(prev[platform as keyof typeof prev] || { login: '', password: '' }),
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(accounts);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setAccounts(initialAccounts);
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-serif flex items-center gap-2">
              <Icon name="User" size={24} />
              Аккаунты модели: {modelName}
            </DialogTitle>
            {canEdit && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Icon name="Edit" size={16} />
                Редактировать
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {platformConfig.map(({ key, label, icon, color }) => {
            const accountData = accounts[key as keyof typeof accounts];
            const hasData = accountData?.login || accountData?.password;
            
            return (
              <div key={key} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${color}`}>
                    <Icon name={icon as any} size={20} className="text-white" />
                  </div>
                  <p className="font-semibold text-lg">{label}</p>
                  {!hasData && !isEditing && (
                    <Badge variant="secondary" className="text-xs">Не указан</Badge>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3 ml-11">
                    <div>
                      <Label htmlFor={`${key}-login`} className="text-sm">Логин</Label>
                      <Input
                        id={`${key}-login`}
                        value={accountData?.login || ''}
                        onChange={(e) => handleInputChange(key, 'login', e.target.value)}
                        placeholder="Введите логин"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${key}-password`} className="text-sm">Пароль</Label>
                      <div className="relative mt-1">
                        <Input
                          id={`${key}-password`}
                          type={showPasswords[key] ? 'text' : 'password'}
                          value={accountData?.password || ''}
                          onChange={(e) => handleInputChange(key, 'password', e.target.value)}
                          placeholder="Введите пароль"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => togglePasswordVisibility(key)}
                        >
                          <Icon name={showPasswords[key] ? 'EyeOff' : 'Eye'} size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : hasData ? (
                  <div className="space-y-2 ml-11">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Логин</p>
                        <p className="text-sm font-mono">{accountData?.login}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(accountData?.login || '')}
                        className="gap-2"
                      >
                        <Icon name="Copy" size={14} />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Пароль</p>
                        <p className="text-sm font-mono">
                          {showPasswords[key] ? accountData?.password : '••••••••'}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePasswordVisibility(key)}
                        >
                          <Icon name={showPasswords[key] ? 'EyeOff' : 'Eye'} size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(accountData?.password || '')}
                          className="gap-2"
                        >
                          <Icon name="Copy" size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Отмена
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Icon name="Save" size={16} />
                Сохранить
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Закрыть
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModelAccountsDialog;