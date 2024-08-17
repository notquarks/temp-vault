import dynamic from "next/dynamic";
import { Footer } from "@/components/Footer";

const NavBar = dynamic(() => import("@/components/NavBar"), { ssr: false });

export default function FilePageLayout({ children }) {
  return (
    <div className="flex w-full max-w-5xl flex-1 grow flex-col items-center justify-between">
      {children}
    </div>
  );
}
