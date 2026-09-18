import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Check, Info, TriangleAlert, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  variant: ToastVariant;
  title: string;
  message?: string;
}

interface ToastContextValue {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}

function ToastSurface({ toasts, dismiss }: { toasts: ToastItem[]; dismiss: (id: number) => void }) {
  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.variant === "error" ? "alert" : "status"}
          className={`animate-brutal pointer-events-auto flex w-full max-w-sm items-start gap-3 border-2 bg-panel-hover px-4 py-3 shadow-brutal ${
            t.variant === "error"
              ? "border-danger-strong"
              : t.variant === "success"
              ? "border-safe-strong"
              : "border-line-strong"
          }`}
        >
          <span
            className={`mt-0.5 shrink-0 ${
              t.variant === "error"
                ? "text-danger"
                : t.variant === "success"
                ? "text-safe"
                : "text-bone"
            }`}
          >
            {t.variant === "error" ? (
              <TriangleAlert size={18} aria-hidden />
            ) : t.variant === "info" ? (
              <Info size={18} aria-hidden />
            ) : (
              <Check size={18} aria-hidden />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm font-bold tracking-wider text-bone uppercase">
              {t.title}
            </p>
            {t.message && (
              <p className="mt-1 font-sans text-xs leading-snug text-muted">
                {t.message}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss notification"
            className="shrink-0 p-1 text-muted transition-colors hover:cursor-pointer hover:text-bone"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (variant: ToastVariant, title: string, message?: string) => {
      const id = ++toastId;
      setToasts((current) => [...current, { id, variant, title, message }]);
      window.setTimeout(() => dismiss(id), variant === "error" ? 6000 : 4000);
    },
    [dismiss],
  );

  const success = useCallback(
    (title: string, message?: string) => push("success", title, message),
    [push],
  );
  const error = useCallback(
    (title: string, message?: string) => push("error", title, message),
    [push],
  );
  const info = useCallback(
    (title: string, message?: string) => push("info", title, message),
    [push],
  );

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      <ToastSurface toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

interface DialogChromeProps {
  label: string;
  labelId: string;
  title: string;
  message: string;
  markerClass: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  children: ReactNode;
  onBackdropDismiss: () => void;
}

function DialogChrome({
  label,
  labelId,
  title,
  message,
  markerClass,
  containerRef,
  children,
  onBackdropDismiss,
}: DialogChromeProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
    >
      <div
        className="fixed inset-0 bg-paper/80 backdrop-blur-xs"
        onClick={onBackdropDismiss}
        aria-hidden="true"
      />
      <div
        ref={containerRef}
        className="bracket-frame relative z-10 w-full max-w-md border-2 border-line-strong bg-panel-hover p-6 shadow-brutal"
      >
        <span className="bracket bracket-tl" aria-hidden="true" />
        <span className="bracket bracket-tr" aria-hidden="true" />
        <span className="bracket bracket-bl" aria-hidden="true" />
        <span className="bracket bracket-br" aria-hidden="true" />
        <div className="flex items-center justify-between border-b-2 border-line pb-3">
          <span className="font-mono text-xs font-semibold tracking-wider text-bone uppercase">
            {label}
          </span>
          <span className={`h-2 w-2 ${markerClass}`} aria-hidden="true" />
        </div>
        <h2
          id={labelId}
          className="font-syne mt-4 text-xl font-bold tracking-wide text-bone uppercase"
        >
          {title}
        </h2>
        <p className="mt-2 font-sans text-sm leading-relaxed text-muted">
          {message}
        </p>
        {children}
      </div>
    </div>,
    document.body,
  );
}

function useDialogFocus(
  open: boolean,
  containerRef: React.RefObject<HTMLDivElement | null>,
  onClose: () => void,
  focusFirstText?: string,
) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open || !containerRef.current) return;
    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);

    (focusFirstText
      ? focusables().find((el) => el.textContent?.trim() === focusFirstText)
      : focusables()[0])?.focus() ?? focusables()[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !container.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open, containerRef, focusFirstText]);
}

interface NoticeDialogProps {
  open: boolean;
  title: string;
  message: string;
  dismissLabel?: string;
  onDismiss: () => void;
}

export function NoticeDialog({
  open,
  title,
  message,
  dismissLabel = "GOT IT",
  onDismiss,
}: NoticeDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useDialogFocus(open, containerRef, onDismiss, dismissLabel);

  if (!open) return null;

  return (
    <DialogChrome
      label="[NOTICE"
      labelId="notice-dialog-title"
      title={title}
      message={message}
      markerClass="bg-bone"
      containerRef={containerRef}
      onBackdropDismiss={onDismiss}
    >
      <div className="mt-6 flex justify-end">
        <button type="button" onClick={onDismiss} className="btn-hud-primary">
          {dismissLabel}
        </button>
      </div>
    </DialogChrome>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "CONFIRM",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useDialogFocus(open, containerRef, onCancel);

  if (!open) return null;

  return (
    <DialogChrome
      label="[CONFIRM"
      labelId="confirm-dialog-title"
      title={title}
      message={message}
      markerClass={destructive ? "bg-danger-strong" : "bg-safe-strong"}
      containerRef={containerRef}
      onBackdropDismiss={onCancel}
    >
      <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-hud-outline">
          CANCEL
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={destructive ? "btn-hud-outline btn-hud-destructive" : "btn-hud-primary"}
        >
          {confirmLabel}
        </button>
      </div>
    </DialogChrome>
  );
}
