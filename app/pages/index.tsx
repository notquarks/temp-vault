import { useEffect } from "react";
import { useNavigate } from "react-router";
import UploadArea from "~/components/upload-area";
import { authClient } from "~/lib/auth-client";

export default function HomeScreen({}) {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  return (
    <div className="marathon-grid flex h-full max-h-dvh min-h-dvh w-full max-w-dvw min-w-dvw">
      <nav className="my-1 ml-1 flex w-14 shrink-0 flex-col justify-between border-r border-amber/10 bg-paper px-2 py-4">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex flex-col items-start justify-start opacity-100 transition-opacity duration-150 ease-out hover:cursor-pointer hover:opacity-65"
        >
          <span className="font-bitcount text-xl leading-none font-extrabold text-amber">
            ARK
          </span>
          <span className="font-bitcount text-xl leading-none font-extrabold text-amber">
            IVI
          </span>
          <span className="font-bitcount text-xl leading-none font-extrabold text-amber">
            O//
          </span>
        </button>
        {authClient.useSession().data ? (
          <button
            type="button"
            className="flex flex-col font-rajdhani text-base font-bold tracking-[0.08em] text-amber/55 uppercase transition-colors duration-150 ease-out hover:cursor-pointer hover:text-amber"
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
            className="flex flex-col font-rajdhani text-base font-bold tracking-[0.08em] text-amber/55 uppercase transition-colors duration-150 ease-out hover:cursor-pointer hover:text-amber"
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

      <div className="flex w-full flex-col items-center justify-center">
        <div className="w-full max-w-4xl pt-10 pb-6 select-none">
          <div className="relative flex items-center justify-center">
            <span
              className="absolute left-0 font-ibmplex text-xl font-bold text-amber/60"
              aria-hidden="true"
            >
              +
            </span>
            <h1
              className="font-rajdhani leading-none font-bold tracking-[-0.02em] text-amber uppercase"
              style={{ fontSize: "clamp(4rem, 9vw, 7.5rem)" }}
            >
              UPLOAD
            </h1>
            <span
              className="absolute right-0 font-ibmplex text-xl font-bold text-amber/60"
              aria-hidden="true"
            >
              +
            </span>
          </div>

          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="font-ibmplex text-[0.6rem] tracking-[0.22em] text-amber/40 uppercase">
              IIII IIII
            </span>
            <span className="text-[0.6rem] text-amber/25">×</span>
            <span className="font-ibmplex text-[0.6rem] tracking-[0.22em] text-amber/40 uppercase">
              50 MB MAX
            </span>
            <span className="text-[0.6rem] text-amber/25">×</span>
            <span className="font-ibmplex text-[0.6rem] tracking-[0.22em] text-amber/40 uppercase">
              20 FILES
            </span>
            <span className="text-[0.6rem] text-amber/25">×</span>
            <span className="font-ibmplex text-[0.6rem] tracking-[0.22em] text-amber/40">
              SEQUENTIAL //
            </span>
          </div>
        </div>

        <UploadArea userId={session?.user?.id} />
      </div>

      <aside
        className="flex w-7 shrink-0 flex-col items-center justify-between bg-amber py-4"
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
