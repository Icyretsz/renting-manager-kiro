import { prisma } from '../config/database';
import { MeterReading, ReadingModification, ReadingStatus, ModificationType } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { AppError, ValidationError } from '../utils/errors';
import * as billingService from './billingService';
import { notifyReadingApproved } from './notificationService';

export interface MeterReadingWithDetails extends MeterReading {
  room: {
    id: number;
    roomNumber: number;
    floor: number;
    baseRent: Prisma.Decimal;
  };
  submitter: {
    id: string;
    name: string;
    email: string;
    role: string;
    tenant?: {
      roomId: number;
      name: string;
    } | null;
  };
  approver?: {
    id: string;
    name: string;
    email: string;
    role: string;
    tenant?: {
      roomId: number;
      name: string;
    } | null;
  } | null;
  modifications: Array<ReadingModification & {
    modifier: {
      id: string;
      name: string;
      email: string;
      role: string;
      tenant?: {
        roomId: number;
        name: string;
      } | null;
    };
  }>;
}

export interface CreateMeterReadingData {
  roomId: number;
  month: number;
  year: number;
  waterReading: number;
  electricityReading: number;
  waterPhotoUrl?: string;
  electricityPhotoUrl?: string;
  submittedBy: string;
}

export interface UpdateMeterReadingData {
  waterReading?: number;
  electricityReading?: number;
  waterPhotoUrl?: string;
  electricityPhotoUrl?: string;
  baseRent?: number;
}

export interface MeterReadingFilters {
  roomId?: number;
  month?: number;
  year?: number;
  status?: ReadingStatus;
  submittedBy?: string;
}

/**
 * Create a new meter reading with validation
 */
export const createMeterReading = async (data: CreateMeterReadingData): Promise<MeterReadingWithDetails> => {
  // Validate basic data
  await validateMeterReadingData(data);

  // Check for existing reading for the same room/month/year
  await validateUniqueReading(data.roomId, data.month, data.year);

  // Validate reading progression (no decrease from previous month)
  await validateReadingProgression(data.roomId, data.month, data.year, data.waterReading, data.electricityReading);

  // Fetch room data to get baseRent
  const room = await prisma.room.findUnique({
    where: { id: data.roomId },
    select: { baseRent: true }
  });

  if (!room) {
    throw new ValidationError('Room not found');
  }

  const baseRent = parseFloat(room.baseRent.toString());

  // Calculate total amount
  const totalAmount = await calculateTotalAmount(data.roomId, data.month, data.year, data.waterReading, data.electricityReading, baseRent);

  const reading = await prisma.meterReading.create({
    data: {
      ...data,
      baseRent,
      totalAmount,
      trashFee: 52000 // Fixed trash fee as per requirements
    },
    include: {
      room: {
        select: {
          id: true,
          roomNumber: true,
          floor: true,
          baseRent: true
        }
      },
      submitter: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tenant: {
            select: {
              roomId: true,
              name: true
            }
          }
        }
      },
      approver: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tenant: {
            select: {
              roomId: true,
              name: true
            }
          }
        }
      },
      modifications: {
        include: {
          modifier: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              tenant: {
                select: {
                  roomId: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          modifiedAt: 'desc'
        }
      }
    }
  });

  // Log the creation
  await logModification(reading.id, data.submittedBy, ModificationType.CREATE, 'reading', null, 'created');

  // Send notification to admins about new submission
  try {
    const { notifyReadingSubmitted } = await import('./notificationService');
    await notifyReadingSubmitted(reading.room.roomNumber, data.month, data.year);
  } catch (error) {
    console.error('Failed to send notification for reading submission:', error);
    // Don't throw error as the reading was created successfully
  }

  return reading;
};

/**
 * Update an existing meter reading (only if pending)
 */
