import express, { Request, Response } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ValidationError, NotFoundError } from '../utils/errors';
import prisma from '../config/database';

const router = express.Router();

/**
 * Get current user profile
 * GET /api/auth/profile
 */
router.get('/profile', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      tenant: {
        include: {
          room: {
            select: {
              id: true,
              roomNumber: true,
              floor: true,
            }
          }
        }
      }
    }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      auth0Id: user.auth0Id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      tenantRoom: user.tenant ? {
        roomId: user.tenant.room.id,
        roomNumber: user.tenant.room.roomNumber,
        floor: user.tenant.room.floor,
        moveInDate: user.tenant.moveInDate,
      } : null,
    },
  });
}));

/**
 * Check if user is linked to a tenant
 * GET /api/auth/tenant-status
 */
router.get('/tenant-status', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      tenant: {
        where: { isActive: true },
        select: {
          id: true,
          roomId: true,
          room: {
            select: {
              roomNumber: true,
              floor: true,
            }
          }
        }
      }
    }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const isLinked = !!user.tenant;

  res.json({
    success: true,
    data: {
      isLinked,
      tenant: user.tenant ? {
        id: user.tenant.id,
        roomId: user.tenant.roomId,
        roomNumber: user.tenant.room.roomNumber,
        floor: user.tenant.room.floor,
      } : null,
    },
  });
}));

/**
 * Update user profile
 * PUT /api/auth/profile
 */
router.put('/profile', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name || name.trim().length === 0) {
    throw new ValidationError('Name is required');
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user!.id },
    data: { name: name.trim() },
    select: {
      id: true,
      auth0Id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    }
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedUser,
  });
}));

/**
 * Get all users (admin only)
 * GET /api/auth/users
 */
router.get('/users', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, role, search } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  
  if (role && (role === 'ADMIN' || role === 'USER')) {
    where.role = role;
  }

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        tenant: {
          include: {
            room: {
              select: {
                id: true,
                roomNumber: true,
                floor: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    data: users.map(user => ({
      id: user.id,
      auth0Id: user.auth0Id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      tenantRoom: user.tenant ? {
        roomId: user.tenant.room.id,
        roomNumber: user.tenant.room.roomNumber,
        floor: user.tenant.room.floor,
        moveInDate: user.tenant.moveInDate,
      } : null,
    })),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
}));

/**
 * Assign user to rooms (admin only)
 * POST /api/auth/users/:userId/rooms
 */
router.post('/users/:userId/rooms', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { roomIds } = req.body;

  if (!Array.isArray(roomIds) || roomIds.length === 0) {
    throw new ValidationError('Room IDs array is required');
  }

  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Verify all rooms exist
  const rooms = await prisma.room.findMany({
    where: { id: { in: roomIds } }
  });

  if (rooms.length !== roomIds.length) {
    throw new ValidationError('One or more rooms not found');
  }

  // Room assignment functionality removed - admin uses tenant linking system
  res.status(410).json({
    success: false,
    message: 'Room assignment endpoints removed - use tenant linking system',
    data: null
  });
}));

/**
 * Remove user from room (admin only)
 * DELETE /api/auth/users/:userId/rooms/:roomId
 */
router.delete('/users/:userId/rooms/:roomId', authenticate, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { userId, roomId } = req.params;

  if (!userId || !roomId) {
    throw new ValidationError('User ID and Room ID are required');
  }

  const roomIdNum = parseInt(roomId);
  if (isNaN(roomIdNum)) {
    throw new ValidationError('Invalid room ID');
  }

  // Room assignment functionality removed - admin uses tenant linking system
  res.status(410).json({
    success: false,
    message: 'Room assignment endpoints removed - use tenant linking system',
  });
}));

export default router;