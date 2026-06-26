import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import HomeScreen from "~/pages";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Arkivio // Temp Storage" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return <HomeScreen />;
}
