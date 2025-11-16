import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { ApiResponse, User } from '@/types';
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
    // Optimistic update
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: curfewKeys.roomTenants() });
      await queryClient.cancelQueries({ queryKey: ['userProfile'] });

      // Snapshot the previous values
      const previousRoomTenants = queryClient.getQueryData(curfewKeys.roomTenants());
      const previousUserProfile = queryClient.getQueryData(['userProfile']);

      // Optimistically update room tenants
      queryClient.setQueryData<RoomTenant[]>(curfewKeys.roomTenants(), (old) => {
        if (!old) return old;
        return old.map((tenant) =>
          variables.tenantIds.includes(tenant.id)
            ? { ...tenant, curfewStatus: 'PENDING' as const, curfewRequestedAt: new Date() }
            : tenant
        );
      });

      // Optimistically update user profile (if user is requesting for themselves)
      queryClient.setQueryData(['userProfile'], (old: User) => {
        if (!old?.tenant) return old;
        if (variables.tenantIds.includes(old.tenant.id)) {
          return {
            ...old,
            tenant: {
              ...old.tenant,
              curfewStatus: 'PENDING',
              curfewRequestedAt: new Date(),
            },
          };
        }
        return old;
      });

      // Return context with previous values
      return { previousRoomTenants, previousUserProfile };
    },
    onSuccess: () => {
      message.success('Curfew override request sent to admins');
      // Invalidate to get the actual server data
      queryClient.invalidateQueries({ queryKey: curfewKeys.roomTenants() });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
    onError: (error: any, _variables, context) => {
      message.error(error.response?.data?.message || 'Failed to request curfew override');
      // Rollback on error
      if (context?.previousRoomTenants) {
        queryClient.setQueryData(curfewKeys.roomTenants(), context.previousRoomTenants);
      }
      if (context?.previousUserProfile) {
        queryClient.setQueryData(['userProfile'], context.previousUserProfile);
      }
    },
  });
};

// Approve curfew override (Admin only)
export const useApproveCurfewOverrideMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CurfewApprovalData & { isPermanent?: boolean }) => {
      const response = await api.post<ApiResponse<any>>('/curfew/approve', data);
      return response.data;
    },
    // Optimistic update
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [...curfewKeys.all, 'pending'] });

      // Snapshot the previous value
      const previousPending = queryClient.getQueryData([...curfewKeys.all, 'pending']);

      // Optimistically remove from pending list
      queryClient.setQueryData<any[]>([...curfewKeys.all, 'pending'], (old) => {
        if (!old) return old;
        return old.filter((tenant) => !variables.tenantIds.includes(tenant.id));
      });

      return { previousPending };
    },
    onSuccess: () => {
      message.success('Curfew override approved');
      queryClient.invalidateQueries({ queryKey: curfewKeys.all });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any, _variables, context) => {
      message.error(error.response?.data?.message || 'Failed to approve curfew override');
      // Rollback on error
      if (context?.previousPending) {
        queryClient.setQueryData([...curfewKeys.all, 'pending'], context.previousPending);
      }
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
    // Optimistic update
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [...curfewKeys.all, 'pending'] });

      // Snapshot the previous value
      const previousPending = queryClient.getQueryData([...curfewKeys.all, 'pending']);

      // Optimistically remove from pending list
      queryClient.setQueryData<any[]>([...curfewKeys.all, 'pending'], (old) => {
        if (!old) return old;
        return old.filter((tenant) => !variables.tenantIds.includes(tenant.id));
      });

      return { previousPending };
    },
    onSuccess: () => {
      message.success('Curfew override rejected');
      queryClient.invalidateQueries({ queryKey: curfewKeys.all });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any, _variables, context) => {
      message.error(error.response?.data?.message || 'Failed to reject curfew override');
      // Rollback on error
      if (context?.previousPending) {
        queryClient.setQueryData([...curfewKeys.all, 'pending'], context.previousPending);
      }
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
