import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { createShareLink, download, UploadError } from "~/lib/api";
import { authClient } from "~/lib/auth-client";

export default function ViewScreen() {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [fileKey, setFileKey] = useState<CryptoKey | null>(null);
  const [canShare, setCanShare] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (!fileId) return;
    setLoading(true);
    setError("");
    download(fileId)
      .then(({ blobUrl, name, fileKey, canShare }) => {
        setBlobUrl(blobUrl);
        setName(name);
        setFileKey(fileKey);
        setCanShare(canShare);
      })
      .catch((err) => {
        if (err instanceof UploadError && err.status) {
          if (err.status === 403) {
            setError("// ACCESS DENIED. THIS FILE IS PRIVATE.");
          } else if (err.status === 404) {
            setError("// FILE NOT FOUND. IT MAY HAVE BEEN DELETED.");
          } else {
            setError(`// ERROR ${err.status}: ${err.message.toUpperCase()}`);
          }
        } else {
          setError(err.message || "FAILED TO LOAD FILE");
        }
      })
      .finally(() => setLoading(false));
  }, [fileId]);

  const ext = name.split(".").pop()?.toLowerCase() || "";
  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(
    ext,
  );
  const isVideo = ["mp4", "webm", "ogg", "mov", "avi"].includes(ext);
  const shareFile = async () => {
    if (!fileId || !fileKey) return;
    try {
      const link = await createShareLink(fileId, fileKey);
      await navigator.clipboard.writeText(link);
      alert("Share link copied to clipboard!");
    } catch {
      alert("Failed to create share link.");
    }
  };

  return (
    <div className="flex min-h-dvh w-full flex-col overflow-hidden bg-black sm:h-dvh">
      <nav className="flex min-h-14 w-full shrink-0 items-center justify-between gap-3 bg-amber px-3 py-2 font-bitcount text-2xl leading-none font-semibold text-black sm:px-4 sm:text-4xl">
        <button
          type="button"
          className="hover:cursor-pointer hover:bg-black hover:text-white hover:underline"
          onClick={() => navigate("/")}
        >
          <p>UPLOAD //</p>
        </button>
        <div>
          {session ? (
            <button
              type="button"
              className="hover:cursor-pointer hover:bg-black hover:text-white hover:underline"
              onClick={async () =>
                await authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => navigate("/login"),
                  },
                })
              }
            >
              LOGOUT
            </button>
          ) : (
            <button
              type="button"
              className="hover:cursor-pointer hover:bg-black hover:text-white hover:underline"
              onClick={() => navigate("/login")}
            >
              LOGIN
            </button>
          )}
        </div>
      </nav>

      <main className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-3 sm:p-6">
        {loading && (
          <span className="font-syne text-sm tracking-[0.08em] text-white/60">
            LOADING...
          </span>
        )}
        {error && (
          <div className="max-w-xl px-2 text-center">
            <p className="font-syne text-xs leading-relaxed tracking-[0.06em] break-words text-red-400 sm:text-sm sm:tracking-[0.08em]">
              {error}
            </p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-4 border border-white/15 px-4 py-1.5 font-rajdhani text-base tracking-[0.08em] text-white/60 uppercase transition-colors hover:cursor-pointer hover:border-white/40 hover:text-white/80"
            >
              BACK
            </button>
          </div>
        )}
        {blobUrl && !loading && !error && (
          <div className="flex max-h-full max-w-full min-w-0 flex-col items-center gap-3 sm:gap-4">
            {isImage && (
              <img
                src={blobUrl}
                alt={name}
                className="max-h-[calc(100dvh-11rem)] max-w-full rounded-sm object-contain sm:max-h-[calc(100dvh-10rem)]"
              />
            )}
            {isVideo && (
              <video
                src={blobUrl}
                controls
                className="max-h-[calc(100dvh-11rem)] max-w-full rounded-sm sm:max-h-[calc(100dvh-10rem)]"
              />
            )}

            <div className="max-w-full min-w-0 text-center">
              <p className="mb-3 max-w-[90vw] truncate font-syne text-xs tracking-[0.06em] text-white/60 sm:mb-4 sm:text-sm sm:tracking-[0.08em]">
                {name}
              </p>

              <div className="flex items-center justify-center gap-2">
                <a
                  href={blobUrl}
                  download={name}
                  className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/15 text-white transition-all hover:scale-110 hover:bg-white hover:text-black"
                  aria-label="Download file"
                  title="Download file"
                >
                  <Download size={16} />
                </a>
                {canShare && (
                  <button
                    type="button"
                    onClick={shareFile}
                    className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/15 text-white transition-all hover:scale-110 hover:cursor-pointer hover:bg-white hover:text-black"
                    aria-label="Share file"
                    title="Share file"
                  >
                    <Share2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
