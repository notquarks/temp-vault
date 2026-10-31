import { Link, useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, Download, Lock, Sailboat, Upload } from "lucide-react";
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
              ? body.error
              : "This share link has expired or is invalid.",
          );
        }
        return res.json();
      })
      .then((data) => {
        const { fileId } = data;
        if (!fileId)
          throw new Error("There is no file attached to this share link.");

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
          setError(`Error ${err.status}: ${err.message}`);
        } else {
          setError(err.message || "Unable to load this shared file.");
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
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="app-brand" aria-label="Arkivio home">
          <Sailboat size={22} strokeWidth={2} aria-hidden="true" />
          Arkivio
        </Link>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="btn-hud-outline"
        >
          <Upload size={16} strokeWidth={2} aria-hidden="true" />
          Upload
        </button>
      </header>

      <main className="app-main flex flex-1 flex-col">
        {loading && (
          <section
            className="flex w-full min-w-0 flex-col gap-6"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="vault-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex min-h-8 items-center gap-2 rounded-full bg-pixel-glare px-3.5 py-1 text-xs font-medium text-abyssal-ink">
                    <Lock size={14} strokeWidth={2} aria-hidden="true" />
                    AES-256
                  </span>
                  <h1 className="card-heading">Decrypting shared file</h1>
                </div>
                <div
                  className="vault-skeleton h-4 w-64 max-w-full rounded-full"
                  aria-hidden="true"
                />
              </div>
              <div
                className="flex flex-wrap items-center gap-3"
                aria-hidden="true"
              >
                <div className="vault-skeleton h-12 w-36 rounded-full" />
              </div>
            </div>

            <div className="vault-card flex min-h-80 w-full min-w-0 flex-col justify-between gap-6 sm:min-h-[440px]">
              <div
                className="vault-skeleton flex flex-1 flex-col items-center justify-center rounded-3xl p-6 text-center"
                aria-hidden="true"
              >
                <div className="relative z-10 flex max-w-sm flex-col items-center gap-4 rounded-3xl bg-ash-white px-6 py-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-paper text-bone">
                    <Lock size={20} strokeWidth={2} />
                  </div>
                  <p className="text-sm font-medium text-bone">
                    Verifying share link and decrypting payload…
                  </p>
                  <div className="vault-shimmer-bar h-2.5 w-48 rounded-full" />
                </div>
              </div>
              <div
                className="grid grid-cols-3 gap-3 sm:gap-4"
                aria-hidden="true"
              >
                <div className="vault-skeleton h-3.5 rounded-full" />
                <div className="vault-skeleton h-3.5 rounded-full" />
                <div className="vault-skeleton h-3.5 rounded-full" />
              </div>
            </div>
          </section>
        )}

        {error && (
          <section className="vault-empty my-auto" role="alert">
            <h1 className="page-heading">Link unavailable</h1>
            <p className="text-base text-danger">{error}</p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="btn-hud-primary mt-2"
            >
              Open workbench
            </button>
          </section>
        )}

        {blobUrl && !loading && !error && (
          <section className="flex w-full min-w-0 flex-col gap-6">
            <div className="vault-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="card-heading break-all sm:break-words">
                  {name}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <a href={blobUrl} download={name} className="btn-hud-primary">
                  <Download size={16} strokeWidth={2} aria-hidden="true" />
                  Download
                </a>
              </div>
            </div>

            {textContent !== null && textLanguage ? (
              <TextPreview source={textContent} language={textLanguage} />
            ) : (
              <div className="vault-card flex min-h-64 w-full min-w-0 items-center justify-center">
                {isImage && (
                  <img
                    src={blobUrl}
                    alt={name}
                    className="max-h-[65dvh] max-w-full rounded-3xl object-contain"
                  />
                )}
                {isVideo && (
                  <video
                    src={blobUrl}
                    controls
                    aria-label={name}
                    className="max-h-[65dvh] max-w-full rounded-3xl"
                  />
                )}
                {!isImage && !isVideo && (
                  <div className="max-w-sm py-8 text-center">
                    <h2 className="card-heading">No inline preview</h2>
                    <p className="mt-2 text-sm text-muted">
                      {isTextFile
                        ? "Download a copy to open this text file on your device."
                        : "Download this file to open it locally."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
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
