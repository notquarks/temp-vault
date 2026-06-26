import type { Route } from "./+types/dashboard";
import { DashboardScreen } from "../pages/dashboard/dashboard_screen";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Arkivio // DASHBOARD" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Dashboard() {
  return <DashboardScreen />;
}
