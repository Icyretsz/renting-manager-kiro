import { prisma } from '../config/database';
import { BillingRecord, PaymentStatus, MeterReading, ReadingStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { AppError, ValidationError } from '../utils/errors';

export interface BillingRecordWithDetails extends BillingRecord {
  room: {
    id: number;
    roomNumber: number;
    floor: number;
    baseRent: Prisma.Decimal;
  };
  reading: {
    id: string;
    month: number;
    year: number;
    waterReading: Prisma.Decimal;
    electricityReading: Prisma.Decimal;
    status: ReadingStatus;
    submittedAt: Date;
    approvedAt: Date | null;
  };
}

export interface BillingCalculation {
  waterUsage: number;
  electricityUsage: number;
  waterCost: number;
  electricityCost: number;
  baseRent: number;
  trashFee: number;
  totalAmount: number;
}

export interface FinancialSummary {
  totalIncome: number;
  totalPaid: number;
  totalUnpaid: number;
  totalOverdue: number;
  roomCount: number;
  occupiedRooms: number;
  averageRoomIncome: number;
}

export interface MonthlyFinancialReport {
  month: number;
  year: number;
  totalIncome: number;
  totalPaid: number;
  totalUnpaid: number;
  totalOverdue: number;
  roomBreakdown: Array<{
    roomId: number;
    roomNumber: number;
    floor: number;
    totalAmount: number;
    paymentStatus: PaymentStatus;
    waterUsage: number;
    electricityUsage: number;
    waterCost: number;
    electricityCost: number;
    baseRent: number;
    trashFee: number;
  }>;
}

export interface YearlyFinancialReport {
  year: number;
  totalIncome: number;
  totalPaid: number;
  totalUnpaid: number;
  totalOverdue: number;
  monthlyBreakdown: Array<{
    month: number;
    totalIncome: number;
    totalPaid: number;
    totalUnpaid: number;
    totalOverdue: number;
  }>;
}

export interface BillingFilters {
  roomId?: number;
  month?: number;
  year?: number;
  paymentStatus?: PaymentStatus;
  floor?: number;
}

export class BillingService {
  // Fixed rates as per requirements
  private static readonly ELECTRICITY_RATE = 3500;
  private static readonly WATER_RATE = 22000;
  private static readonly TRASH_FEE = 52000;

  /**
   * Generate billing record from approved meter reading
   */
  async generateBillingRecord(readingId: string): Promise<BillingRecordWithDetails> {
    const reading = await prisma.meterReading.findUnique({
      where: { id: readingId },
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
            floor: true,
            baseRent: true
          }
        }
      }
    });

    if (!reading) {
      throw new AppError('Meter reading not found', 404);
    }

    if (reading.status !== ReadingStatus.APPROVED) {
      throw new ValidationError('Can only generate billing records for approved readings');
    }

    // Check if billing record already exists
    const existingBilling = await prisma.billingRecord.findUnique({
      where: { readingId }
    });

    if (existingBilling) {
      throw new ValidationError('Billing record already exists for this reading');
    }

    // Calculate usage and costs
    const calculation = await this.calculateBilling(
      reading.roomId,
      reading.month,
      reading.year,
      reading.waterReading.toNumber(),
      reading.electricityReading.toNumber(),
      reading.baseRent.toNumber()
    );

    // Create billing record
    const billingRecord = await prisma.billingRecord.create({
      data: {
        readingId,
        roomId: reading.roomId,
        month: reading.month,
        year: reading.year,
        waterUsage: calculation.waterUsage,
        electricityUsage: calculation.electricityUsage,
        waterCost: calculation.waterCost,
        electricityCost: calculation.electricityCost,
        baseRent: calculation.baseRent,
        trashFee: calculation.trashFee,
        totalAmount: calculation.totalAmount,
        paymentStatus: PaymentStatus.UNPAID
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
        reading: {
          select: {
            id: true,
            month: true,
            year: true,
            waterReading: true,
            electricityReading: true,
            status: true,
            submittedAt: true,
            approvedAt: true
          }
        }
      }
    });

    return billingRecord;
  }

  /**
   * Calculate billing amounts based on meter readings
   */
  async calculateBilling(
    roomId: number,
    month: number,
    year: number,
    waterReading: number,
    electricityReading: number,
    baseRent: number
  ): Promise<BillingCalculation> {
    // Get previous month's reading for usage calculation
    const previousReading = await this.getPreviousMonthReading(roomId, month, year);
    
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
    const electricityCost = electricityUsage * BillingService.ELECTRICITY_RATE;
    const waterCost = waterUsage * BillingService.WATER_RATE;
    const trashFee = BillingService.TRASH_FEE;
    const totalAmount = electricityCost + waterCost + baseRent + trashFee;

    return {
      waterUsage,
      electricityUsage,
      waterCost,
      electricityCost,
      baseRent,
      trashFee,
      totalAmount
    };
  }

  /**
   * Calculate real-time bill amount for user interface
   */
  async calculateRealtimeBill(
    roomId: number,
    month: number,
    year: number,
    waterReading: number,
    electricityReading: number,
    baseRent: number
  ): Promise<BillingCalculation> {
    return await this.calculateBilling(roomId, month, year, waterReading, electricityReading, baseRent);
  }

  /**
   * Get billing record by ID
   */
  async getBillingRecordById(id: string, userRole: string, userId?: string): Promise<BillingRecordWithDetails | null> {
    const billingRecord = await prisma.billingRecord.findUnique({
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
        reading: {
          select: {
            id: true,
            month: true,
            year: true,
            waterReading: true,
            electricityReading: true,
            status: true,
            submittedAt: true,
            approvedAt: true
          }
        }
      }
    });

    if (!billingRecord) {
      return null;
    }

    // Check access permissions for regular users
    if (userRole === 'USER' && userId) {
      const hasAccess = await this.checkUserBillingAccess(userId, billingRecord.roomId);
      if (!hasAccess) {
        throw new AppError('Access denied to this billing record', 403);
      }
    }

    return billingRecord;
  }

  /**
   * Get billing records with filters and pagination
   */
  async getBillingRecords(
    filters: BillingFilters,
    userRole: string,
    userId?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    billingRecords: BillingRecordWithDetails[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const whereClause: any = { ...filters };

    // Filter by user access for regular users
    if (userRole === 'USER' && userId) {
      const userRooms = await prisma.userRoomAssignment.findMany({
        where: { userId },
        select: { roomId: true }
      });
      const roomIds = userRooms.map(assignment => assignment.roomId);
      whereClause.roomId = { in: roomIds };
    }

    // Filter by floor if specified
    if (filters.floor) {
      whereClause.room = {
        floor: filters.floor
      };
    }

    const [billingRecords, total] = await Promise.all([
      prisma.billingRecord.findMany({
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
          reading: {
            select: {
              id: true,
              month: true,
              year: true,
              waterReading: true,
              electricityReading: true,
              status: true,
              submittedAt: true,
              approvedAt: true
            }
          }
        },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.billingRecord.count({ where: whereClause })
    ]);

    return {
      billingRecords,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get billing history for a specific room
   */
  async getRoomBillingHistory(roomId: number, userRole: string, userId?: string): Promise<BillingRecordWithDetails[]> {
    // Check access permissions for regular users
    if (userRole === 'USER' && userId) {
      const hasAccess = await this.checkUserBillingAccess(userId, roomId);
      if (!hasAccess) {
        throw new AppError('Access denied to this room', 403);
      }
    }

    return await prisma.billingRecord.findMany({
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
        reading: {
          select: {
            id: true,
            month: true,
            year: true,
            waterReading: true,
            electricityReading: true,
            status: true,
            submittedAt: true,
            approvedAt: true
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    });
  }

  /**
   * Update payment status of a billing record
   */
  async updatePaymentStatus(
    id: string,
    paymentStatus: PaymentStatus,
    paymentDate?: Date
  ): Promise<BillingRecordWithDetails> {
    const billingRecord = await prisma.billingRecord.findUnique({
      where: { id }
    });

    if (!billingRecord) {
      throw new AppError('Billing record not found', 404);
    }

    const updateData: any = { paymentStatus };
    
    if (paymentStatus === PaymentStatus.PAID && paymentDate) {
      updateData.paymentDate = paymentDate;
    } else if (paymentStatus !== PaymentStatus.PAID) {
      updateData.paymentDate = null;
    }

    const updatedRecord = await prisma.billingRecord.update({
      where: { id },
      data: updateData,
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
            floor: true,
            baseRent: true
          }
        },
        reading: {
          select: {
            id: true,
            month: true,
            year: true,
            waterReading: true,
            electricityReading: true,
            status: true,
            submittedAt: true,
            approvedAt: true
          }
        }
      }
    });

    return updatedRecord;
  }

  /**
   * Mark overdue payments
   */
  async markOverduePayments(dueDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - dueDays);

    const result = await prisma.billingRecord.updateMany({
      where: {
        paymentStatus: PaymentStatus.UNPAID,
        createdAt: {
          lt: cutoffDate
        }
      },
      data: {
        paymentStatus: PaymentStatus.OVERDUE
      }
    });

    return result.count;
  }

  /**
   * Get financial summary
   */
  async getFinancialSummary(
    month?: number,
    year?: number,
    userRole?: string,
    userId?: string
  ): Promise<FinancialSummary> {
    const whereClause: any = {};

    if (month && year) {
      whereClause.month = month;
      whereClause.year = year;
    }

    // Filter by user access for regular users
    if (userRole === 'USER' && userId) {
      const userRooms = await prisma.userRoomAssignment.findMany({
        where: { userId },
        select: { roomId: true }
      });
      const roomIds = userRooms.map(assignment => assignment.roomId);
      whereClause.roomId = { in: roomIds };
    }

    const [billingRecords, totalRooms, occupiedRooms] = await Promise.all([
      prisma.billingRecord.findMany({
        where: whereClause,
        select: {
          totalAmount: true,
          paymentStatus: true
        }
      }),
      prisma.room.count(),
      prisma.room.count({
        where: {
          tenants: {
            some: {
              isActive: true
            }
          }
        }
      })
    ]);

    const totalIncome = billingRecords.reduce((sum, record) => sum + record.totalAmount.toNumber(), 0);
    const totalPaid = billingRecords
      .filter(record => record.paymentStatus === PaymentStatus.PAID)
      .reduce((sum, record) => sum + record.totalAmount.toNumber(), 0);
    const totalUnpaid = billingRecords
      .filter(record => record.paymentStatus === PaymentStatus.UNPAID)
      .reduce((sum, record) => sum + record.totalAmount.toNumber(), 0);
    const totalOverdue = billingRecords
      .filter(record => record.paymentStatus === PaymentStatus.OVERDUE)
      .reduce((sum, record) => sum + record.totalAmount.toNumber(), 0);

    const averageRoomIncome = occupiedRooms > 0 ? totalIncome / occupiedRooms : 0;

    return {
      totalIncome,
      totalPaid,
      totalUnpaid,
      totalOverdue,
      roomCount: totalRooms,
      occupiedRooms,
      averageRoomIncome
    };
  }

  /**
   * Get monthly financial report
   */
  async getMonthlyFinancialReport(
    month: number,
    year: number,
    userRole?: string,
    userId?: string
  ): Promise<MonthlyFinancialReport> {
    const whereClause: any = { month, year };

    // Filter by user access for regular users
    if (userRole === 'USER' && userId) {
      const userRooms = await prisma.userRoomAssignment.findMany({
        where: { userId },
        select: { roomId: true }
      });
      const roomIds = userRooms.map(assignment => assignment.roomId);
      whereClause.roomId = { in: roomIds };
    }

    const billingRecords = await prisma.billingRecord.findMany({
      where: whereClause,
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
            floor: true
          }
        }
      },
      orderBy: [
        { room: { floor: 'asc' } },
        { room: { roomNumber: 'asc' } }
      ]
    });

    const totalIncome = billingRecords.reduce((sum, record) => sum + record.totalAmount.toNumber(), 0);
    const totalPaid = billingRecords
      .filter(record => record.paymentStatus === PaymentStatus.PAID)
      .reduce((sum, record) => sum + record.totalAmount.toNumber(), 0);
    const totalUnpaid = billingRecords
      .filter(record => record.paymentStatus === PaymentStatus.UNPAID)
      .reduce((sum, record) => sum + record.totalAmount.toNumber(), 0);
    const totalOverdue = billingRecords
      .filter(record => record.paymentStatus === PaymentStatus.OVERDUE)
      .reduce((sum, record) => sum + record.totalAmount.toNumber(), 0);

    const roomBreakdown = billingRecords.map(record => ({
      roomId: record.roomId,
      roomNumber: record.room.roomNumber,
      floor: record.room.floor,
      totalAmount: record.totalAmount.toNumber(),
      paymentStatus: record.paymentStatus,
      waterUsage: record.waterUsage.toNumber(),
      electricityUsage: record.electricityUsage.toNumber(),
      waterCost: record.waterCost.toNumber(),
      electricityCost: record.electricityCost.toNumber(),
      baseRent: record.baseRent.toNumber(),
      trashFee: record.trashFee.toNumber()
    }));

    return {
      month,
      year,
      totalIncome,
      totalPaid,
      totalUnpaid,
      totalOverdue,
      roomBreakdown
    };
  }

  /**
   * Get yearly financial report
   */
  async getYearlyFinancialReport(
    year: number,
    userRole?: string,
    userId?: string
  ): Promise<YearlyFinancialReport> {
    const whereClause: any = { year };

    // Filter by user access for regular users
    if (userRole === 'USER' && userId) {
      const userRooms = await prisma.userRoomAssignment.findMany({
        where: { userId },
        select: { roomId: true }
      });
      const roomIds = userRooms.map(assignment => assignment.roomId);
      whereClause.roomId = { in: roomIds };
    }

    const billingRecords = await prisma.billingRecord.findMany({
      where: whereClause,
      select: {
        month: true,
        totalAmount: true,
        paymentStatus: true
      },
      orderBy: {
        month: 'asc'
      }
    });

    const totalIncome = billingRecords.reduce((sum, record) => sum + record.totalAmount.toNumber(), 0);
    const totalPaid = billingRecords
      .filter(record => record.paymentStatus === PaymentStatus.PAID)
      .reduce((sum, record) => sum + record.totalAmount.toNumber(), 0);
    const totalUnpaid = billingRecords
      .filter(record => record.paymentStatus === PaymentStatus.UNPAID)
      .reduce((sum, record) => sum + record.totalAmount.toNumber(), 0);
    const totalOverdue = billingRecords
      .filter(record => record.paymentStatus === PaymentStatus.OVERDUE)
      .reduce((sum, record) => sum + record.totalAmount.toNumber(), 0);

    // Group by month for monthly breakdown
    const monthlyData: { [key: number]: { totalIncome: number; totalPaid: number; totalUnpaid: number; totalOverdue: number } } = {};
    
    for (let month = 1; month <= 12; month++) {
      monthlyData[month] = { totalIncome: 0, totalPaid: 0, totalUnpaid: 0, totalOverdue: 0 };
    }

    billingRecords.forEach(record => {
      const month = record.month;
      const amount = record.totalAmount.toNumber();
      
      if (monthlyData[month]) {
        monthlyData[month].totalIncome += amount;
        
        if (record.paymentStatus === PaymentStatus.PAID) {
          monthlyData[month].totalPaid += amount;
        } else if (record.paymentStatus === PaymentStatus.UNPAID) {
          monthlyData[month].totalUnpaid += amount;
        } else if (record.paymentStatus === PaymentStatus.OVERDUE) {
          monthlyData[month].totalOverdue += amount;
        }
      }
    });

    const monthlyBreakdown = Object.entries(monthlyData).map(([month, data]) => ({
      month: parseInt(month),
      ...data
    }));

    return {
      year,
      totalIncome,
      totalPaid,
      totalUnpaid,
      totalOverdue,
      monthlyBreakdown
    };
  }

  /**
   * Export financial data to CSV format
   */
  async exportFinancialData(
    filters: BillingFilters,
    userRole?: string,
    userId?: string
  ): Promise<string> {
    const { billingRecords } = await this.getBillingRecords(filters, userRole || 'ADMIN', userId, 1, 10000);

    const headers = [
      'Room Number',
      'Floor',
      'Month',
      'Year',
      'Water Usage',
      'Electricity Usage',
      'Water Cost',
      'Electricity Cost',
      'Base Rent',
      'Trash Fee',
      'Total Amount',
      'Payment Status',
      'Payment Date',
      'Created At'
    ];

    const csvRows = [headers.join(',')];

    billingRecords.forEach(record => {
      const row = [
        record.room.roomNumber,
        record.room.floor,
        record.month,
        record.year,
        record.waterUsage.toNumber(),
        record.electricityUsage.toNumber(),
        record.waterCost.toNumber(),
        record.electricityCost.toNumber(),
        record.baseRent.toNumber(),
        record.trashFee.toNumber(),
        record.totalAmount.toNumber(),
        record.paymentStatus,
        record.paymentDate ? record.paymentDate.toISOString().split('T')[0] : '',
        record.createdAt.toISOString().split('T')[0]
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Get previous month's reading for a room
   */
  private async getPreviousMonthReading(roomId: number, month: number, year: number): Promise<MeterReading | null> {
    let prevMonth = month - 1;
    let prevYear = year;

    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = year - 1;
    }

    return await prisma.meterReading.findUnique({
      where: {
        roomId_month_year: {
          roomId,
          month: prevMonth,
          year: prevYear
        }
      }
    });
  }

  /**
   * Check if user has access to billing records for a specific room
   */
  private async checkUserBillingAccess(userId: string, roomId: number): Promise<boolean> {
    const assignment = await prisma.userRoomAssignment.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId
        }
      }
    });

    return !!assignment;
  }
}

export const billingService = new BillingService();