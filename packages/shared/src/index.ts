export type FractureSeverity = "critical" | "high" | "medium" | "low";
export type FractureCategory = "environment" | "route";
export type RepositoryEntityKind =
  | "repository"
  | "file"
  | "environment_variable"
  | "route"
  | "http_request"
  | "route_contract"
  | "fracture"
  | "evidence";
export type RepositoryRelation =
  | "CONTAINS"
  | "DECLARES"
  | "REFERENCES"
  | "CALLS"
  | "IMPLEMENTS"
  | "MATCHES"
  | "EVIDENCES"
  | "BROKEN_BY";
export type LearningActionType =
  | "run_environment_analysis"
  | "run_route_analysis"
  | "generate_repair_pack"
  | "update_project_truth"
  | "defer_for_review";
export type RepairPlanStatus = "proposed" | "ready" | "blocked";
export type MemoryScope =
  | "repository"
  | "workspace"
  | "developer"
  | "organization"
  | "global_sanitized";
export type RepairOutcomeStage =
  | "proposed"
  | "accepted"
  | "modified"
  | "applied"
  | "built"
  | "tested"
  | "deployed"
  | "observed"
  | "confirmed"
  | "reverted";
export type RepairOutcomeResult =
  | "pending"
  | "successful"
  | "failed"
  | "rejected"
  | "reverted";
export type SourceTier =
  | "canonical"
  | "maintainer"
  | "institutional"
  | "community_verified"
  | "unverified"
  | "rejected";
export type SourceStatus =
  | "approved"
  | "limited"
  | "metadata_only"
  | "suspended"
  | "quarantined"
  | "rejected";
export type ClaimTrialStatus = "confirmed" | "partial" | "unsupported";
export type InteractionType =
  | "repository_scan"
  | "repair_proposed"
  | "repair_modified_by_user"
  | "repair_rejected"
  | "repair_confirmed";

export interface EvidenceRef {
  file: string;
  line?: number;
  excerpt?: string;
}

export interface RepairOption {
  summary: string;
  actions: string[];
}

export interface Fracture {
  id: string;
  title: string;
  category: FractureCategory;
  severity: FractureSeverity;
  summary: string;
  expected: string[];
  actual: string[];
  evidence: EvidenceRef[];
  repairOptions: RepairOption[];
}

export interface RepositoryEntity {
  id: string;
  kind: RepositoryEntityKind;
  label: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface RepositoryEdge {
  from: string;
  to: string;
  relation: RepositoryRelation;
}

export interface RepositoryKnowledgeModel {
  repositoryId: string;
  targetPath: string;
  entities: RepositoryEntity[];
  edges: RepositoryEdge[];
}

export interface RepositorySignal {
  fractureCount: number;
  criticalCount: number;
  highSeverityCount: number;
  environmentVariableCount: number;
  routeCount: number;
  requestCount: number;
  routeContractCount: number;
  evidenceCount: number;
}

export interface LearningActionScore {
  action: LearningActionType;
  score: number;
  reasons: string[];
}

export interface LearningDecision {
  recommendedAction: LearningActionType;
  rankedActions: LearningActionScore[];
}

export interface RepairStep {
  system: string;
  action: string;
}

export interface RepairPlan {
  id: string;
  title: string;
  status: RepairPlanStatus;
  summary: string;
  basedOnFractures: string[];
  recommendedBy: LearningActionType;
  estimatedFileTouches: number;
  evidenceCount: number;
  steps: RepairStep[];
}

export interface MemoryPatternRecord {
  id: string;
  scope: MemoryScope;
  category: "diagnostic" | "repair" | "architecture" | "style" | "failure" | "verification";
  title: string;
  summary: string;
  confidence: number;
  evidenceCount: number;
  source: string;
  tags: string[];
}

export interface RepositoryConventionRecord {
  id: string;
  title: string;
  summary: string;
  confidence: number;
  source: string;
}

export interface RepairOutcomeRecord {
  id: string;
  repairPlanId: string;
  targetPath: string;
  fractureIds: string[];
  recommendedAction: LearningActionType;
  stage: RepairOutcomeStage;
  result: RepairOutcomeResult;
  summary: string;
  timestamp: string;
}

export interface SourceTrustRecord {
  id: string;
  sourcePath: string;
  sourceType: string;
  publisher: string;
  tier: SourceTier;
  status: SourceStatus;
  trustScore: number;
  authorityScore: number;
  freshnessScore: number;
  canonical: boolean;
  automatedAccessAllowed: boolean;
  trainingUseAllowed: boolean;
  attributionRequired: boolean;
  evidenceCount: number;
  tags: string[];
}

export interface KnowledgeClaimRecord {
  id: string;
  title: string;
  summary: string;
  scope: string;
  sourceId: string;
  confidence: number;
  versionScope: string;
  evidence: EvidenceRef[];
  tags: string[];
}

export interface ClaimTrialRecord {
  id: string;
  claimId: string;
  sourceId: string;
  status: ClaimTrialStatus;
  confidence: number;
  summary: string;
  checks: string[];
}

export interface InteractionPredictionRecord {
  repairStrategy: string;
  confidence: number;
  expectedOutcome: string;
}

export interface InteractionOutcomeRecord {
  action: "observed" | "confirmed" | "rejected" | "modified";
  build: "passed" | "failed" | "unknown";
  tests: "passed" | "failed" | "unknown";
  runtimeProbe: "passed" | "failed" | "unknown";
  summary: string;
}

export interface InteractionVerificationInput {
  build?: InteractionOutcomeRecord["build"];
  tests?: InteractionOutcomeRecord["tests"];
  runtimeProbe?: InteractionOutcomeRecord["runtimeProbe"];
}

export interface InteractionLearningRecord {
  id: string;
  type: InteractionType;
  targetPath: string;
  repositoryFamily: string;
  subsystem: string;
  defectFamilies: string[];
  prediction: InteractionPredictionRecord;
  outcome: InteractionOutcomeRecord;
  learned: string[];
  intelligenceChanges: string[];
  verificationChecks: string[];
  timestamp: string;
}

export interface IntelligenceDeltaRecord {
  id: string;
  interactionId: string;
  summary: string;
  interactionGradient: number;
  improvements: string[];
  reinforced: string[];
  quarantined: string[];
  readyForNextUse: boolean;
}

export interface RepairFeedbackInput {
  targetPath: string;
  repairPlanId: string;
  action: "accepted" | "rejected" | "modified" | "confirmed";
  summary: string;
  finalStrategy?: string;
  subsystem?: string;
  verification?: InteractionVerificationInput;
}

export interface DiagnosisCorrectionInput {
  targetPath: string;
  previousDiagnosis: string;
  correctedDiagnosis: string;
  summary: string;
  subsystem?: string;
  verification?: InteractionVerificationInput;
}

export interface ScanSummary {
  targetPath: string;
  fractures: Fracture[];
  knowledgeModel?: RepositoryKnowledgeModel;
  signals?: RepositorySignal;
  learningDecision?: LearningDecision;
  repairPlan?: RepairPlan;
  memoryPatterns?: MemoryPatternRecord[];
  repairOutcome?: RepairOutcomeRecord;
  sourceTrustRecords?: SourceTrustRecord[];
  knowledgeClaims?: KnowledgeClaimRecord[];
  claimTrials?: ClaimTrialRecord[];
  interactionRecord?: InteractionLearningRecord;
  intelligenceDelta?: IntelligenceDeltaRecord;
}
