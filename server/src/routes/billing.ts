import { Router } from 'express';
import { billingController } from '../controllers/billingController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Apply authentication to all billing routes
router.use(authenticateToken);

/**
 * @route POST /api/billing/generate/:readingId
 * @desc Generate billing record from approved meter reading
 * @access Admin only
 */
router.post('/generate/:readingId', requireAdmin, billingController.generateBillingRecord);

/**
 * @route POST /api/billing/calculate
 * @desc Calculate real-time bill amount for user interface
 * @access Authenticated users
 */
router.post('/calculate', billingController.calculateRealtimeBill);

/**
 * @route GET /api/billing/:id
 * @desc Get billing record by ID
 * @access Authenticated users (filtered by access)
 */
router.get('/:id', billingController.getBillingRecordById);

/**
 * @route GET /api/billing
 * @desc Get billing records with filters and pagination
 * @access Authenticated users (filtered by access)
 */
router.get('/', billingController.getBillingRecords);

/**
 * @route GET /api/billing/room/:roomId/history
 * @desc Get billing history for a specific room
 * @access Authenticated users (filtered by access)
 */
router.get('/room/:roomId/history', billingController.getRoomBillingHistory);

/**
 * @route PUT /api/billing/:id/payment-status
 * @desc Update payment status of a billing record
 * @access Admin only
 */
router.put('/:id/payment-status', requireAdmin, billingController.updatePaymentStatus);

/**
 * @route POST /api/billing/mark-overdue
 * @desc Mark overdue payments
 * @access Admin only
 */
router.post('/mark-overdue', requireAdmin, billingController.markOverduePayments);

/**
 * @route GET /api/billing/reports/summary
 * @desc Get financial summary
 * @access Authenticated users (filtered by access)
 */
router.get('/reports/summary', billingController.getFinancialSummary);

/**
 * @route GET /api/billing/reports/monthly
 * @desc Get monthly financial report
 * @access Authenticated users (filtered by access)
 */
router.get('/reports/monthly', billingController.getMonthlyFinancialReport);

/**
 * @route GET /api/billing/reports/yearly
 * @desc Get yearly financial report
 * @access Authenticated users (filtered by access)
 */
router.get('/reports/yearly', billingController.getYearlyFinancialReport);

/**
 * @route GET /api/billing/export
 * @desc Export financial data to CSV
 * @access Admin only
 */
router.get('/export', requireAdmin, billingController.exportFinancialData);

export default router;