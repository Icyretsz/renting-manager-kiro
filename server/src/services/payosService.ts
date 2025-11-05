import { PayOS, WebhookError } from '@payos/node';
import { CreatePaymentLinkRequest } from '@payos/node/lib/resources/v2/payment-requests/payment-requests'
import { Webhook } from '@payos/node/lib/resources/webhooks/index'
import { prisma } from '../config/database';
import { AppError, ValidationError } from '../utils/errors';

import { PaymentStatus } from '@prisma/client';

// PayOS configuration
const payOS = new PayOS({
  clientId: process.env['PAYOS_CLIENT_ID']!,
  apiKey: process.env['PAYOS_API_KEY']!,
  checksumKey: process.env['PAYOS_CHECKSUM_KEY']!,
  // ... other options
});

export interface PaymentLinkData {
  orderCode: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerAddress?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface PaymentResponse {
  bin: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
  orderCode: number;
  currency: string;
  paymentLinkId: string;
  status: string;
  checkoutUrl: string;
  qrCode: string;
}

export interface PaymentWebhookData {
  orderCode: number;
  amount: number;
  description: string;
  accountNumber: string;
  reference: string;
  transactionDateTime: string;
  currency: string;
  paymentLinkId: string;
  code: string;
  desc: string;
  counterAccountBankId?: string;
  counterAccountBankName?: string;
  counterAccountName?: string;
  counterAccountNumber?: string;
  virtualAccountName?: string;
  virtualAccountNumber?: string;
}

/**
 * Generate PayOS payment link for a billing record
 */
export const generatePaymentLink = async (billingRecordId: string): Promise<PaymentResponse> => {
  try {
    // Get billing record with details
    const billingRecord = await prisma.billingRecord.findUnique({
      where: { id: billingRecordId },
      include: {
        room: {
          select: {
            roomNumber: true,
            floor: true
          }
        },
        reading: {
          select: {
            month: true,
            year: true
          }
        }
      }
    });

    if (!billingRecord) {
      throw new AppError('Billing record not found', 404);
    }

    if (billingRecord.paymentStatus === PaymentStatus.PAID) {
      throw new ValidationError('This bill has already been paid');
    }

    // Generate unique order code (timestamp + room number)
    const orderCode = parseInt(`${Date.now()}${billingRecord.room.roomNumber.toString().padStart(2, '0')}`);

    // Create payment link data
    const paymentData: CreatePaymentLinkRequest = {
      orderCode,
      amount: Math.round(billingRecord.totalAmount.toNumber()),
      description: `Room ${billingRecord.room.roomNumber} - ${getMonthName(billingRecord.month)} ${billingRecord.year} Bill`,
      returnUrl: `${process.env['CLIENT_URL']}/billing/success?orderCode=${orderCode}`,
      cancelUrl: `${process.env['CLIENT_URL']}/billing/cancel?orderCode=${orderCode}`,
      items: [
        {
          name: `Water Usage (${billingRecord.waterUsage.toNumber()} units)`,
          quantity: 1,
          price: Math.round(billingRecord.waterCost.toNumber())
        },
        {
          name: `Electricity Usage (${billingRecord.electricityUsage.toNumber()} units)`,
          quantity: 1,
          price: Math.round(billingRecord.electricityCost.toNumber())
        },
        {
          name: 'Base Rent',
          quantity: 1,
          price: Math.round(billingRecord.baseRent.toNumber())
        },
        {
          name: 'Trash Fee',
          quantity: 1,
          price: Math.round(billingRecord.trashFee.toNumber())
        }
      ]
    };

    // Create payment link with PayOS
    const paymentLink = await payOS.paymentRequests.create(paymentData);

    // Store payment reference in database (not the QR URL as it expires)
    await prisma.billingRecord.update({
      where: { id: billingRecordId },
      data: {
        paymentReference: orderCode.toString(),
        paymentLinkId: paymentLink.paymentLinkId
      }
    });

    return paymentLink;
  } catch (error) {
    if (error instanceof AppError || error instanceof ValidationError) {
      throw error;
    }
    throw new AppError('Failed to generate payment link', 500);
  }
};

/**
 * Get payment information by order code
 */
export const getPaymentInfo = async (orderCode: number): Promise<any> => {
  try {
    return await payOS.paymentRequests.get(orderCode);
  } catch (error) {
    throw new AppError('Failed to get payment information', 500);
  }
};

/**
 * Handle payment webhook from PayOS
 */
export const handlePaymentWebhook = async (webhook: Webhook): Promise<void> => {
  try {
    const { orderCode, code, transactionDateTime, reference } = webhook.data;

    // Find billing record by payment reference
    const billingRecord = await prisma.billingRecord.findFirst({
      where: { paymentReference: orderCode.toString() }
    });

    if (!billingRecord) {
      throw new AppError('Billing record not found for payment', 404);
    }

    // Update payment status based on webhook data
    let paymentStatus: PaymentStatus;
    let paymentDate: Date | null = null;

    if (code === '00') {
      // Payment successful
      paymentStatus = PaymentStatus.PAID;
      paymentDate = new Date(transactionDateTime);
    } else {
      // Payment failed or cancelled
      paymentStatus = PaymentStatus.UNPAID;
    }

    // Update billing record
    await prisma.billingRecord.update({
      where: { id: billingRecord.id },
      data: {
        paymentStatus,
        paymentDate,
        paymentTransactionId: reference
      }
    });

    // Send notification to tenant about payment status
    if (paymentStatus === PaymentStatus.PAID) {
      await sendPaymentSuccessNotification(billingRecord.id);
    }
  } catch (error) {
    console.error('Payment webhook error:', error);
    throw new AppError('Failed to process payment webhook', 500);
  }
};

/**
 * Verify webhook signature (PayOS security)
 */
export const verifyWebhookSignature = async (webhook: Webhook): Promise<boolean> => {
  try {
    // In a real application, you would receive this data from PayOS
    const verifiedData = await payOS.webhooks.verify(webhook);

    console.log('Webhook verified successfully:');
    console.log('Webhook data receive', verifiedData);

    // Process the payment confirmation
    console.log('Processing payment confirmation...');
    await handlePaymentWebhook(webhook);
    return true;
  } catch (error) {
    if (error instanceof WebhookError) {
      console.error('Webhook verification failed:', error.message);
      console.log('This might be a fraudulent webhook request');
    } else {
      console.error('Unexpected error:', error);
    }
    return false;
  }
};

/**
 * Cancel payment link
 */
export const cancelPaymentLink = async (orderCode: number, cancellationReason?: string): Promise<any> => {
  try {
    return await payOS.paymentRequests.cancel(orderCode, cancellationReason);
  } catch (error) {
    throw new AppError('Failed to cancel payment link', 500);
  }
};

/**
 * Send payment success notification to tenant
 */
const sendPaymentSuccessNotification = async (billingRecordId: string): Promise<void> => {
  try {
    const billingRecord = await prisma.billingRecord.findUnique({
      where: { id: billingRecordId },
      include: {
        room: {
          include: {
            tenants: {
              where: { isActive: true },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    fcmToken: true
                  }
                }
              }
            }
          }
        },
        reading: {
          select: {
            month: true,
            year: true
          }
        }
      }
    });

    if (!billingRecord) return;

    // Send notification to all active tenants in the room
    for (const tenant of billingRecord.room.tenants) {
      if (tenant.user) {
        const notification = await prisma.notification.create({
          data: {
            userId: tenant.user.id,
            title: 'Payment Confirmed',
            message: `Your payment for Room ${billingRecord.room.roomNumber} - ${getMonthName(billingRecord.month)} ${billingRecord.year} has been confirmed. Amount: ₫${billingRecord.totalAmount.toNumber().toLocaleString()}`,
            type: 'payment_success'
          }
        });

        // Emit WebSocket notification
        try {
          const { emitNotificationToUser } = await import('../config/socket');
          emitNotificationToUser(tenant.user.id, notification);
        } catch (socketError) {
          console.error('Failed to emit WebSocket notification:', socketError);
        }
      }
    }
  } catch (error) {
    console.error('Failed to send payment success notification:', error);
  }
};

/**
 * Get month name from month number
 */
const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'Unknown';
};

/**
 * Generate fresh QR code for unpaid bill (for UI display)
 */
export const generateFreshQRCode = async (billingRecordId: string): Promise<string> => {
  try {
    const paymentLink = await generatePaymentLink(billingRecordId);
    return paymentLink.qrCode;
  } catch (error) {
    throw new AppError('Failed to generate QR code', 500);
  }
};