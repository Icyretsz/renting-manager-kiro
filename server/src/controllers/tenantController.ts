import { Request, Response, NextFunction } from 'express';
import * as tenantService from '../services/tenantService';
import { AppError } from '../utils/errors';
import { parseIntParam, getStringParam } from '../utils/paramHelpers';

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

/**
 * Get all tenants
 * GET /api/tenants
 */
export const getAllTenants = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userRole = req.user?.role || 'USER';
    const userId = req.user?.id;

    // Parse query parameters
    const filters: any = {};
    
    if (req.query['roomId']) {
      filters.roomId = parseInt(req.query['roomId'] as string);
    }
    
    if (req.query['isActive'] !== undefined) {
      filters.isActive = req.query['isActive'] === 'true';
    }
    
    if (req.query['floor']) {
      filters.floor = parseInt(req.query['floor'] as string);
    }
    
    if (req.query['search']) {
      filters.search = req.query['search'] as string;
    }

    const tenants = await tenantService.getAllTenants(userRole, userId, filters);

    res.json({
      success: true,
      data: tenants,
      message: 'Tenants retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tenant by ID
 * GET /api/tenants/:id
 */
export const getTenantById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = getStringParam(req.params, 'id', 'Tenant ID is required');
    const userRole = req.user?.role || 'USER';
    const userId = req.user?.id;

    const tenant = await tenantService.getTenantById(tenantId, userRole, userId);

    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    res.json({
      success: true,
      data: tenant,
      message: 'Tenant retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new tenant (admin only)
 * POST /api/tenants
 */
export const createTenant = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Admin access required', 403);
    }

    const { name, email, phone, fingerprintId, permanentAddress, roomId, moveInDate } = req.body;

    if (!name || !roomId) {
      throw new AppError('Name and room ID are required', 400);
    }

    const createData: any = {
      name,
      roomId: parseInt(roomId)
    };
    
    if (email !== undefined) createData.email = email;
    if (phone !== undefined) createData.phone = phone;
    if (fingerprintId !== undefined) createData.fingerprintId = parseInt(fingerprintId);
    if (permanentAddress !== undefined) createData.permanentAddress = permanentAddress;
    if (moveInDate !== undefined) createData.moveInDate = new Date(moveInDate);

    const tenant = await tenantService.createTenant(createData);

    res.status(201).json({
      success: true,
      data: tenant,
      message: 'Tenant created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update tenant (admin only)
 * PUT /api/tenants/:id
 */
export const updateTenant = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Admin access required', 403);
    }

    const tenantId = getStringParam(req.params, 'id', 'Tenant ID is required');
    const { name, email, phone, fingerprintId, permanentAddress, roomId, moveInDate, moveOutDate, isActive } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (fingerprintId !== undefined) updateData.fingerprintId = fingerprintId ? parseInt(fingerprintId) : null;
    if (permanentAddress !== undefined) updateData.permanentAddress = permanentAddress;
    if (roomId !== undefined) updateData.roomId = parseInt(roomId);
    if (moveInDate !== undefined) updateData.moveInDate = moveInDate ? new Date(moveInDate) : null;
    if (moveOutDate !== undefined) updateData.moveOutDate = moveOutDate ? new Date(moveOutDate) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const tenant = await tenantService.updateTenant(tenantId, updateData);

    res.json({
      success: true,
      data: tenant,
      message: 'Tenant updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete tenant (admin only)
 * DELETE /api/tenants/:id
 */
export const deleteTenant = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Admin access required', 403);
    }

    const tenantId = getStringParam(req.params, 'id', 'Tenant ID is required');
    await tenantService.deleteTenant(tenantId);

    res.json({
      success: true,
      message: 'Tenant deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Move tenant out
 * POST /api/tenants/:id/move-out
 */
export const moveTenantOut = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Admin access required', 403);
    }

    const tenantId = getStringParam(req.params, 'id', 'Tenant ID is required');
    const { moveOutDate } = req.body;

    const tenant = await tenantService.moveTenantOut(
      tenantId,
      moveOutDate ? new Date(moveOutDate) : undefined
    );

    res.json({
      success: true,
      data: tenant,
      message: 'Tenant moved out successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Move tenant in
 * POST /api/tenants/:id/move-in
 */
export const moveTenantIn = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Admin access required', 403);
    }

    const tenantId = getStringParam(req.params, 'id', 'Tenant ID is required');
    const { moveInDate } = req.body;

    const tenant = await tenantService.moveTenantIn(
      tenantId,
      moveInDate ? new Date(moveInDate) : undefined
    );

    res.json({
      success: true,
      data: tenant,
      message: 'Tenant moved in successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tenants by room
 * GET /api/tenants/room/:roomId
 */
export const getTenantsByRoom = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const roomId = parseIntParam(req.params, 'roomId', 'Room ID is required');

    const userRole = req.user?.role || 'USER';
    const userId = req.user?.id;

    const tenants = await tenantService.getTenantsByRoom(roomId, userRole, userId);

    res.json({
      success: true,
      data: tenants,
      message: 'Room tenants retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tenant statistics (admin only)
 * GET /api/tenants/stats
 */
export const getTenantStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Admin access required', 403);
    }

    const stats = await tenantService.getTenantStats();

    res.json({
      success: true,
      data: stats,
      message: 'Tenant statistics retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search tenants
 * GET /api/tenants/search
 */
export const searchTenants = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = req.query['q'] as string;
    const isActive = req.query['isActive'] !== undefined ? req.query['isActive'] === 'true' : true;

    if (!query || query.trim().length < 2) {
      throw new AppError('Search query must be at least 2 characters long', 400);
    }

    const userRole = req.user?.role || 'USER';
    const userId = req.user?.id;

    const tenants = await tenantService.searchTenants(query.trim(), userRole, userId, isActive);

    res.json({
      success: true,
      data: tenants,
      message: 'Search results retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};