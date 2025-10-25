import { Router } from "express";
import projects from "./projects.routes.js";
import reports from "./reports.routes.js";

const r = Router();
r.get("/", (_req, res) => res.render("index", { title: "Product OS" }));
r.use("/projects", projects);
r.use("/reports", reports);

export default r;
