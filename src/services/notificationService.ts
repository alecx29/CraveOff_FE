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
};

/**
 * Schedule a daily check-in notification at 11:00 AM local time
 * This will show the app logo in the notification
 */
export const scheduleDailyCheckInNotification = async (): Promise<
  string | null
> => {
  try {
    // Cancel any existing check-in notification first
    await cancelDailyCheckInNotification();

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

    // Schedule for 11:00 AM every day
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(11, 0, 0, 0); // Set to 11:00 AM

    // If it's already past 11:00 AM, schedule for tomorrow
    if (now > scheduledTime) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    // Calculate seconds until scheduled time
    const secondsUntilScheduled = Math.floor(
      (scheduledTime.getTime() - now.getTime()) / 1000
    );

    // Schedule the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: {
        seconds: secondsUntilScheduled,
        repeats: true,
        channelId: "check-ins",
      },
    });

    // Store the notification ID for future reference
    await AsyncStorage.setItem(
      STORAGE_KEYS.CHECKIN_NOTIFICATION_ID,
      notificationId
    );

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
