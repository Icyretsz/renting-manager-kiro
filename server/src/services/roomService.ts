import { prisma } from '../config/database';
import { Room, Tenant, UserRoomAssignment } from '@prisma/client';
import { AppError, ValidationError } from '../utils/errors';

export interface RoomWithDetails extends Room {
  tenants: Tenant[];
  occupancyCount: number;
  userAssignments?: UserRoomAssignment[];
}

export interface CreateRoomData {
  roomNumber: number;
  floor: number;
  baseRent?: number;
  maxTenants?: number;
}

export interface UpdateRoomData {
  baseRent?: number;
  maxTenants?: number;
}

/**
 * Get all rooms with tenant information
 * @param userRole - User role for filtering
 * @param userId - User ID for filtering (regular users only see assigned rooms)
 */
export const getAllRooms = async (userRole: string, userId?: string): Promise<RoomWithDetails[]> => {
  const whereClause = userRole === 'USER' && userId 
    ? {
        userAssignments: {
          some: {
            userId: userId
          }
        }
      }
    : {};

  const rooms = await prisma.room.findMany({
    where: whereClause,
    include: {
      tenants: {
        where: {
          isActive: true
        },
        orderBy: {
          name: 'asc'
        }
      },
      ...(userRole === 'ADMIN' ? {
        userAssignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      } : {}),
      _count: {
        select: {
          tenants: {
            where: {
              isActive: true
            }
          }
        }
      }
    },
    orderBy: {
      roomNumber: 'asc'
    }
  });

  return rooms.map(room => ({
    ...room,
    occupancyCount: room._count.tenants,
    tenants: room.tenants
  }));
};

/**
 * Get room by ID with full details
 */
export const getRoomById = async (id: number, userRole: string, userId?: string): Promise<RoomWithDetails | null> => {
  // Check if user has access to this room
  if (userRole === 'USER' && userId) {
    const hasAccess = await checkUserRoomAccess(userId, id);
    if (!hasAccess) {
      throw new AppError('Access denied to this room', 403);
    }
  }

  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      tenants: {
        where: {
          isActive: true
        },
        orderBy: {
          name: 'asc'
        }
      },
      userAssignments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      },
      _count: {
        select: {
          tenants: {
            where: {
              isActive: true
            }
          }
        }
      }
    }
  });

  if (!room) {
    return null;
  }

  return {
    ...room,
    occupancyCount: room._count.tenants,
    tenants: room.tenants
  };
};

/**
 * Get room by room number
 */
export const getRoomByNumber = async (roomNumber: number): Promise<Room | null> => {
  return await prisma.room.findUnique({
    where: { roomNumber }
  });
};

/**
 * Create a new room (admin only)
 */
export const createRoom = async (data: CreateRoomData): Promise<Room> => {
  // Validate room number range
  if (data.roomNumber < 1 || data.roomNumber > 18) {
    throw new ValidationError('Room number must be between 1 and 18');
  }

  // Validate floor based on room number
  const expectedFloor = data.roomNumber <= 9 ? 1 : 2;
  if (data.floor !== expectedFloor) {
    throw new ValidationError(`Room ${data.roomNumber} should be on floor ${expectedFloor}`);
  }

  // Check if room number already exists
  const existingRoom = await getRoomByNumber(data.roomNumber);
  if (existingRoom) {
    throw new ValidationError(`Room ${data.roomNumber} already exists`);
  }

  return await prisma.room.create({
    data: {
      roomNumber: data.roomNumber,
      floor: data.floor,
      baseRent: data.baseRent || 0,
      maxTenants: data.maxTenants || 4
    }
  });
};

/**
 * Update room information (admin only)
 */
export const updateRoom = async (id: number, data: UpdateRoomData): Promise<Room> => {
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) {
    throw new AppError('Room not found', 404);
  }

  // Validate maxTenants doesn't go below current occupancy
  if (data.maxTenants !== undefined) {
    const currentOccupancy = await prisma.tenant.count({
      where: {
        roomId: id,
        isActive: true
      }
    });

    if (data.maxTenants < currentOccupancy) {
      throw new ValidationError(`Cannot set max tenants below current occupancy (${currentOccupancy})`);
    }
  }

  return await prisma.room.update({
    where: { id },
    data
  });
};

