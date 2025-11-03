import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { AppError } from '../utils/errors';

export class NotificationController {
  /**
   * Get user notifications with pagination
   */
  static async getUserNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const page = parseInt(req.query['page'] as string) || 1;
      const limit = parseInt(req.query['limit'] as string) || 20;

      const result = await NotificationService.getUserNotifications(userId, page, limit);

      res.json({
        success: true,
        data: result.notifications,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
        unreadCount: result.unreadCount,
      });
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
        });
      }
    }
  }

  /**
   * Mark specific notifications as read
   */
  static async markNotificationsAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { notificationIds } = req.body;
      if (!Array.isArray(notificationIds)) {
        throw new AppError('notificationIds must be an array', 400);
      }

      await NotificationService.markAsRead(userId, notificationIds);

      res.json({
        success: true,
        message: 'Notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
        });
      }
    }
  }

  /**
   * Mark all notifications as read for the user
   */
  static async markAllNotificationsAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      await NotificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
        });
      }
    }
  }

  /**
   * Update user's FCM token for push notifications
   */
  static async updateFCMToken(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { fcmToken } = req.body;
      if (!fcmToken || typeof fcmToken !== 'string') {
        throw new AppError('Valid FCM token is required', 400);
      }

      await NotificationService.updateFCMToken(userId, fcmToken);

      res.json({
        success: true,
        message: 'FCM token updated successfully',
      });
    } catch (error) {
      console.error('Error updating FCM token:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
        });
      }
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const result = await NotificationService.getUserNotifications(userId, 1, 1);

      res.json({
        success: true,
        unreadCount: result.unreadCount,
      });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
        });
      }
    }
  }
}