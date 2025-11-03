import { prisma } from '../config/database';
import { Tenant, Room } from '@prisma/client';
import { AppError, ValidationError } from '../utils/errors';

export interface TenantWithRoom extends Tenant {
  room: Room;
}

export interface CreateTenantData {
  name: string;
  email?: string;
  phone?: string;
  roomId: number;
  moveInDate?: Date;
}

export interface UpdateTenantData {
  name?: string;
  email?: string;
  phone?: string;
  roomId?: number;
  moveInDate?: Date;
  moveOutDate?: Date;
  isActive?: boolean;
}

export interface TenantFilters {
  roomId?: number;
  isActive?: boolean;
  floor?: number;
  search?: string;
}

/**
 * Check if user has access to a specific room
 */
const checkUserRoomAccess = async (userId: string, roomId: number): Promise<boolean> => {
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
 * Get all tenants with room information
 * @param userRole - User role for filtering
 * @param userId - User ID for filtering (regular users only see tenants in assigned rooms)
 * @param filters - Additional filters
 */
export const getAllTenants = async (
  userRole: string, 
  userId?: string, 
  filters: TenantFilters = {}
): Promise<TenantWithRoom[]> => {
  const whereClause: any = {};

  // Role-based filtering
  if (userRole === 'USER' && userId) {
    whereClause.room = {
      userAssignments: {
        some: {
          userId: userId
        }
      }
    };
  }

  // Apply additional filters
  if (filters.roomId) {
    whereClause.roomId = filters.roomId;
  }

  if (filters.isActive !== undefined) {
    whereClause.isActive = filters.isActive;
  }

  if (filters.floor) {
    whereClause.room = {
      ...whereClause.room,
      floor: filters.floor
    };
  }

  if (filters.search) {
    whereClause.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  const tenants = await prisma.tenant.findMany({
    where: whereClause,
    include: {
      room: true
    },
    orderBy: [
      { room: { roomNumber: 'asc' } },
      { name: 'asc' }
    ]
  });

  return tenants;
};

/**
 * Get tenant by ID
 */
export const getTenantById = async (id: string, userRole: string, userId?: string): Promise<TenantWithRoom | null> => {
  const whereClause: any = { id };

  // Role-based filtering
  if (userRole === 'USER' && userId) {
    whereClause.room = {
      userAssignments: {
        some: {
          userId: userId
        }
      }
    };
  }

  const tenant = await prisma.tenant.findFirst({
    where: whereClause,
    include: {
      room: true
    }
  });

  return tenant;
};

/**
 * Create a new tenant (admin only)
 */
export const createTenant = async (data: CreateTenantData): Promise<TenantWithRoom> => {
  // Validate room exists
  const room = await prisma.room.findUnique({
    where: { id: data.roomId },
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

  // Check room occupancy limit
  if (room._count.tenants >= room.maxTenants) {
    throw new ValidationError(`Room ${room.roomNumber} is at maximum capacity (${room.maxTenants} tenants)`);
  }

  // Validate email uniqueness if provided
  if (data.email) {
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        email: data.email,
        isActive: true
      }
    });

    if (existingTenant) {
      throw new ValidationError('A tenant with this email already exists');
    }
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      roomId: data.roomId,
      moveInDate: data.moveInDate || null,
      isActive: true
    },
    include: {
      room: true
    }
  });

  return tenant;
};

/**
 * Update tenant information (admin only)
 */
export const updateTenant = async (id: string, data: UpdateTenantData): Promise<TenantWithRoom> => {
  const existingTenant = await prisma.tenant.findUnique({
    where: { id },
    include: { room: true }
  });

  if (!existingTenant) {
    throw new AppError('Tenant not found', 404);
  }

  // If changing room, validate new room capacity
  if (data.roomId && data.roomId !== existingTenant.roomId) {
    const newRoom = await prisma.room.findUnique({
      where: { id: data.roomId },
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

    if (!newRoom) {
      throw new AppError('New room not found', 404);
    }

    if (newRoom._count.tenants >= newRoom.maxTenants) {
      throw new ValidationError(`Room ${newRoom.roomNumber} is at maximum capacity (${newRoom.maxTenants} tenants)`);
    }
  }

  // Validate email uniqueness if changing email
  if (data.email && data.email !== existingTenant.email) {
    const existingEmailTenant = await prisma.tenant.findFirst({
      where: {
        email: data.email,
        isActive: true,
        id: { not: id }
      }
    });

    if (existingEmailTenant) {
      throw new ValidationError('A tenant with this email already exists');
    }
  }

  const updatedTenant = await prisma.tenant.update({
    where: { id },
    data,
    include: {
      room: true
    }
  });

  return updatedTenant;
};

/**
 * Move tenant out (set move-out date and deactivate)
 */
export const moveTenantOut = async (id: string, moveOutDate?: Date): Promise<TenantWithRoom> => {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: { room: true }
  });

  if (!tenant) {
    throw new AppError('Tenant not found', 404);
  }

  if (!tenant.isActive) {
    throw new ValidationError('Tenant is already moved out');
  }

  const updatedTenant = await prisma.tenant.update({
    where: { id },
    data: {
      moveOutDate: moveOutDate || new Date(),
      isActive: false
    },
    include: {
      room: true
    }
  });

  return updatedTenant;
};

