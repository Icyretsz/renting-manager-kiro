import { prisma } from '../config/database';
import { ReadingStatus } from '@prisma/client';
import { AppError } from '../utils/errors';

export interface ReadingAccessInfo {
  canView: boolean;
  canEdit: boolean;
  canApprove: boolean;
  canReject: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  status: ReadingStatus;
  reason?: string;
}

/**
 * Check comprehensive access permissions for a meter reading
 */
export const checkReadingAccess = async (
  readingId: string,
  userId: string,
  userRole: 'ADMIN' | 'USER'
): Promise<ReadingAccessInfo> => {
    const reading = await prisma.meterReading.findUnique({
      where: { id: readingId },
      include: {
        room: true,
      },
    });

    if (!reading) {
      throw new AppError('Meter reading not found', 404);
    }

    const isAdmin = userRole === 'ADMIN';
    const isOwner = reading.submittedBy === userId;
    const isPending = reading.status === ReadingStatus.PENDING;

  // Check if user has access to this room (for regular users)
  let hasRoomAccess = true;
  if (!isAdmin) {
    hasRoomAccess = await checkUserRoomAccess(userId, reading.roomId);
  }

    if (!hasRoomAccess) {
      return {
        canView: false,
        canEdit: false,
        canApprove: false,
        canReject: false,
        isOwner: false,
        isAdmin: false,
        status: reading.status,
        reason: 'No access to this room',
      };
    }

    // Determine permissions based on role and reading status
    let canView = true; // All authenticated users with room access can view
    let canEdit = false;
    let canApprove = false;
    let canReject = false;

    if (isAdmin) {
      // Admin can always edit, approve, and reject
      canEdit = true;
      canApprove = isPending;
      canReject = isPending;
    } else {
      // Regular users can only edit their own pending readings
      canEdit = isOwner && isPending;
      canApprove = false;
      canReject = false;
    }

  return {
    canView,
    canEdit,
    canApprove,
    canReject,
    isOwner,
    isAdmin,
    status: reading.status,
  };
};

/**
 * Check if user has access to a specific room
 */
export const checkUserRoomAccess = async (userId: string, roomId: number): Promise<boolean> => {
    const assignment = await prisma.userRoomAssignment.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
    });

  return !!assignment;
};

/**
 * Validate reading modification permissions
 */
export const validateReadingModification = async (
  readingId: string,
  userId: string,
  userRole: 'ADMIN' | 'USER'
): Promise<void> => {
  const access = await checkReadingAccess(readingId, userId, userRole);

    if (!access.canEdit) {
      if (!access.canView) {
        throw new AppError('Reading not found or access denied', 404);
      }

      if (access.status === ReadingStatus.APPROVED && !access.isAdmin) {
        throw new AppError('Cannot modify approved readings. Only admin can edit approved readings.', 403);
      }

      if (!access.isOwner && !access.isAdmin) {
        throw new AppError('Can only modify your own readings', 403);
      }

    throw new AppError('Insufficient permissions to modify this reading', 403);
  }
};

/**
 * Validate reading approval permissions
 */
export const validateReadingApproval = async (
  readingId: string,
  userId: string,
  userRole: 'ADMIN' | 'USER'
): Promise<void> => {
  const access = await checkReadingAccess(readingId, userId, userRole);

    if (!access.canApprove) {
      if (!access.canView) {
        throw new AppError('Reading not found or access denied', 404);
      }

      if (!access.isAdmin) {
        throw new AppError('Only admin users can approve readings', 403);
      }

      if (access.status !== ReadingStatus.PENDING) {
        throw new AppError(`Cannot approve ${access.status.toLowerCase()} readings. Only pending readings can be approved.`, 400);
      }

      throw new AppError('Insufficient permissions to approve this reading', 403);
  }
};

/**
 * Validate reading rejection permissions
 */
