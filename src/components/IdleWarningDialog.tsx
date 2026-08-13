import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface IdleWarningDialogProps {
  open: boolean;
  secondsLeft: number;
  onStay: () => void;
  onLogout: () => void;
}

const IdleWarningDialog = ({
  open,
  secondsLeft,
  onStay,
  onLogout,
}: IdleWarningDialogProps) => {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Вы ещё здесь?</AlertDialogTitle>
          <AlertDialogDescription>
            Из-за бездействия вы автоматически выйдете из системы через{' '}
            <span className="font-semibold text-foreground">
              {secondsLeft} сек.
            </span>
            <br />
            Это защищает данные, если вы отошли от компьютера.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onLogout}>Выйти сейчас</AlertDialogCancel>
          <AlertDialogAction onClick={onStay}>Остаться в системе</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default IdleWarningDialog;
