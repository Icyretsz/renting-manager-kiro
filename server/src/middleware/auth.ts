import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractUserFromToken } from '../config/auth0';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import prisma from '../config/database';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        auth0Id: string;
        email: string;
        name: string;
        role: 'ADMIN' | 'USER';
        roomAssignments?: number[];
      };
    }
  }
}

/**
 * JWT Authentication middleware
 * Verifies the JWT token and attaches user info to request
 */
export const authenticateToken = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Auth0
    const decodedToken = await verifyToken(token);
    const userInfo = extractUserFromToken(decodedToken);

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { auth0Id: userInfo.auth0Id },
      include: {
        roomAssignments: {
          select: { roomId: true }
        }
      }
    });

    if (!user) {
      // Create new user if doesn't exist
      user = await prisma.user.create({
        data: {
          auth0Id: userInfo.auth0Id,
          email: userInfo.email,
          name: userInfo.name,
          role: userInfo.roles.includes('admin') ? 'ADMIN' : 'USER',
        },
        include: {
          roomAssignments: {
            select: { roomId: true }
          }
        }
      });
    } else {
      // Update user info if it has changed
      const needsUpdate = 
        user.email !== userInfo.email || 
        user.name !== userInfo.name ||
        (userInfo.roles.includes('admin') && user.role !== 'ADMIN') ||
        (!userInfo.roles.includes('admin') && user.role !== 'USER');

      if (needsUpdate) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            email: userInfo.email,
            name: userInfo.name,
            role: userInfo.roles.includes('admin') ? 'ADMIN' : 'USER',
          },
          include: {
            roomAssignments: {
              select: { roomId: true }
            }
          }
        });
      }
    }

    // Attach user to request
    req.user = {
      id: user.id,
      auth0Id: user.auth0Id,
      email: user.email,
      name: user.name,
      role: user.role,
      roomAssignments: user.roomAssignments.map(assignment => assignment.roomId),
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorization middleware - requires admin role
 */
export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AuthenticationError('Authentication required'));
  }

  if (req.user.role !== 'ADMIN') {
    return next(new AuthorizationError('Admin access required'));
  }

  next();
};

/**
 * Authorization middleware - requires user to be admin or have access to specific room
 */
export const requireRoomAccess = (roomIdParam: string = 'roomId') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    // Admin has access to all rooms
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // Check if user has access to the specific room
    const roomId = parseInt(req.params[roomIdParam] || req.body[roomIdParam]);
    if (!roomId) {
      return next(new AuthorizationError('Room ID required'));
    }

    if (!req.user.roomAssignments?.includes(roomId)) {
      return next(new AuthorizationError('Access denied for this room'));
    }

    next();
  };
};

/**
 * Authorization middleware - requires user to be admin or regular user
 */
export const requireUser = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AuthenticationError('Authentication required'));
  }

  // Both admin and regular users are allowed
  if (req.user.role === 'ADMIN' || req.user.role === 'USER') {
    return next();
  }

  next(new AuthorizationError('User access required'));
};

/**
 * Optional authentication - doesn't throw error if no token
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      await authenticateToken(req, res, next);
    } else {
      next();
    }
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

// Alias for backward compatibility
export const authenticate = authenticateToken;