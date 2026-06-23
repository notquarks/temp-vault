import type { Route } from "./+types/login";
import { LoginScreen } from "../auth/login_screen";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Arkivio // LOGIN" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Login() {
  return <LoginScreen />;
}