export const updateMeterReading = async (id: string, data: UpdateMeterReadingData, userId: string, userRole: string): Promise<MeterReadingWithDetails> => {
  const existingReading = await prisma.meterReading.findUnique({
    where: { id },
    include: {
      room: true
    }
  });

  if (!existingReading) {
    throw new AppError('Meter reading not found', 404);
  }

  // Check permissions
  if (userRole !== 'ADMIN' && existingReading.status === ReadingStatus.APPROVED) {
    throw new AppError('Cannot modify approved readings', 403);
  }

  if (userRole !== 'ADMIN' && existingReading.submittedBy !== userId) {
    throw new AppError('Can only modify your own readings', 403);
  }

  // Validate updated data
  const updatedData = {
    roomId: existingReading.roomId,
    month: existingReading.month,
    year: existingReading.year,
    waterReading: data.waterReading ?? existingReading.waterReading.toNumber(),
    electricityReading: data.electricityReading ?? existingReading.electricityReading.toNumber(),
    baseRent: data.baseRent ?? existingReading.baseRent.toNumber(),
    submittedBy: existingReading.submittedBy
  };

  await validateMeterReadingData(updatedData);

  // Validate reading progression if readings changed
  if (data.waterReading !== undefined || data.electricityReading !== undefined) {
    await validateReadingProgression(
      existingReading.roomId,
      existingReading.month,
      existingReading.year,
      updatedData.waterReading,
      updatedData.electricityReading
    );
  }

  // Calculate new total amount
  const totalAmount = await calculateTotalAmount(
    existingReading.roomId,
    existingReading.month,
    existingReading.year,
    updatedData.waterReading,
    updatedData.electricityReading,
    updatedData.baseRent
  );

  // Log modifications
  const modifications = [];
  if (data.waterReading !== undefined && data.waterReading !== existingReading.waterReading.toNumber()) {
    modifications.push(logModification(id, userId, ModificationType.UPDATE, 'waterReading', existingReading.waterReading.toString(), data.waterReading.toString()));
  }
  if (data.electricityReading !== undefined && data.electricityReading !== existingReading.electricityReading.toNumber()) {
    modifications.push(logModification(id, userId, ModificationType.UPDATE, 'electricityReading', existingReading.electricityReading.toString(), data.electricityReading.toString()));
  }
  if (data.baseRent !== undefined && data.baseRent !== existingReading.baseRent.toNumber()) {
    modifications.push(logModification(id, userId, ModificationType.UPDATE, 'baseRent', existingReading.baseRent.toString(), data.baseRent.toString()));
  }
  if (data.waterPhotoUrl !== undefined && data.waterPhotoUrl !== existingReading.waterPhotoUrl) {
    modifications.push(logModification(id, userId, ModificationType.UPDATE, 'waterPhotoUrl', existingReading.waterPhotoUrl || 'null', data.waterPhotoUrl || 'null'));
  }
  if (data.electricityPhotoUrl !== undefined && data.electricityPhotoUrl !== existingReading.electricityPhotoUrl) {
    modifications.push(logModification(id, userId, ModificationType.UPDATE, 'electricityPhotoUrl', existingReading.electricityPhotoUrl || 'null', data.electricityPhotoUrl || 'null'));
  }

  // Execute modifications logging
  await Promise.all(modifications);

  // Update the reading
  const updatedReading = await prisma.meterReading.update({
    where: { id },
    data: {
      ...data,
      totalAmount
    },
    include: {
      room: {
        select: {
          id: true,
          roomNumber: true,
          floor: true,
          baseRent: true
        }
      },
      submitter: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tenant: {
            select: {
              roomId: true,
              name: true
            }
          }
        }
      },
      approver: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tenant: {
            select: {
              roomId: true,
              name: true
            }
          }
        }
      },
      modifications: {
        include: {
          modifier: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              tenant: {
                select: {
                  roomId: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          modifiedAt: 'desc'
        }
      }
    }
  });

  // Send notification if admin modified an approved reading
  if (userRole === 'ADMIN' && existingReading.status === ReadingStatus.APPROVED && modifications.length > 0) {
    try {
      const { notifyReadingModified } = await import('./notificationService');
      await notifyReadingModified(
        updatedReading.roomId, 
        updatedReading.room.roomNumber, 
        updatedReading.month, 
        updatedReading.year
      );
    } catch (error) {
      console.error('Failed to send notification for reading modification:', error);
      // Don't throw error as the update was successful
    }
  }

  // Send notification if user updated their readings (notify admins)
  if (userRole === 'USER' && modifications.length > 0) {
    try {
      const { notifyReadingUpdated } = await import('./notificationService');
      await notifyReadingUpdated(
        updatedReading.room.roomNumber, 
        updatedReading.month, 
        updatedReading.year
      );
    } catch (error) {
      console.error('Failed to send notification for reading update:', error);
      // Don't throw error as the update was successful
    }
  }

  return updatedReading;
};