/**
 * Move tenant back in (reactivate and clear move-out date)
 */
export const moveTenantIn = async (id: string, moveInDate?: Date): Promise<TenantWithRoom> => {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: { 
      room: {
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
      }
    }
  });

  if (!tenant) {
    throw new AppError('Tenant not found', 404);
  }

  if (tenant.isActive) {
    throw new ValidationError('Tenant is already active');
  }

  // Check room capacity
  if (tenant.room._count.tenants >= tenant.room.maxTenants) {
    throw new ValidationError(`Room ${tenant.room.roomNumber} is at maximum capacity (${tenant.room.maxTenants} tenants)`);
  }

  const updatedTenant = await prisma.tenant.update({
    where: { id },
    data: {
      moveInDate: moveInDate || new Date(),
      moveOutDate: null,
      isActive: true
    },
    include: {
      room: true
    }
  });

  return updatedTenant;
};

/**
 * Delete tenant permanently (admin only) - only if no associated data
 */
export const deleteTenant = async (id: string): Promise<void> => {
  const tenant = await prisma.tenant.findUnique({
    where: { id }
  });

  if (!tenant) {
    throw new AppError('Tenant not found', 404);
  }

  // For now, we'll allow deletion. Later, when meter readings are implemented,
  // we should check if tenant has any associated readings
  await prisma.tenant.delete({
    where: { id }
  });
};

/**
 * Get tenants by room ID
 */
export const getTenantsByRoom = async (roomId: number, userRole: string, userId?: string): Promise<TenantWithRoom[]> => {
  // Check if user has access to this room
  if (userRole === 'USER' && userId) {
    const hasAccess = await checkUserRoomAccess(userId, roomId);
    if (!hasAccess) {
      throw new AppError('Access denied to this room', 403);
    }
  }

  const tenants = await prisma.tenant.findMany({
    where: {
      roomId,
      isActive: true
    },
    include: {
      room: true
    },
    orderBy: {
      name: 'asc'
    }
  });

  return tenants;
};

/**
 * Get tenant statistics
 */
export const getTenantStats = async (): Promise<{
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  occupancyRate: number;
  floorStats: Array<{
    floor: number;
    totalTenants: number;
    activeTenants: number;
    occupancyRate: number;
  }>;
  roomOccupancyDistribution: Array<{
    occupancyCount: number;
    roomCount: number;
  }>;
}> => {
  const totalTenants = await prisma.tenant.count();
  const activeTenants = await prisma.tenant.count({
    where: { isActive: true }
  });
  const inactiveTenants = totalTenants - activeTenants;

  // Get total room capacity
  const totalCapacity = await prisma.room.aggregate({
    _sum: {
      maxTenants: true
    }
  });

  const occupancyRate = totalCapacity._sum.maxTenants 
    ? (activeTenants / totalCapacity._sum.maxTenants) * 100 
    : 0;

  // Floor statistics
  const floorStats = await Promise.all([1, 2].map(async (floor) => {
    const floorTenants = await prisma.tenant.count({
      where: {
        isActive: true,
        room: {
          floor: floor
        }
      }
    });

    const floorCapacity = await prisma.room.aggregate({
      where: { floor },
      _sum: {
        maxTenants: true
      }
    });

    const floorOccupancyRate = floorCapacity._sum.maxTenants 
      ? (floorTenants / floorCapacity._sum.maxTenants) * 100 
      : 0;

    return {
      floor,
      totalTenants: floorTenants,
      activeTenants: floorTenants,
      occupancyRate: Math.round(floorOccupancyRate * 100) / 100
    };
  }));

  // Room occupancy distribution
  const roomOccupancy = await prisma.room.findMany({
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

  const occupancyDistribution = new Map<number, number>();
  roomOccupancy.forEach(room => {
    const count = room._count.tenants;
    occupancyDistribution.set(count, (occupancyDistribution.get(count) || 0) + 1);
  });

  const roomOccupancyDistribution = Array.from(occupancyDistribution.entries())
    .map(([occupancyCount, roomCount]) => ({ occupancyCount, roomCount }))
    .sort((a, b) => a.occupancyCount - b.occupancyCount);

  return {
    totalTenants,
    activeTenants,
    inactiveTenants,
    occupancyRate: Math.round(occupancyRate * 100) / 100,
    floorStats,
    roomOccupancyDistribution
  };
};

/**
 * Search tenants by name, email, or phone
 */
export const searchTenants = async (
  query: string, 
  userRole: string, 
  userId?: string,
  isActive: boolean = true
): Promise<TenantWithRoom[]> => {
  const whereClause: any = {
    isActive,
    OR: [
      { name: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
      { phone: { contains: query, mode: 'insensitive' } }
    ]
  };

  // Role-based filtering
  if (userRole === 'USER' && userId) {
    whereClause.room = {
      userAssignments: {
        some: {
          userId: userId
        }
      }
    };
  }

  const tenants = await prisma.tenant.findMany({
    where: whereClause,
    include: {
      room: true
    },
    orderBy: [
      { room: { roomNumber: 'asc' } },
      { name: 'asc' }
    ]
  });

  return tenants;
};