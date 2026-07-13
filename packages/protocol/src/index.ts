import {
  DiagnosisCorrectionInput,
  RepairFeedbackInput,
  ScanSummary,
} from "@stackmend/shared";
export type { DiagnosisCorrectionInput, RepairFeedbackInput } from "@stackmend/shared";

export const STACKMEND_PROTOCOL_VERSION = "1.0";

export type DaemonState =
  | "stopped"
  | "starting"
  | "ready"
  | "busy"
  | "degraded"
  | "updating"
  | "stopping"
  | "failed";

export interface ClientHello {
  clientId: string;
  clientType: "vscode" | "cli" | "desktop" | "ci";
  clientVersion: string;
  protocolVersion: string;
}

export interface DaemonStatus {
  state: DaemonState;
  daemonVersion: string;
  protocolVersion: string;
  activeProjects: number;
  queuedJobs: number;
  uptimeMs: number;
  mode: "observe" | "suggest" | "assist" | "reflex";
}

export interface AnalyzeRequest {
  projectPath: string;
}

export interface FracturesRequest {
  projectPath: string;
  severity?: "critical" | "high" | "medium" | "low";
}

export interface FeedbackRequest {
  kind: "repair_feedback" | "diagnosis_correction";
  payload: RepairFeedbackInput | DiagnosisCorrectionInput;
}

export interface StackMendSuccessResponse<T> {
  ok: true;
  requestId: string;
  data: T;
}

export interface StackMendErrorResponse {
  ok: false;
  requestId: string;
  error: {
    code: string;
    message: string;
  };
}

export type StackMendResponse<T> = StackMendSuccessResponse<T> | StackMendErrorResponse;

export interface AnalyzeResponse {
  summary: ScanSummary;
}

export interface FracturesResponse {
  summary: Pick<ScanSummary, "targetPath" | "fractures">;
}

export interface FeedbackResponse {
  interactionId: string;
  intelligenceDeltaId: string;
  gradient: number;
}

export function isProtocolVersionCompatible(version: string): boolean {
  return version === STACKMEND_PROTOCOL_VERSION;
}
