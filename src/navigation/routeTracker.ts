let currentPath: string = "/";

export const setCurrentPath = (path: string) => {
  if (typeof path === "string") {
    currentPath = path;
  }
};

export const getCurrentPath = (): string => currentPath;

export const isOnboardingPath = (path: string | undefined | null): boolean => {
  if (!path) return false;
  if (path === "/login") return true;
  if (path === "/signup") return true;
  if (path.startsWith("/(auth)")) return true;
  if (path.startsWith("/onboarding")) return true;
  return false;
};

export default {
  setCurrentPath,
  getCurrentPath,
  isOnboardingPath,
};
