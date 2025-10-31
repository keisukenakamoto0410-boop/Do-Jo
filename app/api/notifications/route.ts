import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/notifications";

/**
 * GET /api/notifications
 * Get user's notifications
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = parseInt(searchParams.get("skip") || "0");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    // Get notifications
    const notifications = await getUserNotifications(session.user.id, limit, skip);

    // Get unread count
    const unreadCount = await getUnreadCount(session.user.id);

    // Filter unread only if requested
    const filteredNotifications = unreadOnly
      ? notifications.filter((n) => !n.isRead)
      : notifications;

    return NextResponse.json({
      notifications: filteredNotifications,
      unreadCount,
      total: filteredNotifications.length,
    });
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json(
      { error: "通知の取得に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Mark notification(s) as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all as read
      const success = await markAllNotificationsAsRead(session.user.id);

      if (!success) {
        return NextResponse.json(
          { error: "通知の更新に失敗しました" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "すべての通知を既読にしました",
        success: true,
      });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: "通知IDが必要です" },
        { status: 400 }
      );
    }

    // Mark specific notification as read
    const success = await markNotificationAsRead(notificationId);

    if (!success) {
      return NextResponse.json(
        { error: "通知の更新に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "通知を既読にしました",
      success: true,
    });
  } catch (error) {
    console.error("Notification update error:", error);
    return NextResponse.json(
      { error: "通知の更新に失敗しました" },
      { status: 500 }
    );
  }
}
