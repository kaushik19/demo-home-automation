import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import type { Toast as ToastT } from "@/hooks/useToast";

interface Props {
  toast: ToastT;
  onClose: (id: string) => void;
}

const palette: Record<ToastT["variant"], { icon: typeof Info; bg: string; fg: string }> = {
  success: { icon: CheckCircle2,   bg: "bg-accent-green/15", fg: "text-accent-green" },
  warning: { icon: AlertTriangle,  bg: "bg-accent-amber/15", fg: "text-accent-amber" },
  error:   { icon: AlertTriangle,  bg: "bg-accent-red/15",   fg: "text-accent-red"   },
  info:    { icon: Info,           bg: "bg-brand-50",        fg: "text-brand-500"    },
};

export function ToastBubble({ toast, onClose }: Props) {
  const p = palette[toast.variant];
  const Icon = p.icon;
  return (
    <div className="bg-surface rounded-xl shadow-pop p-3 pr-2 border border-surface-sunken w-[320px] max-w-[92vw] flex items-start gap-3 animate-[slideUp_160ms_ease-out]">
      <div className={`w-9 h-9 grid place-items-center rounded-lg ${p.bg} ${p.fg} shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm font-semibold text-ink-900 leading-snug">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-ink-500 mt-0.5 leading-snug">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        aria-label="Dismiss"
        className="w-8 h-8 grid place-items-center rounded-lg text-ink-500 hover:bg-surface-muted shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
