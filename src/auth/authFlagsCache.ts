// Compatibility wrapper (older experiments used this path).
// Keep this file so imports don't break; source of truth is `src/Storage/authFlagsStorage.ts`.
export type { AuthFlags } from "@/src/Storage/authFlagsStorage";
export {
  extractAuthFlags,
  loadAuthFlags,
  saveAuthFlags,
  clearAuthFlags,
} from "@/src/Storage/authFlagsStorage";
