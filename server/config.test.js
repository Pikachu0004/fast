import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("vercel config enforces static security headers and serverless limits", async () => {
  const config = JSON.parse(await fs.readFile("vercel.json", "utf8"));
  assert.equal(config.buildCommand, "npm run build");
  assert.equal(config.outputDirectory, "dist");
  assert.equal(config.functions["api/[...path].js"].maxDuration, 30);
  const headerKeys = config.headers[0].headers.map((header) => header.key);
  assert.ok(headerKeys.includes("Content-Security-Policy"));
  assert.ok(headerKeys.includes("Referrer-Policy"));
  assert.ok(headerKeys.includes("X-Content-Type-Options"));
  assert.ok(headerKeys.includes("Strict-Transport-Security"));
});
