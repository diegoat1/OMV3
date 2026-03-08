// Notification Service - Local notifications for reminders
// Uses expo-notifications for scheduling local reminders

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Reminder } from '../../models';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  // Request permissions for notifications
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }

    // Android requires a channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Recordatorios',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0891b2',
      });

      await Notifications.setNotificationChannelAsync('tasks', {
        name: 'Tareas diarias',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    return true;
  },

  // Schedule a notification for a reminder
  async scheduleReminderNotification(reminder: Reminder): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const dueDate = new Date(reminder.dueDate);
      
      // Don't schedule if date is in the past
      if (dueDate <= new Date()) {
        return null;
      }

      // Schedule notification for 9 AM on the due date
      dueDate.setHours(9, 0, 0, 0);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `📋 ${reminder.title}`,
          body: reminder.description || 'Tienes un control pendiente',
          data: { reminderId: reminder.id, type: 'reminder' },
          sound: true,
        },
        trigger: {
          date: dueDate,
          channelId: 'reminders',
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling reminder notification:', error);
      return null;
    }
  },

  // Schedule a daily task reminder
  async scheduleDailyTaskReminder(time: string = '08:00'): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const [hours, minutes] = time.split(':').map(Number);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '☀️ Buenos días',
          body: 'Revisa tus tareas del día',
          data: { type: 'daily_tasks' },
          sound: true,
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
          channelId: 'tasks',
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling daily task reminder:', error);
      return null;
    }
  },

  // Schedule appointment reminder (for doctors)
  async scheduleAppointmentReminder(
    appointmentId: string,
    patientName: string,
    dateTime: Date,
    minutesBefore: number = 30
  ): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const reminderTime = new Date(dateTime.getTime() - minutesBefore * 60 * 1000);
      
      if (reminderTime <= new Date()) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🗓️ Turno próximo',
          body: `${patientName} en ${minutesBefore} minutos`,
          data: { appointmentId, type: 'appointment' },
          sound: true,
        },
        trigger: {
          date: reminderTime,
          channelId: 'reminders',
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling appointment reminder:', error);
      return null;
    }
  },

  // Cancel a scheduled notification
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  },

  // Cancel all scheduled notifications
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  },

  // Get all scheduled notifications
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  },

  // Add notification response listener
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },

  // Add notification received listener
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  },
};
