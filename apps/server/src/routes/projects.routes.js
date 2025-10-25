// routes/projects.routes.js
import { Router } from "express";
import * as ctrl from "../controllers/projects.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  ProjectCreateSchema,
  InsightAddSchema,
  InsightUpdateSchema,
  OutcomeAddSchema,
  OutcomeUpdateSchema,
  OpportunityAddSchema,
  OpportunityUpdateSchema,
  ExperimentAddSchema,
  ExperimentUpdateSchema,
  MetricAddSchema,
  MetricUpdateSchema,
  MetricSnapshotAddSchema,
  EnableWeeklySchema,
  EnableMonthlySchema,
} from "../validation/schemas.js";

const r = Router();

// List
r.get("/", ctrl.list);

// Create flow
r.get("/new/form", ctrl.newForm);
r.post("/", validate(ProjectCreateSchema), ctrl.create);
r.post("/quick-create", ctrl.quickCreate);

// Project detail
r.get("/:id", ctrl.detail);

// ---- Discovery loop creates ----
r.post("/:id/insights", validate(InsightAddSchema), ctrl.addInsight);
r.post("/:id/outcomes", validate(OutcomeAddSchema), ctrl.addOutcome);
r.post(
  "/:id/opportunities",
  validate(OpportunityAddSchema),
  ctrl.addOpportunity,
);
r.post("/:id/experiments", validate(ExperimentAddSchema), ctrl.addExperiment);
r.post("/:id/metrics", validate(MetricAddSchema), ctrl.addMetric);
r.post(
  "/:id/metrics/snapshots",
  validate(MetricSnapshotAddSchema),
  ctrl.addMetricSnapshot,
);

// ---- Insights CRUD ----
r.get("/:id/insights/:insightId/edit", ctrl.editInsightForm);
r.post(
  "/:id/insights/:insightId/update",
  validate(InsightUpdateSchema),
  ctrl.updateInsight,
);
r.post("/:id/insights/:insightId/delete", ctrl.deleteInsight);

// ---- Opportunities CRUD ----
r.get("/:id/opportunities/:oppId/edit", ctrl.editOpportunityForm);
r.post(
  "/:id/opportunities/:oppId/update",
  validate(OpportunityUpdateSchema),
  ctrl.updateOpportunity,
);
r.post("/:id/opportunities/:oppId/delete", ctrl.deleteOpportunity);

// ---- Experiments CRUD ----
r.get("/:id/experiments/:expId/edit", ctrl.editExperimentForm);
r.post(
  "/:id/experiments/:expId/update",
  validate(ExperimentUpdateSchema),
  ctrl.updateExperiment,
);
r.post("/:id/experiments/:expId/delete", ctrl.deleteExperiment);

// ---- Outcomes CRUD (NEW edit/update; delete existed) ----
r.get("/:id/outcomes/:outcomeId/edit", ctrl.editOutcomeForm);
r.post(
  "/:id/outcomes/:outcomeId/update",
  validate(OutcomeUpdateSchema),
  ctrl.updateOutcome,
);
r.post("/:id/outcomes/:outcomeId/delete", ctrl.deleteOutcome);

// ---- Metrics CRUD (NEW edit/update; delete existed) ----
r.get("/:id/metrics/:metricId/edit", ctrl.editMetricForm);
r.post(
  "/:id/metrics/:metricId/update",
  validate(MetricUpdateSchema),
  ctrl.updateMetric,
);
r.post("/:id/metrics/:metricId/delete", ctrl.deleteMetric);

// ---- Snapshots delete (unchanged) ----
r.post("/:id/metrics/snapshots/:snapshotId/delete", ctrl.deleteMetricSnapshot);

// ---- Scheduling ----
r.post("/:id/schedule/weekly", validate(EnableWeeklySchema), ctrl.enableWeekly);
r.post(
  "/:id/schedule/monthly",
  validate(EnableMonthlySchema),
  ctrl.enableMonthly,
);
r.post("/:id/schedule/disable", ctrl.disableSchedule);

export default r;
