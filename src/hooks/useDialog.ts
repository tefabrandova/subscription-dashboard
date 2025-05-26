import { useState } from 'react';

interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'warning' | 'error' | 'success';
}

export function useDialog(initialState: Partial<DialogState> = {}) {
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    ...initialState
  });

  const showDialog = (options: Partial<DialogState>) => {
    setDialog({ ...dialog, isOpen: true, ...options });
  };

  const hideDialog = () => {
    setDialog({ ...dialog, isOpen: false });
  };

  return {
    dialog,
    showDialog,
    hideDialog
  };
}