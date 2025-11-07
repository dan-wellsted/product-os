import { Router } from "express";
import {
  listOutcomes,
  createOutcome,
  getOutcome,
  updateOutcome,
  deleteOutcome,
  listOpportunities,
  createOpportunity,
  getOpportunityById,
  updateOpportunityById,
  deleteOpportunityById,
  listSolutions,
  createSolution,
  getSolutionById,
  updateSolutionById,
  deleteSolutionById,
  listAssumptions,
  createAssumption,
  getAssumptionById,
  updateAssumptionById,
  deleteAssumptionById,
  createOutcomeOpportunity,
  deleteOutcomeOpportunity,
  createOpportunitySolution,
  deleteOpportunitySolution,
  batchCreateOpportunitySolution,
  createSolutionAssumption,
  deleteSolutionAssumption,
  listHypotheses,
  createHypothesis,
  getHypothesis,
  updateHypothesis,
  deleteHypothesis,
  listExperiments,
  createExperiment,
  getExperiment,
  updateExperiment,
  deleteExperiment,
  listInsights,
  createInsight,
  getInsight,
  updateInsight,
  deleteInsight,
  getOutcomeSolutionTree,
} from "../../../controllers/discovery.controller.js";

const router = Router();

router.get("/outcomes", listOutcomes);
router.post("/outcomes", createOutcome);
router.get("/outcomes/:id", getOutcome);
router.patch("/outcomes/:id", updateOutcome);
router.delete("/outcomes/:id", deleteOutcome);

router.get("/opportunities", listOpportunities);
router.post("/opportunities", createOpportunity);
router.get("/opportunities/:id", getOpportunityById);
router.patch("/opportunities/:id", updateOpportunityById);
router.delete("/opportunities/:id", deleteOpportunityById);

router.get("/solutions", listSolutions);
router.post("/solutions", createSolution);
router.get("/solutions/:id", getSolutionById);
router.patch("/solutions/:id", updateSolutionById);
router.delete("/solutions/:id", deleteSolutionById);

router.get("/assumptions", listAssumptions);
router.post("/assumptions", createAssumption);
router.get("/assumptions/:id", getAssumptionById);
router.patch("/assumptions/:id", updateAssumptionById);
router.delete("/assumptions/:id", deleteAssumptionById);

router.post("/edges/outcome-opportunity", createOutcomeOpportunity);
router.delete("/edges/outcome-opportunity/:id", deleteOutcomeOpportunity);

router.post("/edges/opportunity-solution", createOpportunitySolution);
router.post("/edges/opportunity-solution/batch", batchCreateOpportunitySolution);
router.delete("/edges/opportunity-solution/:id", deleteOpportunitySolution);

router.post("/edges/solution-assumption", createSolutionAssumption);
router.delete("/edges/solution-assumption/:id", deleteSolutionAssumption);

router.get("/hypotheses", listHypotheses);
router.post("/hypotheses", createHypothesis);
router.get("/hypotheses/:id", getHypothesis);
router.patch("/hypotheses/:id", updateHypothesis);
router.delete("/hypotheses/:id", deleteHypothesis);

router.get("/experiments", listExperiments);
router.post("/experiments", createExperiment);
router.get("/experiments/:id", getExperiment);
router.patch("/experiments/:id", updateExperiment);
router.delete("/experiments/:id", deleteExperiment);

router.get("/insights", listInsights);
router.post("/insights", createInsight);
router.get("/insights/:id", getInsight);
router.patch("/insights/:id", updateInsight);
router.delete("/insights/:id", deleteInsight);

router.get("/trees/ost", getOutcomeSolutionTree);

export default router;
