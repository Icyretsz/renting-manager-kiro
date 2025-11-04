import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { prisma } from '../config/database';

/**
 * Middleware to check if user is linked to a tenant
 * Only applies to regular users (not admins)
 */
export const requireTenantLink = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    
    if (!user) {
      throw new AppError('Authentication required', 401);
    }

    // Admins don't need tenant links
    if (user.role === 'ADMIN') {
      return next();
    }

    // Check if user is linked to an active tenant
    const tenant = await prisma.tenant.findFirst({
      where: {
        userId: user.id,
        isActive: true
      }
    });

    if (!tenant) {
      throw new AppError('User account is not linked to a tenant. Please contact the administrator.', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};