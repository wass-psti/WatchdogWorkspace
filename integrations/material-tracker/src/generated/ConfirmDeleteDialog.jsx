import React from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@material/components/ui/alert-dialog';
import { Trash2, AlertTriangle } from 'lucide-react';

export function ConfirmDeleteDialog({ open, onOpenChange, count, onConfirm }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[420px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="size-11 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-bold font-[family-name:var(--font-heading)]">
                Delete {count} {count === 1 ? 'item' : 'items'}?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground mt-1">
                This will archive {count === 1 ? 'this material' : `these ${count} materials`} from the board. You'll have a brief window to undo after confirming.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel className="rounded-full h-9 px-5 text-sm font-medium">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-full h-9 px-5 bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5 text-sm font-semibold shadow-sm transition-all active:scale-95"
          >
            <Trash2 className="size-3.5" />
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
export default ConfirmDeleteDialog;
