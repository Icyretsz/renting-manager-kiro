import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError, ValidationError } from '../utils/errors';
import * as notificationService from '../services/notificationService';

/**
 * Request curfew override for tenant(s)
 * User can request for themselves or other tenants in the same room
 */
export const requestCurfewOverride = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { tenantIds, reason } = req.body;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    if (!tenantIds || !Array.isArray(tenantIds) || tenantIds.length === 0) {
      throw new ValidationError('At least one tenant must be selected');
    }

    // Get the requesting user's tenant info
    const requestingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: {
          include: {
            room: true
          }
        }
      }
    });

    if (!requestingUser?.tenant) {
      throw new AppError('You must be linked to a tenant to request curfew override', 403);
    }

    const userRoomId = requestingUser.tenant.roomId;

    // Verify all selected tenants are in the same room
    const selectedTenants = await prisma.tenant.findMany({
      where: {
        id: { in: tenantIds },
        roomId: userRoomId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (selectedTenants.length !== tenantIds.length) {
      throw new ValidationError('All selected tenants must be in your room');
    }

    // Check if any tenant has a non-NORMAL status OR has a request today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const blockedTenants = selectedTenants.filter(t => {
      // Block if status is not NORMAL
      if (t.curfewStatus !== 'NORMAL') {
        return true;
      }
      
      // Block if there was a request today (even if it was approved/rejected)
      if (t.curfewRequestedAt) {
        const requestDate = new Date(t.curfewRequestedAt);
        requestDate.setHours(0, 0, 0, 0);
        return requestDate.getTime() === today.getTime();
      }
      
      return false;
    });

    if (blockedTenants.length > 0) {
      const names = blockedTenants.map(t => t.name).join(', ');
      throw new ValidationError(`Cannot request override for these tenants today: ${names}. They either have an active status or already made a request today.`);
    }

    // Update tenant status to PENDING and create modification logs
    for (const tenant of selectedTenants) {
      const oldStatus = tenant.curfewStatus;
      
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          curfewStatus: 'PENDING',
          curfewRequestedAt: new Date()
        }
      });

      // Create modification log
      await prisma.curfewModification.create({
        data: {
          tenantId: tenant.id,
          modifiedBy: userId,
          oldStatus: oldStatus,
          newStatus: 'PENDING',
          modificationType: 'REQUEST',
          reason: reason || null,
          isPermanent: false
        }
      });
    }

    // Send notification to admins using notification service
    const tenantNames = selectedTenants.map(t => t.name).join(', ');
    const roomNumber = requestingUser.tenant?.room?.roomNumber || 0;
    
    await notificationService.notifyCurfewRequest(
      requestingUser.name,
      roomNumber,
      tenantNames,
      reason
    );

    res.json({
      success: true,
      message: 'Curfew override request sent to admins',
      data: {
        requestedFor: selectedTenants.map(t => ({
          id: t.id,
          name: t.name,
          status: 'PENDING'
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve curfew override (Admin only)
 */
export const approveCurfewOverride = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const { tenantIds, isPermanent = false } = req.body;

    if (!adminId) {
      throw new AppError('Unauthorized', 401);
    }

    if (!tenantIds || !Array.isArray(tenantIds) || tenantIds.length === 0) {
      throw new ValidationError('At least one tenant must be selected');
    }

    // Get tenant details
    const tenants = await prisma.tenant.findMany({
      where: {
        id: { in: tenantIds }
      },
      include: {
        room: {
          select: {
            roomNumber: true
          }
        },
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const newStatus = isPermanent ? 'APPROVED_PERMANENT' : 'APPROVED_TEMPORARY';

    // Update each tenant and create modification logs
    for (const tenant of tenants) {
      const oldStatus = tenant.curfewStatus;
      
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          curfewStatus: newStatus,
          curfewApprovedAt: new Date(),
          curfewApprovedBy: adminId
        }
      });

      // Create modification log
      await prisma.curfewModification.create({
        data: {
          tenantId: tenant.id,
          modifiedBy: adminId,
          oldStatus: oldStatus,
          newStatus: newStatus,
          modificationType: 'APPROVE',
          isPermanent: isPermanent
        }
      });

      // Send notification to user if they have an account
      if (tenant.user) {
        await notificationService.notifyCurfewApproved(
          tenant.user.id,
          tenant.room.roomNumber,
          isPermanent
        );
      }
    }

    res.json({
      success: true,
      message: `Curfew override approved for ${tenants.length} tenant(s)`,
      data: {
        approvedTenants: tenants.map(t => ({
          id: t.id,
          name: t.name,
          roomNumber: t.room.roomNumber,
          status: newStatus,
          isPermanent
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject curfew override (Admin only)
 */
export const rejectCurfewOverride = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const { tenantIds, reason } = req.body;

    if (!adminId) {
      throw new AppError('Unauthorized', 401);
    }

    if (!tenantIds || !Array.isArray(tenantIds) || tenantIds.length === 0) {
      throw new ValidationError('At least one tenant must be selected');
    }

    // Get tenant details
    const tenants = await prisma.tenant.findMany({
      where: {
        id: { in: tenantIds }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Update each tenant and create modification logs
    for (const tenant of tenants) {
      const oldStatus = tenant.curfewStatus;
      
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          curfewStatus: 'NORMAL',
          curfewRequestedAt: null,
          curfewApprovedAt: null,
          curfewApprovedBy: null
        }
      });

      // Create modification log
      await prisma.curfewModification.create({
        data: {
          tenantId: tenant.id,
          modifiedBy: adminId,
          oldStatus: oldStatus,
          newStatus: 'NORMAL',
          modificationType: 'REJECT',
          reason: reason || null,
          isPermanent: false
        }
      });

      // Send notification to user if they have an account
      if (tenant.user) {
        await notificationService.notifyCurfewRejected(
          tenant.user.id,
          reason
        );
      }
    }

    res.json({
      success: true,
      message: `Curfew override rejected for ${tenants.length} tenant(s)`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tenants in user's room (for dropdown selection)
 */
export const getRoomTenants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: true
      }
    });

    if (!user?.tenant) {
      throw new AppError('You must be linked to a tenant', 403);
    }

    // Get all tenants in the same room
    const roomTenants = await prisma.tenant.findMany({
      where: {
        roomId: user.tenant.roomId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        curfewStatus: true,
        curfewRequestedAt: true,
        curfewApprovedAt: true,
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: roomTenants
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset curfew overrides (called by cron job at 6 AM)
 * Only resets APPROVED_TEMPORARY, not APPROVED_PERMANENT
 */
export const resetCurfewOverrides = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get all tenants with temporary approval
    const tenantsToReset = await prisma.tenant.findMany({
      where: {
        curfewStatus: 'APPROVED_TEMPORARY'
      },
      select: {
        id: true,
        name: true
      }
    });

    // Create a system user ID for cron jobs (or use first admin)
    const systemAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true }
    });

    if (!systemAdmin) {
      throw new AppError('No admin user found for system operations', 500);
    }

    // Reset each tenant and create modification logs
    for (const tenant of tenantsToReset) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          curfewStatus: 'NORMAL',
          curfewApprovedAt: null,
          curfewApprovedBy: null
        }
      });

      // Create modification log
      await prisma.curfewModification.create({
        data: {
          tenantId: tenant.id,
          modifiedBy: systemAdmin.id,
          oldStatus: 'APPROVED_TEMPORARY',
          newStatus: 'NORMAL',
          modificationType: 'RESET',
          reason: 'Automatic reset at 6:00 AM',
          isPermanent: false
        }
      });
    }

    console.log(`[Cron] Reset curfew override for ${tenantsToReset.length} tenant(s) at ${new Date().toISOString()}`);

    res.json({
      success: true,
      message: `Reset curfew override for ${tenantsToReset.length} tenant(s)`
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Get all pending curfew requests (Admin only)
 */
export const getPendingCurfewRequests = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pendingTenants = await prisma.tenant.findMany({
      where: {
        curfewStatus: 'PENDING'
      },
      include: {
        room: {
          select: {
            roomNumber: true,
            floor: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        curfewModifications: {
          where: {
            modificationType: 'REQUEST'
          },
          orderBy: {
            modifiedAt: 'desc'
          },
          take: 1,
          include: {
            modifier: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        curfewRequestedAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: pendingTenants
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get curfew modification history for a tenant
 */
export const getCurfewModifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tenantId } = req.params;

    if (!tenantId) {
      throw new ValidationError('Tenant ID is required');
    }

    const modifications = await prisma.curfewModification.findMany({
      where: {
        tenantId
      },
      include: {
        modifier: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            roomId: true
          }
        }
      },
      orderBy: {
        modifiedAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: modifications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manually change tenant curfew status (Admin only)
 * For direct admin control in TenantModal
 */
export const manualChangeCurfewStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const { tenantId, newStatus, isPermanent = false, reason } = req.body;

    if (!adminId) {
      throw new AppError('Unauthorized', 401);
    }

    if (!tenantId || !newStatus) {
      throw new ValidationError('Tenant ID and new status are required');
    }

    const validStatuses = ['NORMAL', 'PENDING', 'APPROVED_TEMPORARY', 'APPROVED_PERMANENT'];
    if (!validStatuses.includes(newStatus)) {
      throw new ValidationError('Invalid curfew status');
    }

    // Get current tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    const oldStatus = tenant.curfewStatus;

    // Update tenant
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        curfewStatus: newStatus,
        curfewApprovedAt: newStatus.startsWith('APPROVED') ? new Date() : null,
        curfewApprovedBy: newStatus.startsWith('APPROVED') ? adminId : null,
        curfewRequestedAt: newStatus === 'PENDING' ? (tenant.curfewRequestedAt || new Date()) : null
      }
    });

    // Create modification log
    await prisma.curfewModification.create({
      data: {
        tenantId,
        modifiedBy: adminId,
        oldStatus,
        newStatus,
        modificationType: 'MANUAL_CHANGE',
        reason: reason || 'Manual change by admin',
        isPermanent
      }
    });

    res.json({
      success: true,
      message: 'Curfew status updated successfully',
      data: {
        tenantId,
        oldStatus,
        newStatus
      }
    });
  } catch (error) {
    next(error);
  }
};
