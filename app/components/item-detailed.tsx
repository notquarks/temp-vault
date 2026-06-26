import { Image, Share2, Trash2, Unlock, Lock } from "lucide-react";
import type { ReactNode } from "react";

interface ItemDetailedProps {
  filename: string;
  type: string;
  size: string;
  datetime: string;
  icon?: ReactNode;
  onClick?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  onTogglePrivacy?: () => void;
  isPrivate?: boolean;
}

export default function ItemDetailed({
  icon = <Image size={20} />,
  filename = "Item",
  type = "file/type",
  size = "0.00 MB",
  datetime = "00/00/0000 00:00:00",
  onClick,
  onShare,
  onDelete,
  onTogglePrivacy,
  isPrivate = false,
}: ItemDetailedProps) {
  return (
    <section
      aria-label="Item Detail"
      className="group grid grid-cols-12 px-4 py-2 font-syne tracking-wide transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:cursor-pointer hover:bg-white hover:text-black"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "  ") {
          onClick;
        }
      }}
    >
      <div className="col-span-1 flex items-center justify-center px-2 py-1 text-center align-middle">
        {icon}
      </div>
      <div className="col-span-5 flex items-center justify-start gap-3 px-2 py-1 align-middle">
        <p className="truncate">{filename}</p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePrivacy?.();
          }}
          className={`flex items-center gap-1 rounded-sm border px-2 py-0.5 font-syne text-[10px] font-bold tracking-wider uppercase transition-colors hover:cursor-pointer ${
            isPrivate
              ? "border-amber text-amber hover:bg-amber hover:text-black"
              : "border-green-500 text-green-500 hover:bg-green-500 hover:text-black"
          }`}
          aria-label={isPrivate ? "Make public" : "Make private"}
          title={
            isPrivate
              ? "Private: Only you can view"
              : "Public: Anyone with link can view"
          }
        >
          {isPrivate ? <Lock size={12} /> : <Unlock size={12} />}
          {isPrivate ? "Private" : "Public"}
        </button>
      </div>
      <div className="col-span-2 flex items-center justify-start px-2 py-1 align-middle">
        <p className="truncate opacity-60">{type}</p>
      </div>
      <div className="col-span-1 flex items-center justify-end px-2 py-1 align-middle">
        <p className="whitespace-nowrap tabular-nums opacity-80">{size}</p>
      </div>
      <div className="col-span-2 flex items-center justify-end px-2 py-1 align-middle">
        <p className="whitespace-nowrap tabular-nums opacity-80">{datetime}</p>
      </div>
      <div className="col-span-1 flex items-center justify-end gap-1 px-2 py-1 align-middle text-white transition-opacity duration-300 ease-out group-hover:text-black group-hover:opacity-100">
        {!isPrivate && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShare?.();
            }}
            className="flex h-7 w-7 items-center justify-center rounded-sm transition-all hover:scale-110 hover:cursor-pointer hover:bg-black/80 hover:text-amber"
            aria-label="Share file"
          >
            <Share2 size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-sm transition-all hover:scale-110 hover:cursor-pointer hover:bg-black/80 hover:text-amber"
          aria-label="Delete file"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </section>
  );
}
