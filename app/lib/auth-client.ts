import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [usernameClient()],
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : import.meta.env.VITE_BACKEND_URL,
});
