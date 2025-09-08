import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform, Alert } from "react-native";
import { apiClient } from "@/src/axios/apiClient";
import { BackendRoutes } from "@/src/axios/backendRoutes";

export type PushPlatform = "ios" | "android" | "unknown";

export interface RegisterDeviceOptions {
  silent?: boolean;
}

export const getExpoPushTokenAsync = async (): Promise<string | null> => {
  if (!Device.isDevice) {
    console.log(
      "[pushService] Not a physical device; skipping push token fetch"
    );
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  console.log(
    "[pushService] Notification permission status (existing):",
    existingStatus
  );
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    console.log(
      "[pushService] Notification permission status (requested):",
      status
    );
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    console.log("[pushService] Permission not granted; returning null token");
    return null;
  }

  const projectId = (Constants?.expoConfig as any)?.extra?.eas?.projectId as
    | string
    | undefined;
  try {
    console.log(
      "[pushService] Fetching Expo push token with projectId:",
      projectId ? "present" : "missing"
    );
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : (undefined as any)
    );
    const token = tokenResponse?.data ?? (tokenResponse as any);
    const tokenStr = typeof token === "string" ? token : null;
    if (tokenStr) {
      console.log(
        "[pushService] Obtained Expo push token:",
        tokenStr.substring(0, 18) + "..."
      );
    } else {
      console.log("[pushService] Failed to parse Expo push token");
    }
    return tokenStr;
  } catch (e) {
    console.log(
      "[pushService] Error obtaining Expo push token:",
      (e as any)?.message
    );
    return null;
  }
};

export const getPlatform = (): PushPlatform => {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  return "unknown";
};

export const registerDeviceWithBackend = async (
  options: RegisterDeviceOptions = {}
): Promise<boolean> => {
  const { silent } = options;
  try {
    console.log("[pushService] Attempting to register device with backend");
    const token = await getExpoPushTokenAsync();
    if (!token) {
      if (!silent) {
        Alert.alert(
          "Notifications disabled",
          "Enable notifications in Settings to receive reminders."
        );
      }
      console.log("[pushService] Skipping device registration: no token");
      return false;
    }
    const platform: PushPlatform = getPlatform();
    console.log("[pushService] Registering device:", {
      platform,
      endpoint: BackendRoutes.DEVICES_REGISTER,
    });
    const response = await apiClient.post(BackendRoutes.DEVICES_REGISTER, {
      expo_push_token: token,
      platform,
    });
    console.log(
      "[pushService] Device registration success with status:",
      response?.status
    );
    return true;
  } catch (error) {
    if (!silent) {
      console.log(
        "[pushService] register device failed:",
        (error as any)?.message
      );
    }
    console.log(
      "[pushService] Device registration error:",
      (error as any)?.message
    );
    return false;
  }
};
