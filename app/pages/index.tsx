import { useNavigate } from "react-router";
import UploadArea from "~/components/upload-area";
import { authClient } from "~/lib/auth-client";

export default function HomeScreen({}) {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  return (
    <div className="marathon-grid flex min-h-dvh w-full flex-col overflow-hidden sm:h-dvh sm:flex-row">
      <nav className="flex h-16 w-full shrink-0 items-center justify-between border-b border-amber/10 bg-paper px-4 py-2 sm:my-1 sm:ml-1 sm:h-auto sm:w-14 sm:flex-col sm:items-stretch sm:border-r sm:border-b-0 sm:px-2 sm:py-4">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-start justify-start gap-1 opacity-100 transition-opacity duration-150 ease-out hover:cursor-pointer hover:opacity-65 sm:flex-col sm:gap-0"
        >
          <span className="font-bitcount text-base leading-none font-extrabold text-amber sm:text-xl">
            ARK
          </span>
          <span className="font-bitcount text-base leading-none font-extrabold text-amber sm:text-xl">
            IVI
          </span>
          <span className="font-bitcount text-base leading-none font-extrabold text-amber sm:text-xl">
            O//
          </span>
        </button>
        {session ? (
          <button
            type="button"
            className="flex gap-1 font-rajdhani text-sm font-bold tracking-[0.08em] text-amber/55 uppercase transition-colors duration-150 ease-out hover:cursor-pointer hover:text-amber sm:flex-col sm:gap-0 sm:text-base"
            onClick={() => navigate("/dashboard")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/dashboard");
            }}
          >
            <span>DASH</span>
            <span>BOARD//</span>
          </button>
        ) : (
          <button
            type="button"
            className="flex gap-1 font-rajdhani text-sm font-bold tracking-[0.08em] text-amber/55 uppercase transition-colors duration-150 ease-out hover:cursor-pointer hover:text-amber sm:flex-col sm:gap-0 sm:text-base"
            onClick={() => navigate("/login")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/login");
            }}
          >
            <span>LOG</span>
            <span>IN//</span>
          </button>
        )}
      </nav>

      <main className="flex min-h-0 w-full flex-1 flex-col items-center overflow-y-auto px-4 pt-5 pb-4 sm:justify-center sm:px-6 sm:pt-8 sm:pb-6 lg:px-10">
        <div className="w-full max-w-4xl pb-4 select-none sm:pb-6">
          <div className="relative flex items-center justify-center">
            <span
              className="absolute left-0 font-ibmplex text-xl font-bold text-amber/60"
              aria-hidden="true"
            >
              +
            </span>
            <h1 className="font-rajdhani text-[clamp(3.25rem,18vw,7.5rem)] leading-none font-bold tracking-[-0.02em] text-amber uppercase sm:text-[clamp(4rem,9vw,7.5rem)]">
              UPLOAD
            </h1>
            <span
              className="absolute right-0 font-ibmplex text-xl font-bold text-amber/60"
              aria-hidden="true"
            >
              +
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:gap-3">
            <span className="hidden font-ibmplex text-[0.6rem] tracking-[0.22em] text-amber/40 uppercase sm:inline">
              IIII IIII
            </span>
            <span className="hidden text-[0.6rem] text-amber/25 sm:inline">
              ×
            </span>
            <span className="font-ibmplex text-[0.6rem] tracking-[0.22em] text-amber/40 uppercase">
              {session ? "50 MB MAX" : "20 MB GUEST MAX"}
            </span>
            <span className="text-[0.6rem] text-amber/25">×</span>
            <span className="font-ibmplex text-[0.6rem] tracking-[0.22em] text-amber/40 uppercase">
              {session ? "10 FILES" : "3 FILES"}
            </span>
            <span className="text-[0.6rem] text-amber/25">×</span>
            <span className="font-ibmplex text-[0.6rem] tracking-[0.22em] text-amber/40">
              SEQUENTIAL //
            </span>
          </div>
          {!session && (
            <p className="mt-2 px-2 text-center font-ibmplex text-[0.55rem] leading-relaxed tracking-[0.09em] text-amber/35 uppercase sm:mt-3 sm:text-[0.6rem] sm:tracking-[0.12em]">
              ENCRYPTED // 7-DAY RETENTION // GUESTS CANNOT DELETE //
            </p>
          )}
        </div>

        <UploadArea userId={session?.user?.id} />
      </main>

      <aside
        className="hidden w-7 shrink-0 flex-col items-center justify-between bg-amber py-4 sm:flex"
        aria-hidden="true"
      >
        <span className="[transform:rotate(180deg)] font-ibmplex text-[8px] font-bold tracking-[0.18em] text-paper uppercase [writing-mode:vertical-rl]">
          ARKIVIO
        </span>
        <span className="[transform:rotate(180deg)] font-ibmplex text-[7px] font-bold tracking-[0.12em] text-paper/50 [writing-mode:vertical-rl]">
          //
        </span>
      </aside>
    </div>
  );
}
