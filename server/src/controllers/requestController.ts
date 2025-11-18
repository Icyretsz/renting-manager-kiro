import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError, ValidationError } from '../utils/errors';
import * as notificationService from '../services/notificationService';

/**
 * Create a new request (curfew, repair, or other)
 */
export const createRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { requestType, description, photoUrls, tenantIds, reason } = req.body;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
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
      throw new AppError('You must be linked to a tenant to create a request', 403);
    }

    const userRoomId = requestingUser.tenant.roomId;
    const roomNumber = requestingUser.tenant.room?.roomNumber || 0;

    // Validate request type
    if (!['CURFEW', 'REPAIR', 'OTHER'].includes(requestType)) {
      throw new ValidationError('Invalid request type');
    }

    // Handle curfew-specific validation
    if (requestType === 'CURFEW') {
      if (!tenantIds || !Array.isArray(tenantIds) || tenantIds.length === 0) {
        throw new ValidationError('At least one tenant must be selected for curfew requests');
      }

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
        if (t.curfewStatus !== 'NORMAL') {
          return true;
        }
        
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

      // Create request with curfew details
      const request = await prisma.request.create({
        data: {
          userId,
          roomId: userRoomId,
          requestType: 'CURFEW',
          status: 'PENDING',
          description: reason || null,
          curfewRequest: {
            create: {
              tenantIds,
              reason: reason || null
            }
          }
        },
        include: {
          curfewRequest: true
        }
      });

      // Update tenant status to PENDING
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

      // Send notification to admins
      const tenantNames = selectedTenants.map(t => t.name).join(', ');
      await notificationService.notifyCurfewRequest(
        requestingUser.name,
        roomNumber,
        tenantNames,
        reason
      );

      res.json({
        success: true,
        message: 'Curfew request created successfully',
        data: request
      });
    } else {
      // Handle repair/other requests
      if (!description || description.trim().length === 0) {
        throw new ValidationError('Description is required for repair and other requests');
      }

      const request = await prisma.request.create({
        data: {
          userId,
          roomId: userRoomId,
          requestType,
          status: 'PENDING',
          description,
          photoUrls: photoUrls || []
        }
      });

      // Send notification to admins
      await notificationService.notifyGeneralRequest(
        requestingUser.name,
        roomNumber,
        requestType,
        description
      );

      res.json({
        success: true,
        message: `${requestType.toLowerCase()} request created successfully`,
        data: request
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get all requests for the current user
 */
export const getUserRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const requests = await prisma.request.findMany({
      where: {
        userId
      },
      include: {
        room: {
          select: {
            roomNumber: true,
            floor: true
          }
        },
        curfewRequest: true,
        approver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all pending requests (Admin only)
 */
export const getPendingRequests = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const requests = await prisma.request.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        room: {
          select: {
            roomNumber: true,
            floor: true
          }
        },
        curfewRequest: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all requests (Admin only)
 */
export const getAllRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, requestType, roomId } = req.query;

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (requestType) {
      where.requestType = requestType;
    }
    
    if (roomId) {
      where.roomId = parseInt(roomId as string);
    }

    const requests = await prisma.request.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        room: {
          select: {
            roomNumber: true,
            floor: true
          }
        },
        curfewRequest: true,
        approver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a request (Admin only)
 */
export const approveRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const { requestId } = req.params;
    const { isPermanent = false } = req.body;

    if (!adminId) {
      throw new AppError('Unauthorized', 401);
    }

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        room: {
          select: {
            roomNumber: true
          }
        },
        curfewRequest: true
      }
    });

    if (!request) {
      throw new AppError('Request not found', 404);
    }

    if (request.status !== 'PENDING') {
      throw new ValidationError('Only pending requests can be approved');
    }

    // Update request status
    await prisma.request.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approvedBy: adminId,
        approvedAt: new Date()
      }
    });

    // Handle curfew-specific approval
    if (request.requestType === 'CURFEW' && request.curfewRequest) {
      const tenantIds = request.curfewRequest.tenantIds;
      const newStatus = isPermanent ? 'APPROVED_PERMANENT' : 'APPROVED_TEMPORARY';

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

      // Update each tenant
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
      }

      // Send notification to user
      const tenantNames = tenants.map(t => t.name).join(', ');
      if (request.user) {
        await notificationService.notifyCurfewApproved(
          request.user.id,
          request.room.roomNumber,
          tenantNames,
          isPermanent
        );
      }
    } else {
      // Send notification for repair/other requests
      if (request.user) {
        await notificationService.notifyRequestApproved(
          request.user.id,
          request.room.roomNumber,
          request.requestType
        );
      }
    }

    res.json({
      success: true,
      message: 'Request approved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a request (Admin only)
 */
export const rejectRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const { requestId } = req.params;
    const { reason } = req.body;

    if (!adminId) {
      throw new AppError('Unauthorized', 401);
    }

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        room: {
          select: {
            roomNumber: true
          }
        },
        curfewRequest: true
      }
    });

    if (!request) {
      throw new AppError('Request not found', 404);
    }

    if (request.status !== 'PENDING') {
      throw new ValidationError('Only pending requests can be rejected');
    }

    // Update request status
    await prisma.request.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        approvedBy: adminId,
        approvedAt: new Date(),
        rejectionReason: reason || null
      }
    });

    // Handle curfew-specific rejection
    if (request.requestType === 'CURFEW' && request.curfewRequest) {
      const tenantIds = request.curfewRequest.tenantIds;

      // Get tenant details
      const tenants = await prisma.tenant.findMany({
        where: {
          id: { in: tenantIds }
        }
      });

      // Update each tenant back to NORMAL
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
      }

      // Send notification to user
      if (request.user) {
        await notificationService.notifyCurfewRejected(
          request.user.id,
          reason
        );
      }
    } else {
      // Send notification for repair/other requests
      if (request.user) {
        await notificationService.notifyRequestRejected(
          request.user.id,
          request.room.roomNumber,
          request.requestType,
          reason
        );
      }
    }

    res.json({
      success: true,
      message: 'Request rejected successfully'
    });
  } catch (error) {
    next(error);
  }
};
