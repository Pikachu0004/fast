import fs from "node:fs/promises";
import path from "node:path";

const maxLines = new Map([
  ["web/app.js", 40],
  ["server/api.js", 90],
  ["server/http.js", 110],
  ["web/js/setup.js", 110],
  ["web/js/navigation.js", 60],
  ["web/js/dom.js", 50],
  ["web/js/views/smart.js", 70],
  ["web/js/views/threads.js", 90]
]);

for (const [file, limit] of maxLines) {
  const text = await fs.readFile(file, "utf8");
  const lines = text.trim().split("\n").length;
  if (lines > limit) {
    throw new Error(`${file} has ${lines} lines; limit is ${limit}`);
  }
}

const webModules = await listFiles("web/js");
if (webModules.length < 8) throw new Error("Frontend modules are missing");
for (const file of webModules) {
  const text = await fs.readFile(file, "utf8");
  if (/\beval\s*\(|new Function\s*\(/.test(text)) throw new Error(`Unsafe dynamic code in ${file}`);
  if (/error\.stack/.test(text)) throw new Error(`Stack exposure risk in ${file}`);
}

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  }));
  return files.flat();
}
