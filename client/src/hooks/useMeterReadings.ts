import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth0 } from '@auth0/auth0-react';
import api from '@/services/api';
import { MeterReading, ApiResponse } from '@/types';

// Query keys
export const meterReadingKeys = {
  all: ['meterReadings'] as const,
  lists: () => [...meterReadingKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...meterReadingKeys.lists(), { filters }] as const,
  details: () => [...meterReadingKeys.all, 'detail'] as const,
  detail: (id: string) => [...meterReadingKeys.details(), id] as const,
  byRoom: (roomId: number) => [...meterReadingKeys.all, 'room', roomId] as const,
  pending: () => [...meterReadingKeys.all, 'pending'] as const,
};

// Fetch meter readings for a room
export const useMeterReadingsQuery = (roomId: number) => {
  const { isAuthenticated, user } = useAuth0();

  return useQuery({
    queryKey: meterReadingKeys.byRoom(roomId),
    queryFn: async (): Promise<MeterReading[]> => {
      const response = await api.get<ApiResponse<MeterReading[]>>(`/readings/room/${roomId}/history`);
      return response.data.data || [];
    },
    enabled: !!roomId && isAuthenticated && !!user,
  });
};

// Fetch pending readings (admin only) - DEPRECATED: Use useAllReadingsQuery instead
export const usePendingReadingsQuery = () => {
  const { isAuthenticated, user } = useAuth0();

  return useQuery({
    queryKey: meterReadingKeys.pending(),
    queryFn: async (): Promise<MeterReading[]> => {
      const response = await api.get<ApiResponse<MeterReading[]>>(
        '/readings/pending/all'
      );
      return response.data.data || [];
    },
    enabled: isAuthenticated && !!user && user.role === 'ADMIN',
  });
};

// Fetch all readings for admin approval (admin only)
export const useAllReadingsQuery = () => {
  const { isAuthenticated, user } = useAuth0();

  return useQuery({
    queryKey: [...meterReadingKeys.all, 'admin-all'],
    queryFn: async (): Promise<MeterReading[]> => {
      const response = await api.get<ApiResponse<MeterReading[]>>('/readings/');
      return response.data.data || [];
    },
    enabled: isAuthenticated && !!user && user.role === 'ADMIN',
    staleTime: 30000, // 30 seconds
  });
};

// Submit meter reading mutation
export const useSubmitMeterReadingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      roomId: number;
      month: number;
      year: number;
      waterReading: number;
      electricityReading: number;
      waterPhotoUrl?: string;
      electricityPhotoUrl?: string;
    }) => {
      const response = await api.post<ApiResponse<MeterReading>>('/readings', data);
      return response.data.data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: meterReadingKeys.all });
      if (data?.roomId) {
        queryClient.invalidateQueries({ queryKey: meterReadingKeys.byRoom(data.roomId) });
      }
    },
  });
};

// Update meter reading mutation
export const useUpdateMeterReadingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ readingId, data }: { readingId: string; data: Partial<MeterReading> }) => {
      const response = await api.put<ApiResponse<MeterReading>>(`/readings/${readingId}`, data);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and update queries
      queryClient.invalidateQueries({ queryKey: meterReadingKeys.all });
      queryClient.setQueryData(meterReadingKeys.detail(variables.readingId), data);
      if (data?.roomId) {
        queryClient.invalidateQueries({ queryKey: meterReadingKeys.byRoom(data.roomId) });
      }
    },
  });
};

// Approve reading mutation
export const useApproveReadingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (readingId: string) => {
      const response = await api.post<ApiResponse<MeterReading>>(`/readings/${readingId}/approve`);
      return response.data.data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: meterReadingKeys.all });
      if (data?.roomId) {
        queryClient.invalidateQueries({ queryKey: meterReadingKeys.byRoom(data.roomId) });
      }
    },
  });
};

// Reject reading mutation
export const useRejectReadingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (readingId: string) => {
      const response = await api.post<ApiResponse<MeterReading>>(`/readings/${readingId}/reject`);
      return response.data.data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: meterReadingKeys.all });
      if (data?.roomId) {
        queryClient.invalidateQueries({ queryKey: meterReadingKeys.byRoom(data.roomId) });
      }
    },
  });
};

