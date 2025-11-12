const devUpdateConfig = {
  ios: { minBuild: "22", latest: "26" },
  android: { minBuild: "30", latest: "31" },
  messageMandatory: "This version is no longer compatible. Please update.",
  messageOptional: "A new version is available.",
} as const;

export default devUpdateConfig;
