import { Router } from "express";
import {
  listProjects,
  getProject,
  getProjectDiscovery,
} from "../../controllers/projects.api.controller.js";
import {
  listHypotheses,
  getHypothesis,
  createHypothesis,
  updateHypothesis,
  deleteHypothesis,
  listAssumptions,
  getAssumption,
  createAssumption,
  updateAssumption,
  deleteAssumption,
  listInterviews,
  getInterview,
  createInterview,
  updateInterview,
  deleteInterview,
  listInsights,
  getInsight,
  createInsight,
  updateInsight,
  deleteInsight,
  listOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  listSolutions,
  getSolution,
  createSolution,
  updateSolution,
  deleteSolution,
  listExperiments,
  getExperiment,
  createExperiment,
  updateExperiment,
  deleteExperiment,
  listEvidence,
  getEvidence,
  createEvidence,
  updateEvidence,
  deleteEvidence,
} from "../../controllers/discovery.api.controller.js";
import { discoveryAuditLogger } from "../../middleware/logging.middleware.js";
import { requireAdmin } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/", listProjects);
router.get("/:projectId", getProject);
router.get("/:projectId/discovery", getProjectDiscovery);

const manage = Router({ mergeParams: true });
manage.use(discoveryAuditLogger, requireAdmin);

manage
  .route("/hypotheses")
  .get(listHypotheses)
  .post(createHypothesis);

manage
  .route("/hypotheses/:hypothesisId")
  .get(getHypothesis)
  .put(updateHypothesis)
  .delete(deleteHypothesis);

manage
  .route("/assumptions")
  .get(listAssumptions)
  .post(createAssumption);

manage
  .route("/assumptions/:assumptionId")
  .get(getAssumption)
  .put(updateAssumption)
  .delete(deleteAssumption);

manage
  .route("/interviews")
  .get(listInterviews)
  .post(createInterview);

manage
  .route("/interviews/:interviewId")
  .get(getInterview)
  .put(updateInterview)
  .delete(deleteInterview);

manage
  .route("/insights")
  .get(listInsights)
  .post(createInsight);

manage
  .route("/insights/:insightId")
  .get(getInsight)
  .put(updateInsight)
  .delete(deleteInsight);

manage
  .route("/opportunities")
  .get(listOpportunities)
  .post(createOpportunity);

manage
  .route("/opportunities/:opportunityId")
  .get(getOpportunity)
  .put(updateOpportunity)
  .delete(deleteOpportunity);

manage
  .route("/solutions")
  .get(listSolutions)
  .post(createSolution);

manage
  .route("/solutions/:solutionId")
  .get(getSolution)
  .put(updateSolution)
  .delete(deleteSolution);

manage
  .route("/experiments")
  .get(listExperiments)
  .post(createExperiment);

manage
  .route("/experiments/:experimentId")
  .get(getExperiment)
  .put(updateExperiment)
  .delete(deleteExperiment);

manage
  .route("/evidence")
  .get(listEvidence)
  .post(createEvidence);

manage
  .route("/evidence/:evidenceId")
  .get(getEvidence)
  .put(updateEvidence)
  .delete(deleteEvidence);

router.use("/:projectId", manage);

export default router;
