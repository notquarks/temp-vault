import type { Route } from "./+types/login";
import { LoginScreen } from "../pages/auth/login_screen";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Arkivio // LOGIN" },
    { name: "description", content: "Sign in to your Arkivio vault." },
  ];
}

export default function Login() {
  return <LoginScreen />;
}
