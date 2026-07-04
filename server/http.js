const MAX_BODY_BYTES = 64 * 1024;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT = 80;
const rateBuckets = new Map();

export function applyApiSecurityHeaders(request, response) {
  const origin = request.headers.origin;
  if (origin && isAllowedOrigin(origin)) response.setHeader("access-control-allow-origin", origin);
  response.setHeader("vary", "origin");
  response.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type");
  response.setHeader("content-security-policy", "default-src 'none'; frame-ancestors 'none'");
  response.setHeader("cross-origin-resource-policy", "same-origin");
  response.setHeader("cross-origin-opener-policy", "same-origin");
  response.setHeader("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.setHeader("referrer-policy", "no-referrer");
  response.setHeader("x-content-type-options", "nosniff");
}

export function assertAllowedOrigin(request) {
  if (isAllowedOrigin(request.headers.origin)) return;
  const error = new Error("Origin is not allowed");
  error.status = 403;
  error.code = "FORBIDDEN_ORIGIN";
  throw error;
}

export function assertRateLimit(request) {
  const ip = request.headers["x-forwarded-for"]?.split(",")[0]?.trim() || request.socket?.remoteAddress || "unknown";
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return;
  }
  bucket.count += 1;
  if (bucket.count <= RATE_LIMIT) return;
  const error = new Error("Too many requests");
  error.status = 429;
  error.code = "RATE_LIMITED";
  throw error;
}

export function sendJson(response, status, payload) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

export function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        const error = new Error("Request body is too large");
        error.status = 413;
        error.code = "BODY_TOO_LARGE";
        reject(error);
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {});
      } catch {
        const error = new Error("Request body must be valid JSON");
        error.status = 400;
        error.code = "INVALID_JSON";
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  const configured = (process.env.FRONTEND_ORIGIN || "").split(",").map((item) => item.trim()).filter(Boolean);
  if (configured.includes(origin)) return true;
  try {
    const { hostname, protocol } = new URL(origin);
    return (protocol === "http:" && hostname === "localhost") || (protocol === "https:" && hostname.endsWith(".vercel.app"));
  } catch {
    return false;
  }
}
