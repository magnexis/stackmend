import {
  Fracture,
  LearningActionScore,
  LearningDecision,
  RepositoryKnowledgeModel,
  RepositorySignal,
} from "@stackmend/shared";

export interface LearningPolicyContext {
  knowledgeModel: RepositoryKnowledgeModel;
  fractures: Fracture[];
  signals: RepositorySignal;
}

export interface LearningPolicy {
  name: string;
  decide(context: LearningPolicyContext): LearningDecision;
}

export class BaselineRepairPolicy implements LearningPolicy {
  name = "baseline-repair-policy";

  decide(context: LearningPolicyContext): LearningDecision {
    const rankedActions: LearningActionScore[] = [
      scoreEnvironmentAnalysis(context),
      scoreRouteAnalysis(context),
      scoreRepairPack(context),
      scoreProjectTruth(context),
      scoreDefer(context),
    ].sort((left, right) => right.score - left.score);

    return {
      recommendedAction: rankedActions[0].action,
      rankedActions,
    };
  }
}

export function createBaselineLearningDecision(
  context: LearningPolicyContext,
): LearningDecision {
  return new BaselineRepairPolicy().decide(context);
}

function scoreRouteAnalysis(context: LearningPolicyContext): LearningActionScore {
  const routeFractures = countFracturesByCategory(context.fractures, "route");
  const score =
    0.25 +
    routeFractures * 0.3 +
    context.signals.requestCount * 0.05 +
    context.signals.routeContractCount * 0.03;

  return {
    action: "run_route_analysis",
    score,
    reasons: [
      `Route fractures detected: ${routeFractures}.`,
      `HTTP request entities modeled: ${context.signals.requestCount}.`,
      `Route contracts modeled: ${context.signals.routeContractCount}.`,
    ],
  };
}

function scoreEnvironmentAnalysis(context: LearningPolicyContext): LearningActionScore {
  const score =
    0.45 +
    context.signals.highSeverityCount * 0.15 +
    countFracturesByCategory(context.fractures, "environment") * 0.2;

  return {
    action: "run_environment_analysis",
    score,
    reasons: [
      "Current scan includes environment fractures.",
      `High-severity fractures: ${context.signals.highSeverityCount}.`,
    ],
  };
}

function scoreRepairPack(context: LearningPolicyContext): LearningActionScore {
  const score =
    0.3 +
    context.signals.fractureCount * 0.1 +
    Math.min(context.signals.evidenceCount, 8) * 0.04;

  return {
    action: "generate_repair_pack",
    score,
    reasons: [
      `Fractures available for coordinated repair: ${context.signals.fractureCount}.`,
      `Evidence references available: ${context.signals.evidenceCount}.`,
    ],
  };
}

function scoreProjectTruth(context: LearningPolicyContext): LearningActionScore {
  const score =
    0.2 +
    context.knowledgeModel.entities.filter((entity) => entity.kind === "file").length * 0.02;

  return {
    action: "update_project_truth",
    score,
    reasons: [
      "Repository knowledge model has enough file-level evidence to refresh Project Truth.",
    ],
  };
}

function scoreDefer(context: LearningPolicyContext): LearningActionScore {
  const score = context.signals.fractureCount === 0 ? 0.9 : 0.05;

  return {
    action: "defer_for_review",
    score,
    reasons: [
      context.signals.fractureCount === 0
        ? "No fractures found; defer active repair work."
        : "Active fractures exist, so deferral is low priority.",
    ],
  };
}

function countFracturesByCategory(fractures: Fracture[], category: Fracture["category"]): number {
  return fractures.filter((fracture) => fracture.category === category).length;
}
