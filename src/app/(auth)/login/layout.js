import Link from "next/link";
import { Sailboat } from "lucide-react";

export default function LoginLayout({ children }) {
  return (
    <main className="flex min-h-screen w-full items-center justify-center">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center justify-end">
          <section className="flex flex-row items-center">
            <Sailboat className="mr-3 h-6 w-6" />
            <Link href="/">
              <h1 className="text-center text-4xl font-bold">Arkivio</h1>
            </Link>
          </section>
          <p>
            This temporary file storage lets you share or keep your files for 30
            days
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
