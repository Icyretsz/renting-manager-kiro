import { Request, Response, NextFunction } from 'express';
import * as meterReadingService from '../services/meterReadingService';
import { AppError } from '../utils/errors';
import prisma from '../config/database';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    auth0Id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'USER';
    roomAssignments?: number[];
  };
}

/**
 * Create a new meter reading
 */
export const createReading = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { roomId, month, year, waterReading, electricityReading, waterPhotoUrl, electricityPhotoUrl } = req.body;

      const reading = await meterReadingService.createMeterReading({
        roomId: parseInt(roomId),
        month: parseInt(month),
        year: parseInt(year),
        waterReading: parseFloat(waterReading),
        electricityReading: parseFloat(electricityReading),
        waterPhotoUrl,
        electricityPhotoUrl,
        submittedBy: req.user.id
      });

      res.status(201).json({
        success: true,
        data: reading,
        message: 'Meter reading created successfully'
      });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing meter reading
 */
export const updateReading = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { id } = req.params;
      if (!id) {
        throw new AppError('Reading ID is required', 400);
      }
      const { waterReading, electricityReading, waterPhotoUrl, electricityPhotoUrl, baseRent } = req.body;

      const updateData: any = {};
      if (waterReading !== undefined) updateData.waterReading = parseFloat(waterReading);
      if (electricityReading !== undefined) updateData.electricityReading = parseFloat(electricityReading);
      if (waterPhotoUrl !== undefined) updateData.waterPhotoUrl = waterPhotoUrl;
      if (electricityPhotoUrl !== undefined) updateData.electricityPhotoUrl = electricityPhotoUrl;
      if (baseRent !== undefined) updateData.baseRent = parseFloat(baseRent);

      const reading = await meterReadingService.updateMeterReading(id, updateData, req.user.id, req.user.role);

      res.json({
        success: true,
        data: reading,
        message: 'Meter reading updated successfully'
      });
  } catch (error) {
    next(error);
  }
};

/**
 * Get meter reading by ID
 */
export const getReadingById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { id } = req.params;
      if (!id) {
        throw new AppError('Reading ID is required', 400);
      }

      const reading = await meterReadingService.getMeterReadingById(id, req.user.role, req.user.id);

      if (!reading) {
        throw new AppError('Meter reading not found', 404);
      }

      res.json({
        success: true,
        data: reading
      });
  } catch (error) {
    next(error);
  }
};

/**
 * Get meter readings with filters and pagination
 */
export const getReadings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { roomId, month, year, status, submittedBy, page = 1, limit = 10 } = req.query;

      const filters: any = {};
      if (roomId) filters.roomId = parseInt(roomId as string);
      if (month) filters.month = parseInt(month as string);
      if (year) filters.year = parseInt(year as string);
      if (status) filters.status = status as string;
      if (submittedBy) filters.submittedBy = submittedBy as string;

      const result = await meterReadingService.getMeterReadings(
        filters,
        req.user.role,
        req.user.id,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: result.readings,
        pagination: {
          page: result.page,
          limit: parseInt(limit as string),
          total: result.total,
          totalPages: result.totalPages
        }
      });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending readings for admin approval
 */
export const getPendingApprovals = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      if (req.user.role !== 'ADMIN') {
        throw new AppError('Admin access required', 403);
      }

      const readings = await meterReadingService.getPendingReadings();

      res.json({
        success: true,
        data: readings
      });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a meter reading
 */
export const approveReading = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      if (req.user.role !== 'ADMIN') {
        throw new AppError('Admin access required', 403);
      }

      const { id } = req.params;
      if (!id) {
        throw new AppError('Reading ID is required', 400);
      }
      const reading = await meterReadingService.approveReading(id, req.user.id);

      res.json({
        success: true,
        data: reading,
        message: 'Meter reading approved successfully'
      });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a meter reading
 */
