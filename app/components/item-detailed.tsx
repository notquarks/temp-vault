import { Image } from "lucide-react";
import type { ReactNode } from "react";

interface ItemDetailedProps {
  filename: string;
  type: string;
  size: string;
  datetime: string;
  icon: ReactNode;
}

export default function ItemDetailed({
  icon = <Image size={20} />,
  filename = "Item",
  type = "file/type",
  size = "0.00 MB",
  datetime = "00/00/0000 00:00:00",
}: ItemDetailedProps) {
  return (
    <div className="grid grid-cols-8 px-4 py-2 font-syne tracking-wide hover:cursor-pointer hover:bg-white hover:text-black hover:outline-2 hover:outline-black">
      <div className="col-span-1 justify-center px-2 py-1 text-center align-middle">
        {icon}
      </div>
      <div className="col-span-3 justify-center px-2 py-1 align-middle">
        <p>{filename}</p>
      </div>
      <div className="col-span-2 justify-center px-2 py-1 text-center align-middle">
        <p>{type}</p>
      </div>
      <div className="col-span-1 justify-center px-2 py-1 text-center align-middle">
        <p>{size}</p>
      </div>
      <div className="col-span-1 justify-center px-2 py-1 text-center align-middle">
        <p>{datetime}</p>
      </div>
    </div>
  );
}
