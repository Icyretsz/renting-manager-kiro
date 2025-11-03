import { Request, Response, NextFunction } from 'express';
import { roomService } from '../services/roomService';
import { AppError } from '../utils/errors';
import { parseIntParam } from '../utils/paramHelpers';

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

export class RoomController {
  /**
   * Get all rooms
   * GET /api/rooms
   */
  async getAllRooms(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userRole = req.user?.role || 'USER';
      const userId = req.user?.id;

      const rooms = await roomService.getAllRooms(userRole, userId);

      res.json({
        success: true,
        data: rooms,
        message: 'Rooms retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get room by ID
   * GET /api/rooms/:id
   */
  async getRoomById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const roomId = parseIntParam(req.params, 'id', 'Room ID is required');

      const userRole = req.user?.role || 'USER';
      const userId = req.user?.id;

      const room = await roomService.getRoomById(roomId, userRole, userId);

      if (!room) {
        throw new AppError('Room not found', 404);
      }

      res.json({
        success: true,
        data: room,
        message: 'Room retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new room (admin only)
   * POST /api/rooms
   */
  async createRoom(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        throw new AppError('Admin access required', 403);
      }

      const { roomNumber, floor, baseRent, maxTenants } = req.body;

      if (!roomNumber || !floor) {
        throw new AppError('Room number and floor are required', 400);
      }

      const createData: any = {
        roomNumber: parseInt(roomNumber),
        floor: parseInt(floor)
      };
      
      if (baseRent !== undefined) {
        createData.baseRent = parseFloat(baseRent);
      }
      
      if (maxTenants !== undefined) {
        createData.maxTenants = parseInt(maxTenants);
      }

      const room = await roomService.createRoom(createData);

      res.status(201).json({
        success: true,
        data: room,
        message: 'Room created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update room (admin only)
   * PUT /api/rooms/:id
   */
  async updateRoom(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        throw new AppError('Admin access required', 403);
      }

      const roomId = parseIntParam(req.params, 'id', 'Room ID is required');

      const { baseRent, maxTenants } = req.body;
      const updateData: any = {};

      if (baseRent !== undefined) {
        updateData.baseRent = parseFloat(baseRent);
      }
      if (maxTenants !== undefined) {
        updateData.maxTenants = parseInt(maxTenants);
      }

      const room = await roomService.updateRoom(roomId, updateData);

      res.json({
        success: true,
        data: room,
        message: 'Room updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete room (admin only)
   * DELETE /api/rooms/:id
   */
  async deleteRoom(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        throw new AppError('Admin access required', 403);
      }

      const roomId = parseIntParam(req.params, 'id', 'Room ID is required');

      await roomService.deleteRoom(roomId);

      res.json({
        success: true,
        message: 'Room deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get rooms by floor
   * GET /api/rooms/floor/:floor
   */
  async getRoomsByFloor(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const floor = parseIntParam(req.params, 'floor', 'Floor is required');
      if (floor !== 1 && floor !== 2) {
        throw new AppError('Invalid floor number. Must be 1 or 2', 400);
      }

      const userRole = req.user?.role || 'USER';
      const userId = req.user?.id;

      const rooms = await roomService.getRoomsByFloor(floor, userRole, userId);

      res.json({
        success: true,
        data: rooms,
        message: `Floor ${floor} rooms retrieved successfully`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get room occupancy statistics (admin only)
   * GET /api/rooms/stats/occupancy
   */
  async getOccupancyStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        throw new AppError('Admin access required', 403);
      }

      const stats = await roomService.getRoomOccupancyStats();

      res.json({
        success: true,
        data: stats,
        message: 'Occupancy statistics retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get room tenants
   * GET /api/rooms/:id/tenants
   */
  async getRoomTenants(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const roomId = parseIntParam(req.params, 'id', 'Room ID is required');

      const userRole = req.user?.role || 'USER';
      const userId = req.user?.id;

      const room = await roomService.getRoomById(roomId, userRole, userId);

      if (!room) {
        throw new AppError('Room not found', 404);
      }

      res.json({
        success: true,
        data: room.tenants,
        message: 'Room tenants retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Initialize rooms (development/setup endpoint)
   * POST /api/rooms/initialize
   */
  async initializeRooms(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.role !== 'ADMIN') {
        throw new AppError('Admin access required', 403);
      }

      await roomService.initializeRooms();

      res.json({
        success: true,
        message: 'Rooms initialized successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const roomController = new RoomController();