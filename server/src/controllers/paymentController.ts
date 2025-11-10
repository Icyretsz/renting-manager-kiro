import { Request, Response, NextFunction } from 'express';
import * as payosService from '../services/payosService';
import * as billingService from '../services/billingService';
import { prisma } from '../config/database';
import { AppError, ValidationError } from '../utils/errors';
import { getStringParam } from '../utils/paramHelpers';

/**
 * Generate payment link for a billing record
 */
export const generatePaymentLink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const billingRecordId = getStringParam(req.params, 'billingRecordId');
    const userRole = req.user?.role || 'USER';
    const userId = req.user?.id;

    if (!billingRecordId) {
      throw new ValidationError('Billing record ID is required');
    }

    // Verify user has access to this billing record
    const billingRecord = await billingService.getBillingRecordById(billingRecordId, userRole, userId);
    if (!billingRecord) {
      throw new AppError('Billing record not found or access denied', 404);
    }

    // Generate payment link
    const paymentLink = await payosService.generatePaymentLink(billingRecordId);

    res.json({
      success: true,
      data: {
        checkoutUrl: paymentLink.checkoutUrl,
        qrCode: paymentLink.qrCode,
        orderCode: paymentLink.orderCode,
        amount: paymentLink.amount,
        description: paymentLink.description
      },
      message: 'Payment link generated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get fresh QR code for unpaid bill
 */
export const getFreshQRCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const billingRecordId = getStringParam(req.params, 'billingRecordId');
    const userRole = req.user?.role || 'USER';
    const userId = req.user?.id;

    if (!billingRecordId) {
      throw new ValidationError('Billing record ID is required');
    }

    // Verify user has access to this billing record
    const billingRecord = await billingService.getBillingRecordById(billingRecordId, userRole, userId);
    if (!billingRecord) {
      throw new AppError('Billing record not found or access denied', 404);
    }

    // Generate fresh QR code
    const qrCode = await payosService.generateFreshQRCode(billingRecordId);

    res.json({
      success: true,
      data: { qrCode },
      message: 'QR code generated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment information by order code
 */
export const getPaymentInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orderCode = parseInt(req.params['orderCode'] || '0');

    if (!orderCode || isNaN(orderCode)) {
      throw new ValidationError('Valid order code is required');
    }

    const paymentInfo = await payosService.getPaymentInfo(orderCode);

    res.json({
      success: true,
      data: paymentInfo
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle PayOS webhook for payment confirmations
 */
export const handlePaymentWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Create webhook object from request body (PayOS sends the full webhook structure)
    console.log(req.body)
    const webhook = req.body

    // Verify webhook signature and process payment
    const isValid = await payosService.verifyWebhookSignature(webhook);
    
    if (!isValid) {
      throw new AppError('Invalid webhook signature', 401);
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel payment link
 */
export const cancelPaymentLink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orderCode = parseInt(req.params['orderCode'] || '0');
    const { cancellationReason } = req.body;

    if (!orderCode || isNaN(orderCode)) {
      throw new ValidationError('Valid order code is required');
    }

    const result = await payosService.cancelPaymentLink(orderCode, cancellationReason);

    res.json({
      success: true,
      data: result,
      message: 'Payment link cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send payment notification when readings are approved
 */
export const sendPaymentNotification = async (billingRecordId: string, userId: string): Promise<void> => {
  try {
    const billingRecord = await billingService.getBillingRecordById(billingRecordId, 'ADMIN');
    
    if (!billingRecord) {
      throw new AppError('Billing record not found', 404);
    }

    // Create notification for bill ready
    await prisma.notification.create({
      data: {
        userId,
        title: 'Bill Ready for Payment',
        message: `Your bill for Room ${billingRecord.room.roomNumber} is ready. Tap to see bill details and pay. Amount: ₫${billingRecord.totalAmount.toNumber().toLocaleString()}`,
        type: 'bill_ready'
      }
    });
  } catch (error) {
    console.error('Failed to send payment notification:', error);
  }
};