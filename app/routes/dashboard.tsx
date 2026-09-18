import type { Route } from "./+types/dashboard";
import { DashboardScreen } from "../pages/dashboard/dashboard_screen";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Arkivio // DASHBOARD" },
    { name: "description", content: "Manage the files stored in your Arkivio vault." },
  ];
}

export default function Dashboard() {
  return <DashboardScreen />;
}
