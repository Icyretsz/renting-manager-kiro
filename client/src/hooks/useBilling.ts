import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { BillingRecord, ApiResponse, PaginatedResponse, PaymentLink, FinancialSummary, MonthlyFinancialReport } from '@/types';

// Query keys
export const billingKeys = {
  all: ['billing'] as const,
  lists: () => [...billingKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...billingKeys.lists(), { filters }] as const,
  byRoom: (roomId: number) => [...billingKeys.all, 'room', roomId] as const,
  byId: (id: string) => [...billingKeys.all, 'detail', id] as const,
  reports: () => [...billingKeys.all, 'reports'] as const,
  summary: (filters?: Record<string, any>) => [...billingKeys.all, 'summary', filters] as const,
  monthly: (month: number, year: number) => [...billingKeys.all, 'monthly', month, year] as const,
  calculate: () => [...billingKeys.all, 'calculate'] as const,
};

// Payment query keys
export const paymentKeys = {
  all: ['payments'] as const,
  link: (billingRecordId: string) => [...paymentKeys.all, 'link', billingRecordId] as const,
  qrCode: (billingRecordId: string) => [...paymentKeys.all, 'qr', billingRecordId] as const,
};

// Fetch billing records with filters and pagination
export const useBillingRecordsQuery = (filters?: Record<string, any>, page = 1, limit = 10) => {
  return useQuery({
    queryKey: billingKeys.list({ ...filters, page, limit }),
    queryFn: async (): Promise<PaginatedResponse<BillingRecord>> => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      const response = await api.get<PaginatedResponse<BillingRecord>>(`/billing?${params.toString()}`);
      return response.data;
    },
  });
};

// Fetch billing record by ID
export const useBillingRecordQuery = (id: string) => {
  return useQuery({
    queryKey: billingKeys.byId(id),
    queryFn: async (): Promise<BillingRecord> => {
      const response = await api.get<ApiResponse<BillingRecord>>(`/billing/${id}`);
      return response.data.data!;
    },
    enabled: !!id,
  });
};

// Fetch billing history for a room
export const useBillingHistoryQuery = (roomId: number) => {
  return useQuery({
    queryKey: billingKeys.byRoom(roomId),
    queryFn: async (): Promise<BillingRecord[]> => {
      const response = await api.get<ApiResponse<BillingRecord[]>>(`/billing/room/${roomId}`);
      return response.data.data || [];
    },
    enabled: !!roomId,
  });
};

// Fetch financial summary
export const useFinancialSummaryQuery = (filters?: { month?: number; year?: number }) => {
  return useQuery({
    queryKey: billingKeys.summary(filters),
    queryFn: async (): Promise<FinancialSummary> => {
      const params = new URLSearchParams();
      if (filters?.month) params.append('month', filters.month.toString());
      if (filters?.year) params.append('year', filters.year.toString());
      
      const response = await api.get<ApiResponse<FinancialSummary>>(`/billing/summary?${params.toString()}`);
      return response.data.data!;
    },
  });
};

// Fetch monthly financial report
export const useMonthlyFinancialReportQuery = (month: number, year: number) => {
  return useQuery({
    queryKey: billingKeys.monthly(month, year),
    queryFn: async (): Promise<MonthlyFinancialReport> => {
      const response = await api.get<ApiResponse<MonthlyFinancialReport>>(`/billing/monthly?month=${month}&year=${year}`);
      return response.data.data!;
    },
    enabled: !!month && !!year,
  });
};

// Fetch yearly trend data for financial dashboard
export const useYearlyTrendDataQuery = (year: number) => {
  return useQuery({
    queryKey: [...billingKeys.all, 'yearly-trend', year],
    queryFn: async (): Promise<Array<{
      month: number;
      monthName: string;
      totalIncome: number;
      totalPaid: number;
      totalUnpaid: number;
      totalOverdue: number;
    }>> => {
      const response = await api.get<ApiResponse<any>>(`/billing/yearly-trend?year=${year}`);
      return response.data.data!;
    },
    enabled: !!year,
  });
};

// Calculate bill amount
export const useCalculateBillMutation = () => {
  return useMutation({
    mutationFn: async (data: {
      roomId: number;
      month: number;
      year: number;
      waterReading: number;
      electricityReading: number;
      baseRent: number;
    }) => {
      const response = await api.post<ApiResponse<{ totalAmount: number; breakdown: any }>>('/billing/calculate', data);
      return response.data.data;
    },
  });
};

// Generate payment link
export const useGeneratePaymentLinkMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (billingRecordId: string): Promise<PaymentLink> => {
      const response = await api.post<ApiResponse<PaymentLink>>(`/payments/billing/${billingRecordId}/payment-link`);
      return response.data.data!;
    },
    onSuccess: (_, billingRecordId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: paymentKeys.link(billingRecordId) });
      queryClient.invalidateQueries({ queryKey: billingKeys.byId(billingRecordId) });
    },
  });
};

// Get fresh QR code for unpaid bill
export const useFreshQRCodeQuery = (billingRecordId: string, enabled = false) => {
  return useQuery({
    queryKey: paymentKeys.qrCode(billingRecordId),
    queryFn: async (): Promise<{ qrCode: string }> => {
      const response = await api.get<ApiResponse<{ qrCode: string }>>(`/payments/billing/${billingRecordId}/qr-code`);
      return response.data.data!;
    },
    enabled: enabled && !!billingRecordId,
    staleTime: 0, // Always fetch fresh QR code
    gcTime: 0, // Don't cache QR codes
  });
};

// Update payment status
export const useUpdatePaymentStatusMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, paymentStatus, paymentDate }: { 
      id: string; 
      paymentStatus: 'UNPAID' | 'PAID' | 'OVERDUE'; 
      paymentDate?: Date 
    }) => {
      const response = await api.put<ApiResponse<BillingRecord>>(`/billing/${id}/payment-status`, {
        paymentStatus,
        paymentDate,
      });
      return response.data.data!;
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: billingKeys.byId(data.id) });
      queryClient.invalidateQueries({ queryKey: billingKeys.byRoom(data.roomId) });
      queryClient.invalidateQueries({ queryKey: billingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: billingKeys.summary() });
    },
  });
};

// Export financial data
export const useExportFinancialDataMutation = () => {
  return useMutation({
    mutationFn: async (filters?: Record<string, any>): Promise<Blob> => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }
      
      const response = await api.get(`/billing/export?${params.toString()}`, {
        responseType: 'blob',
      });
      return response.data;
    },
  });
};