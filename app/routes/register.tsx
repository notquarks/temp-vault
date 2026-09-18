import type { Route } from "./+types/register";
import { RegisterScreen } from "../pages/auth/register_screen";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Arkivio // REGISTER" },
    { name: "description", content: "Create your Arkivio vault account." },
  ];
}

export default function Register() {
  return <RegisterScreen />;
}
