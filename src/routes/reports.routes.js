import { Router } from "express";
import * as ctrl from "../controllers/reports.controller.js";

const r = Router();

r.get("/", ctrl.list);
r.post("/discovery/run/:projectId", ctrl.runDiscoveryNow);
r.get("/:id", ctrl.getReport);

export default r;
