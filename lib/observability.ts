import { randomUUID } from "crypto";

export const REQUEST_ID_HEADER = "x-request-id";

type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  path?: string;
  method?: string;
  [key: string]: unknown;
}

const requestIdCache = new WeakMap<Request, string>();

export function getRequestIdFromRequest(req: Request): string {
  const fromHeader = req.headers.get(REQUEST_ID_HEADER);
  if (fromHeader) return fromHeader;

  const cached = requestIdCache.get(req);
  if (cached) return cached;

  const generated = createRequestId();
  requestIdCache.set(req, generated);
  return generated;
}

export function createRequestId(): string {
  try {
    return randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

export function logApiInfo(req: Request, message: string, meta: Record<string, unknown> = {}) {
  log("info", message, req, meta);
}

export function logApiWarn(req: Request, message: string, meta: Record<string, unknown> = {}) {
  log("warn", message, req, meta);
}

export function logApiError(
  req: Request,
  message: string,
  error: unknown,
  meta: Record<string, unknown> = {}
) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  log("error", message, req, {
    ...meta,
    errorMessage,
    stack,
  });
}

function log(level: LogLevel, message: string, req: Request, meta: Record<string, unknown>) {
  const payload: LogPayload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    requestId: getRequestIdFromRequest(req),
    path: new URL(req.url).pathname,
    method: req.method,
    ...meta,
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}
