import type { Route } from "./+types/home";
import HomeScreen from "~/pages";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Arkivio" },
    {
      name: "description",
      content: "Client-side encrypted file upload and sharing workbench.",
    },
  ];
}

export default function Home() {
  return <HomeScreen />;
}
