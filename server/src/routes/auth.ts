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
      roomAssignments: {
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
      roomAssignments: user.roomAssignments.map(assignment => ({
        roomId: assignment.room.id,
        roomNumber: assignment.room.roomNumber,
        floor: assignment.room.floor,
        assignedAt: assignment.assignedAt,
      })),
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
        roomAssignments: {
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
      roomAssignments: user.roomAssignments.map(assignment => ({
        roomId: assignment.room.id,
        roomNumber: assignment.room.roomNumber,
        floor: assignment.room.floor,
        assignedAt: assignment.assignedAt,
      })),
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

  // Remove existing assignments
  await prisma.userRoomAssignment.deleteMany({
    where: { userId }
  });

  // Create new assignments
  const assignments = await prisma.userRoomAssignment.createMany({
    data: roomIds.map((roomId: number) => ({
      userId,
      roomId,
    })),
  });

  res.json({
    success: true,
    message: 'Room assignments updated successfully',
    data: {
      userId,
      assignedRooms: roomIds,
      assignmentCount: assignments.count,
    },
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

  const assignment = await prisma.userRoomAssignment.findUnique({
    where: {
      userId_roomId: {
        userId,
        roomId: roomIdNum,
      }
    }
  });

  if (!assignment) {
    throw new NotFoundError('Room assignment not found');
  }

  await prisma.userRoomAssignment.delete({
    where: {
      userId_roomId: {
        userId,
        roomId: roomIdNum,
      }
    }
  });

  res.json({
    success: true,
    message: 'Room assignment removed successfully',
  });
}));

export default router;