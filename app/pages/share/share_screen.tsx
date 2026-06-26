import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { download, UploadError } from "~/lib/api";

export default function ShareScreen() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shareId) return;
    

    const hash = window.location.hash;
    const keyMatch = hash.match(/#key=([^&]+)/);
    if (!keyMatch) {
      setError("// INVALID SHARE LINK: MISSING DECRYPTION KEY.");
      setLoading(false);
      return;
    }
    

    fetch(`/api/share/${shareId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ? `// ${body.error.toUpperCase()}` : "// SHARE LINK EXPIRED OR INVALID.");
        }
        return res.json();
      })
      .then((data) => {
        const { fileId } = data;
        if (!fileId) throw new Error("// NO FILE ATTACHED TO THIS SHARE.");
        

        return download(fileId, { shareId });
      })
      .then(({ blobUrl, name }) => {
        setBlobUrl(blobUrl);
        setName(name);
      })
      .catch((err) => {
        if (err instanceof UploadError && err.status) {
          setError(`// ERROR ${err.status}: ${err.message.toUpperCase()}`);
        } else {
          setError(err.message || "FAILED TO LOAD SHARED FILE");
        }
      })
      .finally(() => setLoading(false));
  }, [shareId]);

  const ext = name.split(".").pop()?.toLowerCase() || "";
  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext);
  const isVideo = ["mp4", "webm", "ogg", "mov", "avi"].includes(ext);

  return (
    <div className="flex h-dvh w-full flex-col bg-black">
      <nav className="flex w-full justify-between bg-amber px-2 py-1 font-bitcount text-4xl leading-none font-semibold text-black">
        <button
          type="button"
          className="hover:cursor-pointer hover:bg-black hover:text-white hover:underline"
          onClick={() => navigate("/")}
        >
          <p>HOME //</p>
        </button>
        <div>
          <button
            type="button"
            className="hover:cursor-pointer hover:bg-black hover:text-white hover:underline"
            onClick={() => navigate("/login")}
          >
            LOGIN
          </button>
        </div>
      </nav>

      <div className="flex flex-1 items-center justify-center p-4">
        {loading && (
          <span className="font-syne text-sm tracking-[0.08em] text-white/60">
            DECRYPTING...
          </span>
        )}
        {error && (
          <div className="text-center">
            <p className="font-syne text-sm tracking-[0.08em] text-red-400">
              {error}
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-4 border border-white/15 px-4 py-1.5 font-rajdhani text-base tracking-[0.08em] text-white/60 uppercase transition-colors hover:cursor-pointer hover:border-white/40 hover:text-white/80"
            >
              GO HOME
            </button>
          </div>
        )}
        {blobUrl && !loading && !error && (
          <div className="flex max-h-full max-w-full flex-col items-center gap-4">
            {isImage && (
              <img
                src={blobUrl}
                alt={name}
                className="max-h-[80vh] max-w-full rounded-sm object-contain"
              />
            )}
            {isVideo && (
              <video
                src={blobUrl}
                controls
                className="max-h-[80vh] max-w-full rounded-sm"
              />
            )}
            {!isImage && !isVideo && (
              <div className="text-center">
                <p className="mb-4 font-syne text-sm tracking-[0.08em] text-white/60">
                  {name}
                </p>
                <a
                  href={blobUrl}
                  download={name}
                  className="inline-block border border-amber-400/60 bg-amber-400/[0.06] px-5 py-1.5 font-rajdhani text-base font-bold tracking-[0.1em] text-amber-300 uppercase transition-colors hover:bg-amber-400 hover:text-black"
                >
                  DOWNLOAD
                </a>
              </div>
            )}
            <p className="font-syne text-xs tracking-[0.08em] text-white/40">
              {name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
