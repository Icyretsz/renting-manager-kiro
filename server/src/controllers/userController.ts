import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService';
import { AppError } from '../utils/errors';
import { parseIntParam, getStringParam } from '../utils/paramHelpers';

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
 * Get current user profile
 * GET /api/users/profile
 */
export const getCurrentUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const user = await userService.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: user,
      message: 'User profile retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users (admin only)
 * GET /api/users
 */
export const getAllUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Admin access required', 403);
    }

    const users = await userService.getAllUsers();

    res.json({
      success: true,
      data: users,
      message: 'Users retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID (admin only)
 * GET /api/users/:id
 */
export const getUserById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Admin access required', 403);
    }

    const userId = getStringParam(req.params, 'id', 'User ID is required');
    const user = await userService.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: user,
      message: 'User retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/users/profile
 */
export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { name, email } = req.body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;

    const user = await userService.updateUser(userId, updateData);

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user role (admin only)
 * PUT /api/users/:id/role
 */
export const updateUserRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Admin access required', 403);
    }

    const userId = getStringParam(req.params, 'id', 'User ID is required');
    const { role } = req.body;

    if (!role || !['ADMIN', 'USER'].includes(role)) {
      throw new AppError('Valid role (ADMIN or USER) is required', 400);
    }

    // Prevent admin from changing their own role
    if (userId === req.user?.id) {
      throw new AppError('Cannot change your own role', 400);
    }

    const user = await userService.updateUserRole(userId, role);

    res.json({
      success: true,
      data: user,
      message: 'User role updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user tenant room (if user is a tenant)
 * GET /api/users/:id/tenant-room
 */
export const getUserTenantRoom = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const targetUserId = getStringParam(req.params, 'id', 'User ID is required');
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;

    // Users can only view their own tenant room, admins can view any
    if (currentUserRole !== 'ADMIN' && targetUserId !== currentUserId) {
      throw new AppError('Access denied', 403);
    }

    const tenantRoom = await userService.getUserTenantRoom(targetUserId);

    res.json({
      success: true,
      data: tenantRoom,
      message: tenantRoom ? 'User tenant room retrieved successfully' : 'User is not a tenant'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign user to rooms (admin only)
 * POST /api/users/:id/rooms
 */
export const assignUserToRooms = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Admin access required', 403);
    }

    // Room assignment functionality removed - admin uses tenant linking system
    res.status(410).json({
      success: false,
      message: 'Room assignment endpoints removed - use tenant linking system'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add single room assignment (admin only)
 * POST /api/users/:id/rooms/:roomId
 */
export const addRoomAssignment = async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Admin access required', 403);
    }

    // Room assignment functions removed - admin uses tenant linking system
    throw new AppError('Room assignment endpoints removed - use tenant linking system', 410);
  } catch (error) {
    next(error);
  }
};

// Room assignment functions removed - admin uses tenant linking system
export const removeRoomAssignment = async (_req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    throw new AppError('Room assignment endpoints removed - use tenant linking system', 410);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user statistics (admin only)
 * GET /api/users/stats
 */
export const getUserStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Admin access required', 403);
    }

    const stats = await userService.getUserStats();

    res.json({
      success: true,
      data: stats,
      message: 'User statistics retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get users by role (admin only)
 * GET /api/users/role/:role
 */
export const getUsersByRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Admin access required', 403);
    }

    const role = req.params['role'] as 'ADMIN' | 'USER';
    if (!['ADMIN', 'USER'].includes(role)) {
      throw new AppError('Invalid role. Must be ADMIN or USER', 400);
    }

    const users = await userService.getUsersByRole(role);

    res.json({
      success: true,
      data: users,
      message: `${role} users retrieved successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check room access
 * GET /api/users/access/room/:roomId
 */
export const checkRoomAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const roomId = parseIntParam(req.params, 'roomId', 'Room ID is required');

    const hasAccess = await userService.hasRoomAccess(userId, roomId);

    res.json({
      success: true,
      data: { hasAccess },
      message: 'Room access checked successfully'
    });
  } catch (error) {
    next(error);
  }
};