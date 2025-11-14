import { ReactNode } from 'react';
import { UploadFile } from 'antd';

// Import from index to avoid circular dependencies
import type {
  MeterReading,
  BillingRecord,
  Room,
  Tenant,
  MeterType,
  UserWithTenant,
} from './index';

// Approvals Components
export interface ReadingCardProps {
  reading: MeterReading;
  onReview: (reading: MeterReading) => void;
  onApprove: (readingId: string) => void;
  approveLoading: boolean;
  getStatusColor: (status: string) => string;
}

export interface FiltersCardProps {
  filterStatus: string;
  sortBy: string;
  onFilterStatusChange: (value: string) => void;
  onSortByChange: (value: string) => void;
}

export interface StatisticsCardsProps {
  pendingCount: number;
  totalCount: number;
  approvedTodayCount: number;
}

export interface ReviewModalProps {
  visible: boolean;
  reading: MeterReading | null;
  onClose: () => void;
  onApprove: (readingId: string) => void;
  onReject: (readingId: string) => void;
  approveLoading: boolean;
  rejectLoading: boolean;
  getStatusColor: (status: string) => string;
}

// Billing Components
export interface BillingRecordCardProps {
  record: BillingRecord;
  isAdmin: boolean;
  onViewDetails: (record: BillingRecord) => void;
  onGenerateQRCode: (record: BillingRecord) => void;
  getPaymentStatusColor: (status: string) => "success" | "error" | "warning" | "default";
  formatCurrency: (amount: string | number) => string;
  getMonthName: (month: number) => string;
}

export interface BillingFiltersProps {
  isAdmin: boolean;
  onStatusChange: (value: string | undefined) => void;
  onRoomChange: (value: number | undefined) => void;
  onFloorChange: (value: number | undefined) => void;
  onMonthChange: (date: any) => void;
  onExport: () => void;
  exportLoading: boolean;
}

export interface FinancialSummaryCardProps {
  summary: {
    totalIncome: number;
    totalPaid: number;
    totalUnpaid: number;
    totalOverdue: number;
    roomCount: number;
    occupiedRooms: number;
    averageRoomIncome: number;
  };
  formatCurrency: (amount: string | number) => string;
}

export interface PaymentSuccessModalProps {
  open: boolean;
  billingRecord: BillingRecord | null;
  onClose: () => void;
  formatCurrency: (amount: string | number) => string;
  getMonthName: (month: number) => string;
}

export interface ConnectionStatusProps {
  isConnected: boolean;
  isPolling: boolean;
}

// Meter Readings Components
export interface BillCalculation {
  totalBill: number;
  electricityUsage: number;
  waterUsage: number;
  electricityBill: number;
  waterBill: number;
}

export interface BillCalculationCardProps {
  calculatedBill: BillCalculation;
  waterRate: number;
  electricityRate: number;
  trashFee: number;
  baseRent: number;
}

export interface CurrentMonthReadingCardProps {
  reading: MeterReading;
  currentMonth: number;
  currentYear: number;
  submissionCount: number;
  isAdmin: boolean;
  canAdminOverride: boolean;
  canCreateNewReading: boolean;
}

export interface MeterReadingFormProps {
  form: any;
  previousReading: MeterReading | null;
  currentRoom: Room | null;
  calculatedBill: BillCalculation;
  waterRate: number;
  electricityRate: number;
  trashFee: number;
  canEdit: boolean;
  canAdminOverride: boolean;
  canCreateNew: boolean;
  hasApprovedReading: boolean;
  hasPendingReading: boolean;
  selectedRoomId: number | null;
  uploadLoading: boolean;
  submitLoading: boolean;
  onPhotoUpload: (file: File, type: MeterType) => Promise<boolean>;
  onSubmit: (values: any) => Promise<void>;
  onValuesChange: () => void;
  waterPhotoList: UploadFile[];
  setWaterPhotoList: (waterPhotoList: React.SetStateAction<UploadFile[]>) => void;
  electricityPhotoList: UploadFile[];
  setElectricityPhotoList: (electricityPhotoList: React.SetStateAction<UploadFile[]>) => void;
}

export interface PreviousReadingCardProps {
  reading: MeterReading;
}

export interface ReadingHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  readings: MeterReading[];
  loading?: boolean;
  roomNumber?: number;
}

export interface RoomSelectorProps {
  rooms: Room[] | undefined;
  selectedRoomId: number | null;
  onRoomChange: (roomId: number) => void;
  isAdmin: boolean;
  userRoomId?: number;
  loading?: boolean;
}

// Room Components
export interface EditRoomModalProps {
  room: Room | null;
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

// User Management Components
export interface UserCardProps {
  user: UserWithTenant;
  onEdit: (user: UserWithTenant) => void;
  onDelete: (userId: string) => void;
  onLink: (user: UserWithTenant) => void;
  onUnlink: (user: UserWithTenant) => void;
}

export interface UserFiltersProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  onAddUser: () => void;
}

export interface UserGroupsListProps {
  users: UserWithTenant[];
  onEdit: (user: UserWithTenant) => void;
  onDelete: (userId: string) => void;
  onLink: (user: UserWithTenant) => void;
  onUnlink: (user: UserWithTenant) => void;
}

export interface UserModalProps {
  visible: boolean;
  user: UserWithTenant | null;
  form: any;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
}

export interface LinkUserTenantModalProps {
  visible: boolean;
  user: UserWithTenant | null;
  availableTenants: Tenant[];
  form: any;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
}

export interface TenantCardProps {
  tenant: Tenant;
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenantId: string) => void;
}

export interface TenantFiltersProps {
  searchText: string;
  filterRoom?: number;
  filterStatus?: string;
  onSearchChange: (value: string) => void;
  onRoomChange: (value: number | undefined) => void;
  onStatusChange: (value: string | undefined) => void;
  onAddTenant: () => void;
}

export interface TenantGroupsListProps {
  tenants: Tenant[];
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenantId: string) => void;
}

export interface TenantModalProps {
  visible: boolean;
  tenant: Tenant | null;
  form: any;
  rooms: Room[] | undefined;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
}

// User Rooms Components
export interface RoomCardProps {
  room: Room;
  waterRate: number;
  electricityRate: number;
  trashFee: number;
}

export interface RoomDetailsViewProps {
  room: Room;
  waterRate: number;
  electricityRate: number;
  trashFee: number;
}

// Common Components
export interface RefreshButtonProps {
  queryKeys: readonly (readonly (string | number | Record<string, any>)[])[];
  tooltip?: string;
  size?: 'small' | 'middle' | 'large';
  type?: 'default' | 'primary' | 'text' | 'link';
  className?: string;
  cooldownSeconds?: number;
}

export interface LanguageSwitcherProps {
  className?: string;
}

// Notifications Components
export interface NotificationPromptProps {
  onDismiss?: () => void;
}

// Layout Components
export interface MainLayoutProps {
  children: ReactNode;
}

export interface NavItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path: string;
  adminOnly?: boolean;
  badge?: number;
}

// Error Boundary Components
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export interface PageErrorBoundaryProps {
  children: React.ReactNode;
}

// Loading Components
export interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large';
  message?: string;
  fullScreen?: boolean;
}

// Protected Route Components
export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireTenantLink?: boolean;
}

// DevTools Components
export interface InvalidateQueriesButtonProps {
  className?: string;
}
