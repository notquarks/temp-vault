import {
  Download,
  Eye,
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

export default function ItemDetailed({
  file,
  formatDate,
  onView,
  onDownload,
  onShare,
  onDelete,
  onTogglePrivacy,
}: ItemDetailedProps) {
  const fileName = file.decryptedName || file.encName || "Encrypted Item";

  return (
    <div
      role="group"
      aria-label={fileName}
      className="vault-shell shadow-brutal flex flex-col gap-4 border-2 border-line-strong bg-panel p-4 transition-colors hover:border-bone/60 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-line-strong bg-paper text-bone">
          <File size={16} aria-hidden />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-sans text-sm font-semibold text-bone">
            {fileName}
          </span>
          <span className="mt-0.5 truncate font-mono text-[11px] text-muted">
            {formatFileSize(file.fileSize)} • {formatDate(file.uploadedAt)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 sm:justify-end sm:border-t-0 sm:pt-0 sm:pl-4">
        <button
          type="button"
          onClick={() => onTogglePrivacy(file.id, file.isPrivate)}
          className="btn-hud-outline btn-hud-info btn-hud-sm shrink-0"
          aria-label={
            file.isPrivate ? "Private — make public" : "Public — make private"
          }
        >
          {file.isPrivate ? (
            <Lock size={12} aria-hidden />
          ) : (
            <Unlock size={12} aria-hidden />
          )}
          <span className="hidden sm:inline">
            &nbsp;{file.isPrivate ? "PRIVATE" : "PUBLIC"}
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onView(file.id)}
            className="btn-hud-outline btn-hud-info btn-hud-sm"
            aria-label={`View ${fileName}`}
          >
            <Eye size={12} aria-hidden />
            &nbsp;<span>VIEW</span>
          </button>

          <button
            type="button"
            onClick={() => onDownload(file.id)}
            className="btn-hud-outline btn-hud-info btn-hud-sm"
            aria-label={`Download ${fileName}`}
          >
            <Download size={12} aria-hidden />
            &nbsp;<span>DOWNLOAD</span>
          </button>

          <button
            type="button"
            onClick={() => onShare(file.id)}
            className="btn-hud-outline btn-hud-info btn-hud-sm"
          >
            <Share2 size={12} aria-hidden />
            &nbsp;<span>SHARE</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(file.id)}
            className="btn-hud-outline btn-hud-destructive btn-hud-sm"
          >
            <Trash2 size={12} aria-hidden />
            &nbsp;<span>DELETE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
