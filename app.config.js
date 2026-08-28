module.exports = ({ config }) => {
  const buildProfile =
    process.env.EAS_BUILD_PROFILE ??
    process.env.EXPO_PUBLIC_GAPWISE_CHANNEL ??
    "development";
  const commitSha =
    process.env.EAS_BUILD_GIT_COMMIT_HASH ??
    process.env.EXPO_PUBLIC_GAPWISE_COMMIT_SHA ??
    "local/unknown";
  const buildId = process.env.EAS_BUILD_ID ?? "local";

  return {
    ...config,
    extra: {
      ...config.extra,
      buildProfile,
      commitSha,
      buildId,
    },
  };
};
