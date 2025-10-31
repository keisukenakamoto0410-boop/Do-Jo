/**
 * Notification Helper Functions
 *
 * Creates in-app notifications for users.
 * Works alongside email notifications for a complete notification system.
 */

import { db } from "./db";
import { NotificationType } from "@prisma/client";

interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * Create a single notification
 */
export async function createNotification(
  options: CreateNotificationOptions
): Promise<boolean> {
  try {
    await db.notification.create({
      data: {
        userId: options.userId,
        type: options.type,
        title: options.title,
        message: options.message,
        link: options.link,
      },
    });

    console.log(`✅ Notification created for user ${options.userId}: ${options.title}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to create notification:", error);
    return false;
  }
}

/**
 * Create multiple notifications (bulk)
 */
export async function createBulkNotifications(
  notifications: CreateNotificationOptions[]
): Promise<number> {
  let successCount = 0;

  for (const notification of notifications) {
    const success = await createNotification(notification);
    if (success) successCount++;
  }

  console.log(`✅ Created ${successCount}/${notifications.length} notifications`);
  return successCount;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<boolean> {
  try {
    await db.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    return true;
  } catch (error) {
    console.error("❌ Failed to mark notification as read:", error);
    return false;
  }
}

/**
 * Mark all user's notifications as read
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    await db.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    return true;
  } catch (error) {
    console.error("❌ Failed to mark all notifications as read:", error);
    return false;
  }
}

/**
 * Get user's unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const count = await db.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
    return count;
  } catch (error) {
    console.error("❌ Failed to get unread count:", error);
    return 0;
  }
}

/**
 * Get user's notifications (paginated)
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 20,
  skip: number = 0
) {
  try {
    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    });
    return notifications;
  } catch (error) {
    console.error("❌ Failed to get notifications:", error);
    return [];
  }
}

/**
 * Delete old notifications (cleanup job - run periodically)
 */
export async function deleteOldNotifications(daysOld: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await db.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        isRead: true,
      },
    });

    console.log(`🗑️  Deleted ${result.count} old notifications`);
    return result.count;
  } catch (error) {
    console.error("❌ Failed to delete old notifications:", error);
    return 0;
  }
}

export default {
  createNotification,
  createBulkNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  getUserNotifications,
  deleteOldNotifications,
};
