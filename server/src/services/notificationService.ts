import admin from '../config/firebase';
import { Prisma, PrismaClient } from '@prisma/client';
import { emitNotificationToUser, emitNotificationUpdate } from '../config/socket';

const prisma = new PrismaClient();

interface NotificationData {
  roomNumber: string;
  month?: string;
  year?: string;
  action?: string;
  billId?: string;
  tenantId?: string;
  reason?: string;
  amount?: string;
}

export interface NotificationTemplate {
  title: string;
  message: string;
  type: string;
  data?: NotificationData;
}

export interface NotificationRecipient {
  userId: string;
  fcmToken?: string | undefined;
}

// Notification templates for different events
const templates = {
    READING_SUBMITTED: (roomNumber: number, month: number, year: number): NotificationTemplate => ({
      title: 'New Meter Reading Submitted',
      message: `Room ${roomNumber} has submitted meter readings for ${month}/${year}. Tap to review and approve.`,
      type: 'reading_submitted',
      data: {
        roomNumber: roomNumber.toString(),
        month: month.toString(),
        year: year.toString(),
        action: 'review_reading',
      },
    }),

    READING_UPDATED: (roomNumber: number, month: number, year: number): NotificationTemplate => ({
      title: 'Meter Reading Updated',
      message: `Room ${roomNumber} has updated their meter readings for ${month}/${year}. Tap to review changes.`,
      type: 'reading_updated',
      data: {
        roomNumber: roomNumber.toString(),
        month: month.toString(),
        year: year.toString(),
        action: 'review_reading',
      },
    }),

    READING_APPROVED: (roomNumber: number, month: number, year: number): NotificationTemplate => ({
      title: 'Meter Reading Approved',
      message: `Your bill for Room ${roomNumber} - ${month} ${year} is ready. Tap to see bill details and pay.`,
      type: 'reading_approved',
      data: {
        roomNumber: roomNumber.toString(),
        month: month.toString(),
        year: year.toString(),
        action: 'view_readings',
      },
    }),

    READING_REJECTED: (roomNumber: number, month: number, year: number, reason?: string): NotificationTemplate => ({
      title: 'Meter Reading Rejected',
      message: `Your meter readings for Room ${roomNumber} (${month}/${year}) have been rejected${reason ? `: ${reason}` : ''}`,
      type: 'reading_rejected',
      data: {
        roomNumber: roomNumber.toString(),
        month: month.toString(),
        year: year.toString(),
        reason: reason || '',
      },
    }),

    READING_MODIFIED: (roomNumber: number, month: number, year: number): NotificationTemplate => ({
      title: 'Meter Reading Modified',
      message: `Meter readings for Room ${roomNumber} (${month}/${year}) have been modified by admin`,
      type: 'reading_modified',
      data: {
        roomNumber: roomNumber.toString(),
        month: month.toString(),
        year: year.toString(),
      },
    }),

    BILL_GENERATED: (roomNumber: number, month: number, year: number, amount: number): NotificationTemplate => ({
      title: 'Monthly Bill Generated',
      message: `Your bill for Room ${roomNumber} (${month}/${year}) is ready: ₫${amount.toFixed(2)}. Tap to view and pay.`,
      type: 'bill_generated',
      data: {
        roomNumber: roomNumber.toString(),
        month: month.toString(),
        year: year.toString(),
        amount: amount.toString(),
        action: 'pay_bill',
      },
    }),

    BILL_PAYED: (roomNumber: number, month: number, year: number, amount: Prisma.Decimal): NotificationTemplate => ({
      title: 'User Payed',
      message: `User's bill of Room ${roomNumber} (${month}/${year}) has been payed. Amount: ₫${amount}`,
      type: 'bill_payed',
      data: {
        roomNumber: roomNumber.toString(),
        month: month.toString(),
        year: year.toString(),
        amount: amount.toString(),
        action: 'pay_bill',
      },
    })
  };

/**
 * Send notification to specific users
 */
