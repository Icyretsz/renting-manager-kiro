import { Request, Response, NextFunction } from 'express';
import * as billingService from '../services/billingService';
import { BillingFilters } from '../services/billingService';
import { PaymentStatus } from '@prisma/client';
import { AppError, ValidationError } from '../utils/errors';
import { parseOptionalIntParam, getStringParam, parseIntParam } from '../utils/paramHelpers';

/**
 * Generate billing record from approved meter reading
 */
export const generateBillingRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const readingId = getStringParam(req.params, 'readingId');
    
    if (!readingId) {
      throw new ValidationError('Reading ID is required');
    }

    const billingRecord = await billingService.generateBillingRecord(readingId);

    res.status(201).json({
      success: true,
      data: billingRecord,
      message: 'Billing record generated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate real-time bill amount
 */
export const calculateRealtimeBill = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roomId, month, year, waterReading, electricityReading, baseRent } = req.body;

    if (!roomId || !month || !year || waterReading === undefined || electricityReading === undefined || baseRent === undefined) {
      throw new ValidationError('All fields are required: roomId, month, year, waterReading, electricityReading, baseRent');
    }

    // Validate data types and ranges
    if (!Number.isInteger(roomId) || roomId < 1 || roomId > 18) {
      throw new ValidationError('Room ID must be an integer between 1 and 18');
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new ValidationError('Month must be an integer between 1 and 12');
    }

    if (!Number.isInteger(year) || year < 2020 || year > new Date().getFullYear() + 1) {
      throw new ValidationError('Year must be a valid year');
    }

    if (typeof waterReading !== 'number' || waterReading < 0) {
      throw new ValidationError('Water reading must be a positive number');
    }

    if (typeof electricityReading !== 'number' || electricityReading < 0) {
      throw new ValidationError('Electricity reading must be a positive number');
    }

    if (typeof baseRent !== 'number' || baseRent < 0) {
      throw new ValidationError('Base rent must be a positive number');
    }

    const calculation = await billingService.calculateRealtimeBill(
      roomId,
      month,
      year,
      waterReading,
      electricityReading,
      baseRent
    );

    res.json({
      success: true,
      data: calculation,
      message: 'Bill calculation completed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get billing record by ID
 */
export const getBillingRecordById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = getStringParam(req.params, 'id');
      const userRole = req.user?.role || 'USER';
      const userId = req.user?.id;

      if (!id) {
        throw new ValidationError('Billing record ID is required');
      }

      const billingRecord = await billingService.getBillingRecordById(id, userRole, userId);

      if (!billingRecord) {
        throw new AppError('Billing record not found', 404);
      }

      res.json({
        success: true,
        data: billingRecord
      });
  } catch (error) {
    next(error);
  }
};

/**
 * Get billing records with filters and pagination
 */
export const getBillingRecords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRole = req.user?.role || 'USER';
      const userId = req.user?.id;

      // Parse query parameters
      const page = parseOptionalIntParam(req.query, 'page') || 1;
      const limit = Math.min(parseOptionalIntParam(req.query, 'limit') || 10, 100); // Max 100 per page

      const filters: BillingFilters = {};
      
      const roomId = parseOptionalIntParam(req.query, 'roomId');
      if (roomId !== undefined) filters.roomId = roomId;
      
      const month = parseOptionalIntParam(req.query, 'month');
      if (month !== undefined) filters.month = month;
      
      const year = parseOptionalIntParam(req.query, 'year');
      if (year !== undefined) filters.year = year;
      
      if (req.query['paymentStatus']) {
        const status = req.query['paymentStatus'] as string;
        if (status && Object.values(PaymentStatus).includes(status as PaymentStatus)) {
          filters.paymentStatus = status as PaymentStatus;
        }
      }
      
      const floor = parseOptionalIntParam(req.query, 'floor');
      if (floor !== undefined) filters.floor = floor;

      const result = await billingService.getBillingRecords(filters, userRole, userId, page, limit);

      res.json({
        success: true,
        data: result.billingRecords,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
  } catch (error) {
    next(error);
  }
};

/**
 * Get billing history for a specific room
 */
export const getRoomBillingHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomId = parseIntParam(req.params, 'roomId');
      const userRole = req.user?.role || 'USER';
      const userId = req.user?.id;

      if (!roomId) {
        throw new ValidationError('Room ID is required');
      }

      const billingHistory = await billingService.getRoomBillingHistory(roomId, userRole, userId);

      res.json({
        success: true,
        data: billingHistory
      });
  } catch (error) {
    next(error);
  }
};

/**
 * Update payment status of a billing record
 */
