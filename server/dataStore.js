import fs from "node:fs/promises";
import path from "node:path";
import { webcrypto } from "node:crypto";

const MAX_LEDGER_BYTES = 512 * 1024;

export async function saveConnectionRequest(input) {
  const dir = process.env.WANDERLORE_DATA_DIR || (process.env.VERCEL ? "/tmp" : "./data");
  const file = path.join(dir, "connection-requests.jsonl");
  await fs.mkdir(dir, { recursive: true });
  await enforceLedgerLimit(file);
  const record = {
    id: `req_${Date.now().toString(36)}_${webcrypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`,
    createdAt: new Date().toISOString(),
    city: input.city,
    hostId: input.hostId,
    hostName: input.hostName,
    travelerName: input.travelerName,
    email: input.email,
    message: input.message
  };
  await fs.appendFile(file, `${JSON.stringify(record)}\n`, { mode: 0o600 });
  return { id: record.id, createdAt: record.createdAt };
}

async function enforceLedgerLimit(file) {
  try {
    const stats = await fs.stat(file);
    if (stats.size > MAX_LEDGER_BYTES) {
      const error = new Error("Connection request ledger is temporarily full");
      error.status = 503;
      error.code = "LEDGER_FULL";
      throw error;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
