// User and Authentication
export interface User {
  id: string;
  auth0Id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

// Room Management
export interface Room {
  id: number;
  roomNumber: number;
  floor: 1 | 2;
  baseRent: number;
  maxTenants: number;
  currentTenants: Tenant[];
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
  waterReading: number;
  electricityReading: number;
  waterPhotoUrl?: string;
  electricityPhotoUrl?: string;
  baseRent: number;
  trashFee: number;
  totalAmount?: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  submittedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  modifications: ReadingModification[];
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
  user?: User;
}

// Billing
export interface BillingRecord {
  id: string;
  readingId: string;
  roomId: number;
  month: number;
  year: number;
  waterUsage: number;
  electricityUsage: number;
  waterCost: number;
  electricityCost: number;
  baseRent: number;
  trashFee: number;
  totalAmount: number;
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