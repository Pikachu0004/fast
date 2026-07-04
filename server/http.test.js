import test from "node:test";
import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { assertAllowedOrigin, readJsonBody } from "./http.js";

test("allows configured and Vercel origins while rejecting hostile origins", () => {
  assert.doesNotThrow(() => assertAllowedOrigin({ headers: { origin: "https://preview-example.vercel.app" } }));
  process.env.FRONTEND_ORIGIN = "https://wanderlore.example";
  assert.doesNotThrow(() => assertAllowedOrigin({ headers: { origin: "https://wanderlore.example" } }));
  assert.throws(() => assertAllowedOrigin({ headers: { origin: "https://evil.example" } }), /Origin is not allowed/);
  delete process.env.FRONTEND_ORIGIN;
});

test("rejects oversized JSON bodies before parsing", async () => {
  const request = new PassThrough();
  const promise = readJsonBody(request);
  request.end(Buffer.alloc(65 * 1024, "x"));
  await assert.rejects(promise, /too large/);
});

test("rejects malformed JSON bodies", async () => {
  const request = new PassThrough();
  const promise = readJsonBody(request);
  request.end("{bad json");
  await assert.rejects(promise, /valid JSON/);
});
