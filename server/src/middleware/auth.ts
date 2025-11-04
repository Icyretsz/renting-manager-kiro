import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/auth0';
import { fetchUserInfo, Auth0UserInfo } from '../utils/auth0APIUltils';
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
        roomId?: number; // The room this user is a tenant of (if any)
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
    await verifyToken(token);
    
    // Fetch user info from Auth0 API
    const auth0UserInfo: Auth0UserInfo = await fetchUserInfo(token);

    // Extract user information from Auth0 API response
    const userInfo = {
      auth0Id: auth0UserInfo.sub,
      email: auth0UserInfo.email,
      name: auth0UserInfo.name || auth0UserInfo.nickname || auth0UserInfo.email,
      roles: auth0UserInfo.roleType || [],
    };

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { auth0Id: userInfo.auth0Id },
      include: {
        tenant: {
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
          role: userInfo.roles.includes('ADMIN') ? 'ADMIN' : 'USER',
        },
        include: {
          tenant: {
            select: { roomId: true }
          }
        }
      });
    } else {
      // Update user info if it has changed
      const needsUpdate = 
        user.email !== userInfo.email || 
        user.name !== userInfo.name

      if (needsUpdate) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            email: userInfo.email,
            name: userInfo.name,
          },
          include: {
            tenant: {
              select: { roomId: true }
            }
          }
        });
      }
    }

    // Attach user to request
    const userObj: any = {
      id: user.id,
      auth0Id: user.auth0Id,
      email: user.email,
      name: user.name,
      role: user.role as 'ADMIN' | 'USER',
    };
    
    // Only add roomId if user is a tenant
    if (user.tenant?.roomId) {
      userObj.roomId = user.tenant.roomId;
    }
    
    req.user = userObj;

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

    // Check if user is a tenant of this room
    if (req.user.roomId !== roomId) {
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