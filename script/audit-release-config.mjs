import { readFile } from "node:fs/promises";

const app = JSON.parse(await readFile("app.json", "utf8")).expo;
const eas = JSON.parse(await readFile("eas.json", "utf8"));
const dynamicConfig = await readFile("app.config.js", "utf8");

const failures = [];
const requireValue = (condition, message) => {
  if (!condition) failures.push(message);
};

requireValue(
  /^\d+\.\d+\.\d+$/.test(app.version ?? ""),
  "expo.version must be an explicit semantic version",
);
requireValue(
  app.runtimeVersion?.policy === "appVersion",
  "runtimeVersion must use the appVersion policy so OTA compatibility follows native releases",
);
requireValue(
  app.ios?.bundleIdentifier === "ca.gapwise.mobile",
  "unexpected iOS bundle identifier",
);
requireValue(
  app.android?.package === "ca.gapwise.mobile",
  "unexpected Android application id",
);
requireValue(
  Number.isInteger(app.android?.versionCode) && app.android.versionCode >= 1,
  "android.versionCode must provide a positive local bootstrap value",
);
requireValue(
  /^\d+(?:\.\d+)*$/.test(app.ios?.buildNumber ?? ""),
  "ios.buildNumber must provide a numeric local bootstrap value",
);
requireValue(
  app.extra?.apiBaseUrl === "https://api.gapwise.ca/v1",
  "release API must remain the canonical HTTPS Gapwise v1 endpoint",
);

requireValue(
  eas.cli?.appVersionSource === "remote",
  "EAS must use remote native build-version state",
);
requireValue(
  eas.cli?.requireCommit === true,
  "EAS builds must require a committed source revision",
);
requireValue(
  eas.build?.development?.channel === "development",
  "development build must use the development channel",
);
requireValue(
  eas.build?.preview?.channel === "preview",
  "preview build must use the preview channel",
);
requireValue(
  eas.build?.production?.channel === "production",
  "production build must use the production channel",
);
requireValue(
  eas.build?.production?.autoIncrement === true,
  "production builds must auto-increment native build versions",
);
requireValue(
  eas.build?.preview?.android?.buildType === "apk",
  "preview Android builds must be directly sideloadable APKs",
);
requireValue(
  eas.build?.["ios-simulator"]?.ios?.simulator === true,
  "an unsigned iOS simulator build profile must remain available",
);

for (const profile of ["development", "preview", "production"]) {
  requireValue(
    eas.build?.[profile]?.environment === profile,
    `${profile} profile must bind to the matching EAS environment`,
  );
  requireValue(
    eas.build?.[profile]?.env?.EXPO_PUBLIC_GAPWISE_CHANNEL === profile,
    `${profile} profile must expose its non-secret diagnostics channel`,
  );
}

requireValue(
  dynamicConfig.includes("EAS_BUILD_GIT_COMMIT_HASH"),
  "dynamic app config must embed the EAS source commit in non-secret diagnostics metadata",
);
requireValue(
  dynamicConfig.includes("EAS_BUILD_ID"),
  "dynamic app config must embed the EAS build id in non-secret diagnostics metadata",
);
requireValue(
  dynamicConfig.includes("EAS_BUILD_PROFILE"),
  "dynamic app config must embed the EAS build profile in non-secret diagnostics metadata",
);

const projectId = app.extra?.eas?.projectId;
const updateUrl = app.updates?.url;
if (projectId || updateUrl) {
  requireValue(
    typeof projectId === "string" && /^[0-9a-f-]{36}$/i.test(projectId),
    "EAS Update project id must be a UUID once updates are configured",
  );
  requireValue(
    updateUrl === `https://u.expo.dev/${projectId}`,
    "EAS Update URL must exactly match the configured project id",
  );
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`release config: ${failure}`);
  process.exit(1);
}

console.log(
  projectId
    ? "Release config audit passed, including EAS Update project binding."
    : "Release config audit passed. EAS Update transport remains intentionally owner-gated until an Expo project id is linked.",
);
