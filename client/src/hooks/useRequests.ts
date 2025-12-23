import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth0 } from '@auth0/auth0-react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import { Request as UserRequest, ApiResponse } from '@/types';

// Query keys
export const requestKeys = {
  all: ['requests'] as const,
  lists: () => [...requestKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...requestKeys.lists(), { filters }] as const,
  details: () => [...requestKeys.all, 'detail'] as const,
  detail: (id: string) => [...requestKeys.details(), id] as const,
  myRequests: () => [...requestKeys.all, 'my'] as const,
  pending: () => [...requestKeys.all, 'pending'] as const,
  allRequests: (filters?: any) => [...requestKeys.all, 'all', filters] as const,
};

// Create a new request
export const useCreateRequestMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (data: {
      requestType: string;
      description?: string;
      photoUrls?: string[];
      tenantIds?: string[];
      reason?: string;
    }) => {
      const response = await api.post<ApiResponse<UserRequest>>('/requests', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.all });
      message.success(t('request.createSuccess'));
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || t('request.createError'));
    },
  });
};

// Get user's own requests
export const useMyRequestsQuery = () => {
  const { isAuthenticated, user } = useAuth0();

  return useQuery({
    queryKey: requestKeys.myRequests(),
    queryFn: async (): Promise<UserRequest[]> => {
      const response = await api.get<ApiResponse<UserRequest[]>>(
        '/requests/my-requests'
      );
      return response.data.data || [];
    },
    enabled: isAuthenticated && !!user,
    staleTime: 30000, // 30 seconds
  });
};

// Get pending requests (Admin only)
export const usePendingRequestsQuery = () => {
  const { isAuthenticated, user } = useAuth0();

  return useQuery({
    queryKey: requestKeys.pending(),
    queryFn: async (): Promise<UserRequest[]> => {
      const response =
        await api.get<ApiResponse<UserRequest[]>>('/requests/pending');
      return response.data.data || [];
    },
    enabled: isAuthenticated && !!user && user.roleType[0] === 'ADMIN',
    staleTime: 30000, // 30 seconds
  });
};

// Get all requests with filters (Admin only)
export const useAllRequestsQuery = (filters?: {
  status?: string;
  requestType?: string;
  roomId?: number;
}) => {
  const { isAuthenticated, user } = useAuth0();

  return useQuery({
    queryKey: requestKeys.allRequests(filters),
    queryFn: async (): Promise<UserRequest[]> => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.requestType)
        params.append('requestType', filters.requestType);
      if (filters?.roomId) params.append('roomId', filters.roomId.toString());

      const response = await api.get<ApiResponse<UserRequest[]>>(
        `/requests/all?${params.toString()}`
      );
      return response.data.data || [];
    },
    enabled: isAuthenticated && !!user && user.role === 'ADMIN',
    staleTime: 30000, // 30 seconds
  });
};

// Approve a request (Admin only)
export const useApproveRequestMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (data: { requestId: string; isPermanent?: boolean }) => {
      const response = await api.post<ApiResponse<UserRequest>>(
        `/requests/${data.requestId}/approve`,
        {
          isPermanent: data.isPermanent,
        }
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: requestKeys.all });
      if (data?.id) {
        queryClient.setQueryData(requestKeys.detail(data.id), data);
      }
      message.success(t('request.approveSuccess'));
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || t('request.approveError'));
    },
  });
};

// Reject a request (Admin only)
export const useRejectRequestMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (data: { requestId: string; reason?: string }) => {
      const response = await api.post<ApiResponse<UserRequest>>(
        `/requests/${data.requestId}/reject`,
        {
          reason: data.reason,
        }
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: requestKeys.all });
      if (data?.id) {
        queryClient.setQueryData(requestKeys.detail(data.id), data);
      }
      message.success(t('request.rejectSuccess'));
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || t('request.rejectError'));
    },
  });
};
