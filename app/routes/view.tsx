import ViewScreen from "~/pages/view/view_screen";
import type { Route } from "./+types/view";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Arkivio // View" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return <ViewScreen />;
}
