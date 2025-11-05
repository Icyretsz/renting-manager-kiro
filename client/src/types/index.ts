// User and Authentication
export interface User {
  id: string;
  auth0Id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  tenant?: Tenant; // Optional - populated if user is also a tenant
  createdAt: Date;
  updatedAt: Date;
}

// Room Management
export interface Room {
  id: number;
  roomNumber: number;
  floor: 1 | 2;
  baseRent: string | number; // Prisma Decimal comes as string
  maxTenants: number;
  tenants: Tenant[];
  occupancyCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tenant {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  roomId: number;
  room?: Room;
  userId?: string; // Optional - links to User if tenant has an account
  user?: User; // Optional - populated when tenant has an account
  moveInDate?: Date;
  moveOutDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Meter Readings
export interface MeterReading {
  id: string;
  roomId: number;
  room?: Room;
  month: number;
  year: number;
  waterReading: string | number; // Prisma Decimal comes as string
  electricityReading: string | number; // Prisma Decimal comes as string
  waterPhotoUrl?: string;
  electricityPhotoUrl?: string;
  baseRent: string | number; // Prisma Decimal comes as string
  trashFee: string | number; // Prisma Decimal comes as string
  totalAmount?: string | number; // Prisma Decimal comes as string
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedBy: string;
  submittedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  modifications: ReadingModification[];
  submitter?: {
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
}

export interface ReadingModification {
  id: string;
  readingId: string;
  modifiedBy: string;
  modifiedAt: Date;
  fieldName: string;
  oldValue?: string;
  newValue?: string;
  modificationType: 'create' | 'update' | 'approve' | 'reject';
  modifier?: {
    id: string;
    name: string;
    email: string;
    role: string;
    tenant?: {
      roomId: number;
      name: string;
    } | null;
  };
}

// Billing
export interface BillingRecord {
  id: string;
  readingId: string;
  roomId: number;
  month: number;
  year: number;
  waterUsage: string | number; // Prisma Decimal comes as string
  electricityUsage: string | number; // Prisma Decimal comes as string
  waterCost: string | number; // Prisma Decimal comes as string
  electricityCost: string | number; // Prisma Decimal comes as string
  baseRent: string | number; // Prisma Decimal comes as string
  trashFee: string | number; // Prisma Decimal comes as string
  totalAmount: string | number; // Prisma Decimal comes as string
  paymentStatus: 'unpaid' | 'paid' | 'overdue';
  paymentDate?: Date;
  createdAt: Date;
}

// Notifications
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  readStatus: boolean;
  createdAt: Date;
}

// Settings
export interface Setting {
  id: number;
  key: string;
  value: string | number; // Prisma Decimal comes as string
  description?: string;
  updatedBy?: string;
  updatedAt: Date;
  createdAt: Date;
}

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