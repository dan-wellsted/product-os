import { Router } from "express";
import projectsApi from "./api/projects.api.routes.js";
import reportsApi from "./api/reports.api.routes.js";
import discoveryV1 from "./api/v1/index.js";

const router = Router();

router.use("/api/projects", projectsApi);
router.use("/api/reports", reportsApi);
router.use("/api/v1", discoveryV1);

export default router;