export const validateReadingRejection = async (
  readingId: string,
  userId: string,
  userRole: 'ADMIN' | 'USER'
): Promise<void> => {
  const access = await checkReadingAccess(readingId, userId, userRole);

    if (!access.canReject) {
      if (!access.canView) {
        throw new AppError('Reading not found or access denied', 404);
      }

      if (!access.isAdmin) {
        throw new AppError('Only admin users can reject readings', 403);
      }

      if (access.status !== ReadingStatus.PENDING) {
        throw new AppError(`Cannot reject ${access.status.toLowerCase()} readings. Only pending readings can be rejected.`, 400);
      }

      throw new AppError('Insufficient permissions to reject this reading', 403);
  }
};

/**
 * Get reading status validation info
 */
export const getReadingStatusInfo = async (readingId: string): Promise<{
    status: ReadingStatus;
    canBeModified: boolean;
    canBeApproved: boolean;
    canBeRejected: boolean;
  statusDescription: string;
}> => {
    const reading = await prisma.meterReading.findUnique({
      where: { id: readingId },
      select: { status: true },
    });

    if (!reading) {
      throw new AppError('Meter reading not found', 404);
    }

    const status = reading.status;
    const isPending = status === ReadingStatus.PENDING;

    let statusDescription = '';
    switch (status) {
      case ReadingStatus.PENDING:
        statusDescription = 'Waiting for admin approval';
        break;
      case ReadingStatus.APPROVED:
        statusDescription = 'Approved by admin';
        break;
      case ReadingStatus.REJECTED:
        statusDescription = 'Rejected by admin';
        break;
    }

    return {
      status,
      canBeModified: isPending, // Only pending readings can be modified by tenants
      canBeApproved: isPending,
      canBeRejected: isPending,
      statusDescription,
  };
};

/**
 * Check if user can submit new reading for a room/month/year
 */
export const canSubmitReading = async (
    userId: string,
    userRole: 'ADMIN' | 'USER',
    roomId: number,
    month: number,
    year: number
  ): Promise<{
    canSubmit: boolean;
    reason?: string;
    existingReading?: {
      id: string;
      status: ReadingStatus;
  };
}> => {
  // Check room access for regular users
  if (userRole === 'USER') {
    const hasAccess = await checkUserRoomAccess(userId, roomId);
      if (!hasAccess) {
        return {
          canSubmit: false,
          reason: 'No access to this room',
        };
      }
    }

    // Check if reading already exists for this room/month/year
    const existingReading = await prisma.meterReading.findUnique({
      where: {
        roomId_month_year: {
          roomId,
          month,
          year,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (existingReading) {
      return {
        canSubmit: false,
        reason: `Reading already exists for ${month}/${year}`,
        existingReading,
      };
    }

    return {
      canSubmit: true,
  };
};

/**
 * Get user's accessible rooms
 */
export const getUserAccessibleRooms = async (userId: string, userRole: 'ADMIN' | 'USER'): Promise<number[]> => {
    if (userRole === 'ADMIN') {
      // Admin has access to all rooms
      const rooms = await prisma.room.findMany({
        select: { id: true },
      });
      return rooms.map(room => room.id);
    }

    // Regular users only have access to assigned rooms
    const assignments = await prisma.userRoomAssignment.findMany({
      where: { userId },
      select: { roomId: true },
    });

  return assignments.map(assignment => assignment.roomId);
};

/**
 * Validate reading status transition
 */
export const validateStatusTransition = (
  currentStatus: ReadingStatus,
  newStatus: ReadingStatus
): { isValid: boolean; reason?: string } => {
    // Define valid status transitions
    const validTransitions: Record<ReadingStatus, ReadingStatus[]> = {
      [ReadingStatus.PENDING]: [ReadingStatus.APPROVED, ReadingStatus.REJECTED],
      [ReadingStatus.APPROVED]: [], // Approved readings cannot change status
      [ReadingStatus.REJECTED]: [ReadingStatus.PENDING], // Rejected readings can be resubmitted
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    const isValid = allowedTransitions.includes(newStatus);

    if (!isValid) {
      return {
        isValid: false,
        reason: `Cannot change status from ${currentStatus} to ${newStatus}`,
      };
    }

  return { isValid: true };
};