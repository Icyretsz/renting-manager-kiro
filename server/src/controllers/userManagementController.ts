import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError, ValidationError } from '../utils/errors';
import { getStringParam, parseOptionalIntParam } from '../utils/paramHelpers';
import { Role } from '@prisma/client';

/**
 * Get all users with pagination and filtering
 */
export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseOptionalIntParam(req.query, 'page') || 1;
    const limit = Math.min(parseOptionalIntParam(req.query, 'limit') || 10, 100);
    const search = req.query['search'] as string;
    const role = req.query['role'] as Role;

    const whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (role && Object.values(Role).includes(role)) {
      whereClause.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              roomId: true,
              isActive: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.user.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getStringParam(req.params, 'id');

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            roomId: true,
            isActive: true,
            moveInDate: true,
            moveOutDate: true
          }
        }
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new user
 */
export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { auth0Id, email, name, role } = req.body;

    if (!auth0Id || !email || !name || !role) {
      throw new ValidationError('All fields are required: auth0Id, email, name, role');
    }

    if (!Object.values(Role).includes(role)) {
      throw new ValidationError('Invalid role');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { auth0Id },
          { email }
        ]
      }
    });

    if (existingUser) {
      throw new ValidationError('User with this Auth0 ID or email already exists');
    }

    const user = await prisma.user.create({
      data: {
        auth0Id,
        email,
        name,
        role
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            roomId: true,
            isActive: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 */
export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getStringParam(req.params, 'id');
    const { name, email, role } = req.body;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      throw new AppError('User not found', 404);
    }

    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) {
      if (!Object.values(Role).includes(role)) {
        throw new ValidationError('Invalid role');
      }
      updateData.role = role;
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId }
        }
      });

      if (emailExists) {
        throw new ValidationError('Email is already taken by another user');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            roomId: true,
            isActive: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getStringParam(req.params, 'id');

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: true
      }
    });

    if (!existingUser) {
      throw new AppError('User not found', 404);
    }

    // Unlink from tenant if linked
    if (existingUser.tenant) {
      await prisma.tenant.update({
        where: { id: existingUser.tenant.id },
        data: { userId: null }
      });
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Link user to tenant
 */
export const linkUserToTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, tenantId } = req.body;

    if (!userId || !tenantId) {
      throw new ValidationError('Both userId and tenantId are required');
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    // Check if tenant is already linked to another user
    if (tenant.userId && tenant.userId !== userId) {
      throw new ValidationError('Tenant is already linked to another user');
    }

    // Check if user is already linked to another tenant
    const existingTenant = await prisma.tenant.findFirst({
      where: { userId }
    });

    if (existingTenant && existingTenant.id !== tenantId) {
      throw new ValidationError('User is already linked to another tenant');
    }

    // Link user to tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        room: {
          select: {
            id: true,
            roomNumber: true,
            floor: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedTenant,
      message: 'User linked to tenant successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unlink user from tenant
 */
export const unlinkUserFromTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, tenantId } = req.body;

    if (!userId || !tenantId) {
      throw new ValidationError('Both userId and tenantId are required');
    }

    // Check if tenant exists and is linked to the user
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    if (tenant.userId !== userId) {
      throw new ValidationError('Tenant is not linked to this user');
    }

    // Unlink user from tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { userId: null },
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
            floor: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedTenant,
      message: 'User unlinked from tenant successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get users with tenant linking suggestions based on email matching
 */
export const getUserTenantSuggestions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get users without tenant links
    const unlinkedUsers = await prisma.user.findMany({
      where: {
        tenant: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    // Get tenants without user links
    const unlinkedTenants = await prisma.tenant.findMany({
      where: {
        userId: null,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        roomId: true
      }
    });

    // Find potential matches based on email
    const suggestions = [];
    
    for (const user of unlinkedUsers) {
      for (const tenant of unlinkedTenants) {
        if (tenant.email && user.email.toLowerCase() === tenant.email.toLowerCase()) {
          suggestions.push({
            user,
            tenant,
            matchType: 'email_exact'
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        suggestions,
        unlinkedUsers,
        unlinkedTenants
      }
    });
  } catch (error) {
    next(error);
  }
};