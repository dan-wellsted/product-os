import { Router } from "express";
import projectsApi from "./api/projects.api.routes.js";
import reportsApi from "./api/reports.api.routes.js";

const router = Router();

router.use("/api/projects", projectsApi);
router.use("/api/reports", reportsApi);

export default router;
