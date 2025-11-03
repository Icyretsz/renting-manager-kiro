import { Router } from 'express';
import { meterReadingController } from '../controllers/meterReadingController';
import { authenticateToken } from '../middleware/auth';
import { validateMeterReading, validateRoomId, validateReadingId, validateRequired } from '../middleware/validation';
import * as readingAccess from '../middleware/readingAccess';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route POST /api/readings
 * @desc Create a new meter reading
 * @access Private (Authenticated users)
 */
router.post(
  '/',
  validateRequired(['roomId', 'month', 'year', 'waterReading', 'electricityReading', 'baseRent']),
  validateMeterReading,
  meterReadingController.createMeterReading.bind(meterReadingController)
);

/**
 * @route PUT /api/readings/:id
 * @desc Update an existing meter reading
 * @access Private (Owner or Admin)
 */
router.put(
  '/:id',
  validateReadingId,
  readingAccess.canEditReading,
  validateMeterReading,
  meterReadingController.updateMeterReading.bind(meterReadingController)
);

/**
 * @route GET /api/readings/:id
 * @desc Get meter reading by ID
 * @access Private (Authenticated users with access)
 */
router.get(
  '/:id',
  validateReadingId,
  readingAccess.canViewReading,
  meterReadingController.getMeterReadingById.bind(meterReadingController)
);

/**
 * @route GET /api/readings
 * @desc Get meter readings with filters and pagination
 * @access Private (Authenticated users)
 */
router.get(
  '/',
  meterReadingController.getMeterReadings.bind(meterReadingController)
);

/**
 * @route GET /api/readings/pending/all
 * @desc Get all pending readings for admin approval
 * @access Private (Admin only)
 */
router.get(
  '/pending/all',
  readingAccess.requireAdmin,
  meterReadingController.getPendingReadings.bind(meterReadingController)
);

/**
 * @route POST /api/readings/:id/approve
 * @desc Approve a meter reading
 * @access Private (Admin only)
 */
router.post(
  '/:id/approve',
  validateReadingId,
  readingAccess.canApproveReading,
  meterReadingController.approveReading.bind(meterReadingController)
);

/**
 * @route POST /api/readings/:id/reject
 * @desc Reject a meter reading
 * @access Private (Admin only)
 */
router.post(
  '/:id/reject',
  validateReadingId,
  readingAccess.canRejectReading,
  meterReadingController.rejectReading.bind(meterReadingController)
);

/**
 * @route GET /api/readings/room/:roomId/history
 * @desc Get reading history for a specific room
 * @access Private (Authenticated users with room access)
 */
router.get(
  '/room/:roomId/history',
  validateRoomId,
  readingAccess.canAccessRoom,
  meterReadingController.getRoomReadingHistory.bind(meterReadingController)
);

/**
 * @route GET /api/readings/room/:roomId/history/thumbnails
 * @desc Get reading history with photo thumbnails for a specific room
 * @access Private (Authenticated users with room access)
 */
router.get(
  '/room/:roomId/history/thumbnails',
  validateRoomId,
  readingAccess.canAccessRoom,
  meterReadingController.getRoomReadingHistoryWithThumbnails.bind(meterReadingController)
);

/**
 * @route POST /api/readings/calculate
 * @desc Calculate bill amount for a reading (preview)
 * @access Private (Authenticated users)
 */
router.post(
  '/calculate',
  validateRequired(['roomId', 'month', 'year', 'waterReading', 'electricityReading', 'baseRent']),
  validateMeterReading,
  meterReadingController.calculateBillAmount.bind(meterReadingController)
);

/**
 * @route GET /api/readings/status
 * @desc Get reading submission status for a specific room and month/year
 * @access Private (Authenticated users)
 */
router.get(
  '/status',
  meterReadingController.getReadingSubmissionStatus.bind(meterReadingController)
);

/**
 * @route GET /api/readings/:id/modifications
 * @desc Get modification history for a specific reading
 * @access Private (Authenticated users with access)
 */
router.get(
  '/:id/modifications',
  validateReadingId,
  readingAccess.canViewReading,
  meterReadingController.getReadingModificationHistory.bind(meterReadingController)
);

/**
 * @route GET /api/readings/:id/access
 * @desc Get reading access information for frontend
 * @access Private (Authenticated users with access)
 */
router.get(
  '/:id/access',
  validateReadingId,
  readingAccess.canViewReading,
  meterReadingController.getReadingAccess.bind(meterReadingController)
);

export default router;