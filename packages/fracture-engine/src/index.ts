import { runClaimTrials } from "@stackmend/claim-trial";
import { buildSourceTrustRecords, persistSourceTrustRecords } from "@stackmend/compliance-engine";
import { createIntelligenceDelta, persistIntelligenceDelta } from "@stackmend/delta-reporter";
import { scanEnvironment } from "@stackmend/environment-analyzer";
import {
  createInteractionLearningRecord,
  persistInteractionLearningRecord,
} from "@stackmend/event-capture";
import { createBaselineLearningDecision } from "@stackmend/learning-engine";
import {
  buildMemoryPatterns,
  buildRepositoryConventions,
  persistInteractionMemoryNotes,
  persistRepositoryMemory,
} from "@stackmend/memory-engine";
import { createInteractionOutcome } from "@stackmend/outcome-observer";
import {
  createFeedbackRepairOutcome,
  createRepairOutcome,
  persistRepairOutcome,
} from "@stackmend/outcome-learner";
import { createInteractionPrediction } from "@stackmend/prediction-recorder";
import { createRepairPlan } from "@stackmend/repair-planner";
import {
  buildRepositoryKnowledgeModel,
  deriveRepositorySignals,
} from "@stackmend/repository-intelligence";
import { collectRouteFacts, RouteFact, scanRoutes } from "@stackmend/route-analyzer";
import {
  DiagnosisCorrectionInput,
  RepairFeedbackInput,
  ScanSummary,
} from "@stackmend/shared";
import { buildKnowledgeClaims, persistKnowledgeClaims } from "@stackmend/trust-scope-engine";
import {
  createDiagnosisCorrectionInteractionRecord,
  createRepairFeedbackInteractionRecord,
} from "@stackmend/event-capture";
import { createFeedbackIntelligenceDelta } from "@stackmend/delta-reporter";

export function scanProject(targetPath: string): ScanSummary {
  const environmentSummary = scanEnvironment(targetPath);
  const routeFractures = scanRoutes(targetPath);
  const routeFacts = collectRouteFacts(targetPath);
  const fractures = [...environmentSummary.fractures, ...routeFractures];
  const knowledgeModel = buildRepositoryKnowledgeModel(
    targetPath,
    fractures,
  );
  appendRouteEntities(knowledgeModel, routeFacts.requests, routeFacts.routes);
  const signals = deriveRepositorySignals(knowledgeModel, fractures);
  const sourceTrustRecords = buildSourceTrustRecords({
    targetPath,
    knowledgeModel,
    fractures,
  });
  const knowledgeClaims = buildKnowledgeClaims({
    targetPath,
    knowledgeModel,
    fractures,
    sourceTrustRecords,
  });
  const claimTrials = runClaimTrials({
    targetPath,
    knowledgeModel,
    sourceTrustRecords,
    claims: knowledgeClaims,
  });
  const learningDecision = createBaselineLearningDecision({
    knowledgeModel,
    fractures,
    signals,
  });
  const repairPlan = createRepairPlan({
    knowledgeModel,
    fractures,
    signals,
    learningDecision,
  });
  const memoryPatterns = buildMemoryPatterns({
    targetPath,
    fractures,
    knowledgeModel,
    knowledgeClaims: knowledgeClaims.filter((claim) =>
      claimTrials.some((trial) => trial.claimId === claim.id && trial.status !== "unsupported"),
    ),
  });
  const conventions = buildRepositoryConventions({
    targetPath,
    fractures,
    knowledgeModel,
    knowledgeClaims,
  });

  const summary: ScanSummary = {
    ...environmentSummary,
    fractures,
    knowledgeModel,
    signals,
    learningDecision,
    repairPlan,
    memoryPatterns,
    sourceTrustRecords,
    knowledgeClaims,
    claimTrials,
  };
  const repairOutcome = createRepairOutcome(summary);
  summary.repairOutcome = repairOutcome;
  const interactionPrediction = createInteractionPrediction(summary);
  const interactionOutcome = createInteractionOutcome(summary);
  const interactionRecord = createInteractionLearningRecord(
    summary,
    interactionPrediction,
    interactionOutcome,
  );
  summary.interactionRecord = interactionRecord;
  const intelligenceDelta = createIntelligenceDelta(summary, interactionRecord);
  summary.intelligenceDelta = intelligenceDelta;

  persistRepositoryMemory(targetPath, memoryPatterns, conventions);
  persistSourceTrustRecords(targetPath, sourceTrustRecords);
  persistKnowledgeClaims(targetPath, knowledgeClaims, claimTrials);
  persistRepairOutcome(targetPath, repairOutcome);
  persistInteractionLearningRecord(targetPath, interactionRecord);
  persistIntelligenceDelta(targetPath, intelligenceDelta);

  return summary;
}

export function recordRepairFeedback(input: RepairFeedbackInput) {
  const interactionRecord = createRepairFeedbackInteractionRecord(input);
  const intelligenceDelta = createFeedbackIntelligenceDelta(interactionRecord, input);
  const repairOutcome = createFeedbackRepairOutcome(input);

  persistRepairOutcome(input.targetPath, repairOutcome);
  persistInteractionLearningRecord(input.targetPath, interactionRecord);
  persistIntelligenceDelta(input.targetPath, intelligenceDelta);
  persistInteractionMemoryNotes(
    input.targetPath,
    input.action === "accepted" || input.action === "confirmed" || input.action === "modified"
      ? interactionRecord.learned
      : [],
    input.action === "rejected" ? interactionRecord.learned : [],
  );

  return { interactionRecord, intelligenceDelta, repairOutcome };
}

