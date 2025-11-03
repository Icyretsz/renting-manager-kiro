import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All notification routes require authentication
router.use(authenticateToken);

// Get user notifications with pagination
router.get('/', NotificationController.getUserNotifications);

// Get unread notification count
router.get('/unread-count', NotificationController.getUnreadCount);

// Mark specific notifications as read
router.patch('/mark-read', NotificationController.markNotificationsAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', NotificationController.markAllNotificationsAsRead);

// Update FCM token for push notifications
router.patch('/fcm-token', NotificationController.updateFCMToken);

export default router;