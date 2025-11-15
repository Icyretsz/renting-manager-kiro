import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { ApiResponse } from '@/types';
import { message } from 'antd';

// Query keys
export const curfewKeys = {
  all: ['curfew'] as const,
  roomTenants: () => [...curfewKeys.all, 'room-tenants'] as const,
};

// Types
export interface RoomTenant {
  id: string;
  name: string;
  curfewStatus: 'NORMAL' | 'PENDING' | 'APPROVED_TEMPORARY' | 'APPROVED_PERMANENT';
  curfewRequestedAt?: Date | null;
  curfewApprovedAt?: Date | null;
  user: {
    id: string;
    name: string;
  } | null;
}

export interface CurfewRequestData {
  tenantIds: string[];
  reason?: string;
}

export interface CurfewApprovalData {
  tenantIds: string[];
}

export interface CurfewRejectionData {
  tenantIds: string[];
  reason?: string;
}

// Get tenants in user's room
export const useRoomTenantsQuery = () => {
  return useQuery({
    queryKey: curfewKeys.roomTenants(),
    queryFn: async (): Promise<RoomTenant[]> => {
      const response = await api.get<ApiResponse<RoomTenant[]>>('/curfew/room-tenants');
      return response.data.data || [];
    },
  });
};

// Request curfew override
export const useRequestCurfewOverrideMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CurfewRequestData) => {
      const response = await api.post<ApiResponse<any>>('/curfew/request', data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Curfew override request sent to admins');
      queryClient.invalidateQueries({ queryKey: curfewKeys.roomTenants() });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to request curfew override');
    },
  });
};

// Approve curfew override (Admin only)
export const useApproveCurfewOverrideMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CurfewApprovalData) => {
      const response = await api.post<ApiResponse<any>>('/curfew/approve', data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Curfew override approved');
      queryClient.invalidateQueries({ queryKey: curfewKeys.all });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to approve curfew override');
    },
  });
};

// Reject curfew override (Admin only)
export const useRejectCurfewOverrideMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CurfewRejectionData) => {
      const response = await api.post<ApiResponse<any>>('/curfew/reject', data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Curfew override rejected');
      queryClient.invalidateQueries({ queryKey: curfewKeys.all });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to reject curfew override');
    },
  });
};


// Get pending curfew requests (Admin only)
export const usePendingCurfewRequestsQuery = () => {
  return useQuery({
    queryKey: [...curfewKeys.all, 'pending'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>('/curfew/pending');
      return response.data.data || [];
    },
  });
};

// Get curfew modifications for a tenant
export const useCurfewModificationsQuery = (tenantId: string | null) => {
  return useQuery({
    queryKey: [...curfewKeys.all, 'modifications', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const response = await api.get<ApiResponse<any[]>>(`/curfew/modifications/${tenantId}`);
      return response.data.data || [];
    },
    enabled: !!tenantId,
  });
};

// Manual change curfew status (Admin only)
export const useManualChangeCurfewStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { tenantId: string; newStatus: string; isPermanent?: boolean; reason?: string }) => {
      const response = await api.post<ApiResponse<any>>('/curfew/manual-change', data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Curfew status updated');
      queryClient.invalidateQueries({ queryKey: curfewKeys.all });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to update curfew status');
    },
  });
};
