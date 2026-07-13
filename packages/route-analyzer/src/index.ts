import fs from "node:fs";
import path from "node:path";
import { Fracture } from "@stackmend/shared";

export interface RouteFact {
  key: string;
  normalizedKey: string;
  method: string;
  route: string;
  canonicalRoute: string;
  files: string[];
  expectsRequestBody: boolean;
  responseKind: "json" | "text" | "unknown" | "none";
  responseStatus: number | null;
  requestSchemaHints: string[];
  responseSchemaHints: string[];
}

const CODE_FILE_PATTERN = /\.(ts|tsx|js|jsx|mjs|cjs)$/i;
const FRONTEND_REQUEST_PATTERNS = [
  /\bfetch\(\s*["'`]([^"'`]+)["'`]\s*(?:,\s*\{[^}]*method:\s*["'`]([A-Z]+)["'`])?/g,
  /\baxios\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]/g,
  /\b([a-zA-Z_][a-zA-Z0-9_]*)\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]/g,
];
const BACKEND_ROUTE_PATTERNS = [
  /\b(?:app|router)\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]/g,
];

export function scanRoutes(targetPath: string): Fracture[] {
  const { requests, routes } = collectRouteFacts(targetPath);
  const fractures: Fracture[] = [];
  let counter = 1;

  for (const requestFact of requests.values()) {
    const exactMatch = routes.get(requestFact.key);
    const normalizedMatch = findNormalizedRouteMatch(routes, requestFact.normalizedKey);

    if (!exactMatch && !normalizedMatch) {
      fractures.push({
        id: `SM-ROUTE-${String(counter++).padStart(3, "0")}`,
        title: `Frontend request has no matching backend route: ${requestFact.method} ${requestFact.route}`,
        category: "route",
        severity: "high",
        summary: `A request to ${requestFact.method} ${requestFact.route} was found, but no matching backend route implementation was detected.`,
        expected: [
          `Implement ${requestFact.method} ${requestFact.route} on the backend or update the frontend caller.`,
        ],
        actual: [`Referenced in ${requestFact.files.length} file(s)`],
        evidence: requestFact.files.map((file) => ({
          file,
          excerpt: `${requestFact.method} ${requestFact.route}`,
        })),
        repairOptions: [
          {
            summary: `Align the request and route contract for ${requestFact.method} ${requestFact.route}`,
            actions: [
              "Update the frontend caller to use the implemented backend path.",
              "Or add a backend alias/handler matching the requested route.",
            ],
          },
        ],
      });
      continue;
    }

    if (!exactMatch && normalizedMatch) {
      fractures.push({
        id: `SM-ROUTE-${String(counter++).padStart(3, "0")}`,
        title: `Route alias mismatch detected: ${requestFact.method} ${requestFact.route}`,
        category: "route",
        severity: "medium",
        summary: "A frontend request matches a backend route only after prefix normalization or aliasing.",
        expected: [
          `Use one canonical path such as ${requestFact.canonicalRoute} across frontend and backend.`,
        ],
        actual: [
          `Frontend uses ${requestFact.route}`,
          `Backend implements ${normalizedMatch.route}`,
        ],
        evidence: [
          ...requestFact.files.map((file) => ({
            file,
            excerpt: `${requestFact.method} ${requestFact.route}`,
          })),
          ...normalizedMatch.files.map((file) => ({
            file,
            excerpt: `${normalizedMatch.method} ${normalizedMatch.route}`,
          })),
        ],
        repairOptions: [
          {
            summary: `Normalize request and backend aliases to ${requestFact.canonicalRoute}`,
            actions: [
              "Update frontend callers to the canonical route path.",
              "Or expose a backend alias if both paths must remain supported.",
            ],
          },
        ],
      });
    }

    const matchedRoute = exactMatch ?? normalizedMatch;
    if (matchedRoute) {
      const mismatch = buildExpectationMismatchFracture(
        requestFact,
        matchedRoute,
        counter,
      );
      if (mismatch) {
        fractures.push(mismatch);
        counter += 1;
      }
    }
  }

  return fractures;
}

