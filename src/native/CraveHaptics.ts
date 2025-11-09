import { NativeModules, Platform } from "react-native";
import * as Haptics from "expo-haptics";

type NativeModuleType = {
  startLoop: (inhaleMs: number, exhaleMs: number) => void;
  stop: () => void;
};

const NativeImpl: NativeModuleType | undefined = (NativeModules as any)
  ?.CraveHaptics;

let fallbackTimer: any = null;
let fallbackTimeout: any = null;

function startFallback(inhaleMs: number, exhaleMs: number) {
  try {
    clearInterval(fallbackTimer);
  } catch {}
  // Subtle ticks across inhale, light tick at phase changes; works on both OSes
  const inhaleTick = Math.max(300, Math.floor(inhaleMs / 4));
  const exhaleTick = Math.max(400, Math.floor(exhaleMs / 3));
  let phase: "inhale" | "exhale" = "inhale";
  let phaseElapsed = 0;
  // initial cue
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  fallbackTimer = setInterval(() => {
    if (phase === "inhale") {
      Haptics.selectionAsync().catch(() => {});
      phaseElapsed += inhaleTick;
      if (phaseElapsed >= inhaleMs) {
        phase = "exhale";
        phaseElapsed = 0;
        Haptics.selectionAsync().catch(() => {});
      }
    } else {
      if (Platform.OS === "android") Haptics.selectionAsync().catch(() => {});
      phaseElapsed += exhaleTick;
      if (phaseElapsed >= exhaleMs) {
        phase = "inhale";
        phaseElapsed = 0;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    }
  }, Math.min(inhaleTick, exhaleTick));
}

function stopFallback() {
  try {
    clearInterval(fallbackTimer);
  } catch {}
  fallbackTimer = null;
  try {
    clearTimeout(fallbackTimeout);
  } catch {}
  fallbackTimeout = null;
}

const CraveHaptics = {
  startLoop(inhaleMs: number, exhaleMs: number) {
    if (NativeImpl && typeof NativeImpl.startLoop === "function") {
      NativeImpl.startLoop(inhaleMs, exhaleMs);
      return;
    }
    startFallback(inhaleMs, exhaleMs);
  },
  stop() {
    if (NativeImpl && typeof NativeImpl.stop === "function") {
      NativeImpl.stop();
    }
    stopFallback();
  },
  // Start subtle ticks only for the given phase duration
  startPhase(durationMs: number, phase: "inhale" | "exhale") {
    stopFallback();
    const tick =
      phase === "inhale"
        ? Math.max(300, Math.floor(durationMs / 5))
        : Math.max(500, Math.floor(durationMs / 4));
    const action = () => {
      if (phase === "inhale") {
        Haptics.selectionAsync().catch(() => {});
      } else {
        // Very light for exhale (or skip if you want silence)
        if (Platform.OS === "android") Haptics.selectionAsync().catch(() => {});
      }
    };
    action();
    fallbackTimer = setInterval(action, tick);
    fallbackTimeout = setTimeout(() => {
      stopFallback();
    }, durationMs);
  },
};

export default CraveHaptics;
