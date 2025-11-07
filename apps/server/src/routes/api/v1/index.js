import { Router } from "express";
import discoveryRoutes from "./discovery.routes.js";

const router = Router();

router.use("/", discoveryRoutes);

export default router;
