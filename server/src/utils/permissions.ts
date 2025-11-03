import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';
import { AppError } from './errors';

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
 * Permission validation utilities
 */
export class PermissionValidator {
  /**
   * Require admin role
   */
  static requireAdmin() {
    return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
      if (req.user?.role !== 'ADMIN') {
        return next(new AppError('Admin access required', 403));
      }
      next();
    };
  }

  /**
   * Require user to be authenticated
   */
  static requireAuth() {
    return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
      if (!req.user?.id) {
        return next(new AppError('Authentication required', 401));
      }
      next();
    };
  }

  /**
   * Require user to have access to a specific room
   * Room ID should be in req.params.roomId or req.body.roomId
   */
  static requireRoomAccess() {
    return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return next(new AppError('Authentication required', 401));
        }

        // Admin users have access to all rooms
        if (req.user?.role === 'ADMIN') {
          return next();
        }

        // Get room ID from params or body
        const roomId = req.params['roomId'] || req.body.roomId;
        if (!roomId) {
          return next(new AppError('Room ID is required', 400));
        }

        const roomIdNum = parseInt(roomId);
        if (isNaN(roomIdNum)) {
          return next(new AppError('Invalid room ID', 400));
        }

        const hasAccess = await UserService.hasRoomAccess(userId, roomIdNum);
        if (!hasAccess) {
          return next(new AppError('Access denied to this room', 403));
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Require user to own the resource or be admin
   * User ID should be in req.params.id or req.params.userId
   */
  static requireOwnershipOrAdmin() {
    return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
      const currentUserId = req.user?.id;
      const currentUserRole = req.user?.role;
      
      if (!currentUserId) {
        return next(new AppError('Authentication required', 401));
      }

      // Admin users can access any resource
      if (currentUserRole === 'ADMIN') {
        return next();
      }

      // Get target user ID from params
      const targetUserId = req.params['id'] || req.params['userId'];
      if (!targetUserId) {
        return next(new AppError('User ID is required', 400));
      }

      // Users can only access their own resources
      if (currentUserId !== targetUserId) {
        return next(new AppError('Access denied', 403));
      }

      next();
    };
  }

  /**
   * Check if user has specific role
   */
  static requireRole(role: 'ADMIN' | 'USER') {
    return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
      if (req.user?.role !== role) {
        return next(new AppError(`${role} role required`, 403));
      }
      next();
    };
  }

  /**
   * Check if user has any of the specified roles
   */
  static requireAnyRole(roles: ('ADMIN' | 'USER')[]) {
    return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
      if (!req.user?.role || !roles.includes(req.user.role as 'ADMIN' | 'USER')) {
        return next(new AppError(`One of the following roles required: ${roles.join(', ')}`, 403));
      }
      next();
    };
  }

  /**
   * Validate room access for multiple rooms
   * Room IDs should be in req.body.roomIds
   */
  static requireMultipleRoomAccess() {
    return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return next(new AppError('Authentication required', 401));
        }

        // Admin users have access to all rooms
        if (req.user?.role === 'ADMIN') {
          return next();
        }

        const roomIds = req.body.roomIds;
        if (!Array.isArray(roomIds) || roomIds.length === 0) {
          return next(new AppError('Room IDs array is required', 400));
        }

        // Check access for each room
        for (const roomId of roomIds) {
          const roomIdNum = parseInt(roomId);
          if (isNaN(roomIdNum)) {
            return next(new AppError('Invalid room ID in array', 400));
          }

          const hasAccess = await UserService.hasRoomAccess(userId, roomIdNum);
          if (!hasAccess) {
            return next(new AppError(`Access denied to room ${roomIdNum}`, 403));
          }
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

/**
 * Helper functions for permission checking
 */
export class PermissionHelper {
  /**
   * Check if user is admin
   */
  static isAdmin(userRole: string): boolean {
    return userRole === 'ADMIN';
  }

  /**
   * Check if user is regular user
   */
  static isUser(userRole: string): boolean {
    return userRole === 'USER';
  }

  /**
   * Check if user can access resource
   */
  static canAccessResource(currentUserId: string, resourceUserId: string, userRole: string): boolean {
    return this.isAdmin(userRole) || currentUserId === resourceUserId;
  }

  /**
   * Filter data based on user role and permissions
   */
  static filterDataByRole<T extends { userId?: string }>(
    data: T[], 
    currentUserId: string, 
    userRole: string
  ): T[] {
    if (this.isAdmin(userRole)) {
      return data;
    }

    return data.filter(item => item.userId === currentUserId);
  }

  /**
   * Get accessible room IDs for user
   */
  static async getAccessibleRoomIds(userId: string, userRole: string): Promise<number[]> {
    if (this.isAdmin(userRole)) {
      // Admin can access all rooms - return all room IDs
      const { prisma } = await import('../config/database');
      const rooms = await prisma.room.findMany({
        select: { id: true }
      });
      return rooms.map(room => room.id);
    }

    // Regular users can only access assigned rooms
    const assignments = await UserService.getUserRoomAssignments(userId);
    return assignments.map(assignment => assignment.roomId);
  }
}

// Export middleware functions for easier use
export const requireAdmin = PermissionValidator.requireAdmin();
export const requireAuth = PermissionValidator.requireAuth();
export const requireRoomAccess = PermissionValidator.requireRoomAccess();
export const requireOwnershipOrAdmin = PermissionValidator.requireOwnershipOrAdmin();