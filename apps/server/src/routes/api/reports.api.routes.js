import { Router } from "express";
import { listReports, getReport } from "../../controllers/reports.api.controller.js";

const router = Router();

router.get("/", listReports);
router.get("/:reportId", getReport);

export default router;