/**
 * Get meter reading by ID with full details
 */
export const getMeterReadingById = async (id: string, userRole: string, userId?: string): Promise<MeterReadingWithDetails | null> => {
  const reading = await prisma.meterReading.findUnique({
    where: { id },
    include: {
      room: {
        select: {
          id: true,
          roomNumber: true,
          floor: true,
          baseRent: true
        }
      },
      submitter: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tenant: {
            select: {
              roomId: true,
              name: true
            }
          }
        }
      },
      approver: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tenant: {
            select: {
              roomId: true,
              name: true
            }
          }
        }
      },
      modifications: {
        include: {
          modifier: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              tenant: {
                select: {
                  roomId: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          modifiedAt: 'desc'
        }
      }
    }
  });

  if (!reading) {
    return null;
  }

  // Check access permissions for regular users
  if (userRole === 'USER' && userId) {
    const hasAccess = await checkUserReadingAccess(userId, reading.roomId);
    if (!hasAccess) {
      throw new AppError('Access denied to this reading', 403);
    }
  }

  return reading;
};

/**
 * Get meter readings with filters and pagination
 */
export const getMeterReadings = async (
  filters: MeterReadingFilters,
  userRole: string,
  userId?: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  readings: MeterReadingWithDetails[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const whereClause: any = { ...filters };

  // Filter by user access for regular users
  if (userRole === 'USER' && userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: {
          select: { roomId: true }
        }
      }
    });

    if (user?.tenant?.roomId) {
      whereClause.roomId = user.tenant.roomId;
    } else {
      // User is not a tenant, no access to any rooms
      whereClause.roomId = -1; // Non-existent room ID
    }
  }

  const [readings, total] = await Promise.all([
    prisma.meterReading.findMany({
      where: whereClause,
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
            floor: true,
            baseRent: true
          }
        },
        submitter: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            tenant: {
              select: {
                roomId: true,
                name: true
              }
            }
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            tenant: {
              select: {
                roomId: true,
                name: true
              }
            }
          }
        },
        modifications: {
          include: {
            modifier: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                tenant: {
                  select: {
                    roomId: true,
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            modifiedAt: 'desc'
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { submittedAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.meterReading.count({ where: whereClause })
  ]);

  return {
    readings,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Get pending readings for admin approval
 */
export const getPendingReadings = async (): Promise<MeterReadingWithDetails[]> => {
  return await prisma.meterReading.findMany({
    where: { status: ReadingStatus.PENDING },
    include: {
      room: {
        select: {
          id: true,
          roomNumber: true,
          floor: true,
          baseRent: true
        }
      },
      submitter: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tenant: {
            select: {
              roomId: true,
              name: true
            }
          }
        }
      },
      approver: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tenant: {
            select: {
              roomId: true,
              name: true
            }
          }
        }
      },
      modifications: {
        include: {
          modifier: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              tenant: {
                select: {
                  roomId: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          modifiedAt: 'desc'
        }
      }
    },
    orderBy: [
      { submittedAt: 'asc' }
    ]
  });
};

/**
 * Approve a meter reading
 */
export const approveReading = async (id: string, approvedBy: string): Promise<MeterReadingWithDetails> => {
  const reading = await prisma.meterReading.findUnique({
    where: { id }
  });

  if (!reading) {
    throw new AppError('Meter reading not found', 404);
  }

  if (reading.status !== ReadingStatus.PENDING) {
    throw new ValidationError('Only pending readings can be approved');
  }

  const updatedReading = await prisma.meterReading.update({
    where: { id },
    data: {
      status: ReadingStatus.APPROVED,
      approvedBy,
      approvedAt: new Date()
    },
    include: {
      room: {
        select: {
          id: true,
          roomNumber: true,
          floor: true,
          baseRent: true
        }
      },
      submitter: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tenant: {
            select: {
              roomId: true,
              name: true,
            }
          }
        }
      },
      approver: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tenant: {
            select: {
              roomId: true,
              name: true
            }
          }
        }
      },
      modifications: {
        include: {
          modifier: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              tenant: {
                select: {
                  roomId: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          modifiedAt: 'desc'
        }
      }
    }
  });

  // Log the approval
  await logModification(id, approvedBy, ModificationType.APPROVE, 'status', 'PENDING', 'APPROVED');

  // Generate billing record for approved reading
  let billingRecordId: string | null = null;
  try {
    const billingRecord = await billingService.generateBillingRecord(id);
    billingRecordId = billingRecord.id;
  } catch (error) {
    console.error('Failed to generate billing record for approved reading:', error);
    // Don't throw error as the approval was successful
  }

  // Send payment notification to room tenants
  try {
    if (billingRecordId) {

      // Send "tap to see bill and pay" notification to each tenant
      await notifyReadingApproved(updatedReading.roomId, updatedReading.room.roomNumber, updatedReading.month, updatedReading.year)
    }
  } catch (error) {
    console.error('Failed to send payment notification for reading approval:', error);
    // Don't throw error as the approval was successful
  }

  return updatedReading;
};

