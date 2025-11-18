// ============================================
// CORE DOMAIN TYPES
// ============================================

// User and Authentication
export interface User {
  id: string;
  auth0Id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  readingsSubmitDate?: number | null; // Day of month (1-31) when user can start submitting readings
  readingsSubmitDueDate?: number | null; // Day of month (1-31) deadline for submitting readings
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

export type CurfewStatus = 'NORMAL' | 'PENDING' | 'APPROVED_TEMPORARY' | 'APPROVED_PERMANENT';
export type CurfewModificationType = 'REQUEST' | 'APPROVE' | 'REJECT' | 'RESET' | 'MANUAL_CHANGE';

export interface Tenant {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  fingerprintId?: number;
  permanentAddress?: string;
  roomId: number;
  room?: Room;
  userId?: string; // Optional - links to User if tenant has an account
  user?: User; // Optional - populated when tenant has an account
  moveInDate?: Date;
  moveOutDate?: Date;
  isActive: boolean;
  curfewStatus: CurfewStatus;
  curfewRequestedAt?: Date | null;
  curfewApprovedAt?: Date | null;
  curfewApprovedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CurfewModification {
  id: string;
  tenantId: string;
  modifiedBy: string;
  modifiedAt: Date;
  oldStatus?: CurfewStatus | null;
  newStatus: CurfewStatus;
  modificationType: CurfewModificationType;
  reason?: string | null;
  isPermanent: boolean;
  modifier?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  tenant?: {
    id: string;
    name: string;
    roomId: number;
  };
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
  paymentStatus: 'UNPAID' | 'PAID' | 'OVERDUE';
  paymentDate?: Date;
  paymentReference?: string;
  paymentLinkId?: string;
  paymentTransactionId?: string;
  createdAt: Date;
  room?: {
    id: number;
    roomNumber: number;
    floor: number;
    baseRent: string | number;
  };
  reading?: {
    id: string;
    month: number;
    year: number;
    waterReading: string | number;
    electricityReading: string | number;
    status: string;
    submittedAt: Date;
    approvedAt?: Date;
  };
}

// Notifications
export interface NotificationData {
  roomNumber: string;
  month?: string;
  year?: string;
  action?: string;
  billId?: string;
  tenantId?: string;
  reason?: string;
  amount?: string;
  requesterName?: string;
  requestedName?: string;
  isPermanent?: boolean;
  description?: string;
}

export type NotificationType = 'reading_submitted' | 'reading_updated' | 'reading_modified' | 'reading_approved' | 'reading_rejected' | 'bill_generated' | 'bill_payed' | 'curfew_request' | 'curfew_approved' | 'curfew_rejected' | 'request_submitted' | 'request_approved' | 'request_rejected'

export interface WebsocketNotification {
  id: string;
  userId: string;
  type: NotificationType;
  data: NotificationData;
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

// Request System
export type RequestType = 'CURFEW' | 'REPAIR' | 'OTHER';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Request {
  id: string;
  userId: string;
  roomId: number;
  requestType: RequestType;
  status: RequestStatus;
  description?: string;
  photoUrls: string[];
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  room?: {
    roomNumber: number;
    floor: number;
  };
  approver?: {
    id: string;
    name: string;
    email: string;
  };
  curfewRequest?: CurfewRequest;
}

export interface CurfewRequest {
  id: string;
  requestId: string;
  tenantIds: string[];
  tenantNames?: string[]; // For display purposes in history
  reason?: string;
}

// Utility Types
export type MeterType = 'water' | 'electricity';
export type ImageType = MeterType | 'repair'
export type PresignedURLOperation = 'get' | 'put'

export interface PresignedURLParams {
  operation: PresignedURLOperation
  roomNumber: string
  contentType?: string,
  imageType?: ImageType,
  fileName: string
}

export interface UploadToS3Params {
  presignedUrl: string
  file: File
}

// ============================================
// RE-EXPORTS
// ============================================

// API Types
export type {
  ApiResponse,
  PaginatedResponse,
  ImageUploadPresignedURLType,
  TenantStatus,
  UserProfile,
  PaymentLink,
  FinancialSummary,
  MonthlyFinancialReport,
} from './api';

// User Management Types
export type {
  UserWithTenant,
  LinkingSuggestion,
  SuggestionsResponse,
} from './user';

// Component Props Types
export type {
  // Approvals
  ReadingCardProps,
  FiltersCardProps,
  StatisticsCardsProps,
  ReviewModalProps,
  // Billing
  BillingRecordCardProps,
  BillingFiltersProps,
  FinancialSummaryCardProps,
  PaymentSuccessModalProps,
  ConnectionStatusProps,
  // Meter Readings
  BillCalculation,
  BillCalculationCardProps,
  CurrentMonthReadingCardProps,
  MeterReadingFormProps,
  PreviousReadingCardProps,
  ReadingHistoryModalProps,
  RoomSelectorProps,
  // Rooms
  EditRoomModalProps,
  // User Management
  UserCardProps,
  UserFiltersProps,
  UserGroupsListProps,
  UserModalProps,
  LinkUserTenantModalProps,
  TenantCardProps,
  TenantFiltersProps,
  TenantGroupsListProps,
  TenantModalProps,
  // User Rooms
  RoomCardProps,
  RoomDetailsViewProps,
  // Common
  RefreshButtonProps,
  LanguageSwitcherProps,
  // Notifications
  NotificationPromptProps,
  // Layout
  MainLayoutProps,
  NavItem,
  // Error Boundary
  ErrorBoundaryProps,
  ErrorBoundaryState,
  PageErrorBoundaryProps,
  // Loading
  LoadingSpinnerProps,
  // Protected Route
  ProtectedRouteProps,
  // DevTools
  InvalidateQueriesButtonProps,
} from './components';