import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Notification IDs for easy reference and management
const NOTIFICATION_IDS = {
  DAILY_CHECKIN: "daily-checkin-reminder",
};

// Storage keys
const STORAGE_KEYS = {
  CHECKIN_NOTIFICATION_ID: "checkin-notification-id",
  CHECKIN_LAST_SCHEDULED_AT: "checkin-last-scheduled-at",
};

/**
 * Check if a daily check-in notification is already scheduled.
 * Returns the identifier if found, otherwise null.
 */
const getExistingDailyCheckInId = async (): Promise<string | null> => {
  try {
    const storedId = await AsyncStorage.getItem(STORAGE_KEYS.CHECKIN_NOTIFICATION_ID);
    if (!storedId) {
      // Try to discover an existing check-in by content title to avoid duplicates
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const found = scheduled.find((n: any) => n?.content?.title === "Daily Check-in Reminder");
      if (found?.identifier) {
        await AsyncStorage.setItem(STORAGE_KEYS.CHECKIN_NOTIFICATION_ID, found.identifier);
        return found.identifier as string;
      }
      return null;
    }

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const exists = scheduled.some((n) => (n as any).identifier === storedId);

    if (exists) {
      return storedId;
    }

    // If the notification is no longer scheduled, clean up the stored ID
    await AsyncStorage.removeItem(STORAGE_KEYS.CHECKIN_NOTIFICATION_ID);
    return null;
  } catch (error) {
    console.error("Error checking existing daily check-in notification:", error);
    return null;
  }
};

/**
 * Schedule a daily check-in notification at 11:00 AM local time
 * This will show the app logo in the notification
 */
export const scheduleDailyCheckInNotification = async (): Promise<
  string | null
> => {
  try {
    // If it's already scheduled, do nothing (idempotent)
    const existingId = await getExistingDailyCheckInId();
    if (existingId) {
      console.log("Daily check-in notification already scheduled with ID:", existingId);
      return existingId;
    }

    // Avoid rapid re-scheduling on app cold starts
    const lastScheduledAt = await AsyncStorage.getItem(STORAGE_KEYS.CHECKIN_LAST_SCHEDULED_AT);
    if (lastScheduledAt) {
      const last = Number(lastScheduledAt);
      if (!Number.isNaN(last)) {
        const minutesSince = (Date.now() - last) / 60000;
        if (minutesSince < 10) {
          console.log("Skipping re-schedule; last scheduled", Math.round(minutesSince), "minutes ago");
          return null;
        }
      }
    }

    // Set up notification content
    const notificationContent: Notifications.NotificationContentInput = {
      title: "Daily Check-in Reminder",
      body: "Time to check in with your progress today! Tap to record your daily status.",
      sound: "default",
      priority: Notifications.AndroidNotificationPriority.HIGH,
      // The icon is configured in app.config.js and will be used automatically
    };

    // Setări specifice pentru Android
    if (Platform.OS === "android") {
      // Aceste setări vor fi gestionate separat prin canalul de notificări
      console.log("Using Android-specific notification channel: check-ins");
    }

    // Schedule using a calendar-based daily trigger at 11:00 AM local time
    const calendarTrigger: Notifications.NotificationTriggerInput = Platform.select({
      ios: { hour: 11, minute: 0, repeats: true },
      android: { hour: 11, minute: 0, repeats: true, channelId: "check-ins" as any },
      default: { hour: 11, minute: 0, repeats: true },
    }) as Notifications.NotificationTriggerInput;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: calendarTrigger,
    });

    // Store the notification ID for future reference
    await AsyncStorage.setItem(
      STORAGE_KEYS.CHECKIN_NOTIFICATION_ID,
      notificationId
    );
    await AsyncStorage.setItem(STORAGE_KEYS.CHECKIN_LAST_SCHEDULED_AT, String(Date.now()));

    console.log(
      "Daily check-in notification scheduled with ID:",
      notificationId
    );
    return notificationId;
  } catch (error) {
    console.error("Error scheduling daily check-in notification:", error);
    return null;
  }
};

/**
 * Cancel the daily check-in notification
 */
export const cancelDailyCheckInNotification = async (): Promise<void> => {
  try {
    // Try to get the stored notification ID
    const notificationId = await AsyncStorage.getItem(
      STORAGE_KEYS.CHECKIN_NOTIFICATION_ID
    );

    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await AsyncStorage.removeItem(STORAGE_KEYS.CHECKIN_NOTIFICATION_ID);
      console.log("Daily check-in notification cancelled");
    }
  } catch (error) {
    console.error("Error cancelling daily check-in notification:", error);
  }
};

/**
 * Set up notification channels for Android
 */
export const setupNotificationChannels = async (): Promise<void> => {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("check-ins", {
      name: "Check-ins",
      description: "Daily reminders to check in with your progress",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6366F1",
      sound: "default",
    });
  }
};