export function collectRouteFacts(targetPath: string): {
  requests: Map<string, RouteFact>;
  routes: Map<string, RouteFact>;
} {
  const files = collectFiles(targetPath);
  const requests = new Map<string, RouteFact>();
  const routes = new Map<string, RouteFact>();

  for (const file of files) {
    const content = safeRead(file);
    if (!content) {
      continue;
    }

    const relativeFile = path.relative(targetPath, file);
    collectRequests(content, relativeFile, requests);
    collectRoutes(content, relativeFile, routes);
  }

  return { requests, routes };
}

function collectRequests(
  content: string,
  relativeFile: string,
  requests: Map<string, RouteFact>,
): void {
  for (const pattern of FRONTEND_REQUEST_PATTERNS) {
    for (const match of content.matchAll(pattern)) {
      const genericClientName = match[3] ? match[1] : undefined;
      const method = normalizeMethod(match[3] ? match[2] : match[2] ?? match[1] ?? "GET");
      const route = normalizeRoute(match[3] ? match[3] : match[1] && match[2] ? match[2] : match[1]);
      if (!shouldTreatRequestCall(genericClientName, route, relativeFile)) {
        continue;
      }
      const slice = content.slice(match.index, Math.min(content.length, match.index + 400));
      upsertRouteFact(requests, {
        method,
        route,
        file: relativeFile,
        expectsRequestBody: inferRequestBodyExpectation(method, slice),
        responseKind: inferRequestResponseKind(slice),
        responseStatus: null,
        requestSchemaHints: inferRequestSchemaHints(slice),
        responseSchemaHints: inferFrontendResponseSchemaHints(slice),
      });
    }
  }
}

function shouldTreatRequestCall(
  clientName: string | undefined,
  route: string,
  relativeFile: string,
): boolean {
  if (!route.startsWith("/")) {
    return false;
  }

  if (
    relativeFile.includes("trust-scope-engine") ||
    relativeFile.includes("event-capture") ||
    relativeFile.includes("prediction-recorder") ||
    relativeFile.includes("outcome-observer") ||
    relativeFile.includes("delta-reporter")
  ) {
    return false;
  }

  if (!clientName) {
    return true;
  }

  return /api|client|http|request|fetcher|service/i.test(clientName);
}

function collectRoutes(content: string, relativeFile: string, routes: Map<string, RouteFact>): void {
  for (const pattern of BACKEND_ROUTE_PATTERNS) {
    for (const match of content.matchAll(pattern)) {
      const method = normalizeMethod(match[1]);
      const route = normalizeRoute(match[2]);
      const slice = content.slice(match.index, Math.min(content.length, match.index + 800));
      upsertRouteFact(routes, {
        method,
        route,
        file: relativeFile,
        expectsRequestBody: method !== "GET" && method !== "DELETE",
        responseKind: inferBackendResponseKind(slice),
        responseStatus: inferBackendStatus(slice),
        requestSchemaHints: inferBackendRequestSchemaHints(slice),
        responseSchemaHints: inferBackendResponseSchemaHints(slice),
      });
    }
  }
}

function normalizeMethod(method: string): string {
  return method.toUpperCase();
}

function normalizeRoute(route: string): string {
  return route.trim().replace(/\/+$/, "") || "/";
}

function canonicalizeRoute(route: string): string {
  const normalized = normalizeRoute(route);
  const withoutApiPrefix = normalized.replace(/^\/api(?=\/|$)/, "");
  return withoutApiPrefix || "/";
}

function normalizedRouteKey(method: string, route: string): string {
  return `${method} ${canonicalizeRoute(route)}`;
}

function findNormalizedRouteMatch(
  routes: Map<string, RouteFact>,
  normalizedKey: string,
): RouteFact | undefined {
  for (const routeFact of routes.values()) {
    if (routeFact.normalizedKey === normalizedKey) {
      return routeFact;
    }
  }

  return undefined;
}

