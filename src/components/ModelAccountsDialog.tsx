import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

interface ModelAccountsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelName: string;
  accounts: {
    stripchat?: string;
    chaturbate?: string;
    camsoda?: string;
    cam4?: string;
    email?: string;
  };
}

const platformConfig = [
  { key: 'stripchat', label: 'Stripchat', icon: 'Video', color: 'bg-red-500' },
  { key: 'chaturbate', label: 'Chaturbate', icon: 'Video', color: 'bg-orange-500' },
  { key: 'camsoda', label: 'CamSoda', icon: 'Video', color: 'bg-purple-500' },
  { key: 'cam4', label: 'Cam4', icon: 'Video', color: 'bg-blue-500' },
  { key: 'email', label: 'Email', icon: 'Mail', color: 'bg-green-500' }
];

const ModelAccountsDialog = ({ open, onOpenChange, modelName, accounts }: ModelAccountsDialogProps) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif flex items-center gap-2">
            <Icon name="User" size={24} />
            Аккаунты модели: {modelName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {platformConfig.map(({ key, label, icon, color }) => {
            const value = accounts[key as keyof typeof accounts];
            
            return (
              <div key={key} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${color}`}>
                    <Icon name={icon as any} size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">{label}</p>
                    {value ? (
                      <p className="text-sm text-muted-foreground">{value}</p>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Не указан</Badge>
                    )}
                  </div>
                </div>
                
                {value && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(value)}
                    className="gap-2"
                  >
                    <Icon name="Copy" size={16} />
                    Копировать
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModelAccountsDialog;
