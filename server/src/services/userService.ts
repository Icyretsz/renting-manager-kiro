import prisma from '../config/database';
import { DatabaseError, NotFoundError } from '../utils/errors';

export interface CreateUserData {
  auth0Id: string;
  email: string;
  name: string;
  role?: 'ADMIN' | 'USER';
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  role?: 'ADMIN' | 'USER';
}

/**
 * Find user by Auth0 ID
 */
export const findByAuth0Id = async (auth0Id: string) => {
  try {
    return await prisma.user.findUnique({
      where: { auth0Id },
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
  } catch (error) {
    throw new DatabaseError('Failed to find user');
  }
};

/**
 * Find user by ID
 */
export const findById = async (userId: string) => {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: {
          include: {
            room: {
              select: {
                id: true,
                roomNumber: true,
                floor: true,
                baseRent: true,
              }
            }
          }
        }
      }
    });
  } catch (error) {
    throw new DatabaseError('Failed to find user');
  }
};

/**
 * Get all users (admin only)
 */
export const getAllUsers = async () => {
  try {
    return await prisma.user.findMany({
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
      orderBy: [
        { role: 'asc' },
        { name: 'asc' }
      ]
    });
  } catch (error) {
    throw new DatabaseError('Failed to get users');
  }
};

/**
 * Create new user
 */
export const createUser = async (userData: CreateUserData) => {
  try {
    return await prisma.user.create({
      data: {
        auth0Id: userData.auth0Id,
        email: userData.email,
        name: userData.name,
        role: userData.role || 'USER',
      },
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
  } catch (error) {
    throw new DatabaseError('Failed to create user');
  }
};

/**
 * Update user information
 */
export const updateUser = async (userId: string, userData: UpdateUserData) => {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: userData,
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
  } catch (error) {
    throw new DatabaseError('Failed to update user');
  }
};

/**
 * Sync user with Auth0 profile
 */
export const syncWithAuth0 = async (auth0Profile: any) => {
  const auth0Id = auth0Profile.sub;
  const email = auth0Profile.email;
  const name = auth0Profile.name || auth0Profile.nickname || email;
  const roles = auth0Profile['https://rental-app.com/roles'] || [];
  const role = roles.includes('admin') ? 'ADMIN' : 'USER';

  try {
    // Try to find existing user
    let user = await findByAuth0Id(auth0Id);

    if (!user) {
      // Create new user
      user = await createUser({
        auth0Id,
        email,
        name,
        role,
      });
    } else {
      // Update existing user if data has changed
      const needsUpdate = 
        user.email !== email || 
        user.name !== name ||
        user.role !== role;

      if (needsUpdate) {
        user = await updateUser(user.id, {
          email,
          name,
          role,
        });
      }
    }

    return user;
  } catch (error) {
    throw new DatabaseError('Failed to sync user with Auth0');
  }
};

// Room assignment functions removed - users now access rooms through tenant relationship
// Admin uses tenant linking system to manage user-room access

/**
 * Get user's tenant room (if user is a tenant)
 */
export const getUserTenantRoom = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: {
          include: {
            room: {
              select: {
                id: true,
                roomNumber: true,
                floor: true,
                baseRent: true,
              }
            }
          }
        }
      }
    });

    if (!user?.tenant) {
      return null; // User is not a tenant
    }

    return {
      roomId: user.tenant.room.id,
      roomNumber: user.tenant.room.roomNumber,
      floor: user.tenant.room.floor,
      baseRent: user.tenant.room.baseRent,
      moveInDate: user.tenant.moveInDate,
    };
  } catch (error) {
    throw new DatabaseError('Failed to get user tenant room');
  }
};

// Removed - users access rooms through tenant relationship

// Removed - users access rooms through tenant relationship

/**
 * Check if user has access to a specific room (updated for tenant relationship)
 */
export const hasRoomAccess = async (userId: string, roomId: number): Promise<boolean> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: {
          select: { roomId: true }
        }
      }
    });

    if (!user) {
      return false;
    }

    // Admin users have access to all rooms
    if (user.role === 'ADMIN') {
      return true;
    }

    // Regular users only have access to their tenant room
    return user.tenant?.roomId === roomId;
  } catch (error) {
    return false;
  }
};

/**
 * Get user statistics (admin only) - updated for tenant relationship
 */
export const getUserStats = async () => {
  try {
    const totalUsers = await prisma.user.count();
    const adminUsers = await prisma.user.count({
      where: { role: 'ADMIN' }
    });
    const regularUsers = totalUsers - adminUsers;

    const usersWithTenantRooms = await prisma.user.count({
      where: {
        tenant: {
          isNot: null
        }
      }
    });

    const usersWithoutTenantRooms = totalUsers - usersWithTenantRooms;

    return {
      totalUsers,
      adminUsers,
      regularUsers,
      usersWithTenantRooms,
      usersWithoutTenantRooms
    };
  } catch (error) {
    throw new DatabaseError('Failed to get user statistics');
  }
};

/**
 * Update user role (admin only)
 */
export const updateUserRole = async (userId: string, role: 'ADMIN' | 'USER') => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
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

    return updatedUser;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to update user role');
  }
};

/**
 * Get users by role
 */
export const getUsersByRole = async (role: 'ADMIN' | 'USER') => {
  try {
    return await prisma.user.findMany({
      where: { role },
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
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    throw new DatabaseError('Failed to get users by role');
  }
};