export const rejectReading = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      if (req.user.role !== 'ADMIN') {
        throw new AppError('Admin access required', 403);
      }

      const { id } = req.params;
      if (!id) {
        throw new AppError('Reading ID is required', 400);
      }

      const { reason } = req.body;
      const reading = await meterReadingService.rejectReading(id, req.user.id, reason);

      res.json({
        success: true,
        data: reading,
        message: 'Meter reading rejected successfully'
      });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reading history for a specific room
 */
export const getRoomReadingHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { roomId } = req.params;
      if (!roomId) {
        throw new AppError('Room ID is required', 400);
      }
      const readings = await meterReadingService.getRoomReadingHistory(
        parseInt(roomId),
        req.user.role,
        req.user.id
      );

      res.json({
        success: true,
        data: readings
      });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reading history with photo thumbnails for a specific room
 */
export const getRoomReadingHistoryWithThumbnails = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { roomId } = req.params;
      if (!roomId) {
        throw new AppError('Room ID is required', 400);
      }

      const readings = await meterReadingService.getRoomReadingHistoryWithThumbnails(
        parseInt(roomId),
        req.user.role,
        req.user.id
      );

      res.json({
        success: true,
        data: readings
      });
    } catch (error) {
      next(error);
    }
  };

/**
 * Get reading submission status for a specific room and month/year
 */
export const getReadingSubmissionStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { roomId, month, year } = req.query;

    if (!roomId || !month || !year) {
      throw new AppError('Room ID, month, and year are required', 400);
    }

    const status = await meterReadingService.getReadingSubmissionStatus(
      parseInt(roomId as string),
      parseInt(month as string),
      parseInt(year as string),
      req.user.role,
      req.user.id
    );

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get modification history for a specific reading
 */
export const getReadingModificationHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;
    if (!id) {
      throw new AppError('Reading ID is required', 400);
    }

    const modifications = await meterReadingService.getReadingModificationHistory(
      id,
      req.user.role,
      req.user.id
    );

    res.json({
      success: true,
      data: modifications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reading access information for frontend
 */
export const getReadingAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;
    if (!id) {
      throw new AppError('Reading ID is required', 400);
    }

    // Use the access info attached by middleware
    const accessInfo = (req as any).readingAccess;

    res.json({
      success: true,
      data: accessInfo
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate bill amount for a reading (preview)
 */
export const calculateBillAmount = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { roomId, month, year, waterReading, electricityReading } = req.body;

    // Fetch room data to get baseRent
    const room = await prisma.room.findUnique({
      where: { id: parseInt(roomId) },
      select: { baseRent: true }
    });
    
    if (!room) {
      throw new AppError('Room not found', 404);
    }
    
    const baseRent = parseFloat(room.baseRent.toString());

    // Use the service's calculation method directly
    const totalAmount = await meterReadingService.calculateTotalAmount(
      parseInt(roomId),
      parseInt(month),
      parseInt(year),
      parseFloat(waterReading),
      parseFloat(electricityReading),
      baseRent
    );

    // Get previous reading for usage calculation
    const previousReading = await meterReadingService.getPreviousMonthReading(
      parseInt(roomId),
      parseInt(month),
      parseInt(year)
    );

    let waterUsage = parseFloat(waterReading);
    let electricityUsage = parseFloat(electricityReading);

    if (previousReading) {
      waterUsage = Math.max(0, parseFloat(waterReading) - parseFloat(previousReading.waterReading.toString()));
      electricityUsage = Math.max(0, parseFloat(electricityReading) - parseFloat(previousReading.electricityReading.toString()));
    }

    res.json({
      success: true,
      data: {
        totalAmount,
        breakdown: {
          waterUsage,
          electricityUsage,
          waterCost: waterUsage * 22000,
          electricityCost: electricityUsage * 3500,
          baseRent: baseRent,
          trashFee: 52000
        },
        previousReading: previousReading ? {
          waterReading: parseFloat(previousReading.waterReading.toString()),
          electricityReading: parseFloat(previousReading.electricityReading.toString()),
          month: previousReading.month,
          year: previousReading.year
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};