/**
 * Reject a meter reading
 */
export const rejectReading = async (id: string, rejectedBy: string, _reason?: string): Promise<MeterReadingWithDetails> => {
  const reading = await prisma.meterReading.findUnique({
    where: { id }
  });

  if (!reading) {
    throw new AppError('Meter reading not found', 404);
  }

  if (reading.status !== ReadingStatus.PENDING) {
    throw new ValidationError('Only pending readings can be rejected');
  }

  const updatedReading = await prisma.meterReading.update({
    where: { id },
    data: {
      status: ReadingStatus.REJECTED
    },
    include: {
      room: {
        select: {
          id: true,
          roomNumber: true,
          floor: true,
          baseRent: true
        }
      },
      submitter: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tenant: {
            select: {
              roomId: true,
              name: true
            }
          }
        }
      },
      approver: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tenant: {
            select: {
              roomId: true,
              name: true
            }
          }
        }
      },
      modifications: {
        include: {
          modifier: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              tenant: {
                select: {
                  roomId: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          modifiedAt: 'desc'
        }
      }
    }
  });

  // Log the rejection
  await logModification(id, rejectedBy, ModificationType.REJECT, 'status', 'PENDING', 'REJECTED');

  // Send notification to room users about rejection
  try {
    // TODO: Implement notifyReadingRejected in notificationService
    // await notificationService.notifyReadingRejected(
    //   updatedReading.roomId, 
    //   updatedReading.room.roomNumber, 
    //   updatedReading.month, 
    //   updatedReading.year,
    //   reason
    // );
  } catch (error) {
    console.error('Failed to send notification for reading rejection:', error);
    // Don't throw error as the rejection was successful
  }

  return updatedReading;
};

/**
 * Get reading history for a specific room
 */
export const getRoomReadingHistory = async (roomId: number, userRole: string, userId?: string): Promise<MeterReadingWithDetails[]> => {
  // Check access permissions for regular users
  if (userRole === 'USER' && userId) {
    const hasAccess = await checkUserReadingAccess(userId, roomId);
    if (!hasAccess) {
      throw new AppError('Access denied to this room', 403);
    }
  }

  return await prisma.meterReading.findMany({
    where: { roomId },
    include: {
      room: {
        select: {
          id: true,
          roomNumber: true,
          floor: true,
          baseRent: true
        }
      },
      submitter: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tenant: {
            select: {
              roomId: true,
              name: true
            }
          }
        }
      },
      approver: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tenant: {
            select: {
              roomId: true,
              name: true
            }
          }
        }
      },
      modifications: {
        include: {
          modifier: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              tenant: {
                select: {
                  roomId: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          modifiedAt: 'desc'
        }
      }
    },
    orderBy: [
      { year: 'desc' },
      { month: 'desc' }
    ]
  });
};

/**
 * Get reading history with photo thumbnails for a specific room
 */
export const getRoomReadingHistoryWithThumbnails = async (
  roomId: number,
  userRole: string,
  userId?: string
): Promise<Array<MeterReadingWithDetails & { photoThumbnails: { water?: string; electricity?: string } }>> => {
  const readings = await getRoomReadingHistory(roomId, userRole, userId);

  // Add photo thumbnail information
  return readings.map(reading => ({
    ...reading,
    photoThumbnails: {
      water: reading.waterPhotoUrl ? generateThumbnailUrl(reading.waterPhotoUrl) : undefined,
      electricity: reading.electricityPhotoUrl ? generateThumbnailUrl(reading.electricityPhotoUrl) : undefined
    } as { water?: string; electricity?: string }
  }));
}

