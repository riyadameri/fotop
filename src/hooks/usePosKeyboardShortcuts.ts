import { useEffect } from 'react';

interface PosKeyboardShortcutsOptions {
  onNewOrder?: () => void;
  onSaveOrder?: () => void;
  onPrintReceipt?: () => void;
  onFocusSearch?: () => void;
  onQuickCash?: () => void;
  onCloseModal?: () => void;
  onToggleHelp?: () => void;
  enabled?: boolean;
}

export function usePosKeyboardShortcuts({
  onNewOrder,
  onSaveOrder,
  onPrintReceipt,
  onFocusSearch,
  onQuickCash,
  onCloseModal,
  onToggleHelp,
  enabled = true
}: PosKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      const code = e.code;

      // 1. Ctrl+N / Cmd+N -> New Order
      if (isModifier && (key === 'n' || code === 'KeyN')) {
        e.preventDefault();
        e.stopPropagation();
        onNewOrder?.();
        return;
      }

      // 2. Ctrl+S / Cmd+S -> Save / Checkout Order
      if (isModifier && (key === 's' || code === 'KeyS')) {
        e.preventDefault();
        e.stopPropagation();
        onSaveOrder?.();
        return;
      }

      // 3. Ctrl+P / Cmd+P -> Print Receipt Ticket
      if (isModifier && (key === 'p' || code === 'KeyP')) {
        e.preventDefault();
        e.stopPropagation();
        onPrintReceipt?.();
        return;
      }

      // 4. F2 or Ctrl+F / Cmd+F -> Focus Search
      if (e.key === 'F2' || (isModifier && (key === 'f' || code === 'KeyF'))) {
        e.preventDefault();
        e.stopPropagation();
        onFocusSearch?.();
        return;
      }

      // 5. F4 -> Quick Exact Cash Payment
      if (e.key === 'F4') {
        e.preventDefault();
        e.stopPropagation();
        onQuickCash?.();
        return;
      }

      // 6. F1 -> Help & Shortcuts Guide
      if (e.key === 'F1') {
        e.preventDefault();
        e.stopPropagation();
        onToggleHelp?.();
        return;
      }

      // 7. Escape -> Close modal / Clear
      if (e.key === 'Escape') {
        onCloseModal?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [
    onNewOrder,
    onSaveOrder,
    onPrintReceipt,
    onFocusSearch,
    onQuickCash,
    onCloseModal,
    onToggleHelp,
    enabled
  ]);
}
