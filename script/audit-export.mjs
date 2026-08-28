import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const roots = process.argv.slice(2);
if (roots.length === 0) {
  console.error("usage: node script/audit-export.mjs <export-dir> [...]");
  process.exit(2);
}

const MAX_EXPORT_BYTES = 25 * 1024 * 1024;
const MAX_SINGLE_FILE_BYTES = 8 * 1024 * 1024;
const forbiddenAscii = [
  "service_role",
  "sb_secret_",
  "SUPABASE_SERVICE_ROLE",
  "PRIVATE KEY-----",
  "BEGIN RSA PRIVATE KEY",
];

async function filesUnder(root) {
  const result = [];
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(full);
      else if (entry.isFile()) result.push(full);
    }
  }
  await visit(root);
  return result;
}

let failed = false;
for (const root of roots) {
  const files = await filesUnder(root);
  let total = 0;
  for (const file of files) {
    const info = await stat(file);
    total += info.size;
    if (info.size > MAX_SINGLE_FILE_BYTES) {
      console.error(
        `${file}: ${info.size} bytes exceeds ${MAX_SINGLE_FILE_BYTES}-byte single-file budget`,
      );
      failed = true;
    }

    // Search raw bytes as latin1 so ASCII secret markers are detectable even in
    // otherwise-binary artifacts without interpreting or logging the payload.
    const haystack = (await readFile(file)).toString("latin1");
    for (const marker of forbiddenAscii) {
      if (haystack.includes(marker)) {
        console.error(`${file}: forbidden privileged-secret marker ${marker}`);
        failed = true;
      }
    }
  }

  console.log(`${root}: ${files.length} files, ${total} bytes`);
  if (total > MAX_EXPORT_BYTES) {
    console.error(
      `${root}: ${total} bytes exceeds ${MAX_EXPORT_BYTES}-byte export budget`,
    );
    failed = true;
  }
}

if (failed) process.exit(1);
