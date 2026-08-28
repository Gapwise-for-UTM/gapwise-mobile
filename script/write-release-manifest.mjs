import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const app = JSON.parse(await readFile("app.json", "utf8")).expo;

async function filesUnder(root) {
  const files = [];
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(full);
      else if (entry.isFile()) files.push(full);
    }
  }
  await visit(root);
  return files.sort();
}

async function treeDigest(root) {
  const hash = createHash("sha256");
  for (const file of await filesUnder(root)) {
    const relative = path.relative(root, file).split(path.sep).join("/");
    const bytes = await readFile(file);
    const digest = createHash("sha256").update(bytes).digest("hex");
    hash.update(relative);
    hash.update("\0");
    hash.update(digest);
    hash.update("\n");
  }
  return hash.digest("hex");
}

const sourceSha =
  process.env.GITHUB_SHA ??
  process.env.EAS_BUILD_GIT_COMMIT_HASH ??
  process.env.EXPO_PUBLIC_GAPWISE_COMMIT_SHA ??
  "local/unknown";

if (process.env.CI && !/^[0-9a-f]{40}$/i.test(sourceSha)) {
  console.error(
    "release manifest: CI source commit must be an exact 40-character git SHA",
  );
  process.exit(1);
}

const manifest = {
  schemaVersion: 1,
  app: "Gapwise",
  appVersion: app.version,
  runtimeVersionPolicy: app.runtimeVersion?.policy ?? null,
  sourceSha,
  sourceRef: process.env.GITHUB_REF ?? null,
  githubRunId: process.env.GITHUB_RUN_ID ?? null,
  apiBaseUrl: app.extra?.apiBaseUrl ?? null,
  iosExportSha256: await treeDigest("dist/ios"),
  androidExportSha256: await treeDigest("dist/android"),
};

await writeFile(
  "dist/release-manifest.json",
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);
console.log(
  `Release provenance manifest written for ${sourceSha} (${manifest.appVersion}).`,
);