function upsertRouteFact(
  map: Map<string, RouteFact>,
  input: {
    method: string;
    route: string;
    file: string;
    expectsRequestBody: boolean;
    responseKind: RouteFact["responseKind"];
    responseStatus: number | null;
    requestSchemaHints: string[];
    responseSchemaHints: string[];
  },
): void {
  const key = `${input.method} ${input.route}`;
  const existing = map.get(key);
  if (existing) {
    if (!existing.files.includes(input.file)) {
      existing.files.push(input.file);
    }
    existing.expectsRequestBody = existing.expectsRequestBody || input.expectsRequestBody;
    existing.responseKind = mergeResponseKinds(existing.responseKind, input.responseKind);
    existing.responseStatus ??= input.responseStatus;
    existing.requestSchemaHints = mergeHints(existing.requestSchemaHints, input.requestSchemaHints);
    existing.responseSchemaHints = mergeHints(existing.responseSchemaHints, input.responseSchemaHints);
    return;
  }

  map.set(key, {
    key,
    normalizedKey: normalizedRouteKey(input.method, input.route),
    method: input.method,
    route: input.route,
    canonicalRoute: canonicalizeRoute(input.route),
    files: [input.file],
    expectsRequestBody: input.expectsRequestBody,
    responseKind: input.responseKind,
    responseStatus: input.responseStatus,
    requestSchemaHints: input.requestSchemaHints,
    responseSchemaHints: input.responseSchemaHints,
  });
}

