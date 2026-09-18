import { useNavigate } from "react-router";
import UploadArea from "~/components/upload-area";
import { downloadFile } from "~/lib/api";
import { authClient } from "~/lib/auth-client";
import { useToast } from "~/components/feedback";
export default function HomeScreen() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const toast = useToast();
  return (
    <div className="min-h-dvh flex flex-col bg-paper text-bone selection:bg-bone selection:text-paper">
      <header className="border-b-2 border-line h-14 sm:h-16 px-5 sm:px-6 flex items-center justify-between shrink-0 animate-brutal">
        <button type="button" onClick={() => navigate("/")} className="font-mono text-[1.05rem] sm:text-lg font-bold tracking-[0.13em] uppercase leading-none hover:opacity-70 transition-opacity">
          ARKIVIO
        </button>
        {session ? (
          <button onClick={() => navigate("/dashboard")} className="btn-hud-outline btn-hud-info px-4 min-h-[44px]">Dashboard</button>
        ) : (
          <button onClick={() => navigate("/login")} className="btn-hud-primary btn-hud-constructive px-5 py-0 min-h-[44px]">Sign In</button>
        )}
      </header>
      <main className="flex-1 flex items-center justify-center p-5 sm:p-8 lg:p-10 bg-paper">
        <div className="w-full max-w-[640px] animate-brutal delay-1">
          <UploadArea
            userId={session?.user?.id}
            onNeedAccount={() => navigate("/login")}
            onView={(fileId) => navigate(`/view/${fileId}`)}
            onDownload={async (fileId) => {
              try {
                await downloadFile(fileId);
              } catch {
                toast.error("Download failed", "Could not retrieve this item. Try again.");
              }
            }}
          />
        </div>
      </main>
      <footer className="border-t-2 border-line px-5 sm:px-6 h-10 flex items-center justify-between shrink-0">
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">© 2026 ARKIVIO</span>
        <a href="https://github.com/notquarks/temp-vault" target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted hover:text-bone underline decoration-white/20 underline-offset-4">
          GITHUB
        </a>
      </footer>
    </div>
  );
}
