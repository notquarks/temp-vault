import { Hono } from "hono";
import files from "./files";
import share from "./share";

const routes = new Hono();

routes.route("/files", files);
routes.route("/share", share);

export default routes;
