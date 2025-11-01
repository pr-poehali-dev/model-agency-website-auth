import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface ActionButtonsProps {
  isSaving: boolean;
  isReadOnly: boolean;
  lastSaved: Date | null;
  onSave: () => void;
  onClearData: () => void;
}

const ActionButtons = ({ isSaving, isReadOnly, lastSaved, onSave, onClearData }: ActionButtonsProps) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {!isReadOnly && (
        <Button
          onClick={onSave}
          disabled={isSaving}
          size="sm"
        >
          {isSaving ? (
            <>
              <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
              Сохранение...
            </>
          ) : (
            <>
              <Icon name="Save" size={16} className="mr-2" />
              Сохранить
            </>
          )}
        </Button>
      )}
      {!isReadOnly && (
        <Button
          variant="destructive"
          onClick={onClearData}
          size="sm"
        >
          <Icon name="Trash2" size={16} className="mr-2" />
          Очистить
        </Button>
      )}
      {lastSaved && (
        <div className="text-xs text-muted-foreground">
          Автосохранение: {lastSaved.toLocaleTimeString('ru-RU')}
        </div>
      )}
    </div>
  );
};

export default ActionButtons;
