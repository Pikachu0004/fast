import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleApiRequest } from "./api.js";

const port = Number(process.env.PORT || 8787);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const staticRoot = path.join(root, "dist");
const staticHeaders = {
  "content-security-policy": "default-src 'self'; connect-src 'self'; frame-src https://www.openstreetmap.org; img-src 'self' data:; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  "cross-origin-opener-policy": "same-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff"
};

http
  .createServer(async (request, response) => {
    if (request.url?.startsWith("/api/")) {
      await handleApiRequest(request, response);
      return;
    }
    await serveStatic(request, response);
  })
  .listen(port, () => {
    console.log(`Wanderlore listening on http://localhost:${port}`);
  });

async function serveStatic(request, response) {
  const url = new URL(request.url || "/", "http://localhost");
  const target = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const safeTarget = path.normalize(target).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(staticRoot, safeTarget);
  if (!filePath.startsWith(staticRoot)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  try {
    const data = await fs.readFile(filePath);
    response.writeHead(200, { ...staticHeaders, "content-type": contentType(filePath) });
    response.end(data);
  } catch {
    const data = await fs.readFile(path.join(staticRoot, "index.html"));
    response.writeHead(200, { ...staticHeaders, "content-type": "text/html; charset=utf-8" });
    response.end(data);
  }
}

function contentType(filePath) {
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  return "text/html; charset=utf-8";
}