function inferRequestBodyExpectation(method: string, slice: string): boolean {
  if (method === "GET") {
    return false;
  }

  return /\bbody\s*:/.test(slice) || /\b(?:post|put|patch)\(/i.test(slice);
}

function inferRequestResponseKind(slice: string): RouteFact["responseKind"] {
  if (/\.json\(\)/.test(slice)) {
    return "json";
  }
  if (/\.text\(\)/.test(slice)) {
    return "text";
  }
  return "unknown";
}

function inferBackendResponseKind(slice: string): RouteFact["responseKind"] {
  if (/\bres\.json\(/.test(slice)) {
    return "json";
  }
  if (/\bres\.(?:send|sendFile|render)\(/.test(slice)) {
    return "text";
  }
  if (/\bres\.status\(\s*204\s*\)/.test(slice)) {
    return "none";
  }
  return "unknown";
}

function inferBackendStatus(slice: string): number | null {
  const match = slice.match(/\bres\.status\(\s*(\d{3})\s*\)/);
  return match ? Number(match[1]) : null;
}

function inferRequestSchemaHints(slice: string): string[] {
  const hints = new Set<string>();
  for (const match of slice.matchAll(/\bbody\s*:\s*\{([^}]*)\}/g)) {
    extractObjectKeys(match[1]).forEach((key) => hints.add(key));
  }
  return [...hints];
}

function inferFrontendResponseSchemaHints(slice: string): string[] {
  const hints = new Set<string>();
  for (const match of slice.matchAll(/\b(?:data|result|json)\.([a-zA-Z_][a-zA-Z0-9_]*)/g)) {
    hints.add(match[1]);
  }
  return [...hints];
}

function inferBackendRequestSchemaHints(slice: string): string[] {
  const hints = new Set<string>();
  for (const match of slice.matchAll(/\breq\.body\.([a-zA-Z_][a-zA-Z0-9_]*)/g)) {
    hints.add(match[1]);
  }
  return [...hints];
}

function inferBackendResponseSchemaHints(slice: string): string[] {
  const hints = new Set<string>();
  for (const match of slice.matchAll(/\bres\.json\(\s*\{([^}]*)\}/g)) {
    extractObjectKeys(match[1]).forEach((key) => hints.add(key));
  }
  return [...hints];
}

function extractObjectKeys(source: string): string[] {
  const keys = new Set<string>();
  for (const match of source.matchAll(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g)) {
    keys.add(match[1]);
  }
  return [...keys];
}

function mergeResponseKinds(
  left: RouteFact["responseKind"],
  right: RouteFact["responseKind"],
): RouteFact["responseKind"] {
  if (left === right) {
    return left;
  }
  if (left === "unknown") {
    return right;
  }
  if (right === "unknown") {
    return left;
  }
  return left;
}

function mergeHints(left: string[], right: string[]): string[] {
  return [...new Set([...left, ...right])];
}

function buildExpectationMismatchFracture(
  requestFact: RouteFact,
  routeFact: RouteFact,
  counter: number,
): Fracture | null {
  const mismatches: string[] = [];
  const expected: string[] = [];
  const actual: string[] = [];

  if (requestFact.expectsRequestBody && !routeFact.expectsRequestBody && requestFact.method !== "GET") {
    mismatches.push("request body expectation");
    expected.push("Backend route should accept a request body for this caller.");
    actual.push("Caller appears to send a body, but backend route does not appear to expect one.");
  }

  if (
    requestFact.responseKind !== "unknown" &&
    routeFact.responseKind !== "unknown" &&
    requestFact.responseKind !== routeFact.responseKind
  ) {
    mismatches.push("response format");
    expected.push(`Backend should return ${requestFact.responseKind} to match caller expectations.`);
    actual.push(`Caller expects ${requestFact.responseKind}, backend appears to return ${routeFact.responseKind}.`);
  }

  if (requestFact.responseKind !== "unknown" && routeFact.responseKind === "none") {
    mismatches.push("missing response payload");
    expected.push("Caller should not expect a response payload when backend returns no content.");
    actual.push("Caller appears to parse a response payload, but backend route returns no content.");
  }

  const requestHintMismatch = diffHints(requestFact.requestSchemaHints, routeFact.requestSchemaHints);
  if (requestHintMismatch.length > 0) {
    mismatches.push("request body shape");
    expected.push(`Backend should recognize request fields such as ${requestHintMismatch.join(", ")}.`);
    actual.push(
      `Caller appears to send fields not observed in backend handling: ${requestHintMismatch.join(", ")}.`,
    );
  }

  const responseHintMismatch = diffHints(requestFact.responseSchemaHints, routeFact.responseSchemaHints);
  if (responseHintMismatch.length > 0) {
    mismatches.push("response shape");
    expected.push(`Backend should provide response fields such as ${responseHintMismatch.join(", ")}.`);
    actual.push(
      `Caller appears to consume response fields not observed in backend output: ${responseHintMismatch.join(", ")}.`,
    );
  }

  if (mismatches.length === 0) {
    return null;
  }

  return {
    id: `SM-ROUTE-${String(counter).padStart(3, "0")}`,
    title: `Route contract expectation mismatch: ${requestFact.method} ${requestFact.route}`,
    category: "route",
    severity: "high",
    summary: `The frontend caller and backend route appear to disagree on ${mismatches.join(" and ")}.`,
    expected,
    actual,
    evidence: [
      ...requestFact.files.map((file) => ({
        file,
        excerpt: `${requestFact.method} ${requestFact.route}`,
      })),
      ...routeFact.files.map((file) => ({
        file,
        excerpt: `${routeFact.method} ${routeFact.route}`,
      })),
    ],
    repairOptions: [
      {
        summary: `Align request and response expectations for ${requestFact.method} ${requestFact.canonicalRoute}`,
        actions: [
          "Update frontend parsing or payload shape to match the backend contract.",
          "Or update the backend handler to satisfy the frontend request and response expectations.",
        ],
      },
    ],
  };
}

function diffHints(expected: string[], actual: string[]): string[] {
  if (expected.length === 0 || actual.length === 0) {
    return [];
  }

  const actualSet = new Set(actual);
  return expected.filter((hint) => !actualSet.has(hint));
}

function collectFiles(root: string): string[] {
  const results: string[] = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") {
        continue;
      }

      const nextPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(nextPath);
      } else if (CODE_FILE_PATTERN.test(entry.name)) {
        results.push(nextPath);
      }
    }
  }

  return results;
}

function safeRead(file: string): string | null {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}
