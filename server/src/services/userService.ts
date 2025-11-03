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
        roomAssignments: {
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

/**
 * Assign user to rooms
 */
export const assignUserToRooms = async (userId: string, roomIds: number[]) => {
  try {
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
      throw new NotFoundError('One or more rooms not found');
    }

    // Remove existing assignments
    await prisma.userRoomAssignment.deleteMany({
      where: { userId }
    });

    // Create new assignments
    const assignments = await prisma.userRoomAssignment.createMany({
      data: roomIds.map(roomId => ({
        userId,
        roomId,
      })),
    });

    return assignments;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to assign user to rooms');
  }
};

/**
 * Get user's room assignments
 */
export const getUserRoomAssignments = async (userId: string) => {
  try {
    const assignments = await prisma.userRoomAssignment.findMany({
      where: { userId },
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
    });

    return assignments.map(assignment => ({
      roomId: assignment.room.id,
      roomNumber: assignment.room.roomNumber,
      floor: assignment.room.floor,
      baseRent: assignment.room.baseRent,
      assignedAt: assignment.assignedAt,
    }));
  } catch (error) {
    throw new DatabaseError('Failed to get user room assignments');
  }
};

/**
 * Remove user room assignment
 */
export const removeUserRoomAssignment = async (userId: string, roomId: number) => {
  try {
    const assignment = await prisma.userRoomAssignment.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId
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
          roomId
        }
      }
    });

    return true;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to remove room assignment');
  }
};

/**
 * Add single room assignment to user
 */
export const addUserRoomAssignment = async (userId: string, roomId: number) => {
  try {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.userRoomAssignment.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId
        }
      }
    });

    if (existingAssignment) {
      return existingAssignment;
    }

    // Create new assignment
    const assignment = await prisma.userRoomAssignment.create({
      data: {
        userId,
        roomId
      },
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
    });

    return assignment;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to add room assignment');
  }
};

/**
 * Check if user has access to a specific room
 */
export const hasRoomAccess = async (userId: string, roomId: number): Promise<boolean> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return false;
    }

    // Admin users have access to all rooms
    if (user.role === 'ADMIN') {
      return true;
    }

    // Regular users only have access to assigned rooms
    const assignment = await prisma.userRoomAssignment.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId
        }
      }
    });

    return !!assignment;
  } catch (error) {
    return false;
  }
};

/**
 * Get user statistics (admin only)
 */
export const getUserStats = async () => {
  try {
    const totalUsers = await prisma.user.count();
    const adminUsers = await prisma.user.count({
      where: { role: 'ADMIN' }
    });
    const regularUsers = totalUsers - adminUsers;

    const usersWithRoomAssignments = await prisma.user.count({
      where: {
        roomAssignments: {
          some: {}
        }
      }
    });

    const usersWithoutRoomAssignments = totalUsers - usersWithRoomAssignments;

    return {
      totalUsers,
      adminUsers,
      regularUsers,
      usersWithRoomAssignments,
      usersWithoutRoomAssignments
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
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    throw new DatabaseError('Failed to get users by role');
  }
};