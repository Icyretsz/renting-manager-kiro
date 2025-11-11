import { Router } from 'express';
import * as billingController from '../controllers/billingController';
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
 * @route GET /api/billing/room/:roomId
 * @desc Get billing history for a specific room
 * @access Authenticated users (filtered by access)
 */
router.get('/room/:roomId', billingController.getRoomBillingHistory);

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
 * @route GET /api/billing/summary
 * @desc Get financial summary
 * @access Authenticated users (filtered by access)
 */
router.get('/summary', billingController.getFinancialSummary);

/**
 * @route GET /api/billing/monthly
 * @desc Get monthly financial report
 * @access Authenticated users (filtered by access)
 */
router.get('/monthly', billingController.getMonthlyFinancialReport);

/**
 * @route GET /api/billing/yearly
 * @desc Get yearly financial report
 * @access Authenticated users (filtered by access)
 */
router.get('/yearly', billingController.getYearlyFinancialReport);

/**
 * @route GET /api/billing/yearly-trend
 * @desc Get yearly trend data for financial dashboard
 * @access Authenticated users (filtered by access)
 */
router.get('/yearly-trend', billingController.getYearlyTrendData);

/**
 * @route GET /api/billing/export
 * @desc Export financial data to CSV
 * @access Admin only
 */
router.get('/export', requireAdmin, billingController.exportFinancialData);

/**
 * @route GET /api/billing/:id/status
 * @desc Get payment status of a billing record
 * @access Authenticated users (filtered by access)
 */
router.get('/:id/status', billingController.getBillingStatus)

export default router;