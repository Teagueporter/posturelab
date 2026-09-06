type RouteLogContext = {
  requestId: string | null;
  route: string;
  start: number;
};

type ActionLogContext = {
  action: string;
  start: number;
};

type RouteLogDetails = Record<string, boolean | number | string | null | undefined>;
type ActionLogDetails = RouteLogDetails;

export function routeLogContext(route: string, request: Request): RouteLogContext {
  return {
    requestId: request.headers.get("x-vercel-id"),
    route,
    start: Date.now(),
  };
}

export function logRouteStart(context: RouteLogContext) {
  writeLog("info", {
    msg: "start",
    requestId: context.requestId,
    route: context.route,
  });
}

export function logRouteDone(context: RouteLogContext, status: number, details: RouteLogDetails = {}) {
  writeLog("info", {
    ...details,
    msg: "done",
    ms: Date.now() - context.start,
    requestId: context.requestId,
    route: context.route,
    status,
  });
}

export function logRouteError(context: RouteLogContext, error: unknown, status = 500, details: RouteLogDetails = {}) {
  writeLog("error", {
    ...details,
    error: error instanceof Error ? error.message.slice(0, 500) : "Unknown error",
    msg: "failed",
    ms: Date.now() - context.start,
    requestId: context.requestId,
    route: context.route,
    status,
  });
}

export function actionLogContext(action: string): ActionLogContext {
  return {
    action,
    start: Date.now(),
  };
}

export function logActionStart(context: ActionLogContext, details: ActionLogDetails = {}) {
  writeLog("info", {
    ...details,
    action: context.action,
    msg: "start",
  });
}

export function logActionDone(context: ActionLogContext, result: string, details: ActionLogDetails = {}) {
  writeLog("info", {
    ...details,
    action: context.action,
    msg: "done",
    ms: Date.now() - context.start,
    result,
  });
}

export function logActionError(context: ActionLogContext, error: unknown, details: ActionLogDetails = {}) {
  writeLog("error", {
    ...details,
    action: context.action,
    error: error instanceof Error ? error.message.slice(0, 500) : "Unknown error",
    msg: "failed",
    ms: Date.now() - context.start,
  });
}

function writeLog(level: "error" | "info", payload: RouteLogDetails & { level?: string; msg: string }) {
  const entry = JSON.stringify({ level, ...payload });
  if (level === "error") {
    console.error(entry);
  } else {
    console.log(entry);
  }
}
