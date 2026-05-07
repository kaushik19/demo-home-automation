// Tiny pub/sub toast system. The host (AppShell) subscribes and renders.
// Components push toasts via the singleton:
//   import { toast } from "@/hooks/useToast";
//   toast.success("Device added", "Living Room • Ceiling Light");

import { useEffect, useState } from "react";

export type ToastVariant = "success" | "info" | "warning" | "error";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  /** ms; 0 means sticky */
  duration: number;
}

type Listener = (toasts: Toast[]) => void;

class ToastStore {
  private toasts: Toast[] = [];
  private listeners = new Set<Listener>();

  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    l(this.toasts);
    return () => { this.listeners.delete(l); };
  }

  private notify() {
    for (const l of this.listeners) l([...this.toasts]);
  }

  push(t: Omit<Toast, "id" | "duration"> & { id?: string; duration?: number }): string {
    const id = t.id ?? Math.random().toString(36).slice(2, 10);
    const next: Toast = {
      title: t.title,
      description: t.description,
      variant: t.variant,
      duration: t.duration ?? 4000,
      id,
    };
    this.toasts = [...this.toasts, next];
    this.notify();
    if (next.duration > 0) {
      setTimeout(() => this.dismiss(id), next.duration);
    }
    return id;
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }
}

const store = new ToastStore();

export const toast = {
  success: (title: string, description?: string, duration?: number) =>
    store.push({ title, description, variant: "success", duration: duration ?? 3500 }),
  info:    (title: string, description?: string, duration?: number) =>
    store.push({ title, description, variant: "info",    duration: duration ?? 3500 }),
  warning: (title: string, description?: string, duration?: number) =>
    store.push({ title, description, variant: "warning", duration: duration ?? 4500 }),
  error:   (title: string, description?: string, duration?: number) =>
    store.push({ title, description, variant: "error",   duration: duration ?? 5500 }),
  dismiss: (id: string) => store.dismiss(id),
  clear:   () => store.clear(),
};

/** Hook for the host container to render toasts. */
export function useToastList(): { toasts: Toast[]; dismiss: (id: string) => void } {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => store.subscribe(setToasts), []);
  return { toasts, dismiss: (id) => store.dismiss(id) };
}
