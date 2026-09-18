import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { download, UploadError } from "~/lib/api";
import TextPreview from "~/components/text-preview";

export default function ShareScreen() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLanguage, setTextLanguage] = useState<string | null>(null);
  const [isTextFile, setIsTextFile] = useState(false);

  useEffect(() => {
    if (!shareId) return;

    const tokenMatch = window.location.hash.match(/#token=([^&]+)/);
    const token = tokenMatch?.[1]
      ? decodeURIComponent(tokenMatch[1])
      : undefined;
    setTextContent(null);
    setTextLanguage(null);
    setIsTextFile(false);
    const controller = new AbortController();
    const shareHeaders = new Headers();
    if (token) shareHeaders.set("X-Share-Token", token);

    fetch(`/api/share/${shareId}`, {
      signal: controller.signal,
      headers: shareHeaders,
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(
            body?.error
              ? `// ${body.error.toUpperCase()}`
              : "// SHARE LINK EXPIRED OR INVALID.",
          );
        }
        return res.json();
      })
      .then((data) => {
        const { fileId } = data;
        if (!fileId) throw new Error("// NO FILE ATTACHED TO THIS SHARE.");

        return download(fileId, {
          shareId,
          shareToken: token,
          signal: controller.signal,
        });
      })
      .then(({ blobUrl, name, textContent, textLanguage, isTextFile }) => {
        setBlobUrl(blobUrl);
        setName(name);
        setTextContent(textContent);
        setTextLanguage(textLanguage);
        setIsTextFile(isTextFile);
      })
      .catch((err) => {
        if (controller.signal.aborted || err?.name === "AbortError") return;
        if (err instanceof UploadError && err.status) {
          setError(`// ERROR ${err.status}: ${err.message.toUpperCase()}`);
        } else {
          setError(err.message || "FAILED TO LOAD SHARED FILE");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
      setBlobUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    };
  }, [shareId]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const ext = name.split(".").pop()?.toLowerCase() || "";
  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(
    ext,
  );
  const isVideo = ["mp4", "webm", "ogg", "mov", "avi"].includes(ext);

  return (
    <div className="flex min-h-dvh w-full flex-col bg-paper text-bone selection:bg-bone selection:text-paper">
      <header className="animate-brutal flex h-14 shrink-0 items-center justify-between border-b-2 border-line px-5 sm:h-16 sm:px-6">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="font-syne text-[1.05rem] leading-none font-extrabold tracking-[0.13em] uppercase transition-opacity hover:opacity-70 sm:text-lg"
        >
          ARKIVIO // SHARED
        </button>
        <button
          type="button"
          className="btn-hud-primary btn-hud-constructive min-h-[44px] px-5"
          onClick={() => navigate("/login")}
        >
          Sign In
        </button>
      </header>

      <main
        className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-5 sm:p-8"
        aria-live="polite"
      >
        {loading && (
          <span className="animate-brutal font-mono text-sm tracking-[0.16em] text-muted uppercase">
            DECRYPTING...
          </span>
        )}

        {error && !loading && (
          <div
            role="alert"
            className="bracket-frame shadow-brutal animate-brutal w-full max-w-xl border-2 border-line-strong bg-panel p-10 text-center"
          >
            <span className="bracket bracket-tl" aria-hidden="true" />
            <span className="bracket bracket-tr" aria-hidden="true" />
            <span className="bracket bracket-bl" aria-hidden="true" />
            <span className="bracket bracket-br" aria-hidden="true" />
            <p className="font-mono text-sm leading-relaxed tracking-wide break-words text-danger">
              {error}
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="btn-hud-outline btn-hud-info mt-6"
            >
              Go Home
            </button>
          </div>
        )}

        {blobUrl && !loading && !error && (
          <div className="animate-brutal flex max-h-full max-w-full min-w-0 flex-col items-center gap-4 delay-1">
            {textContent !== null && textLanguage ? (
              <TextPreview source={textContent} language={textLanguage} />
            ) : (
              <div className="bracket-frame shadow-brutal max-w-full border-2 border-line-strong bg-panel p-3 sm:p-4">
                <span className="bracket bracket-tl" aria-hidden="true" />
                <span className="bracket bracket-tr" aria-hidden="true" />
                <span className="bracket bracket-bl" aria-hidden="true" />
                <span className="bracket bracket-br" aria-hidden="true" />
                {isImage && (
                  <img
                    src={blobUrl}
                    alt={name}
                    className="max-h-[calc(100dvh-16rem)] max-w-full object-contain"
                  />
                )}
                {isVideo && (
                  <video
                    src={blobUrl}
                    controls
                    className="max-h-[calc(100dvh-16rem)] max-w-full"
                  />
                )}
                {!isImage && !isVideo && (
                  <div className="flex h-40 items-center justify-center px-8">
                    <span className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
                      {isTextFile
                        ? "TEXT PREVIEW UNAVAILABLE • DOWNLOAD TO OPEN"
                        : "ENCRYPTED PAYLOAD • NO PREVIEW"}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="max-w-full min-w-0 text-center">
              <p className="mb-4 max-w-[90vw] truncate font-mono text-xs tracking-[0.08em] text-muted sm:text-sm">
                {name}
              </p>
              <a
                href={blobUrl}
                download={name}
                className="btn-hud-primary btn-hud-info"
              >
                <Download size={14} aria-hidden />
                <span>&nbsp;Download</span>
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
