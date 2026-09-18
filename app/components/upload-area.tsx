import { useRef, useState, useCallback, useId } from "react";
import { Download, Eye } from "lucide-react";
import {
  AUTHENTICATED_MAX_FILE_SIZE,
  GUEST_MAX_FILE_SIZE,
  createShareLink,
  downloadFile,
  upload,
  UploadError,
} from "~/lib/api";
import { NoticeDialog, useToast } from "./feedback";

const AUTHENTICATED_MAX_FILE_COUNT = 10;
const GUEST_MAX_FILE_COUNT = 3;

type UploadStatus = "idle" | "queued" | "uploading" | "success" | "error";
interface QueuedFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "done" | "failed";
  error?: string;
  progress: number;
  serverFileId?: string;
}
let fileIdCounter = 0;
function nextFileId() {
  return `uf_${++fileIdCounter}_${Date.now()}`;
}
function formatFileSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function UploadArea({
  userId,
  onUploadComplete,
  onNeedAccount,
  onView,
  onDownload,
}: {
  userId?: string;
  onUploadComplete?: (r: { fileName: string; fileId: string }[]) => void;
  onNeedAccount?: () => void;
  onView?: (fileId: string) => void;
  onDownload?: (fileId: string) => Promise<void> | void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [overallStatus, setOverallStatus] = useState<UploadStatus>("idle");
  const [sizeWarning, setSizeWarning] = useState<{
    files: string[];
    limitMB: number;
  } | null>(null);
  const inputId = useId();
  const toast = useToast();
  const abortRef = useRef<AbortController | null>(null);

  const maxFileSize = userId
    ? AUTHENTICATED_MAX_FILE_SIZE
    : GUEST_MAX_FILE_SIZE;
  const maxFileCount = userId
    ? AUTHENTICATED_MAX_FILE_COUNT
    : GUEST_MAX_FILE_COUNT;
  const uploadHint = userId
    ? `MAX ${Math.round(maxFileSize / (1024 * 1024))} MB / FILE • ${maxFileCount}-FILE QUEUE`
    : `MAX ${Math.round(maxFileSize / (1024 * 1024))} MB / FILE • 25 MB DAILY TOTAL`;

  const handleFilesAdded = useCallback(
    (newFiles: File[]) => {
      const oversized: string[] = [];
      setQueue((prev) => {
        const accepted = newFiles.filter((f) => {
          if (f.size > maxFileSize) {
            oversized.push(f.name);
            return false;
          }
          return true;
        });
        if (oversized.length)
          setSizeWarning({
            files: oversized,
            limitMB: Math.round(maxFileSize / (1024 * 1024)),
          });
        const remaining = maxFileCount - prev.length;
        if (remaining <= 0) return prev;
        const toAdd = accepted.slice(0, remaining).map((file) => ({
          file,
          id: nextFileId(),
          status: "pending" as const,
          progress: 0,
        }));
        return [...prev, ...toAdd];
      });
      setOverallStatus("queued");
    },
    [maxFileCount, maxFileSize],
  );

  const isUploading = overallStatus === "uploading";
  const pending = queue.filter((q) => q.status === "pending").length;
  const uploadingCount = queue.filter((q) => q.status === "uploading").length;
  const doneCount = queue.filter((q) => q.status === "done").length;

  const startUploads = useCallback(async () => {
    if (!queue.length || isUploading) return;
    setOverallStatus("uploading");
    const controller = new AbortController();
    abortRef.current = controller;
    const pendingList = queue.filter(
      (q) => q.status === "pending" || q.status === "failed",
    );
    let anyFailed = false;
    const completed: { fileName: string; fileId: string }[] = [];
    for (const item of pendingList) {
      if (controller.signal.aborted) break;
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, status: "uploading" as const, progress: 0 }
            : q,
        ),
      );
      try {
        const result = await upload(item.file, userId, {
          signal: controller.signal,
          onProgress: (p) =>
            setQueue((prev) =>
              prev.map((q) =>
                q.id === item.id ? { ...q, progress: p.percent } : q,
              ),
            ),
        });
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: "done" as const,
                  progress: 100,
                  serverFileId: result.fileId,
                }
              : q,
          ),
        );
        completed.push({ fileName: item.file.name, fileId: result.fileId });
      } catch (err) {
        anyFailed = true;
        const msg = err instanceof UploadError ? err.message : "Upload failed";
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: "failed" as const, error: msg }
              : q,
          ),
        );
      }
    }
    abortRef.current = null;
    if (!anyFailed && completed.length) {
      onUploadComplete?.(completed);
      setOverallStatus("success");
    } else if (anyFailed) setOverallStatus("error");
    else setOverallStatus("queued");
  }, [queue, isUploading, userId, onUploadComplete]);

  const removeItem = useCallback(
    (id: string) => setQueue((prev) => prev.filter((q) => q.id !== id)),
    [],
  );
  const clearQueue = useCallback(() => {
    setQueue([]);
    setOverallStatus("idle");
  }, []);
  const copyLink = useCallback(
    async (item: QueuedFile) => {
      if (!item.serverFileId) return;
      try {
        const link = await createShareLink(item.serverFileId);
        await navigator.clipboard.writeText(link);
        toast.success(
          "Link copied",
          "Anyone with this link can view the file.",
        );
      } catch {
        toast.error(
          "Failed to copy",
          "Could not create the share link. Try again.",
        );
      }
    },
    [toast],
  );

  const queueProgress = Math.round(
    ((doneCount + uploadingCount) / Math.max(1, queue.length)) * 100,
  );

  return (
    <div className="flex w-full flex-col gap-5">
      <NoticeDialog
        open={sizeWarning !== null}
        title="Limit exceeded"
        message={
          sizeWarning
            ? `Excluded files larger than ${sizeWarning.limitMB} MB.`
            : ""
        }
        onDismiss={() => setSizeWarning(null)}
      />
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files)
            handleFilesAdded(Array.from(e.dataTransfer.files));
        }}
        className={`vault-shell shadow-brutal relative flex min-h-[300px] w-full cursor-pointer flex-col items-center justify-center border-2 bg-panel p-8 text-center transition-colors focus-within:border-bone sm:min-h-[340px] ${isDragOver ? "border-bone bg-panel-hover" : "border-line-strong hover:border-bone/60"}`}
      >
        <input
          id={inputId}
          type="file"
          multiple
          onChange={(e) => {
            if (e.target.files) {
              handleFilesAdded(Array.from(e.target.files));
              e.target.value = "";
            }
          }}
          disabled={isUploading}
          className="sr-only"
        />
        <span
          className="animate-tick pointer-events-none absolute top-0 left-0 h-3 w-3 border-t-2 border-l-2 border-bone/40"
          aria-hidden="true"
        />
        <span
          className="animate-tick pointer-events-none absolute top-0 right-0 h-3 w-3 border-t-2 border-r-2 border-bone/40 delay-1"
          aria-hidden="true"
        />
        <span
          className="animate-tick pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-bone/40 delay-2"
          aria-hidden="true"
        />
        <span
          className="animate-tick pointer-events-none absolute right-0 bottom-0 h-3 w-3 border-r-2 border-b-2 border-bone/40 delay-3"
          aria-hidden="true"
        />

        {isUploading ? (
          <div className="flex w-full max-w-[320px] flex-col items-center gap-3">
            <span className="font-mono text-[11px] tracking-[0.16em] text-bone uppercase">
              Uploading • {doneCount + uploadingCount} / {queue.length}
            </span>
            <div
              className="h-2 w-full overflow-hidden border border-line-strong bg-paper"
              role="progressbar"
              aria-label="Overall upload progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={queueProgress}
            >
              <div
                className="h-full bg-bone transition-all duration-200"
                style={{ width: `${queueProgress}%` }}
              />
            </div>
          </div>
        ) : isDragOver ? (
          <span className="font-syne text-[2rem] leading-[0.9] font-extrabold tracking-[-0.03em] text-bone uppercase sm:text-[2.4rem]">
            Release to ingest
          </span>
        ) : (
          <>
            <span className="animate-brutal font-syne text-[2rem] leading-[0.9] font-extrabold tracking-[-0.04em] text-bone uppercase delay-2 sm:text-[2.6rem]">
              Drop files here
            </span>
            <span className="animate-brutal mt-3 font-mono text-[11px] tracking-[0.16em] text-muted uppercase delay-3">
              or click to select from disk
            </span>
            <span className="animate-brutal mt-5 inline-flex border border-line-strong bg-paper px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] text-muted uppercase delay-3">
              {uploadHint}
            </span>
          </>
        )}
      </label>

      {queue.length > 0 && (
        <div className="shadow-brutal border-2 border-line-strong bg-panel">
          <div className="flex items-center justify-between border-b-2 border-line px-4 py-3">
            <span className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
              Queue • {queue.length}
            </span>
            <button
              type="button"
              onClick={clearQueue}
              className="-mr-2 px-3 py-2 font-mono text-[11px] tracking-wide text-muted uppercase transition-colors hover:text-bone"
            >
              Clear
            </button>
          </div>
          <ul className="divide-y divide-line">
            {queue.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-sans text-[13px] font-semibold text-bone">
                    {item.file.name}
                  </div>
                  <div className="font-mono text-[11px] tracking-wide text-muted">
                    {formatFileSize(item.file.size)} •{" "}
                    <span
                      className={
                        item.status === "done"
                          ? "text-safe"
                          : item.status === "failed"
                            ? "text-danger"
                            : "text-muted"
                      }
                    >
                      {item.status}
                    </span>
                  </div>
                  {item.status === "uploading" && (
                    <div
                      className="mt-2 h-1 border border-line-strong bg-paper"
                      role="progressbar"
                      aria-label={`Uploading ${item.file.name}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={item.progress}
                    >
                      <div
                        className="h-full bg-bone transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                  {item.error && (
                    <div className="mt-1 font-mono text-[11px] text-danger">
                      {item.error}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {item.status === "done" && item.serverFileId && (
                    <>
                      <button
                        type="button"
                        onClick={() => onView?.(item.serverFileId!)}
                        className="btn-hud-outline btn-hud-info btn-hud-sm"
                        aria-label={`View ${item.file.name}`}
                      >
                        <Eye size={12} aria-hidden />
                        <span className="hidden sm:inline">&nbsp;View</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onDownload
                            ? onDownload(item.serverFileId!)
                            : downloadFile(item.serverFileId!)
                        }
                        className="btn-hud-outline btn-hud-info btn-hud-sm"
                        aria-label={`Download ${item.file.name}`}
                      >
                        <Download size={12} aria-hidden />
                        <span className="hidden sm:inline">&nbsp;Download</span>
                      </button>
                    </>
                  )}
                  {item.status === "done" && userId && (
                    <button
                      type="button"
                      onClick={() => copyLink(item)}
                      className="btn-hud-outline btn-hud-info btn-hud-sm"
                    >
                      Copy link
                    </button>
                  )}
                  {item.status === "done" && !userId && (
                    <button
                      type="button"
                      onClick={() => onNeedAccount?.()}
                      className="btn-hud-outline btn-hud-info btn-hud-sm"
                      title="Create an account to share files"
                    >
                      Sign in to share
                    </button>
                  )}
                  {item.status !== "uploading" && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="btn-hud-outline btn-hud-destructive"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="flex justify-end border-t-2 border-line p-3">
            <button
              type="button"
              onClick={startUploads}
              disabled={isUploading || pending === 0}
              className="btn-hud-primary btn-hud-constructive w-full disabled:opacity-35 sm:w-auto"
            >
              {isUploading
                ? "Uploading…"
                : pending
                  ? `Upload (${pending})`
                  : "Upload"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
