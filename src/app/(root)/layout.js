import dynamic from "next/dynamic";
import { Footer } from "@/components/Footer";

const NavBar = dynamic(() => import("@/components/NavBar"), { ssr: false });

export default function HomeLayout({ children }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between gap-4 p-4 md:p-14">
      <NavBar />
      <div className="flex w-full grow flex-col items-center justify-center">
        {children}
      </div>
      <Footer />
    </main>
  );
}
