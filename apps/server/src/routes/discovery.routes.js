import { Router } from "express";
import { discoveryAuditLogger } from "../middleware/logging.middleware.js";
import { requireAdmin } from "../middleware/auth.middleware.js";
import * as api from "../controllers/discovery.api.controller.js";

const router = Router();

router.use(discoveryAuditLogger);
router.use(requireAdmin);

const apiRouter = Router({ mergeParams: true });

apiRouter.get("/projects", api.listProjects);
apiRouter.get("/projects/:projectId/overview", api.getProjectOverview);

apiRouter
  .route("/projects/:projectId/hypotheses")
  .get(api.listHypotheses)
  .post(api.createHypothesis);

apiRouter
  .route("/projects/:projectId/hypotheses/:hypothesisId")
  .get(api.getHypothesis)
  .put(api.updateHypothesis)
  .delete(api.deleteHypothesis);

apiRouter
  .route("/projects/:projectId/assumptions")
  .get(api.listAssumptions)
  .post(api.createAssumption);

apiRouter
  .route("/projects/:projectId/assumptions/:assumptionId")
  .get(api.getAssumption)
  .put(api.updateAssumption)
  .delete(api.deleteAssumption);

apiRouter
  .route("/projects/:projectId/interviews")
  .get(api.listInterviews)
  .post(api.createInterview);

apiRouter
  .route("/projects/:projectId/interviews/:interviewId")
  .get(api.getInterview)
  .put(api.updateInterview)
  .delete(api.deleteInterview);

apiRouter
  .route("/projects/:projectId/insights")
  .get(api.listInsights)
  .post(api.createInsight);

apiRouter
  .route("/projects/:projectId/insights/:insightId")
  .get(api.getInsight)
  .put(api.updateInsight)
  .delete(api.deleteInsight);

apiRouter
  .route("/projects/:projectId/opportunities")
  .get(api.listOpportunities)
  .post(api.createOpportunity);

apiRouter
  .route("/projects/:projectId/opportunities/:opportunityId")
  .get(api.getOpportunity)
  .put(api.updateOpportunity)
  .delete(api.deleteOpportunity);

apiRouter
  .route("/projects/:projectId/solutions")
  .get(api.listSolutions)
  .post(api.createSolution);

apiRouter
  .route("/projects/:projectId/solutions/:solutionId")
  .get(api.getSolution)
  .put(api.updateSolution)
  .delete(api.deleteSolution);

apiRouter
  .route("/projects/:projectId/experiments")
  .get(api.listExperiments)
  .post(api.createExperiment);

apiRouter
  .route("/projects/:projectId/experiments/:experimentId")
  .get(api.getExperiment)
  .put(api.updateExperiment)
  .delete(api.deleteExperiment);

apiRouter
  .route("/projects/:projectId/evidence")
  .get(api.listEvidence)
  .post(api.createEvidence);

apiRouter
  .route("/projects/:projectId/evidence/:evidenceId")
  .get(api.getEvidence)
  .put(api.updateEvidence)
  .delete(api.deleteEvidence);

router.use("/api", apiRouter);

export default router;
