import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, LogOut, Sailboat, Search, Upload } from "lucide-react";
import ItemDetailed from "~/components/item-detailed";
import { ConfirmDialog, useToast } from "~/components/feedback";
import { authClient } from "~/lib/auth-client";
import {
  getUserFiles,
  createShareLink,
  deleteFile,
  downloadFile,
  togglePrivacy,
  type FileRecord,
} from "~/lib/api";

function formatTotalSize(files: FileRecord[]) {
  const bytes = files.reduce((acc, f) => acc + (f.fileSize || 0), 0);
  if (bytes === 0) return "0 KB";
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {}
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function DashboardScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<FileRecord | null>(null);
  const [query, setQuery] = useState("");

  const loadFiles = async (options?: { silent?: boolean }) => {
    if (!userId) return;
    if (!options?.silent) setIsLoading(true);
    try {
      const data = await getUserFiles(userId);
      setFiles(data);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      if (!options?.silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    const verify = async () => {
      const current = await authClient.getSession();
      if (!current.data) navigate("/login");
    };
    verify();
  }, [navigate]);

  useEffect(() => {
    if (userId) loadFiles();
  }, [userId]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const handleView = (id: string) => {
    navigate(`/view/${id}`);
  };

  const handleDownload = async (id: string) => {
    try {
      await downloadFile(id);
    } catch {
      toast.error(
        "Download failed",
        "Could not retrieve this item. Try again.",
      );
    }
  };

  const handleShare = async (id: string) => {
    try {
      const link = await createShareLink(id);
      await copyTextToClipboard(link);
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, isPrivate: false } : f)),
      );
      await loadFiles({ silent: true });
      toast.success(
        "Share link copied",
        "File is now public and anyone with the link can view it.",
      );
    } catch {
      toast.error(
        "Share failed",
        "Could not create a share link for this item.",
      );
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteFile(target.id);
      setFiles((prev) => prev.filter((f) => f.id !== target.id));
      await loadFiles({ silent: true });
      toast.info("Item deleted", `${target.decryptedName || "File"} removed.`);
    } catch {
      toast.error("Delete failed", "Could not remove this item. Try again.");
    }
  };

  const handleTogglePrivacy = async (id: string, current: boolean) => {
    const nextPrivate = !current;
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isPrivate: nextPrivate } : f)),
    );
    try {
      await togglePrivacy(id, nextPrivate);
      await loadFiles({ silent: true });
      if (nextPrivate) {
        toast.info("File is now private", "Active share links are disabled.");
      } else {
        toast.success(
          "File is now public",
          "Share links are active for this item.",
        );
      }
    } catch {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, isPrivate: current } : f)),
      );
      toast.error(
        "Update failed",
        "Could not change privacy for this item. Try again.",
      );
    }
  };

  const filteredFiles = files.filter((f) =>
    (f.decryptedName || "Unnamed file")
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const publicCount = files.filter((f) => !f.isPrivate).length;

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="app-brand" aria-label="Arkivio home">
          <Sailboat size={22} strokeWidth={2} aria-hidden="true" />
          Arkivio
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="btn-hud-primary"
          >
            <Upload size={16} strokeWidth={2} aria-hidden="true" />
            Upload files
          </button>
          <button
            type="button"
            onClick={async () => {
              await authClient.signOut({
                fetchOptions: {
                  onSuccess: () => navigate("/login"),
                },
              });
            }}
            className="btn-hud-outline"
          >
            <LogOut size={16} strokeWidth={2} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </header>

      <main className="app-main flex flex-col gap-6 sm:gap-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          <div className="vault-card-accent flex flex-col justify-between gap-2">
            <h1 className="stat-number">{files.length}</h1>
            <div className="text-sm font-medium">Vault items</div>
          </div>
          <div className="vault-card flex flex-col justify-between gap-2">
            <div className="stat-number">{formatTotalSize(files)}</div>
            <div className="text-sm font-medium text-muted">Total stored</div>
          </div>
          <div className="vault-card flex flex-col justify-between gap-2">
            <div className="stat-number">{publicCount}</div>
            <div className="text-sm font-medium text-muted">Shared links</div>
          </div>
        </div>

        {files.length > 0 && (
          <div className="relative flex w-full items-center">
            <Search
              size={18}
              strokeWidth={2}
              className="pointer-events-none absolute left-6 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter files by name"
              aria-label="Filter files by name"
              className="w-full pr-6 pl-14"
            />
          </div>
        )}

        {isLoading ? (
          <div
            className="flex flex-col gap-4"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <span className="sr-only">Loading vault items…</span>
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="vault-card flex min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"
                aria-hidden="true"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="vault-skeleton h-12 w-12 shrink-0 rounded-full" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                    <div className="vault-skeleton h-5 w-56 max-w-full rounded-full" />
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="vault-skeleton h-6 w-20 rounded-full" />
                      <div className="vault-skeleton h-6 w-36 rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="vault-skeleton h-11 w-24 rounded-full" />
                  <div className="vault-skeleton h-11 w-24 rounded-full" />
                  <div className="vault-skeleton h-11 w-28 rounded-full" />
                  <div className="vault-skeleton h-11 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="vault-empty">
            <p className="text-base text-danger">
              Could not load your files. Try again to reconnect.
            </p>
            <button onClick={() => loadFiles()} className="btn-hud-outline">
              Try again
            </button>
          </div>
        ) : files.length === 0 ? (
          <div className="vault-empty">
            <h2 className="card-heading">No files stored</h2>
            <button
              onClick={() => navigate("/")}
              className="btn-hud-primary mt-2"
            >
              <Upload size={16} strokeWidth={2} aria-hidden="true" />
              Upload first file
            </button>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="vault-empty">
            <p className="text-base text-muted">
              No files match &ldquo;{query}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="btn-hud-outline"
            >
              Clear filter
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredFiles.map((file) => (
              <ItemDetailed
                key={file.id}
                file={file}
                formatDate={formatDate}
                onView={handleView}
                onDownload={handleDownload}
                onDelete={(id) => {
                  const target = files.find((f) => f.id === id);
                  if (target) setPendingDelete(target);
                }}
                onShare={handleShare}
                onTogglePrivacy={handleTogglePrivacy}
              />
            ))}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this item?"
        message={`"${pendingDelete?.decryptedName || "This file"}" will be permanently removed from the vault. This cannot be undone.`}
        confirmLabel="Delete file"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <footer className="app-footer">
        <span>© 2026 Arkivio</span>
        <a
          href="https://github.com/notquarks/temp-vault"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
          <ArrowUpRight size={15} strokeWidth={2} aria-hidden="true" />
        </a>
      </footer>
    </div>
  );
}