export const sendToUsers = async (
  recipients: NotificationRecipient[],
  template: NotificationTemplate,
  saveToHistory: boolean = true
): Promise<void> => {
  // Always save to history and emit WebSocket notifications first
  if (saveToHistory) {
    try {
      await saveNotificationHistory(recipients, template);
      console.log(`WebSocket notifications sent to ${recipients.length} users`);
    } catch (error) {
      console.error('Error saving notification history and emitting WebSocket:', error);
      // Don't throw - continue with Firebase notifications
    }
  }

  // Send Firebase push notifications (independent of WebSocket)
  try {
    // Filter recipients with FCM tokens
    const validRecipients = recipients.filter(r => r.fcmToken);
    
    if (validRecipients.length === 0) {
      console.warn('No valid FCM tokens found for Firebase notification');
      return; // WebSocket notifications already sent above
    }

    // Prepare FCM message
    const message = {
      notification: {
        title: template.title,
        body: template.message,
      },
      data: template.data || {},
    };

    // Send via Firebase
    const response = await admin.messaging().sendEachForMulticast({
      ...message,
      tokens: validRecipients.map(r => r.fcmToken!)
    })
    
    console.log(`Firebase notifications sent: ${response.successCount} success, ${response.failureCount} failures`);

    // Handle failed tokens (optional: remove invalid tokens from database)
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`Failed to send Firebase to token ${validRecipients[idx]?.fcmToken}: ${resp.error?.message}`);
        }
      });
    }
  } catch (error) {
    console.error('Error sending Firebase notification:', error);
    // Don't throw - WebSocket notifications already sent
  }
};

/**
 * Send notification to admin users
 */
export const sendToAdmins = async (template: NotificationTemplate): Promise<void> => {
  try {
    // Get all admin users (including those without FCM tokens for WebSocket)
    const adminUsers = await prisma.user.findMany({
      where: { 
        role: 'ADMIN'
      },
      select: {
        id: true,
        fcmToken: true,
      },
    });

    const recipients: NotificationRecipient[] = adminUsers.map(user => ({
      userId: user.id,
      fcmToken: user.fcmToken || undefined,
    }));

    console.log(`Sending notification to ${recipients.length} admin users`);
    await sendToUsers(recipients, template, true);
  } catch (error) {
    console.error('Error sending notification to admins:', error);
    throw error;
  }
};

/**
 * Send notification to users assigned to specific room
 */
export const sendToRoomUsers = async (roomId: number, template: NotificationTemplate): Promise<void> => {
  try {
    // Get users who are tenants of this room (including those without FCM tokens for WebSocket)
    const roomTenants = await prisma.tenant.findMany({
      where: { 
        roomId,
        userId: { not: null } // Only tenants with user accounts
      },
      include: {
        user: {
          select: {
            id: true,
            fcmToken: true,
          },
        },
      },
    });

    const recipients: NotificationRecipient[] = roomTenants
      .filter(tenant => tenant.user) // Ensure user exists
      .map(tenant => ({
        userId: tenant.user!.id,
        fcmToken: tenant.user!.fcmToken || undefined,
      }));

    console.log(`Sending notification to ${recipients.length} room ${roomId} users`);
    await sendToUsers(recipients, template, true);
  } catch (error) {
    console.error('Error sending notification to room users:', error);
    throw error;
  }
};

/**
 * Notify admins about new meter reading submission
 */
export const notifyReadingSubmitted = async (roomNumber: number, month: number, year: number): Promise<void> => {
  const template = templates.READING_SUBMITTED(roomNumber, month, year);
  await sendToAdmins(template);
};

/**
 * Notify admins about meter reading updates
 */
export const notifyReadingUpdated = async (roomNumber: number, month: number, year: number): Promise<void> => {
  const template = templates.READING_UPDATED(roomNumber, month, year);
  await sendToAdmins(template);
};

/**
 * Notify room users about reading approval
 */
export const notifyReadingApproved = async (roomId: number, roomNumber: number, month: number, year: number): Promise<void> => {
  const template = templates.READING_APPROVED(roomNumber, month, year);
  await sendToRoomUsers(roomId, template);
};

/**
 * Notify room users about reading rejection
 */
export const notifyReadingRejected = async (
  roomId: number, 
  roomNumber: number, 
  month: number, 
  year: number, 
  reason?: string
): Promise<void> => {
  const template = templates.READING_REJECTED(roomNumber, month, year, reason);
  await sendToRoomUsers(roomId, template);
};

/**
 * Notify room users about reading modification by admin
 */
export const notifyReadingModified = async (roomId: number, roomNumber: number, month: number, year: number): Promise<void> => {
  const template = templates.READING_MODIFIED(roomNumber, month, year);
  await sendToRoomUsers(roomId, template);
};

/**
 * Notify room users about bill generation
 */
