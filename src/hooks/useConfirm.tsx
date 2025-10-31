import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface UseConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<UseConfirmOptions>({
    title: '',
    description: ''
  });
  const [resolveCallback, setResolveCallback] = useState<((value: boolean) => void) | null>(null);

  const confirm = (opts: UseConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolveCallback(() => resolve);
    });
  };

  const handleConfirm = () => {
    resolveCallback?.(true);
    setIsOpen(false);
  };

  const handleCancel = () => {
    resolveCallback?.(false);
    setIsOpen(false);
  };

  const ConfirmationDialog = () => (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleCancel();
      }}
      onConfirm={handleConfirm}
      title={options.title}
      description={options.description}
      confirmText={options.confirmText}
      cancelText={options.cancelText}
      variant={options.variant}
    />
  );

  return { confirm, ConfirmationDialog };
}
