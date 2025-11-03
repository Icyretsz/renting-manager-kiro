import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';
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

export class UserController {
  /**
   * Get current user profile
   * GET /api/users/profile
   */
  async getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const user = await UserService.findById(userId);
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
  }

  /**
   * Get all users (admin only)
   * GET /api/users
   */
  async getAllUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        throw new AppError('Admin access required', 403);
      }

      const users = await UserService.getAllUsers();

      res.json({
        success: true,
        data: users,
        message: 'Users retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID (admin only)
   * GET /api/users/:id
   */
  async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        throw new AppError('Admin access required', 403);
      }

      const userId = getStringParam(req.params, 'id', 'User ID is required');
      const user = await UserService.findById(userId);

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
  }

  /**
   * Update user profile
   * PUT /api/users/profile
   */
  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { name, email } = req.body;
      const updateData: any = {};

      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;

      const user = await UserService.updateUser(userId, updateData);

      res.json({
        success: true,
        data: user,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user role (admin only)
   * PUT /api/users/:id/role
   */
  async updateUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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

      const user = await UserService.updateUserRole(userId, role);

      res.json({
        success: true,
        data: user,
        message: 'User role updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user room assignments
   * GET /api/users/:id/rooms
   */
  async getUserRoomAssignments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const targetUserId = getStringParam(req.params, 'id', 'User ID is required');
      const currentUserId = req.user?.id;
      const currentUserRole = req.user?.role;

      // Users can only view their own assignments, admins can view any
      if (currentUserRole !== 'ADMIN' && targetUserId !== currentUserId) {
        throw new AppError('Access denied', 403);
      }

      const assignments = await UserService.getUserRoomAssignments(targetUserId);

      res.json({
        success: true,
        data: assignments,
        message: 'Room assignments retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign user to rooms (admin only)
   * POST /api/users/:id/rooms
   */
  async assignUserToRooms(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        throw new AppError('Admin access required', 403);
      }

      const userId = getStringParam(req.params, 'id', 'User ID is required');
      const { roomIds } = req.body;

      if (!Array.isArray(roomIds) || roomIds.length === 0) {
        throw new AppError('Room IDs array is required', 400);
      }

      // Validate all room IDs are numbers
      const validRoomIds = roomIds.filter(id => Number.isInteger(id) && id > 0);
      if (validRoomIds.length !== roomIds.length) {
        throw new AppError('All room IDs must be positive integers', 400);
      }

      await UserService.assignUserToRooms(userId, validRoomIds);

      res.json({
        success: true,
        message: 'User assigned to rooms successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add single room assignment (admin only)
   * POST /api/users/:id/rooms/:roomId
   */
  async addRoomAssignment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        throw new AppError('Admin access required', 403);
      }

      const userId = getStringParam(req.params, 'id', 'User ID is required');
      const roomId = parseIntParam(req.params, 'roomId', 'Room ID is required');

      const assignment = await UserService.addUserRoomAssignment(userId, roomId);

      res.json({
        success: true,
        data: assignment,
        message: 'Room assignment added successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove room assignment (admin only)
   * DELETE /api/users/:id/rooms/:roomId
   */
  async removeRoomAssignment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        throw new AppError('Admin access required', 403);
      }

      const userId = getStringParam(req.params, 'id', 'User ID is required');
      const roomId = parseIntParam(req.params, 'roomId', 'Room ID is required');

      await UserService.removeUserRoomAssignment(userId, roomId);

      res.json({
        success: true,
        message: 'Room assignment removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user statistics (admin only)
   * GET /api/users/stats
   */
  async getUserStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        throw new AppError('Admin access required', 403);
      }

      const stats = await UserService.getUserStats();

      res.json({
        success: true,
        data: stats,
        message: 'User statistics retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get users by role (admin only)
   * GET /api/users/role/:role
   */
  async getUsersByRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        throw new AppError('Admin access required', 403);
      }

      const role = req.params['role'] as 'ADMIN' | 'USER';
      if (!['ADMIN', 'USER'].includes(role)) {
        throw new AppError('Invalid role. Must be ADMIN or USER', 400);
      }

      const users = await UserService.getUsersByRole(role);

      res.json({
        success: true,
        data: users,
        message: `${role} users retrieved successfully`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check room access
   * GET /api/users/access/room/:roomId
   */
  async checkRoomAccess(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const roomId = parseIntParam(req.params, 'roomId', 'Room ID is required');

      const hasAccess = await UserService.hasRoomAccess(userId, roomId);

      res.json({
        success: true,
        data: { hasAccess },
        message: 'Room access checked successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();