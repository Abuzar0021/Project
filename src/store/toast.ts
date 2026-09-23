/**
 * toast.ts: a tiny store for the single transient toast.
 * Actions like Apply and Dismiss announce their result here; the Toast component
 * renders it in an aria-live region and can offer one action (for example Undo).
 * One toast at a time, matching the quiet tone of the UI.
 */
import { create } from "zustand";

interface ToastAction {
  label: string;
  run: () => void;
}

interface ToastState {
  message: string | null;
  action: ToastAction | null;
  /** A counter so repeat messages still retrigger the auto-hide timer. */
  nonce: number;
  show: (message: string, action?: ToastAction) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  action: null,
  nonce: 0,
  show: (message, action) =>
    set((state) => ({
      message,
      action: action ?? null,
      nonce: state.nonce + 1,
    })),
  hide: () => set({ message: null, action: null }),
}));