/**
 * Delete room (admin only) - only if no active tenants
 */
export const deleteRoom = async (id: number): Promise<void> => {
  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          tenants: {
            where: {
              isActive: true
            }
          }
        }
      }
    }
  });

  if (!room) {
    throw new AppError('Room not found', 404);
  }

  if (room._count.tenants > 0) {
    throw new ValidationError('Cannot delete room with active tenants');
  }

  await prisma.room.delete({
    where: { id }
  });
};

/**
 * Get rooms by floor
 */
export const getRoomsByFloor = async (floor: number, userRole: string, userId?: string): Promise<RoomWithDetails[]> => {
  const whereClause: any = { floor };
  
  if (userRole === 'USER' && userId) {
    whereClause.userAssignments = {
      some: {
        userId: userId
      }
    };
  }

  const rooms = await prisma.room.findMany({
    where: whereClause,
    include: {
      tenants: {
        where: {
          isActive: true
        },
        orderBy: {
          name: 'asc'
        }
      },
      _count: {
        select: {
          tenants: {
            where: {
              isActive: true
            }
          }
        }
      }
    },
    orderBy: {
      roomNumber: 'asc'
    }
  });

  return rooms.map(room => ({
    ...room,
    occupancyCount: room._count.tenants,
    tenants: room.tenants
  }));
};

/**
 * Check if user has access to a specific room
 */
export const checkUserRoomAccess = async (userId: string, roomId: number): Promise<boolean> => {
  const assignment = await prisma.userRoomAssignment.findUnique({
    where: {
      userId_roomId: {
        userId,
        roomId
      }
    }
  });

  return !!assignment;
};

/**
 * Get room occupancy statistics
 */
export const getRoomOccupancyStats = async (): Promise<{
  totalRooms: number;
  occupiedRooms: number;
  totalTenants: number;
  averageOccupancy: number;
  floorStats: Array<{
    floor: number;
    totalRooms: number;
    occupiedRooms: number;
    totalTenants: number;
  }>;
}> => {
  const rooms = await prisma.room.findMany({
    include: {
      _count: {
        select: {
          tenants: {
            where: {
              isActive: true
            }
          }
        }
      }
    }
  });

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(room => room._count.tenants > 0).length;
  const totalTenants = rooms.reduce((sum, room) => sum + room._count.tenants, 0);
  const averageOccupancy = totalRooms > 0 ? totalTenants / totalRooms : 0;

  // Calculate floor statistics
  const floorStats = [1, 2].map(floor => {
    const floorRooms = rooms.filter(room => room.floor === floor);
    const floorOccupiedRooms = floorRooms.filter(room => room._count.tenants > 0).length;
    const floorTotalTenants = floorRooms.reduce((sum, room) => sum + room._count.tenants, 0);

    return {
      floor,
      totalRooms: floorRooms.length,
      occupiedRooms: floorOccupiedRooms,
      totalTenants: floorTotalTenants
    };
  });

  return {
    totalRooms,
    occupiedRooms,
    totalTenants,
    averageOccupancy: Math.round(averageOccupancy * 100) / 100,
    floorStats
  };
};

/**
 * Initialize the 18 predefined rooms if they don't exist
 */
export const initializeRooms = async (): Promise<void> => {
  const existingRoomsCount = await prisma.room.count();
  
  if (existingRoomsCount === 0) {
    const roomsData = [];
    
    // Create rooms 1-18
    for (let i = 1; i <= 18; i++) {
      roomsData.push({
        roomNumber: i,
        floor: i <= 9 ? 1 : 2,
        baseRent: 0,
        maxTenants: 4
      });
    }

    await prisma.room.createMany({
      data: roomsData
    });

    console.log('Initialized 18 rooms successfully');
  }
};