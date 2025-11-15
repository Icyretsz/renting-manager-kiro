import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

/**
 * Middleware to check if user has ADMIN role
 */
export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    if (req.user.role !== 'ADMIN') {
      throw new AppError('Access denied. Admin role required.', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has USER role
 */
export const requireUser = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    if (req.user.role !== 'USER') {
      throw new AppError('Access denied. User role required.', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};
