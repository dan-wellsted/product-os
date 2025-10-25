import { Router } from "express";
import { listProjects, getProject } from "../../controllers/projects.api.controller.js";

const router = Router();

router.get("/", listProjects);
router.get("/:projectId", getProject);

export default router;
