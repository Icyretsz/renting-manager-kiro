import express from 'express';
import * as paymentController from '../controllers/paymentController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Generate payment link for a billing record
router.post('/billing/:billingRecordId/payment-link', authenticateToken, paymentController.generatePaymentLink);

// Get fresh QR code for unpaid bill
router.get('/billing/:billingRecordId/qr-code', authenticateToken, paymentController.getFreshQRCode);

// Get payment information by order code
router.get('/payment-info/:orderCode', authenticateToken, paymentController.getPaymentInfo);

// PayOS webhook endpoint (no auth required for webhooks)
router.post('/webhook/payos', paymentController.handlePaymentWebhook);

// Cancel payment link
router.post('/cancel-payment/:orderCode', authenticateToken, paymentController.cancelPaymentLink);

export default router;