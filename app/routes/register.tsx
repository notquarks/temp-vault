import type { Route } from "./+types/register";
import { RegisterScreen } from "../pages/auth/register_screen";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Arkivio // REGISTER" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Register() {
  return <RegisterScreen />;
}
