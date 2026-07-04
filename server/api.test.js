import test from "node:test";
import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { handleApiRequest } from "./api.js";

test("health endpoint returns service status and security headers", async () => {
  const response = await invoke({ method: "GET", url: "/api/health" });
  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.headers["x-content-type-options"], "nosniff");
  assert.match(response.headers["content-security-policy"], /default-src 'none'/);
});

test("api router rejects unknown routes and wrong methods deterministically", async () => {
  const notFound = await invoke({ method: "POST", url: "/api/missing", body: {} });
  assert.equal(notFound.status, 404);
  assert.equal(notFound.body.error.code, "NOT_FOUND");

  const wrongMethod = await invoke({ method: "GET", url: "/api/events" });
  assert.equal(wrongMethod.status, 405);
  assert.equal(wrongMethod.body.error.code, "METHOD_NOT_ALLOWED");
});

test("api router rejects hostile origins before route work", async () => {
  const response = await invoke({
    method: "POST",
    url: "/api/events",
    headers: { origin: "https://evil.example" },
    body: {}
  });
  assert.equal(response.status, 403);
  assert.equal(response.body.error.code, "FORBIDDEN_ORIGIN");
});

test("api response carries cross-origin and permissions policy headers", async () => {
  const response = await invoke({ method: "GET", url: "/api/health" });
  assert.equal(response.headers["cross-origin-opener-policy"], "same-origin");
  assert.match(response.headers["permissions-policy"], /geolocation=\(\)/);
});

test("events route fails safely when Ticketmaster key is unavailable", async () => {
  const originalKey = process.env.EVENTS_API_KEY;
  delete process.env.EVENTS_API_KEY;
  const response = await invoke({
    method: "POST",
    url: "/api/events",
    body: { city: "New Delhi", tripDay: 2, tripDaysTotal: 4, interests: ["heritage"] }
  });
  assert.equal(response.status, 503);
  assert.equal(response.body.error.code, "EVENTS_NOT_CONFIGURED");
  process.env.EVENTS_API_KEY = originalKey;
});

function invoke({ method, url, headers = {}, body }) {
  const request = new PassThrough();
  request.method = method;
  request.url = url;
  request.headers = headers;
  request.socket = { remoteAddress: "127.0.0.1" };

  const response = {
    status: 0,
    headers: {},
    payload: "",
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value;
    },
    writeHead(status, headersToWrite = {}) {
      this.status = status;
      for (const [key, value] of Object.entries(headersToWrite)) this.setHeader(key, value);
    },
    end(chunk = "") {
      this.payload += chunk;
      this.resolve({
        status: this.status,
        headers: this.headers,
        body: this.payload ? JSON.parse(this.payload) : null
      });
    }
  };

  const done = new Promise((resolve) => {
    response.resolve = resolve;
  });
  handleApiRequest(request, response);
  request.end(body === undefined ? "" : JSON.stringify(body));
  return done;
}
