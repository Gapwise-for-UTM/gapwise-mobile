import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const roots = ["app", "src", "modules"];
const sourceExtensions = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const forbiddenPatterns = [
  {
    label: "runtime console logging",
    pattern: /\bconsole\.(?:log|debug|info|warn|error)\s*\(/,
  },
  {
    label: "privileged Supabase secret marker",
    pattern: /\b(?:SUPABASE_SERVICE_ROLE|sb_secret_)\b/,
  },
  {
    label: "embedded private-key material",
    pattern: /BEGIN (?:RSA )?PRIVATE KEY/,
  },
];

async function filesUnder(root) {
  const result = [];
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(full);
      else if (
        entry.isFile() &&
        sourceExtensions.has(path.extname(entry.name))
      ) {
        result.push(full);
      }
    }
  }
  await visit(root);
  return result;
}

let failed = false;
for (const root of roots) {
  const files = await filesUnder(root);
  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const { label, pattern } of forbiddenPatterns) {
      if (pattern.test(source)) {
        console.error(`${file}: forbidden ${label}`);
        failed = true;
      }
    }
  }
}

if (failed) process.exit(1);
console.log(
  "Source privacy audit passed: no runtime logging or privileged secret material found.",
);
