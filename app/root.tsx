import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration, } from "react-router";
import type { Route } from "./+types/root";
import { ToastProvider } from "./components/feedback";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/geist-mono/600.css";
import "@fontsource/geist-mono/700.css";
import "@fontsource/syne/700.css";
import "@fontsource/syne/800.css";
import "./app.css";
export function Layout({ children }: {
    children: React.ReactNode;
}) {
    return (<html lang="en">
      <head>
        <meta charSet="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="theme-color" content="#0b0c0e"/>
        <Meta />
        <title>Arkivio // Temp Storage</title>
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>);
}
export default function App() {
    return (<ToastProvider>
      <Outlet />
    </ToastProvider>);
}
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    let message = "Oops!";
    let details = "An unexpected error occurred.";
    let stack: string | undefined;
    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? "404" : "Error";
        details =
            error.status === 404
                ? "The requested page could not be found."
                : error.statusText || details;
    }
    else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message;
        stack = error.stack;
    }
    return (<main className="auth-grid flex min-h-dvh flex-col items-center justify-center px-5 py-16 text-center">
      <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted">[VAULT FAULT</p>
      <h1 className="font-syne mt-3 text-5xl font-extrabold uppercase leading-none tracking-[-0.02em] text-bone sm:text-6xl">
        {message}
      </h1>
      <p className="mt-4 max-w-2xl break-words font-sans text-sm text-muted">{details}</p>
      {stack && (<pre className="mt-6 w-full max-w-3xl overflow-x-auto border-2 border-line bg-panel p-3 text-left font-mono text-xs text-muted sm:p-4">
          <code>{stack}</code>
        </pre>)}
      <a href="/" className="btn-hud-primary mt-8">BACK TO VAULT</a>
    </main>);
}
