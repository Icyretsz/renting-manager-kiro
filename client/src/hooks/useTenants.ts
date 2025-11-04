import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Tenant, ApiResponse } from '@/types';
import { authService, TenantStatus } from '@/services/authService';

// Query keys
export const tenantKeys = {
  all: ['tenants'] as const,
  lists: () => [...tenantKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...tenantKeys.lists(), { filters }] as const,
  details: () => [...tenantKeys.all, 'detail'] as const,
  detail: (id: string) => [...tenantKeys.details(), id] as const,
  byRoom: (roomId: number) => [...tenantKeys.all, 'room', roomId] as const,
};

// Fetch all tenants
export const useTenantsQuery = (roomId?: number) => {
  return useQuery({
    queryKey: roomId ? tenantKeys.byRoom(roomId) : tenantKeys.lists(),
    queryFn: async (): Promise<Tenant[]> => {
      const url = roomId ? `/rooms/${roomId}/tenants` : '/tenants';
      const response = await api.get<ApiResponse<Tenant[]>>(url);
      return response.data.data || [];
    },
  });
};

// Fetch single tenant
export const useTenantQuery = (tenantId: string) => {
  return useQuery({
    queryKey: tenantKeys.detail(tenantId),
    queryFn: async (): Promise<Tenant> => {
      const response = await api.get<ApiResponse<Tenant>>(`/tenants/${tenantId}`);
      if (!response.data.data) {
        throw new Error('Tenant not found');
      }
      return response.data.data;
    },
    enabled: !!tenantId,
  });
};

// Create tenant mutation
export const useCreateTenantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await api.post<ApiResponse<Tenant>>('/tenants', data);
      return response.data.data;
    },
    onSuccess: (data) => {
      // Invalidate tenant queries
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
      if (data?.roomId) {
        queryClient.invalidateQueries({ queryKey: tenantKeys.byRoom(data.roomId) });
      }
    },
  });
};

// Update tenant mutation
export const useUpdateTenantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenantId, data }: { tenantId: string; data: Partial<Tenant> }) => {
      const response = await api.put<ApiResponse<Tenant>>(`/tenants/${tenantId}`, data);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and update tenant queries
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
      queryClient.setQueryData(tenantKeys.detail(variables.tenantId), data);
      if (data?.roomId) {
        queryClient.invalidateQueries({ queryKey: tenantKeys.byRoom(data.roomId) });
      }
    },
  });
};

// Delete tenant mutation
export const useDeleteTenantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tenantId: string) => {
      const response = await api.delete<ApiResponse<void>>(`/tenants/${tenantId}`);
      return response.data;
    },
    onSuccess: (_, tenantId) => {
      // Invalidate tenant queries
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
      queryClient.removeQueries({ queryKey: tenantKeys.detail(tenantId) });
    },
  });
};

// Check if user have linked to a tenant
export const useTenantStatus = () => {
  return useQuery<TenantStatus>({
    queryKey: ['tenant-status'],
    queryFn: authService.checkTenantStatus,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};