/**
 * Generate thumbnail URL for photo
 */
const generateThumbnailUrl = (photoUrl: string): string => {
  // For now, return the original URL
  // In a production system, you might generate actual thumbnails
  // or use a service like Cloudinary for image transformations
  return photoUrl;
};

/**
 * Get reading submission status for a specific room and month/year
 */
export const getReadingSubmissionStatus = async (
  roomId: number,
  month: number,
  year: number,
  userRole: string,
  userId?: string
): Promise<{
  exists: boolean;
  reading?: MeterReadingWithDetails;
  canModify: boolean;
  status?: ReadingStatus;
}> => {
  // Check access permissions for regular users
  if (userRole === 'USER' && userId) {
    const hasAccess = await checkUserReadingAccess(userId, roomId);
    if (!hasAccess) {
      throw new AppError('Access denied to this room', 403);
    }
  }

  const reading = await prisma.meterReading.findFirst({
    where: {
      roomId,
      month,
      year,
      status: ReadingStatus.APPROVED
    },
    include: {
      room: {
        select: {
          id: true,
          roomNumber: true,
          floor: true,
          baseRent: true
        }
      },
      submitter: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tenant: {
            select: {
              roomId: true,
              name: true
            }
          }
        }
      },
      approver: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tenant: {
            select: {
              roomId: true,
              name: true
            }
          }
        }
      },
      modifications: {
        include: {
          modifier: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              tenant: {
                select: {
                  roomId: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          modifiedAt: 'desc'
        }
      }
    }
  });

  if (!reading) {
    return {
      exists: false,
      canModify: true // Can create new reading
    };
  }

  // Determine if user can modify this reading
  let canModify = false;
  if (userRole === 'ADMIN') {
    canModify = true; // Admin can always modify
  } else if (reading.status === ReadingStatus.PENDING && reading.submittedBy === userId) {
    canModify = true; // Owner can modify pending readings
  }

  return {
    exists: true,
    reading,
    canModify,
    status: reading.status
  };
}

/**
 * Get modification history for a specific reading
 */
export const getReadingModificationHistory = async (
  readingId: string,
  userRole: string,
  userId?: string
): Promise<Array<ReadingModification & {
  modifier: {
    id: string;
    name: string;
    email: string;
    role: string;
    tenant?: {
      roomId: number;
    } | null;
  };
}>> => {
  // First check if the reading exists and user has access
  const reading = await getMeterReadingById(readingId, userRole, userId);
  if (!reading) {
    throw new AppError('Meter reading not found', 404);
  }

  return await prisma.readingModification.findMany({
    where: { readingId },
    include: {
      modifier: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tenant: {
            select: {
              roomId: true
            }
          }
        }
      }
    },
    orderBy: {
      modifiedAt: 'desc'
    }
  });
}

/**
 * Calculate total amount based on readings and rates
 */
export const calculateTotalAmount = async (
  roomId: number,
  month: number,
  year: number,
  waterReading: number,
  electricityReading: number,
  baseRent: number
): Promise<number> => {
  // Get previous month's reading for usage calculation
  const previousReading = await getPreviousMonthReading(roomId, month, year);

  let waterUsage = 0;
  let electricityUsage = 0;

  if (previousReading) {
    waterUsage = Math.max(0, waterReading - previousReading.waterReading.toNumber());
    electricityUsage = Math.max(0, electricityReading - previousReading.electricityReading.toNumber());
  } else {
    // If no previous reading, assume current reading is the usage
    waterUsage = waterReading;
    electricityUsage = electricityReading;
  }

  // Calculate costs using the formula: (3500 × electricity) + (22000 × water) + base_rent + 52000
  const electricityCost = electricityUsage * 3500;
  const waterCost = waterUsage * 22000;
  const trashFee = 52000;

  return electricityCost + waterCost + baseRent + trashFee;
}

/**
 * Get previous month's reading for a room (only approved readings)
 */
