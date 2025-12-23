import { Request, Response, NextFunction } from 'express';
import * as accessControlService from '../services/accessControlService';
import { AppError } from '../utils/errors';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    auth0Id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'USER';
    roomId?: number;
  };
}

/**
 * Middleware to check if user can view a specific reading
 */
export const canViewReading = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const readingId = req.params['id'];
    if (!readingId) {
      throw new AppError('Reading ID is required', 400);
    }

    const access = await accessControlService.checkReadingAccess(
      readingId,
      req.user.id,
      req.user.role
    );

    if (!access.canView) {
      throw new AppError('Access denied to this reading', 403);
    }

    // Attach access info to request for use in controllers
    (req as any).readingAccess = access;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user can edit a specific reading
 */
export const canEditReading = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const readingId = req.params['id'];
    if (!readingId) {
      throw new AppError('Reading ID is required', 400);
    }

    await accessControlService.validateReadingModification(
      readingId,
      req.user.id,
      req.user.role
    );

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user can access a specific room
 */
export const canAccessRoom = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Admin can access all rooms
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    console.log(req.params)

    const roomIdParam = req.params['roomId'] || req.body.roomId;
    if (!roomIdParam) {
      throw new AppError('Room ID is required', 400);
    }

    const roomId = parseInt(roomIdParam);
    if (isNaN(roomId)) {
      throw new AppError('Invalid Room ID', 400);
    }

    const hasAccess = await accessControlService.checkUserRoomAccess(
      req.user.id,
      roomId
    );

    if (!hasAccess) {
      throw new AppError('Access denied to this room', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to ensure only admin users can access
 */
export const requireAdmin = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    if (req.user.role !== 'ADMIN') {
      throw new AppError('Admin access required', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};