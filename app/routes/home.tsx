import type { Route } from "./+types/home";
import HomeScreen from "~/pages";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Arkivio // Temp Storage" },
    { name: "description", content: "Encrypted temporary file storage. Drop files, get shareable links — keys never leave your control." },
  ];
}

export default function Home() {
  return <HomeScreen />;
}
