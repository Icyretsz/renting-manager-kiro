// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// File Upload Types
export interface ImageUploadPresignedURLType {
  url: string;
  fileName: string;
}

// Auth Service Types
export interface TenantStatus {
  isLinked: boolean;
  tenant: {
    id: string;
    roomId: number;
    roomNumber: number;
    floor: number;
  } | null;
}

export interface UserProfile {
  id: string;
  auth0Id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  tenantRoom: {
    roomId: number;
    roomNumber: number;
    floor: number;
    moveInDate: string;
  } | null;
}

// Payment Types
export interface PaymentLink {
  checkoutUrl: string;
  qrCode: string;
  orderCode: number;
  amount: number;
  description: string;
}

// Financial Summary and Reports
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
    paymentStatus: string;
    waterUsage: number;
    electricityUsage: number;
    waterCost: number;
    electricityCost: number;
    baseRent: number;
    trashFee: number;
  }>;
}
