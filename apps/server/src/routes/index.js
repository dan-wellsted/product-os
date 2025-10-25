import { Router } from "express";
import projectsApi from "./api/projects.api.routes.js";
import reportsApi from "./api/reports.api.routes.js";
import discoveryRoutes from "./discovery.routes.js";

const router = Router();

router.use("/api/projects", projectsApi);
router.use("/api/reports", reportsApi);
router.use("/discovery", discoveryRoutes);

export default router;
