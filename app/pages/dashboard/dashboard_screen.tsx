import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import ItemDetailed from "~/components/item-detailed";
import { ConfirmDialog, useToast } from "~/components/feedback";
import { authClient } from "~/lib/auth-client";
import { getUserFiles, createShareLink, deleteFile, downloadFile, togglePrivacy, type FileRecord } from "~/lib/api";

export function DashboardScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<FileRecord | null>(null);

  const loadFiles = async () => {
    if (!userId) return;
    try {
      const data = await getUserFiles(userId);
      setFiles(data);
      setLoadError(false);
    } catch {
      setLoadError(true);
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
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  const handleView = (id: string) => {
    navigate(`/view/${id}`);
  };

  const handleDownload = async (id: string) => {
    try {
      await downloadFile(id);
    } catch {
      toast.error("Download failed", "Could not retrieve this item. Try again.");
    }
  };

  const handleShare = async (id: string) => {
    const target = files.find((f) => f.id === id);
    if (!target) return;
    try {
      const url = await createShareLink(id);
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied", target.isPrivate ? "Heads up — this item is private." : "Anyone with this link can view the file.");
    } catch {
      toast.error("Failed to share", "Could not create the share link. Try again.");
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteFile(target.id);
      toast.success("Item deleted", `${target.decryptedName || "File"} was removed from the vault.`);
      loadFiles();
    } catch {
      toast.error("Delete failed", "The item is still in the vault. Try again.");
    }
  };

  const handleTogglePrivacy = async (id: string, current: boolean) => {
    try {
      await togglePrivacy(id, !current);
      loadFiles();
    } catch {
      toast.error("Privacy update failed", "Could not change the item's visibility. Try again.");
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-paper text-bone selection:bg-bone selection:text-paper">
      <header className="border-b-2 border-line h-14 sm:h-16 px-5 sm:px-6 flex items-center justify-between shrink-0 animate-brutal">
        <button type="button" onClick={() => navigate("/")} className="font-syne text-[1.05rem] sm:text-lg font-extrabold tracking-[0.13em] uppercase leading-none hover:opacity-70 transition-opacity">
          ARKIVIO // DASHBOARD
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
          className="btn-hud-outline btn-hud-destructive px-4 min-h-[44px]"
        >
          Sign Out
        </button>
      </header>

      <main className="flex-1 p-5 sm:p-8 lg:p-10 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6 gap-3">
          <h1 className="font-syne text-xl font-bold tracking-wider uppercase">YOUR VAULT ITEMS ({files.length})</h1>
          <button onClick={() => navigate("/")} className="btn-hud-primary btn-hud-constructive">
            + UPLOAD NEW
          </button>
        </div>

        {loadError ? (
          <div className="bracket-frame border-2 border-line-strong bg-panel p-12 text-center shadow-brutal">
            <span className="bracket bracket-tl" aria-hidden="true" />
            <span className="bracket bracket-tr" aria-hidden="true" />
            <span className="bracket bracket-bl" aria-hidden="true" />
            <span className="bracket bracket-br" aria-hidden="true" />
            <p className="font-mono text-sm text-danger mb-4">[VAULT UNREACHABLE] COULD NOT LOAD YOUR ITEMS.</p>
            <button onClick={loadFiles} className="btn-hud-outline btn-hud-info">RETRY</button>
          </div>
        ) : files.length === 0 ? (
          <div className="bracket-frame border-2 border-line-strong bg-panel p-12 text-center shadow-brutal animate-brutal">
            <span className="bracket bracket-tl" aria-hidden="true" />
            <span className="bracket bracket-tr" aria-hidden="true" />
            <span className="bracket bracket-bl" aria-hidden="true" />
            <span className="bracket bracket-br" aria-hidden="true" />
            <p className="font-mono text-sm text-muted mb-4">NO VAULT ITEMS STORED</p>
            <button onClick={() => navigate("/")} className="btn-hud-primary btn-hud-constructive">
              UPLOAD YOUR FIRST FILE
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {files.map((file) => (
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
        confirmLabel="DELETE"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <footer className="border-t-2 border-line px-5 sm:px-6 h-10 flex items-center justify-between shrink-0">
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">© 2026 ARKIVIO</span>
        <a href="https://github.com/notquarks/temp-vault" target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted hover:text-bone underline decoration-white/20 underline-offset-4">
          GITHUB
        </a>
      </footer>
    </div>
  );
}
