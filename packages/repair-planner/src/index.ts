import {
  Fracture,
  LearningDecision,
  RepairPlan,
  RepositoryKnowledgeModel,
  RepositorySignal,
} from "@stackmend/shared";

export interface RepairPlannerContext {
  fractures: Fracture[];
  knowledgeModel: RepositoryKnowledgeModel;
  signals: RepositorySignal;
  learningDecision: LearningDecision;
}

export function createRepairPlan(context: RepairPlannerContext): RepairPlan | undefined {
  if (context.fractures.length === 0) {
    return undefined;
  }

  const fileTouchCount = new Set(
    context.fractures.flatMap((fracture) => fracture.evidence.map((entry) => entry.file)),
  ).size;

  return {
    id: "RP-001",
    title: determinePlanTitle(context.fractures),
    status:
      context.learningDecision.recommendedAction === "defer_for_review" ? "blocked" : "proposed",
    summary: determinePlanSummary(context.fractures),
    basedOnFractures: context.fractures.map((fracture) => fracture.id),
    recommendedBy: context.learningDecision.recommendedAction,
    estimatedFileTouches: fileTouchCount,
    evidenceCount: context.signals.evidenceCount,
    steps: buildRepairSteps(context),
  };
}

function buildRepairSteps(context: RepairPlannerContext) {
  const hasRouteFractures = context.fractures.some((fracture) => fracture.category === "route");
  const hasRouteExpectationFractures = context.fractures.some((fracture) =>
    fracture.title.startsWith("Route contract expectation mismatch:"),
  );
  const hasRouteSchemaFractures = context.fractures.some((fracture) =>
    fracture.actual.some((item) => item.includes("fields not observed")),
  );
  const hasEnvironmentFractures = context.fractures.some(
    (fracture) => fracture.category === "environment",
  );
  const steps = [];

  if (hasRouteFractures) {
    steps.push(
      {
        system: "frontend",
        action: "Update API callers to use the canonical route contract and normalize path prefixes.",
      },
      {
        system: "backend",
        action: "Add or align backend handlers and aliases for missing or mismatched request paths.",
      },
      {
        system: "tests",
        action: "Add integration coverage for request, alias, and route contract agreement.",
      },
    );
  }

  if (hasRouteExpectationFractures) {
    steps.push(
      {
        system: "contracts",
        action: "Align request payload expectations and response formats between callers and backend handlers.",
      },
      {
        system: "validation",
        action: "Add contract tests for response shape, status behavior, and payload handling.",
      },
    );
  }

  if (hasRouteSchemaFractures) {
    steps.push(
      {
        system: "api-schema",
        action: "Align request and response field shapes between frontend usage and backend serialization.",
      },
      {
        system: "typing",
        action: "Add or update shared API types or validators so contract field names stay synchronized.",
      },
    );
  }

  if (hasEnvironmentFractures) {
    steps.push(
      {
        system: "environment",
        action: "Add missing variables to .env.example and align canonical names.",
      },
      {
        system: "application",
        action: "Update code references to use the canonical variable names.",
      },
      {
        system: "documentation",
        action: "Align README and deployment instructions with the canonical environment contract.",
      },
    );
  }

  if (context.knowledgeModel.entities.some((entity) => entity.kind === "file")) {
    steps.push({
      system: "project-truth",
      action: "Refresh Project Truth after repairs so the repository state reflects the updated configuration.",
    });
  }

  return steps;
}

function determinePlanTitle(fractures: Fracture[]): string {
  if (fractures.some((fracture) => fracture.category === "route")) {
    return fractures.some((fracture) =>
      fracture.title.startsWith("Route contract expectation mismatch:"),
    )
      ? "Repair API request and response contract fractures"
      : "Repair API route contract fractures";
  }

  return "Repair environment configuration fractures";
}

function determinePlanSummary(fractures: Fracture[]): string {
  if (fractures.some((fracture) => fracture.category === "route")) {
    return fractures.some((fracture) =>
      fracture.title.startsWith("Route contract expectation mismatch:"),
    )
      ? "Coordinate frontend callers, backend handlers, and contract tests so request payload and response expectations match across the application."
      : "Coordinate frontend callers, backend handlers, and tests so route contracts match across the application.";
  }

  return "Coordinate environment variable normalization across code, environment files, and documentation.";
}
