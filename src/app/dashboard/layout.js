import dynamic from "next/dynamic";
import { Footer } from "@/components/Footer";

const NavBar = dynamic(() => import("@/components/NavBar"), { ssr: false });

export default function DashboardLayout({ children }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between gap-4 p-4 md:p-14">
      <NavBar />
      <div className="flex w-full grow flex-col items-center justify-center">
        <div className="my-6 flex h-full w-full max-w-5xl flex-1 grow flex-col items-center gap-2">
          {children}
        </div>
      </div>
      <Footer />
    </main>
  );
}
