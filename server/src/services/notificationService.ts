import admin from '../config/firebase';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface NotificationTemplate {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface NotificationRecipient {
  userId: string;
  fcmToken?: string;
}

// Notification templates for different events
const templates = {
    READING_SUBMITTED: (roomNumber: number, month: number, year: number): NotificationTemplate => ({
      title: 'New Meter Reading Submitted',
      body: `Room ${roomNumber} has submitted meter readings for ${month}/${year}`,
      data: {
        type: 'reading_submitted',
        roomNumber: roomNumber.toString(),
        month: month.toString(),
        year: year.toString(),
      },
    }),

    READING_APPROVED: (roomNumber: number, month: number, year: number): NotificationTemplate => ({
      title: 'Meter Reading Approved',
      body: `Your meter readings for Room ${roomNumber} (${month}/${year}) have been approved`,
      data: {
        type: 'reading_approved',
        roomNumber: roomNumber.toString(),
        month: month.toString(),
        year: year.toString(),
      },
    }),

    READING_REJECTED: (roomNumber: number, month: number, year: number, reason?: string): NotificationTemplate => ({
      title: 'Meter Reading Rejected',
      body: `Your meter readings for Room ${roomNumber} (${month}/${year}) have been rejected${reason ? `: ${reason}` : ''}`,
      data: {
        type: 'reading_rejected',
        roomNumber: roomNumber.toString(),
        month: month.toString(),
        year: year.toString(),
        reason: reason || '',
      },
    }),

    READING_MODIFIED: (roomNumber: number, month: number, year: number): NotificationTemplate => ({
      title: 'Meter Reading Modified',
      body: `Meter readings for Room ${roomNumber} (${month}/${year}) have been modified by admin`,
      data: {
        type: 'reading_modified',
        roomNumber: roomNumber.toString(),
        month: month.toString(),
        year: year.toString(),
      },
    }),

    BILL_GENERATED: (roomNumber: number, month: number, year: number, amount: number): NotificationTemplate => ({
      title: 'Monthly Bill Generated',
      body: `Your bill for Room ${roomNumber} (${month}/${year}) is ready: $${amount.toFixed(2)}`,
      data: {
        type: 'bill_generated',
        roomNumber: roomNumber.toString(),
        month: month.toString(),
        year: year.toString(),
        amount: amount.toString(),
      },
    }),
  };

/**
 * Send notification to specific users
 */
export const sendToUsers = async (
  recipients: NotificationRecipient[],
  template: NotificationTemplate,
  saveToHistory: boolean = true
): Promise<void> => {
    try {
      // Filter recipients with FCM tokens
      const validRecipients = recipients.filter(r => r.fcmToken);
      
      if (validRecipients.length === 0) {
        console.warn('No valid FCM tokens found for notification');
        return;
      }

      // Prepare FCM message
      const message = {
        notification: {
          title: template.title,
          body: template.body,
        },
        data: template.data || {},
        tokens: validRecipients.map(r => r.fcmToken!),
      };

      // Send via Firebase
      const response = await admin.messaging().sendMulticast(message);
      
      console.log(`Notification sent successfully: ${response.successCount} success, ${response.failureCount} failures`);

      // Save to notification history if requested
      if (saveToHistory) {
        await saveNotificationHistory(recipients, template);
      }

      // Handle failed tokens (optional: remove invalid tokens from database)
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`Failed to send to token ${validRecipients[idx]?.fcmToken}: ${resp.error?.message}`);
          }
        });
      }
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

/**
 * Send notification to admin users
 */
export const sendToAdmins = async (template: NotificationTemplate): Promise<void> => {
    try {
      // Get all admin users with FCM tokens
      const adminUsers = await prisma.user.findMany({
        where: { 
          role: 'ADMIN',
          fcmToken: { not: null }
        },
        select: {
          id: true,
          fcmToken: true,
        },
      });

      const recipients: NotificationRecipient[] = adminUsers
        .filter(user => user.fcmToken)
        .map(user => ({
          userId: user.id,
          fcmToken: user.fcmToken!,
        }));

    await sendToUsers(recipients, template);
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
      // Get users who are tenants of this room
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
        .filter(tenant => tenant.user?.fcmToken)
        .map(tenant => ({
          userId: tenant.user!.id,
          fcmToken: tenant.user!.fcmToken!,
        }));

    await sendToUsers(recipients, template);
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
 * Save notification to history for tracking
 */
const saveNotificationHistory = async (
  recipients: NotificationRecipient[],
  template: NotificationTemplate
): Promise<void> => {
    try {
      const notifications = recipients.map(recipient => ({
        userId: recipient.userId,
        title: template.title,
        message: template.body,
        type: template.data?.['type'] || 'general',
        readStatus: false,
      }));

      await prisma.notification.createMany({
        data: notifications,
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
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
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