export function recordDiagnosisCorrection(input: DiagnosisCorrectionInput) {
  const interactionRecord = createDiagnosisCorrectionInteractionRecord(input);
  const intelligenceDelta = createFeedbackIntelligenceDelta(interactionRecord, input);
  const repairOutcome = createFeedbackRepairOutcome(input);

  persistRepairOutcome(input.targetPath, repairOutcome);
  persistInteractionLearningRecord(input.targetPath, interactionRecord);
  persistIntelligenceDelta(input.targetPath, intelligenceDelta);
  persistInteractionMemoryNotes(input.targetPath, interactionRecord.learned, [input.previousDiagnosis]);

  return { interactionRecord, intelligenceDelta, repairOutcome };
}

function appendRouteEntities(
  knowledgeModel: NonNullable<ScanSummary["knowledgeModel"]>,
  requests: Map<string, RouteFact>,
  routes: Map<string, RouteFact>,
): void {
  const entityIds = new Set(knowledgeModel.entities.map((entity) => entity.id));
  const edgeKeys = new Set(
    knowledgeModel.edges.map((edge) => `${edge.from}:${edge.relation}:${edge.to}`),
  );

  for (const requestFact of requests.values()) {
    const requestId = `request:${requestFact.key}`;
    if (!entityIds.has(requestId)) {
      knowledgeModel.entities.push({
        id: requestId,
        kind: "http_request",
        label: requestFact.key,
        metadata: {
          method: requestFact.method,
          route: requestFact.route,
          canonicalRoute: requestFact.canonicalRoute,
          expectsRequestBody: requestFact.expectsRequestBody,
          responseKind: requestFact.responseKind,
          requestSchemaHints: requestFact.requestSchemaHints.join(","),
          responseSchemaHints: requestFact.responseSchemaHints.join(","),
        },
      });
      entityIds.add(requestId);
    }

    const contractId = `contract:${requestFact.normalizedKey}`;
    if (!entityIds.has(contractId)) {
      knowledgeModel.entities.push({
        id: contractId,
        kind: "route_contract",
        label: requestFact.normalizedKey,
        metadata: {
          method: requestFact.method,
          canonicalRoute: requestFact.canonicalRoute,
          expectedRequestBody: requestFact.expectsRequestBody,
          expectedResponseKind: requestFact.responseKind,
          expectedRequestSchemaHints: requestFact.requestSchemaHints.join(","),
          expectedResponseSchemaHints: requestFact.responseSchemaHints.join(","),
        },
      });
      entityIds.add(contractId);
    }

    pushEdge(knowledgeModel, edgeKeys, requestId, contractId, "MATCHES");

    for (const file of requestFact.files) {
      const fileId = `file:${file}`;
      if (!entityIds.has(fileId)) {
        knowledgeModel.entities.push({
          id: fileId,
          kind: "file",
          label: file,
        });
        entityIds.add(fileId);
      }
      pushEdge(knowledgeModel, edgeKeys, fileId, requestId, "CALLS");
    }
  }

  for (const routeFact of routes.values()) {
    const routeId = `route:${routeFact.key}`;
    if (!entityIds.has(routeId)) {
      knowledgeModel.entities.push({
        id: routeId,
        kind: "route",
        label: routeFact.key,
        metadata: {
          method: routeFact.method,
          route: routeFact.route,
          canonicalRoute: routeFact.canonicalRoute,
          acceptsRequestBody: routeFact.expectsRequestBody,
          responseKind: routeFact.responseKind,
          responseStatus: routeFact.responseStatus ?? 0,
          requestSchemaHints: routeFact.requestSchemaHints.join(","),
          responseSchemaHints: routeFact.responseSchemaHints.join(","),
        },
      });
      entityIds.add(routeId);
    }

    const contractId = `contract:${routeFact.normalizedKey}`;
    if (!entityIds.has(contractId)) {
      knowledgeModel.entities.push({
        id: contractId,
        kind: "route_contract",
        label: routeFact.normalizedKey,
        metadata: {
          method: routeFact.method,
          canonicalRoute: routeFact.canonicalRoute,
          actualRequestBody: routeFact.expectsRequestBody,
          actualResponseKind: routeFact.responseKind,
          actualResponseStatus: routeFact.responseStatus ?? 0,
          actualRequestSchemaHints: routeFact.requestSchemaHints.join(","),
          actualResponseSchemaHints: routeFact.responseSchemaHints.join(","),
        },
      });
      entityIds.add(contractId);
    }

    pushEdge(knowledgeModel, edgeKeys, routeId, contractId, "MATCHES");

    for (const file of routeFact.files) {
      const fileId = `file:${file}`;
      if (!entityIds.has(fileId)) {
        knowledgeModel.entities.push({
          id: fileId,
          kind: "file",
          label: file,
        });
        entityIds.add(fileId);
      }
      pushEdge(knowledgeModel, edgeKeys, fileId, routeId, "IMPLEMENTS");
    }
  }
}

function pushEdge(
  knowledgeModel: NonNullable<ScanSummary["knowledgeModel"]>,
  edgeKeys: Set<string>,
  from: string,
  to: string,
  relation: "CALLS" | "IMPLEMENTS" | "MATCHES",
): void {
  const key = `${from}:${relation}:${to}`;
  if (edgeKeys.has(key)) {
    return;
  }

  knowledgeModel.edges.push({ from, to, relation });
  edgeKeys.add(key);
}
