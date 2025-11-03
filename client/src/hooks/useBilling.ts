import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import { BillingRecord, ApiResponse } from '@/types';

// Query keys
export const billingKeys = {
  all: ['billing'] as const,
  lists: () => [...billingKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...billingKeys.lists(), { filters }] as const,
  byRoom: (roomId: number) => [...billingKeys.all, 'room', roomId] as const,
  reports: () => [...billingKeys.all, 'reports'] as const,
  calculate: () => [...billingKeys.all, 'calculate'] as const,
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

// Fetch financial reports (admin only)
export const useFinancialReportsQuery = () => {
  return useQuery({
    queryKey: billingKeys.reports(),
    queryFn: async (): Promise<any> => {
      const response = await api.get<ApiResponse<any>>('/billing/reports');
      return response.data.data;
    },
  });
};

// Calculate bill amount
export const useCalculateBillMutation = () => {
  return useMutation({
    mutationFn: async (data: {
      roomId: number;
      waterReading: number;
      electricityReading: number;
      baseRent: number;
    }) => {
      const response = await api.post<ApiResponse<{ totalAmount: number; breakdown: any }>>('/billing/calculate', data);
      return response.data.data;
    },
  });
};