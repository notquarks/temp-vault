import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import ItemDetailed from "~/components/item-detailed";
import UploadArea from "~/components/upload-area";
import { authClient } from "~/lib/auth-client";
import {
  getUserFiles,
  download,
  createShareLink,
  deleteFile,
  togglePrivacy,
  type FileRecord,
} from "~/lib/api";
import { Image } from "lucide-react";
import { decryptFile } from "~/lib/crypto";

interface DashboardScreenProps {
  propName: string;
}

export function DashboardScreen({ propName }: DashboardScreenProps) {
  const Navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const [files, setFiles] = useState<FileRecord[]>([]);

  const loadFiles = async () => {
    if (!userId) return;
    try {
      const data = await getUserFiles(userId);
      setFiles(data);
    } catch {}
  };

  useEffect(() => {
    const verify = async () => {
      const current = await authClient.getSession();
      if (!current.data) Navigate("/login");
    };
    verify();
  }, [Navigate]);

  useEffect(() => {
    if (userId) loadFiles();
  }, [userId]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div>
      <nav className="flex w-full justify-between bg-amber px-2 py-1 font-bitcount text-4xl leading-none font-semibold text-black">
        <button
          type="button"
          className="hover:cursor-pointer hover:bg-black hover:text-white hover:underline"
          onClick={() => Navigate("/")}
        >
          <p>UPLOAD //</p>
        </button>
        <div>
          <button
            type="button"
            className="hover:cursor-pointer hover:bg-black hover:text-white hover:underline"
            onClick={async () =>
              await authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    Navigate("/login");
                  },
                },
              })
            }
          >
            LOGOUT
          </button>
        </div>
      </nav>
      <main>
        {files.length > 0 && (
          <div className="mx-4 mt-4 mb-8">
            <h2 className="mb-2 px-4 font-orbitron text-2xl font-extrabold tracking-tight">
              // FILES
            </h2>
            <div className="grid grid-cols-12 border-b border-white/20 px-4 py-1 font-syne text-[10px] tracking-widest text-white/40 uppercase">
              <div className="col-span-1 text-center">TYPE</div>
              <div className="col-span-5">NAME</div>
              <div className="col-span-2 text-center">FORMAT</div>
              <div className="col-span-1 text-center">SIZE</div>
              <div className="col-span-2 text-center">DATE</div>
              <div className="col-span-1 text-center">ACTION</div>
            </div>
            {files.map((file) => (
              <ItemDetailed
                key={file.id}
                icon={<Image size={18} />}
                filename={file.decryptedName || file.encName}
                type={file.fileType || "unknown"}
                size={
                  file.fileSize > 1048576
                    ? `${(file.fileSize / 1048576).toFixed(1)} MB`
                    : `${(file.fileSize / 1024).toFixed(0)} KB`
                }
                datetime={formatDate(file.uploadedAt || file.createdAt)}
                isPrivate={file.isPrivate}
                onClick={() => Navigate(`/view/${file.id}`)}
                onTogglePrivacy={async () => {
                  try {
                    const newPrivacyStatus = await togglePrivacy(file.id, !file.isPrivate);
                    setFiles(files.map((f) => 
                      f.id === file.id ? { ...f, isPrivate: newPrivacyStatus } : f
                    ));
                  } catch (err: any) {
                    alert("Failed to toggle privacy: " + err.message);
                  }
                }}
                onShare={async () => {
                  try {
                    const rawKey = Uint8Array.from(
                      atob(file.encryptedKey),
                      (c) => c.charCodeAt(0),
                    );
                    const fileKey = await crypto.subtle.importKey(
                      "raw",
                      rawKey,
                      { name: "AES-GCM", length: 256 },
                      true,
                      ["encrypt", "decrypt"],
                    );
                    const link = await createShareLink(file.id, fileKey);
                    await navigator.clipboard.writeText(link);
                    alert("Share link copied to clipboard!");
                  } catch (err) {
                    console.error(err);
                    alert("Failed to create share link");
                  }
                }}
                onDelete={async () => {
                  if (!confirm("Are you sure you want to delete this file?"))
                    return;
                  try {
                    await deleteFile(file.id);
                    loadFiles();
                  } catch (err) {
                    console.error(err);
                    alert("Failed to delete file");
                  }
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