export const getPreviousMonthReading = async (roomId: number, month: number, year: number): Promise<MeterReading | null> => {
  // Find the most recent approved reading before the given month/year
  return await prisma.meterReading.findFirst({
    where: {
      roomId,
      status: ReadingStatus.APPROVED,
      OR: [
        { year: { lt: year } },
        {
          year: year,
          month: { lt: month }
        }
      ]
    },
    orderBy: [
      { year: 'desc' },
      { month: 'desc' }
    ]
  });
}

/**
 * Validate meter reading data
 */
const validateMeterReadingData = async (data: CreateMeterReadingData): Promise<void> => {
  // Validate room exists
  const room = await prisma.room.findUnique({
    where: { id: data.roomId }
  });

  if (!room) {
    throw new ValidationError('Room not found');
  }

  // Validate month and year
  if (data.month < 1 || data.month > 12) {
    throw new ValidationError('Month must be between 1 and 12');
  }

  const currentYear = new Date().getFullYear();
  if (data.year < 2020 || data.year > currentYear + 1) {
    throw new ValidationError(`Year must be between 2020 and ${currentYear + 1}`);
  }

  // Validate readings are positive and have correct decimal precision
  if (data.waterReading < 0) {
    throw new ValidationError('Water reading must be positive');
  }

  if (data.electricityReading < 0) {
    throw new ValidationError('Electricity reading must be positive');
  }

  // Check decimal precision (max 1 decimal place)
  const waterStr = data.waterReading.toString();
  const electricityStr = data.electricityReading.toString();

  if (!/^\d+(\.\d{1})?$/.test(waterStr)) {
    throw new ValidationError('Water reading must have at most 1 decimal place');
  }

  if (!/^\d+(\.\d{1})?$/.test(electricityStr)) {
    throw new ValidationError('Electricity reading must have at most 1 decimal place');
  }

  // Note: baseRent validation is now handled when fetching from room table
}

/**
 * Validate unique approved reading per room/month/year
 * Multiple PENDING/REJECTED readings are allowed, but only one APPROVED reading
 */
const validateUniqueReading = async (roomId: number, month: number, year: number): Promise<void> => {
  const existingApprovedReading = await prisma.meterReading.findFirst({
    where: {
      roomId,
      month,
      year,
      status: ReadingStatus.APPROVED
    }
  });

  if (existingApprovedReading) {
    throw new ValidationError(`An approved reading already exists for room ${roomId} in ${month}/${year}`);
  }
}

/**
 * Validate reading progression (no decrease from previous month)
 */
const validateReadingProgression = async (
  roomId: number,
  month: number,
  year: number,
  waterReading: number,
  electricityReading: number
): Promise<void> => {
  const previousReading = await getPreviousMonthReading(roomId, month, year);

  if (previousReading) {
    if (waterReading < previousReading.waterReading.toNumber()) {
      throw new ValidationError(`Water reading (${waterReading}) cannot be less than previous month (${previousReading.waterReading})`);
    }

    if (electricityReading < previousReading.electricityReading.toNumber()) {
      throw new ValidationError(`Electricity reading (${electricityReading}) cannot be less than previous month (${previousReading.electricityReading})`);
    }
  }
}

/**
 * Log modification to audit trail
 */
const logModification = async (
  readingId: string,
  modifiedBy: string,
  modificationType: ModificationType,
  fieldName: string,
  oldValue: string | null,
  newValue: string | null
): Promise<void> => {
  await prisma.readingModification.create({
    data: {
      readingId,
      modifiedBy,
      modificationType,
      fieldName,
      oldValue,
      newValue
    }
  });
}

/**
 * Delete a meter reading (for cleanup purposes)
 */
export const deleteMeterReading = async (id: string): Promise<void> => {
  await prisma.meterReading.delete({
    where: { id }
  });
}

/**
 * Check if user has access to readings for a specific room
 */
const checkUserReadingAccess = async (userId: string, roomId: number): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tenant: {
        select: { roomId: true }
      }
    }
  });

  return user?.tenant?.roomId === roomId;
};
/**

 * Get month name from month number
 */
// const getMonthName = (month: number): string => {
//   const months = [
//     'January', 'February', 'March', 'April', 'May', 'June',
//     'July', 'August', 'September', 'October', 'November', 'December'
//   ];
//   return months[month - 1] || 'Unknown';
// };