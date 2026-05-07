import { MouseEvent, ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Maximum width preset */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Pad the content area; turn off for layouts that own their padding (e.g. left-tabbed panels). */
  padded?: boolean;
  /** Hide the default header and let children render the chrome. */
  bare?: boolean;
  children: ReactNode;
  /** Optional right-side actions in the header */
  actions?: ReactNode;
  /** Initial focus selector inside the modal. Only consulted on the open
      transition; we never re-focus on subsequent re-renders. */
  initialFocusSelector?: string;
}

const sizeClass: Record<NonNullable<Props["size"]>, string> = {
  sm:   "max-w-md",
  md:   "max-w-xl",
  lg:   "max-w-3xl",
  xl:   "max-w-5xl",
  full: "max-w-[min(1100px,calc(100vw-2rem))]",
};

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = "md",
  padded = true,
  bare = false,
  children,
  actions,
  initialFocusSelector,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Hold the latest `onClose` and `initialFocusSelector` in refs so the
  // open/close effects don't re-run when callers pass inline arrow
  // functions or change the selector between renders.
  // (The previous version re-focused the first focusable on every parent
  //  re-render — typing into a non-first input visibly stole focus to the
  //  first input/select. Keep this pattern.)
  const onCloseRef = useRef(onClose);
  const focusSelectorRef = useRef(initialFocusSelector);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => { focusSelectorRef.current = initialFocusSelector; }, [initialFocusSelector]);

  // Esc-to-close + body scroll lock. Bound once per open transition.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Auto-focus the first focusable element exactly ONCE per open transition.
  // Critically:
  //  - we never re-focus on subsequent re-renders (that was the bug);
  //  - if the user is already focused inside the modal (e.g. typing) we
  //    don't steal focus from them.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const root = dialogRef.current;
      if (!root) return;
      // If focus is already inside the dialog (e.g. caller used autoFocus),
      // do nothing.
      if (document.activeElement && root.contains(document.activeElement)) return;
      const sel = focusSelectorRef.current;
      const target = sel
        ? root.querySelector<HTMLElement>(sel)
        : root.querySelector<HTMLElement>(
            "input, textarea, select, button:not([data-modal-close]), [tabindex]:not([tabindex='-1'])"
          );
      target?.focus();
    }, 30);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;

  const onBackdropMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onCloseRef.current();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-3 sm:px-6 py-6 sm:py-10 bg-ink-900/55 backdrop-blur-sm animate-[fadeIn_120ms_ease-out]"
      role="presentation"
      onMouseDown={onBackdropMouseDown}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className={`w-full ${sizeClass[size]} bg-surface rounded-2xl shadow-pop overflow-hidden flex flex-col max-h-[calc(100vh-3rem)] animate-[slideUp_160ms_ease-out]`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {!bare && (title || actions) && (
          <header className="shrink-0 flex items-start justify-between gap-4 px-5 py-4 border-b border-surface-sunken">
            <div className="min-w-0">
              {typeof title === "string" ? (
                <h3 className="m-0 text-base font-semibold text-brand-500 truncate">{title}</h3>
              ) : (
                title
              )}
              {subtitle && (
                <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {actions}
              <button
                data-modal-close
                onClick={() => onCloseRef.current()}
                className="w-9 h-9 grid place-items-center rounded-xl hover:bg-surface-muted text-ink-700"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>
        )}
        <div className={`min-h-0 flex-1 overflow-y-auto ${padded ? "p-5" : ""}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
