import { Request, Response } from 'express';
import * as notificationService from '../services/notificationService';
import { AppError } from '../utils/errors';

/**
 * Get user notifications with pagination
 */
export const getUserNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const page = parseInt(req.query['page'] as string) || 1;
      const limit = parseInt(req.query['limit'] as string) || 20;

      const result = await notificationService.getUserNotifications(userId, page, limit);

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
};

/**
 * Mark specific notifications as read
 */
export const markNotificationsAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { notificationIds } = req.body;
      if (!Array.isArray(notificationIds)) {
        throw new AppError('notificationIds must be an array', 400);
      }

      await notificationService.markAsRead(userId, notificationIds);

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
};

/**
 * Mark single notification as read
 */
export const markSingleNotificationAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { notificationId } = req.params;
      if (!notificationId) {
        throw new AppError('Notification ID is required', 400);
      }

      await notificationService.markAsRead(userId, [notificationId]);

      res.json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
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
};

/**
 * Mark all notifications as read for the user
 */
export const markAllNotificationsAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      console.log('mark all')

      await notificationService.markAllAsRead(userId);

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
};

/**
 * Delete a single notification
 */
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { notificationId } = req.params;
    if (!notificationId) {
      throw new AppError('Notification ID is required', 400);
    }

    await notificationService.deleteNotification(userId, notificationId);

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
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
};

/**
 * Clear all notifications for the user
 */
export const clearAllNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    await notificationService.clearAllNotifications(userId);

    res.json({
      success: true,
      message: 'All notifications cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing all notifications:', error);
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
};

/**
 * Update user's FCM token for push notifications
 */
export const updateFCMToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { fcmToken } = req.body;
      console.log(fcmToken)
      if (!fcmToken || typeof fcmToken !== 'string') {
        throw new AppError('Valid FCM token is required', 400);
      }

      await notificationService.updateFCMToken(userId, fcmToken);

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
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const result = await notificationService.getUserNotifications(userId, 1, 1);

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
};