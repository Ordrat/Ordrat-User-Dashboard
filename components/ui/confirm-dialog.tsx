'use client';

/**
 * ConfirmDialog — Global confirmation dialog driven by useUIStore.
 *
 * Mount once in root layout. Trigger from anywhere:
 *
 *   const { confirm } = useUIStore()
 *
 *   confirm({
 *     title: t('branch.delete_title'),
 *     description: t('branch.delete_desc'),
 *     variant: 'destructive',
 *     confirmLabel: t('common.delete'),
 *     onConfirm: () => deleteBranch(id),
 *   })
 */

import { useState } from 'react';
import { useUIStore } from '@/stores/ui-store';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

export function ConfirmDialog() {
  const { confirmDialog, closeConfirm } = useUIStore();
  const [isPending, setIsPending] = useState(false);

  const isOpen = !!confirmDialog;

  const handleConfirm = async () => {
    if (!confirmDialog) return;
    setIsPending(true);
    try {
      await confirmDialog.onConfirm();
    } finally {
      setIsPending(false);
      closeConfirm();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && closeConfirm()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirmDialog?.title}</AlertDialogTitle>
          {confirmDialog?.description && (
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={closeConfirm} disabled={isPending}>
            {confirmDialog?.cancelLabel ?? 'Cancel'}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            variant={confirmDialog?.variant === 'destructive' ? 'destructive' : 'primary'}
          >
            {confirmDialog?.confirmLabel ?? 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