export const notifyBillGenerated = async (
  roomId: number, 
  roomNumber: number, 
  month: number, 
  year: number, 
  amount: number
): Promise<void> => {
  const template = templates.BILL_GENERATED(roomNumber, month, year, amount);
  await sendToRoomUsers(roomId, template);
};

/**
 * Notify admins about bill payed
 */
export const notifyBillPayed = async (
  roomNumber: number, 
  month: number, 
  year: number, 
  amount: Prisma.Decimal
): Promise<void> => {
  const template = templates.BILL_PAYED(roomNumber, month, year, amount);
  await sendToAdmins(template);
};

/**
 * Save notification to history for tracking and emit WebSocket events
 */
const saveNotificationHistory = async (
  recipients: NotificationRecipient[],
  template: NotificationTemplate
): Promise<void> => {
    try {
      const notifications = recipients.map(recipient => ({
        userId: recipient.userId,
        title: template.title,
        message: template.message,
        type: template.type || 'general',
        readStatus: false,
      }));

      const createdNotifications = await Promise.all(
        notifications.map(notification => 
          prisma.notification.create({ data: notification })
        )
      );

      // Emit WebSocket events for real-time notifications
      // Need to get Auth0 sub for each user to match socket room names
      const userIds = [...new Set(createdNotifications.map(n => n.userId))];
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, auth0Id: true }
      });

      createdNotifications.forEach(notification => {
        const user = users.find(u => u.id === notification.userId);
        const auth0Id = user?.auth0Id;
        
        if (auth0Id) {
          emitNotificationToUser(auth0Id, {
            ...template,
            userId: notification.userId,
            readStatus: notification.readStatus,
            createdAt: notification.createdAt
          });
        } else {
          console.warn(`No Auth0 ID found for user ${notification.userId}`);
        }
      });

    } catch (error) {
      console.error('Error saving notification history:', error);
    // Don't throw here as notification sending was successful
  }
};

/**
 * Get notification history for a user
 */
export const getUserNotifications = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{
  notifications: any[];
  total: number;
  unreadCount: number;
}> => {
    try {
      const skip = (page - 1) * limit;

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notification.count({
          where: { userId },
        }),
        prisma.notification.count({
          where: { 
            userId,
            readStatus: false,
          },
        }),
      ]);

      return {
        notifications,
        total,
        unreadCount,
      };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
    throw error;
  }
};

/**
 * Mark notifications as read
 */
export const markAsRead = async (userId: string, notificationIds: string[]): Promise<void> => {
    try {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId,
        },
        data: {
          readStatus: true,
        },
      });

      // Emit WebSocket update for each notification
      // Get Auth0 ID for the user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { auth0Id: true }
      });

      if (user?.auth0Id) {
        notificationIds.forEach(notificationId => {
          emitNotificationUpdate(user.auth0Id!, {
            type: 'read',
            notificationId,
          });
        });
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId: string): Promise<void> => {
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          readStatus: false,
        },
        data: {
          readStatus: true,
        },
      });

      // Emit WebSocket update for bulk read
      // Get Auth0 ID for the user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { auth0Id: true }
      });

      if (user?.auth0Id) {
        emitNotificationUpdate(user.auth0Id, {
          type: 'mark_all_read',
        });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete a single notification
 */
export const deleteNotification = async (userId: string, notificationId: string): Promise<void> => {
  try {
    // Verify the notification belongs to the user before deleting
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found or access denied');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    // Emit WebSocket update for deletion
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { auth0Id: true }
    });

    if (user?.auth0Id) {
      emitNotificationUpdate(user.auth0Id, {
        type: 'notification_deleted',
        notificationId,
      });
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Clear all notifications for a user
 */
export const clearAllNotifications = async (userId: string): Promise<void> => {
  try {
    await prisma.notification.deleteMany({
      where: { userId },
    });

    // Emit WebSocket update for bulk deletion
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { auth0Id: true }
    });

    if (user?.auth0Id) {
      emitNotificationUpdate(user.auth0Id, {
        type: 'all_cleared',
      });
    }
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    throw error;
  }
};

/**
 * Update user's FCM token
 */
export const updateFCMToken = async (userId: string, fcmToken: string): Promise<void> => {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { fcmToken },
      });
    } catch (error) {
      console.error('Error updating FCM token:', error);
    throw error;
  }
};