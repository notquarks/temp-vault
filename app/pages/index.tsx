import { Link, useNavigate } from "react-router";
import {
  ArrowUpRight,
  FolderKanban,
  LogIn,
  Sailboat,
  UserPlus,
} from "lucide-react";
import UploadArea from "~/components/upload-area";
import { downloadFile } from "~/lib/api";
import { authClient } from "~/lib/auth-client";
import { useToast } from "~/components/feedback";

export default function HomeScreen() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const toast = useToast();

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to workbench
      </a>
      <header className="app-header">
        <Link to="/" className="app-brand" aria-label="Arkivio home">
          <Sailboat size={22} strokeWidth={2} aria-hidden="true" />
          Arkivio
        </Link>
        <nav
          aria-label="Main navigation"
          className="flex flex-wrap items-center gap-3"
        >
          {session ? (
            <Link to="/dashboard" className="btn-hud-primary">
              <FolderKanban size={16} strokeWidth={2} aria-hidden="true" />
              Vault
            </Link>
          ) : (
            <>
              <Link to="/register" className="nav-pill">
                <UserPlus size={16} strokeWidth={2} aria-hidden="true" />
                Create account
              </Link>
              <Link to="/login" className="btn-hud-primary">
                <LogIn size={16} strokeWidth={2} aria-hidden="true" />
                Sign in
              </Link>
            </>
          )}
        </nav>
      </header>

      <main id="main-content" className="app-main">
        <UploadArea
          userId={session?.user?.id}
          onNeedAccount={() => navigate("/login")}
          onView={(fileId) => navigate(`/view/${fileId}`)}
          onDownload={async (fileId) => {
            try {
              await downloadFile(fileId);
            } catch {
              toast.error(
                "Download failed",
                "Could not retrieve this item. Try again.",
              );
            }
          }}
        />
      </main>

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
