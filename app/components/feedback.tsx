import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

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

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

let toastId = 0;

function ToastSurface({
  toasts,
  dismiss,
}: {
  toasts: ToastItem[];
  dismiss: (id: number) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-3 sm:right-6 sm:bottom-6"
    >
      {toasts.map((item) => {
        const cardStyle =
          item.variant === "error"
            ? "bg-danger text-pure-white"
            : item.variant === "success"
              ? "bg-accent text-pure-white"
              : "bg-panel text-bone border-2 border-bone";

        return (
          <div
            key={item.id}
            role={item.variant === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex items-start justify-between gap-3 rounded-3xl p-5 shadow-[var(--shadow-overlay)] ${cardStyle}`}
          >
            <div className="min-w-0 flex-1">
              <p className="font-sans text-sm font-semibold">{item.title}</p>
              {item.message && (
                <p className="mt-1 font-sans text-xs break-words opacity-90">
                  {item.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss notification"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full opacity-85 hover:opacity-100"
            >
              <X size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
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
  labelId: string;
  title: string;
  message: string;
  onBackdrop: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}

function DialogChrome({
  labelId,
  title,
  message,
  onBackdrop,
  containerRef,
  children,
}: DialogChromeProps) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-abyssal-ink/55"
        onClick={onBackdrop}
        aria-hidden="true"
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        aria-describedby={`${labelId}-description`}
        className="vault-card relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto shadow-[var(--shadow-overlay)]"
      >
        <h2 id={labelId} className="card-heading text-bone">
          {title}
        </h2>
        <p
          id={`${labelId}-description`}
          className="mt-3 font-sans text-sm leading-6 break-words text-muted"
        >
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

    const initialFocus = focusFirstText
      ? focusables().find((el) => el.textContent?.trim() === focusFirstText)
      : focusables()[0];
    (initialFocus ?? focusables()[0])?.focus();

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
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
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

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useDialogFocus(open, containerRef, onCancel, cancelLabel);

  if (!mounted || !open) return null;

  return (
    <DialogChrome
      labelId={labelId}
      title={title}
      message={message}
      onBackdrop={onCancel}
      containerRef={containerRef}
    >
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-hud-outline">
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`btn-hud-primary ${
            destructive ? "btn-hud-destructive" : "btn-hud-constructive"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </DialogChrome>
  );
}

export function NoticeDialog({
  open,
  title,
  message,
  dismissLabel = "OK",
  onDismiss,
}: {
  open: boolean;
  title: string;
  message: string;
  dismissLabel?: string;
  onDismiss: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useDialogFocus(open, containerRef, onDismiss);

  if (!mounted || !open) return null;

  return (
    <DialogChrome
      labelId={labelId}
      title={title}
      message={message}
      onBackdrop={onDismiss}
      containerRef={containerRef}
    >
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onDismiss}
          className="btn-hud-primary btn-hud-info"
        >
          {dismissLabel}
        </button>
      </div>
    </DialogChrome>
  );
}