export const updatePaymentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = getStringParam(req.params, 'id');
      const { paymentStatus, paymentDate } = req.body;

      if (!id) {
        throw new ValidationError('Billing record ID is required');
      }

      if (!paymentStatus || !Object.values(PaymentStatus).includes(paymentStatus)) {
        throw new ValidationError('Valid payment status is required');
      }

      let parsedPaymentDate: Date | undefined;
      if (paymentDate) {
        parsedPaymentDate = new Date(paymentDate);
        if (isNaN(parsedPaymentDate.getTime())) {
          throw new ValidationError('Invalid payment date format');
        }
      }

      const updatedRecord = await billingService.updatePaymentStatus(
        id,
        paymentStatus,
        parsedPaymentDate
      );

      res.json({
        success: true,
        data: updatedRecord,
        message: 'Payment status updated successfully'
      });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark overdue payments
 */
export const markOverduePayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dueDays = parseOptionalIntParam(req.body, 'dueDays') || 30;

      if (dueDays < 1) {
        throw new ValidationError('Due days must be a positive number');
      }

      const updatedCount = await billingService.markOverduePayments(dueDays);

      res.json({
        success: true,
        data: { updatedCount },
        message: `Marked ${updatedCount} payments as overdue`
      });
  } catch (error) {
    next(error);
  }
};

/**
 * Get financial summary
 */
export const getFinancialSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRole = req.user?.role || 'USER';
      const userId = req.user?.id;

      const month = parseOptionalIntParam(req.query, 'month');
      const year = parseOptionalIntParam(req.query, 'year');

      const summary = await billingService.getFinancialSummary(month, year, userRole, userId);

      res.json({
        success: true,
        data: summary
      });
  } catch (error) {
    next(error);
  }
};

/**
 * Get monthly financial report
 */
export const getMonthlyFinancialReport = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
      console.log('hello')
    try {
      const userRole = req.user?.role || 'USER';
      const userId = req.user?.id;

      const month = parseOptionalIntParam(req.query, 'month');
      const year = parseOptionalIntParam(req.query, 'year');

      if (!month || !year) {
        throw new ValidationError('Month and year are required');
      }

      if (month < 1 || month > 12) {
        throw new ValidationError('Month must be between 1 and 12');
      }

      const report = await billingService.getMonthlyFinancialReport(month, year, userRole, userId);

      res.json({
        success: true,
        data: report
      });
  } catch (error) {
    next(error);
  }
};

/**
 * Get yearly financial report
 */
export const getYearlyFinancialReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRole = req.user?.role || 'USER';
      const userId = req.user?.id;

      const year = parseOptionalIntParam(req.query, 'year');

      if (!year) {
        throw new ValidationError('Year is required');
      }

      const report = await billingService.getYearlyFinancialReport(year, userRole, userId);

      res.json({
        success: true,
        data: report
      });
  } catch (error) {
    next(error);
  }
};

/**
 * Export financial data
 */
export const exportFinancialData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRole = req.user?.role || 'USER';
      const userId = req.user?.id;

      const filters: BillingFilters = {};
      
      const roomId = parseOptionalIntParam(req.query, 'roomId');
      if (roomId !== undefined) filters.roomId = roomId;
      
      const month = parseOptionalIntParam(req.query, 'month');
      if (month !== undefined) filters.month = month;
      
      const year = parseOptionalIntParam(req.query, 'year');
      if (year !== undefined) filters.year = year;
      
      if (req.query['paymentStatus']) {
        const status = req.query['paymentStatus'] as string;
        if (status && Object.values(PaymentStatus).includes(status as PaymentStatus)) {
          filters.paymentStatus = status as PaymentStatus;
        }
      }
      
      const floor = parseOptionalIntParam(req.query, 'floor');
      if (floor !== undefined) filters.floor = floor;

      const csvData = await billingService.exportFinancialData(filters, userRole, userId);

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="financial-report.csv"');

      res.send(csvData);
  } catch (error) {
    next(error);
  }
};

/**
 * Get yearly trend data for financial dashboard
 */
export const getYearlyTrendData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userRole = req.user?.role || 'USER';
    const userId = req.user?.id;

    const year = parseOptionalIntParam(req.query, 'year') || new Date().getFullYear();

    const trendData = await billingService.getYearlyTrendData(year, userRole, userId);

    res.json({
      success: true,
      data: trendData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment status
 */
export const getBillingStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getStringParam(req.params, 'id');

    if (!id) {
      throw new ValidationError('Billing record ID is required');
    }

    const billingStatus = await billingService.getBillingStatus(id);

    if (!billingStatus) {
      throw new AppError('Billing record not found', 404);
    }

    res.json({
      success: true,
      data: billingStatus
    });
  } catch (error) {
    next(error);
  }
};