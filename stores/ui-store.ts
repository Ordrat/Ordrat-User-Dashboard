/**
 * Global UI Store — Zustand
 *
 * Holds UI state that is shared across multiple components or features
 * and is NOT server data (that belongs in TanStack Query).
 *
 * Use this for:
 *   - Confirmation dialogs (one global instance, triggered from anywhere)
 *   - Global loading states outside of TQ's isPending
 *
 * Do NOT use this for:
 *   - API data → use TanStack Query hooks in lib/ordrat-api/
 *   - Layout state (title, sidebar) → use LayoutContext / useLayout()
 *   - Form values → use React Hook Form
 *   - Single-component state → use useState
 *   - Table filters/pagination → use useTableStore in stores/table-store.ts
 */
import { create } from 'zustand';

export interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'destructive' renders the confirm button in red */
  variant?: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
}

interface UIState {
  // ─── Confirm dialog ──────────────────────────────────────────────────────────
  confirmDialog: ConfirmOptions | null;
  /** Open the global confirmation dialog */
  confirm: (options: ConfirmOptions) => void;
  /** Close without calling onConfirm */
  closeConfirm: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  confirmDialog: null,
  confirm: (options) => set({ confirmDialog: options }),
  closeConfirm: () => set({ confirmDialog: null }),
}));
