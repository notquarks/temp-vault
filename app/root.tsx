import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
import { ToastProvider } from "./components/feedback";
import "@fontsource/bebas-neue/400.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/geist-mono/400.css";
import "@fontsource/geist-mono/500.css";
import "./app.css";
import "./workbench.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#dfe5e2" />
        <Meta />
        <title>Arkivio</title>
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Outlet />
    </ToastProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Error";
  let details = "Request could not be completed.";
  let stack: string | undefined;
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404 Not found" : `${error.status} Error`;
    details =
      error.status === 404
        ? "This route does not exist."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }
  return (
    <main className="app-main flex min-h-dvh flex-col items-center justify-center">
      <section className="vault-card w-full max-w-xl text-center">
        <h1 className="page-heading">{message}</h1>
        <p className="mt-4 text-base break-words text-muted">{details}</p>
        {stack && (
          <pre className="mt-6 w-full overflow-x-auto rounded-3xl bg-paper p-4 text-left font-mono text-xs text-bone">
            <code>{stack}</code>
          </pre>
        )}
        <a href="/" className="btn-hud-primary mt-8">
          Open workbench
        </a>
      </section>
    </main>
  );
}
