import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { saveConnectionRequest } from "./dataStore.js";

test("saves connection requests to an append-only ledger", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "wanderlore-test-"));
  process.env.WANDERLORE_DATA_DIR = dir;
  const receipt = await saveConnectionRequest({
    city: "Delhi",
    hostId: "host-1",
    hostName: "Host",
    travelerName: "Ada",
    email: "ada@example.com",
    message: "I want to learn about the local cultural experience."
  });
  const ledger = await fs.readFile(path.join(dir, "connection-requests.jsonl"), "utf8");
  assert.match(receipt.id, /^req_/);
  assert.equal(JSON.parse(ledger).email, "ada@example.com");
  await fs.rm(dir, { recursive: true, force: true });
  delete process.env.WANDERLORE_DATA_DIR;
});
