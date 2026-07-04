import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const output = path.join(root, "dist");
await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(output, { recursive: true });
for (const file of ["index.html", "app.css", "app.js"]) {
  await fs.copyFile(path.join(root, "web", file), path.join(output, file));
}
await fs.cp(path.join(root, "web", "js"), path.join(output, "js"), { recursive: true });
