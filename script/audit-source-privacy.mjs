import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const roots = ["app", "src", "modules"];
const sourceExtensions = new Set([
  ".js",
  ".jsx",
  ".mjs",
  ".ts",
  ".tsx",
  ".swift",
  ".kt",
  ".java",
  ".m",
  ".mm",
]);
const forbiddenPatterns = [
  {
    label: "JavaScript runtime console logging",
    pattern: /\bconsole\.(?:log|debug|info|warn|error)\s*\(/,
  },
  {
    label: "Android runtime logging",
    pattern: /\bLog\.(?:v|d|i|w|e|wtf)\s*\(/,
  },
  {
    label: "native stdout logging",
    pattern: /\b(?:NSLog|print|println)\s*\(/,
  },
  {
    label: "privileged Supabase secret marker",
    // Match both environment-variable names and actual secret-key prefixes.
    // Do not use a trailing word boundary after an underscore: `_` and the
    // following key character are both word characters, which would let a
    // real `sb_secret_...` value evade the audit.
    pattern: /\bSUPABASE_SERVICE_ROLE(?:_KEY)?\b|\bsb_secret_[A-Za-z0-9._-]+/,
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
