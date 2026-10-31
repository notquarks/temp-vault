import { useRef, useState, useCallback, useId } from "react";
import {
  Download,
  Eye,
  Link2,
  Trash2,
  Upload as UploadIcon,
} from "lucide-react";
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
  const maxFileSizeMB = Math.round(maxFileSize / (1024 * 1024));
  const maxFileCount = userId
    ? AUTHENTICATED_MAX_FILE_COUNT
    : GUEST_MAX_FILE_COUNT;

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
    [maxFileSize, maxFileCount],
  );

  const pending = queue.filter(
    (q) => q.status === "pending" || q.status === "failed",
  ).length;
  const uploadingCount = queue.filter((q) => q.status === "uploading").length;
  const doneCount = queue.filter((q) => q.status === "done").length;
  const isUploading = overallStatus === "uploading";

  const startUploads = useCallback(async () => {
    if (isUploading) return;
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
    <div className="flex w-full min-w-0 flex-col gap-6 sm:gap-8">
      <NoticeDialog
        open={sizeWarning !== null}
        title="Limit exceeded"
        message={
          sizeWarning
            ? `Excluded files larger than ${sizeWarning.limitMB} MB: ${sizeWarning.files.join(", ")}`
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
        className={`vault-card relative flex min-h-64 w-full cursor-pointer flex-col items-center justify-center border-2 text-center transition-colors focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-bone sm:min-h-72 ${
          isDragOver
            ? "border-accent bg-panel-hover"
            : "border-line-strong hover:bg-panel-hover"
        }`}
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
          aria-describedby={`${inputId}-limits`}
          className="sr-only"
          disabled={isUploading}
        />

        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-paper text-bone">
          <UploadIcon size={26} strokeWidth={2} aria-hidden />
        </div>

        {isUploading ? (
          <div className="flex w-full max-w-md flex-col items-center gap-4">
            <h1 className="page-heading">
              Uploading {doneCount + uploadingCount} of {queue.length}
            </h1>
            <div
              className="h-3 w-full overflow-hidden rounded-full bg-paper"
              role="progressbar"
              aria-label="Overall upload progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={queueProgress}
            >
              <div
                className="h-full w-full origin-left bg-accent transition-transform duration-200 motion-reduce:transition-none"
                style={{ transform: `scaleX(${queueProgress / 100})` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <h1 className="display-heading">Drop files here</h1>
            <span className="btn-hud-primary mt-2">
              <UploadIcon size={16} strokeWidth={2} aria-hidden />
              Select files
            </span>
          </div>
        )}
      </label>

      {queue.length > 0 && (
        <section
          className="vault-card flex flex-col gap-6"
          aria-label="Upload queue"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="card-heading">Queue</h2>
              <span className="inline-flex min-h-8 items-center rounded-full bg-paper px-3 font-mono text-xs font-medium text-bone">
                {queue.length}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={clearQueue}
                disabled={isUploading}
                className="btn-hud-outline btn-hud-sm"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={startUploads}
                disabled={isUploading || pending === 0}
                className="btn-hud-primary"
              >
                {isUploading
                  ? "Uploading…"
                  : pending
                    ? `Upload (${pending})`
                    : "Upload"}
              </button>
            </div>
          </div>

          <ul className="flex flex-col gap-3">
            {queue.map((item) => (
              <li
                key={item.id}
                className="flex min-w-0 flex-col gap-4 rounded-3xl bg-paper p-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-sans text-base font-medium break-all text-bone sm:break-words">
                    {item.file.name}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span className="inline-flex items-center rounded-full bg-panel px-3 py-1 font-mono text-bone">
                      {formatFileSize(item.file.size)}
                    </span>
                    {item.status === "pending" && (
                      <span className="inline-flex items-center rounded-full bg-panel px-3 py-1 font-medium text-muted">
                        Ready
                      </span>
                    )}
                    {item.status === "uploading" && (
                      <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 font-mono font-medium text-pure-white">
                        {item.progress}%
                      </span>
                    )}
                    {item.status === "done" && (
                      <span className="inline-flex items-center rounded-full bg-pixel-glare px-3 py-1 font-medium text-abyssal-ink">
                        Uploaded
                      </span>
                    )}
                    {item.status === "failed" && (
                      <span className="inline-flex items-center rounded-full bg-danger px-3 py-1 font-medium break-words text-pure-white">
                        {item.error || "Failed"}
                      </span>
                    )}
                  </div>

                  {(item.status === "uploading" || item.status === "done") && (
                    <div
                      className="mt-3 h-2 w-full overflow-hidden rounded-full bg-panel"
                      role="progressbar"
                      aria-label={`Upload progress for ${item.file.name}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={
                        item.status === "done" ? 100 : item.progress
                      }
                    >
                      <div
                        className="h-full w-full origin-left bg-accent transition-transform duration-200 motion-reduce:transition-none"
                        style={{
                          transform: `scaleX(${
                            (item.status === "done" ? 100 : item.progress) / 100
                          })`,
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {item.status === "done" && item.serverFileId && (
                    <>
                      <button
                        type="button"
                        onClick={() => onView?.(item.serverFileId!)}
                        className="btn-hud-outline btn-hud-sm"
                      >
                        <Eye size={15} aria-hidden />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onDownload
                            ? onDownload(item.serverFileId!)
                            : downloadFile(item.serverFileId!)
                        }
                        className="btn-hud-outline btn-hud-sm"
                      >
                        <Download size={15} aria-hidden />
                        Download
                      </button>
                    </>
                  )}
                  {item.status === "done" && userId && (
                    <button
                      type="button"
                      onClick={() => copyLink(item)}
                      className="btn-hud-primary btn-hud-sm"
                    >
                      <Link2 size={15} aria-hidden />
                      Copy link
                    </button>
                  )}
                  {item.status === "done" && !userId && (
                    <button
                      type="button"
                      onClick={() => onNeedAccount?.()}
                      className="btn-hud-outline btn-hud-sm"
                      title="Create an account to share files"
                    >
                      Sign in to share
                    </button>
                  )}
                  {item.status !== "uploading" && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.file.name} from queue`}
                      className="btn-hud-outline btn-hud-destructive btn-hud-sm"
                    >
                      <Trash2 size={15} aria-hidden />
                      Remove
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div
        id={`${inputId}-limits`}
        className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6"
      >
        <div className="vault-card-accent flex flex-col justify-between gap-2">
          <div className="stat-number">
            {queue.length > 0
              ? `${doneCount}/${queue.length}`
              : `${maxFileSizeMB} MB`}
          </div>
          <div className="text-sm font-medium">
            {queue.length > 0
              ? isUploading
                ? `Uploading (${queueProgress}%)`
                : "Completed in queue"
              : "Per-file limit"}
          </div>
        </div>

        <div className="vault-card flex flex-col justify-between gap-2">
          <div className="stat-number">
            {queue.length > 0 ? `${pending}` : `${maxFileCount} files`}
          </div>
          <div className="text-sm font-medium text-muted">
            {queue.length > 0
              ? "Ready to upload"
              : userId
                ? "Batch limit (signed in)"
                : "Batch limit (25 MB daily cap)"}
          </div>
        </div>

        <div className="vault-card flex flex-col justify-between gap-2">
          <div className="stat-number">AES-256</div>
          <div className="text-sm font-medium text-muted">
            {userId ? "Encrypted vault storage" : "Encrypted guest session"}
          </div>
        </div>
      </div>
    </div>
  );
}
