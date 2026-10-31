import {
  Download,
  Eye,
  FileText,
  FileImage,
  FileVideo,
  File,
  Share2,
  Trash2,
  Lock,
  Unlock,
} from "lucide-react";
import type { FileRecord } from "~/lib/api";

interface ItemDetailedProps {
  file: FileRecord;
  formatDate: (iso: string) => string;
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  onShare: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePrivacy: (id: string, current: boolean) => void;
}

function formatFileSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function getFileIcon(fileName: string, fileType?: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (
    fileType?.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext)
  ) {
    return FileImage;
  }
  if (
    fileType?.startsWith("video/") ||
    ["mp4", "webm", "ogg", "mov", "avi"].includes(ext)
  ) {
    return FileVideo;
  }
  if (
    fileType?.startsWith("text/") ||
    ["txt", "md", "json", "js", "ts", "tsx", "py", "rs", "go", "sql", "yaml", "yml", "css", "html"].includes(ext)
  ) {
    return FileText;
  }
  return File;
}

export default function ItemDetailed({
  file,
  formatDate,
  onView,
  onDownload,
  onShare,
  onDelete,
  onTogglePrivacy,
}: ItemDetailedProps) {
  const fileName = file.decryptedName || "Unnamed file";
  const Icon = getFileIcon(fileName, file.fileType);

  return (
    <div className="vault-card flex min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-paper text-bone">
          <Icon size={20} strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-sans text-lg leading-snug font-medium text-bone break-all sm:break-words">
            {fileName}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="inline-flex items-center rounded-full bg-paper px-3 py-1 font-mono text-bone">
              {formatFileSize(file.fileSize)}
            </span>
            <span className="inline-flex items-center rounded-full bg-paper px-3 py-1 font-mono">
              {formatDate(file.uploadedAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:justify-end">
        <button
          type="button"
          onClick={() => onTogglePrivacy(file.id, file.isPrivate)}
          aria-label={
            file.isPrivate
              ? `Private file ${fileName}. Click to make public`
              : `Public file ${fileName}. Click to make private`
          }
          title={
            file.isPrivate
              ? "Private — click to make public"
              : "Public — click to make private"
          }
          className={`btn-hud-sm inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-sans text-sm font-medium transition-colors ${
            file.isPrivate
              ? "bg-paper text-bone hover:bg-panel-hover"
              : "bg-pixel-glare text-abyssal-ink"
          }`}
        >
          {file.isPrivate ? (
            <Lock size={15} strokeWidth={2} aria-hidden />
          ) : (
            <Unlock size={15} strokeWidth={2} aria-hidden />
          )}
          <span>{file.isPrivate ? "Private" : "Public"}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onView(file.id)}
            className="btn-hud-primary btn-hud-sm"
            aria-label={`View ${fileName}`}
          >
            <Eye size={15} strokeWidth={2} aria-hidden />
            <span>View</span>
          </button>

          <button
            type="button"
            onClick={() => onDownload(file.id)}
            className="btn-hud-outline btn-hud-sm"
            aria-label={`Download ${fileName}`}
          >
            <Download size={15} strokeWidth={2} aria-hidden />
            <span>Download</span>
          </button>

          <button
            type="button"
            onClick={() => onShare(file.id)}
            aria-label={`Share ${fileName}`}
            className="btn-hud-outline btn-hud-sm"
          >
            <Share2 size={15} strokeWidth={2} aria-hidden />
            <span>Share</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(file.id)}
            aria-label={`Delete ${fileName}`}
            className="btn-hud-outline btn-hud-destructive btn-hud-sm"
          >
            <Trash2 size={15} strokeWidth={2} aria-hidden />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
