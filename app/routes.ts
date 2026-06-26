import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "./routes/login.tsx"),
  route("register", "./routes/register.tsx"),
  route("dashboard", "./routes/dashboard.tsx"),
  route("view/:fileId", "./routes/view.tsx"),
  route("share/:shareId", "./pages/share/share_screen.tsx"),
] satisfies RouteConfig;
