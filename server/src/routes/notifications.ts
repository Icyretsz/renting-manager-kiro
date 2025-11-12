import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All notification routes require authentication
router.use(authenticateToken);

// Get user notifications with pagination
router.get('/', notificationController.getUserNotifications);

// Get unread notification count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark specific notifications as read
router.patch('/mark-read', notificationController.markNotificationsAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', notificationController.markAllNotificationsAsRead);

// Update FCM token for push notifications
router.patch('/fcm-token', notificationController.updateFCMToken);

// Clear all notifications (must come before /:notificationId to avoid route conflicts)
router.delete('/clear-all', notificationController.clearAllNotifications);

// Mark single notification as read
router.put('/:notificationId/read', notificationController.markSingleNotificationAsRead);

// Delete single notification
router.delete('/:notificationId', notificationController.deleteNotification);

export default router;