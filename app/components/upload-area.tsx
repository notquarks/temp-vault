import { useRef, useState, useCallback, useId } from "react";
import { useNavigate } from "react-router";
import {
  AUTHENTICATED_MAX_FILE_SIZE,
  GUEST_MAX_FILE_SIZE,
  upload,
  UploadError,
  type UploadProgress,
} from "~/lib/api";

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

interface UploadAreaProps {
  userId?: string;
  onUploadComplete?: (results: { fileName: string; fileId: string }[]) => void;
}

export default function UploadArea({
  userId,
  onUploadComplete,
}: UploadAreaProps) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [overallStatus, setOverallStatus] = useState<UploadStatus>("idle");
  const [overallError, setOverallError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputId = useId();
  const navigate = useNavigate();
  const maxFileSize = userId
    ? AUTHENTICATED_MAX_FILE_SIZE
    : GUEST_MAX_FILE_SIZE;
  const maxFileCount = userId
    ? AUTHENTICATED_MAX_FILE_COUNT
    : GUEST_MAX_FILE_COUNT;

  const addFiles = useCallback(
    (incoming: File[]) => {
      setOverallError(null);
      setOverallStatus("queued");
      setQueue((prev) => {
        const existingKeys = new Set(
          prev.map((q) => `${q.file.name}::${q.file.size}`),
        );
        const valid: QueuedFile[] = [];
        const errors: string[] = [];

        for (const file of incoming) {
          const key = `${file.name}::${file.size}`;
          if (existingKeys.has(key)) {
            errors.push(`"${file.name}" is already queued`);
            continue;
          }
          existingKeys.add(key);
          if (file.size === 0) {
            errors.push(`"${file.name}" is empty`);
            continue;
          }
          if (file.size > maxFileSize) {
            errors.push(
              `"${file.name}" exceeds ${maxFileSize / 1024 / 1024} MB (${(file.size / 1024 / 1024).toFixed(1)} MB)`,
            );
            continue;
          }
          valid.push({
            file,
            id: nextFileId(),
            status: "pending",
            progress: 0,
          });
        }

        const total = prev.length + valid.length;
        if (total > maxFileCount) {
          valid.splice(valid.length - (total - maxFileCount));
          errors.push(`Max ${maxFileCount} files — excess dropped`);
        }
        if (errors.length > 0) setOverallError(errors.join(". "));
        return [...prev, ...valid];
      });
    },
    [maxFileCount, maxFileSize],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const isUploading = overallStatus === "uploading";

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (isUploading) return;
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) addFiles(files);
    },
    [addFiles, isUploading],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      if (selected.length > 0) addFiles(selected);
      e.target.value = "";
    },
    [addFiles],
  );

  const startUpload = useCallback(async () => {
    const pending = queue.filter((q) => q.status === "pending");
    if (pending.length === 0) return;

    setOverallStatus("uploading");
    setOverallError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    const completed: { fileName: string; fileId: string }[] = [];
    let anyFailed = false;

    for (const item of pending) {
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
          onProgress: (p: UploadProgress) => {
            setQueue((prev) =>
              prev.map((q) =>
                q.id === item.id ? { ...q, progress: p.percent } : q,
              ),
            );
          },
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
        const message =
          err instanceof UploadError ? err.message : "Upload failed";
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: "failed" as const, error: message }
              : q,
          ),
        );
      }
    }

    abortRef.current = null;
    if (!anyFailed && completed.length > 0) {
      onUploadComplete?.(completed);
      setOverallStatus("success");
    } else if (anyFailed) {
      setOverallStatus("error");
    } else {
      setOverallStatus("queued");
    }
  }, [queue, userId, onUploadComplete]);

  const cancelUpload = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setOverallStatus("error");
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setOverallStatus("idle");
    setOverallError(null);
  }, []);

  const removeItem = useCallback(
    (id: string) => setQueue((prev) => prev.filter((q) => q.id !== id)),
    [],
  );

  const retryFailed = useCallback(() => {
    setQueue((prev) =>
      prev.map((q) =>
        q.status === "failed"
          ? { ...q, status: "pending" as const, error: undefined, progress: 0 }
          : q,
      ),
    );
    setOverallStatus("queued");
    setOverallError(null);
  }, []);

  const doneCount = queue.filter((q) => q.status === "done").length;
  const failedCount = queue.filter((q) => q.status === "failed").length;
  const pendingCount = queue.filter((q) => q.status === "pending").length;
  const uploadingCount = queue.filter((q) => q.status === "uploading").length;
  const showActionBar = queue.length > 0;

  const dropZoneBorder = isDragOver
    ? "border-amber/70"
    : queue.length > 0 || overallStatus === "success"
      ? "border-amber/20"
      : "border-amber/12";

  const dropZoneShadow = isDragOver
    ? "shadow-[0_0_0_1px_rgba(255,176,0,0.3),inset_0_0_80px_rgba(255,176,0,0.08)]"
    : "";

  return (
    <section
      className="mx-auto flex min-h-56 w-full max-w-4xl flex-1 flex-col items-center sm:min-h-64 sm:max-h-[34rem]"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      aria-label="File Drop"
    >
      <input
        id={inputId}
        ref={hiddenInputRef}
        type="file"
        multiple
        onChange={handleInputChange}
        disabled={isUploading}
        tabIndex={-1}
        className="sr-only"
      />

      <label
        htmlFor={inputId}
        className={[
          "relative flex h-full min-h-56 w-full flex-1 flex-col items-center justify-center select-none sm:min-h-64",
          "border bg-paper transition-[border-color,box-shadow] duration-200 ease-out",
          "outline-2 outline-offset-2 outline-amber focus-visible:outline",
          isUploading ? "cursor-not-allowed" : "cursor-pointer",
          dropZoneBorder,
          dropZoneShadow,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <span
            className={`absolute top-4 left-4 block h-5 w-5 border-t border-l transition-[border-color] duration-200 ${isDragOver ? "border-amber/60" : "border-amber/8"}`}
          />
          <span
            className={`absolute top-4 right-4 block h-5 w-5 border-t border-r transition-[border-color] duration-200 ${isDragOver ? "border-amber/60" : "border-amber/8"}`}
          />
          <span
            className={`absolute bottom-4 left-4 block h-5 w-5 border-b border-l transition-[border-color] duration-200 ${isDragOver ? "border-amber/60" : "border-amber/8"}`}
          />
          <span
            className={`absolute right-4 bottom-4 block h-5 w-5 border-r border-b transition-[border-color] duration-200 ${isDragOver ? "border-amber/60" : "border-amber/8"}`}
          />
        </div>

        <div className="group relative flex h-full w-full flex-col items-center justify-center gap-3 text-center">
          {isUploading ? (
            <>
              <span className="font-ibmplex text-sm tracking-[0.16em] text-amber uppercase tabular-nums">
                {uploadingCount > 0
                  ? `TRANSMITTING // ${doneCount + uploadingCount}/${queue.length}`
                  : "FINALIZING //"}
              </span>
              <span className="block h-px w-20 bg-amber/30" />
            </>
          ) : isDragOver ? (
            <span className="font-rajdhani text-3xl font-bold tracking-[0.15em] text-amber uppercase">
              DROP //
            </span>
          ) : queue.length > 0 ? (
            <span className="font-ibmplex text-sm tracking-[0.12em] text-amber/50 uppercase">
              {doneCount > 0
                ? `${doneCount} FILE${doneCount !== 1 ? "S" : ""} // UPLOADED`
                : `${queue.length} FILE${queue.length !== 1 ? "S" : ""} // QUEUED`}
            </span>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center">
              <div className="absolute inset-1.5 scale-[0.98] opacity-0 transition-all duration-200 ease-out group-hover:scale-100 group-hover:bg-amber group-hover:opacity-100 z-0" />
              <span className="relative z-10 font-rajdhani text-2xl font-semibold tracking-[0.18em] text-amber/45 uppercase delay-100 group-hover:text-black/70">
                DROP FILES //
              </span>
              <span className="relative z-10 font-ibmplex text-xs tracking-[0.14em] text-amber/28 uppercase delay-100 group-hover:text-black/40">
                OR CLICK TO SELECT //
              </span>
            </div>
          )}
        </div>
      </label>

      {showActionBar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-paper/90 p-3 backdrop-blur-md sm:p-6"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Upload progress"
        >
          <div className="mx-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden border border-amber/25 bg-paper shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
            <div className="flex shrink-0 items-center justify-between border-b border-amber bg-amber px-4 py-3 sm:px-5">
              <span className="font-rajdhani text-sm font-bold tracking-[0.12em] text-paper uppercase">
                {isUploading
                  ? `UPLOADING // ${doneCount + uploadingCount}/${queue.length}`
                  : overallStatus === "success"
                    ? "UPLOAD COMPLETE //"
                    : `${queue.length} FILE${queue.length !== 1 ? "S" : ""} QUEUED //`}
              </span>
              {(overallStatus === "queued" || overallStatus === "success") && (
                <button
                  type="button"
                  onClick={clearQueue}
                  className="flex h-6 w-6 items-center justify-center font-ibmplex text-sm text-paper/50 transition-colors duration-100 hover:cursor-pointer hover:text-paper"
                  aria-label="Close"
                >
                  ✕
                </button>
              )}
            </div>

            {queue.length > 0 && (
              <ul className="flex min-h-0 max-h-[50dvh] list-none flex-col overflow-y-auto sm:max-h-60">
                {queue.map((item, index) => (
                  <li
                    key={item.id}
                    className={[
                      "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 px-4 py-3 font-ibmplex text-sm transition-colors duration-100 sm:flex sm:gap-3 sm:px-5 sm:text-base",
                      index < queue.length - 1 ? "border-b border-amber/6" : "",
                      item.status === "pending" && "text-parchment/80",
                      item.status === "uploading" && "text-amber",
                      item.status === "done" && "text-parchment",
                      item.status === "failed" && "text-red-400",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span
                      className={[
                        "block h-1.5 w-1.5 shrink-0 rounded-full",
                        item.status === "pending" && "bg-parchment/20",
                        (item.status === "uploading" ||
                          item.status === "done") &&
                          "bg-amber",
                        item.status === "failed" && "bg-red-400",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      aria-hidden="true"
                    />

                    {item.status === "uploading" && (
                      <div className="col-start-2 row-start-2 h-px w-full bg-amber/10 sm:col-auto sm:h-px sm:w-16 sm:shrink-0">
                        <div
                          className="h-full bg-amber transition-[width] duration-200 ease-out"
                          style={{ width: `${item.progress}%` }}
                          role="progressbar"
                          aria-valuenow={item.progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Progress: ${item.progress}%`}
                        />
                      </div>
                    )}

                    <span className="min-w-0 truncate tracking-[0.03em] sm:flex-1">
                      {item.file.name}
                    </span>

                    <span className="shrink-0 text-xs tracking-[0.04em] text-parchment/80 tabular-nums sm:text-sm sm:tracking-[0.06em]">
                      {formatFileSize(item.file.size)}
                    </span>

                    {item.status === "done" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/view/${item.serverFileId}`);
                        }}
                        className="col-span-3 mt-1 justify-self-end border border-amber/60 px-2.5 py-1 font-rajdhani text-xs font-bold tracking-[0.1em] text-amber uppercase transition-colors duration-100 hover:cursor-pointer hover:bg-amber hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber sm:col-auto sm:mt-0 sm:shrink-0"
                        aria-label={`View ${item.file.name}`}
                      >
                        VIEW →
                      </button>
                    )}

                    {item.status === "failed" && (
                      <span
                        className="col-start-2 row-start-2 shrink-0 text-xs tracking-[0.06em] text-red-400 sm:col-auto sm:row-auto"
                        title={item.error}
                        aria-label={item.error || "Upload failed"}
                      >
                        ERR
                      </span>
                    )}

                    {item.status === "uploading" && (
                      <span className="col-start-3 row-start-2 shrink-0 text-xs font-bold text-amber tabular-nums sm:col-auto sm:row-auto">
                        {item.progress}%
                      </span>
                    )}

                    {(item.status === "pending" ||
                      item.status === "failed") && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="col-start-3 row-start-2 -mr-1 flex h-6 w-6 shrink-0 items-center justify-center justify-self-end text-parchment/80 transition-colors duration-100 hover:cursor-pointer hover:bg-amber hover:font-bold hover:text-black focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber sm:col-auto sm:row-auto"
                        aria-label={`Remove ${item.file.name}`}
                      >
                        ✕
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {overallError && (
              <div
                role="alert"
                className="max-h-24 overflow-y-auto border-t border-red-400/20 px-4 py-2.5 font-ibmplex text-xs leading-relaxed tracking-[0.04em] text-red-400 sm:px-5 sm:tracking-[0.06em]"
              >
                {overallError}
              </div>
            )}

            <div className="flex shrink-0 flex-col items-stretch gap-px border-t border-amber/8 sm:flex-row sm:items-center">
              {!isUploading && (
                <>
                  {(overallStatus === "queued" || overallStatus === "error") &&
                    pendingCount > 0 && (
                      <button
                        type="button"
                        onClick={startUpload}
                        className="flex-1 bg-amber px-3 py-3.5 font-rajdhani text-lg font-bold tracking-[0.1em] text-paper uppercase outline-0 outline-offset-2 transition-all duration-200 hover:cursor-pointer hover:bg-paper hover:text-white hover:outline-4 hover:-outline-offset-4 hover:outline-amber-bright focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-amber-bright sm:py-4 sm:text-xl sm:tracking-[0.15em]"
                      >
                        {userId ? "UPLOAD" : "UPLOAD AS GUEST"}{" "}
                        {pendingCount > 0 ? `// ${pendingCount}` : ""}
                        <span className="ml-4 inline-block">→</span>
                      </button>
                    )}

                  {failedCount > 0 && (
                    <button
                      type="button"
                      onClick={retryFailed}
                      className="flex-1 bg-amber px-3 py-3.5 font-rajdhani text-lg font-bold tracking-[0.1em] text-paper uppercase outline-0 outline-offset-2 transition-all duration-200 hover:cursor-pointer hover:bg-paper hover:text-white hover:outline-4 hover:-outline-offset-4 hover:outline-amber-bright focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-amber-bright sm:py-4 sm:text-xl sm:tracking-[0.15em]"
                    >
                      RETRY // {failedCount}
                    </button>
                  )}

                  {(overallStatus === "queued" || overallStatus === "error") &&
                    queue.length > 0 && (
                      <button
                        type="button"
                        onClick={clearQueue}
                        className="border-t border-amber/8 px-6 py-3 font-rajdhani text-sm tracking-[0.1em] text-parchment/50 uppercase transition-colors duration-100 hover:cursor-pointer hover:font-semibold hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber sm:m-2 sm:border-t-0 sm:border-l sm:py-4"
                      >
                        CLEAR
                      </button>
                    )}
                </>
              )}

              {isUploading && (
                <button
                  type="button"
                  onClick={cancelUpload}
                  className="w-full py-3.5 font-rajdhani text-sm font-bold tracking-[0.12em] text-parchment/40 uppercase transition-colors duration-100 hover:cursor-pointer hover:bg-red-600/70 hover:text-black/70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber"
                >
                  CANCEL //
                </button>
              )}

              {overallStatus === "success" && (
                <button
                  type="button"
                  onClick={clearQueue}
                  className="flex-1 bg-amber px-3 py-3.5 font-rajdhani text-lg font-bold tracking-[0.1em] text-paper uppercase outline-0 outline-offset-2 transition-all duration-200 hover:cursor-pointer hover:bg-paper hover:text-white hover:outline-4 hover:-outline-offset-4 hover:outline-amber-bright focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-amber-bright sm:py-4 sm:text-xl sm:tracking-[0.15em]"
                >
                  UPLOAD MORE →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
