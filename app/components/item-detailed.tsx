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
      role="button"
      tabIndex={0}
      className="group grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 border-b border-white/10 px-3 py-3 font-syne tracking-wide transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:cursor-pointer hover:bg-white hover:text-black lg:grid-cols-12 lg:gap-0 lg:border-b-0 lg:px-4 lg:py-2"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick?.();
        }
      }}
    >
      <div className="flex items-start justify-center pt-1 text-center lg:col-span-1 lg:items-center lg:px-2 lg:py-1">
        {icon}
      </div>
      <div className="flex min-w-0 flex-wrap items-center justify-start gap-2 lg:col-span-5 lg:flex-nowrap lg:gap-3 lg:px-2 lg:py-1">
        <p className="min-w-0 flex-1 truncate">{filename}</p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePrivacy?.();
          }}
          className={`flex min-h-8 items-center gap-1 rounded-sm border px-2 py-1 font-syne text-[10px] font-bold tracking-wider uppercase transition-colors hover:cursor-pointer lg:min-h-0 lg:py-0.5 ${
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
      <div className="hidden items-center justify-start px-2 py-1 align-middle lg:col-span-2 lg:flex">
        <p className="truncate opacity-60">{type}</p>
      </div>
      <div className="hidden items-center justify-end px-2 py-1 align-middle lg:col-span-1 lg:flex">
        <p className="whitespace-nowrap tabular-nums opacity-80">{size}</p>
      </div>
      <div className="hidden items-center justify-end px-2 py-1 align-middle lg:col-span-2 lg:flex">
        <p className="whitespace-nowrap tabular-nums opacity-80">{datetime}</p>
      </div>
      <div className="col-start-2 flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/55 group-hover:text-black/60 lg:hidden">
        <span className="max-w-full truncate">{type}</span>
        <span className="whitespace-nowrap tabular-nums">{size}</span>
        <span className="whitespace-nowrap tabular-nums">{datetime}</span>
      </div>
      <div className="col-span-2 flex items-center justify-end gap-2 border-t border-white/10 pt-2 text-white transition-opacity duration-300 ease-out group-hover:border-black/10 group-hover:text-black group-hover:opacity-100 lg:col-span-1 lg:border-t-0 lg:px-2 lg:py-1 lg:pt-1">
        {!isPrivate && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShare?.();
            }}
            className="flex h-10 w-10 items-center justify-center rounded-sm transition-all hover:scale-110 hover:cursor-pointer hover:bg-black/80 hover:text-amber lg:h-7 lg:w-7"
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
          className="flex h-10 w-10 items-center justify-center rounded-sm transition-all hover:scale-110 hover:cursor-pointer hover:bg-black/80 hover:text-amber lg:h-7 lg:w-7"
          aria-label="Delete file"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </section>
  );
}
