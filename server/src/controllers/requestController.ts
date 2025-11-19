import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError, ValidationError } from '../utils/errors';
import * as notificationService from '../services/notificationService';

/**
 * Create a new request (repair or other only - curfew uses separate endpoint)
 */
export const createRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { requestType, description, photoUrls } = req.body;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    // Get the requesting user's tenant info
    const requestingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: {
          include: {
            room: true,
          },
        },
      },
    });

    if (!requestingUser?.tenant) {
      throw new AppError(
        'You must be linked to a tenant to create a request',
        403
      );
    }

    const userRoomId = requestingUser.tenant.roomId;
    const roomNumber = requestingUser.tenant.room?.roomNumber || 0;

    // Validate request type - only REPAIR and OTHER allowed here
    if (!['REPAIR', 'OTHER'].includes(requestType)) {
      throw new ValidationError(
        'Invalid request type. Use /api/curfew/request for curfew requests.'
      );
    }

    // Validate description is provided
    if (!description || description.trim().length === 0) {
      throw new ValidationError(
        'Description is required for repair and other requests'
      );
    }

    // Create request
    const request = await prisma.request.create({
      data: {
        userId,
        roomId: userRoomId,
        requestType,
        status: 'PENDING',
        description,
        photoUrls: photoUrls || [],
      },
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
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all requests for the current user (REPAIR and OTHER only)
 */
export const getUserRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const requests = await prisma.request.findMany({
      where: {
        userId,
        requestType: {
          in: ['REPAIR', 'OTHER'],
        },
      },
      include: {
        room: {
          select: {
            roomNumber: true,
            floor: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all pending requests (Admin only - REPAIR and OTHER only)
 */
export const getPendingRequests = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requests = await prisma.request.findMany({
      where: {
        status: 'PENDING',
        requestType: {
          in: ['REPAIR', 'OTHER'],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        room: {
          select: {
            roomNumber: true,
            floor: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all requests (Admin only - REPAIR and OTHER only)
 */
export const getAllRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, requestType, roomId } = req.query;

    const where: any = {
      requestType: {
        in: ['REPAIR', 'OTHER'],
      },
    };

    if (status) {
      where.status = status;
    }

    if (requestType && ['REPAIR', 'OTHER'].includes(requestType as string)) {
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
            email: true,
          },
        },
        room: {
          select: {
            roomNumber: true,
            floor: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a request (Admin only - repair/other only)
 */
export const approveRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const { requestId } = req.params;

    if (!adminId) {
      throw new AppError('Unauthorized', 401);
    }

    if (!requestId) {
      throw new ValidationError('Request ID is required');
    }

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        room: {
          select: {
            roomNumber: true,
          },
        },
      },
    });

    if (!request) {
      throw new AppError('Request not found', 404);
    }

    if (request.status !== 'PENDING') {
      throw new ValidationError('Only pending requests can be approved');
    }

    // Only handle REPAIR and OTHER types
    if (request.requestType === 'CURFEW') {
      throw new ValidationError('Use /api/curfew/approve for curfew requests');
    }

    // Update request status
    await prisma.request.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });

    // Send notification to user
    if (request.user) {
      await notificationService.notifyRequestApproved(
        request.user.id,
        request.room.roomNumber,
        request.requestType
      );
    }

    res.json({
      success: true,
      message: 'Request approved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a request (Admin only - repair/other only)
 */
export const rejectRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const { requestId } = req.params;
    const { reason } = req.body;

    if (!adminId) {
      throw new AppError('Unauthorized', 401);
    }

    if (!requestId) {
      throw new ValidationError('Request ID is required');
    }

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        room: {
          select: {
            roomNumber: true,
          },
        },
      },
    });

    if (!request) {
      throw new AppError('Request not found', 404);
    }

    if (request.status !== 'PENDING') {
      throw new ValidationError('Only pending requests can be rejected');
    }

    // Only handle REPAIR and OTHER types
    if (request.requestType === 'CURFEW') {
      throw new ValidationError('Use /api/curfew/reject for curfew requests');
    }

    // Update request status
    await prisma.request.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        approvedBy: adminId,
        approvedAt: new Date(),
        rejectionReason: reason || null,
      },
    });

    // Send notification to user
    if (request.user) {
      await notificationService.notifyRequestRejected(
        request.user.id,
        request.room.roomNumber,
        request.requestType,
        reason
      );
    }

    res.json({
      success: true,
      message: 'Request rejected successfully',
    });
  } catch (error) {
    next(error);
  }
};
