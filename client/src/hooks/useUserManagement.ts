import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import {
  User,
  Tenant,
  ApiResponse,
  PaginatedResponse,
  UserWithTenant,
  LinkingSuggestion,
  SuggestionsResponse,
} from '@/types';

// Query keys
export const userManagementKeys = {
  all: ['user-management'] as const,
  users: () => [...userManagementKeys.all, 'users'] as const,
  usersList: (filters: Record<string, any>) => [...userManagementKeys.users(), { filters }] as const,
  userDetail: (id: string) => [...userManagementKeys.users(), 'detail', id] as const,
  suggestions: () => [...userManagementKeys.all, 'suggestions'] as const,
};

// Re-export types for backward compatibility
export type { UserWithTenant, LinkingSuggestion, SuggestionsResponse };

// Fetch users with pagination and filtering
export const useUsersQuery = (filters?: Record<string, any>, page = 1, limit = 10) => {
  return useQuery({
    queryKey: userManagementKeys.usersList({ ...filters, page, limit }),
    queryFn: async (): Promise<PaginatedResponse<UserWithTenant>> => {
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
      
      const response = await api.get<PaginatedResponse<UserWithTenant>>(`/user-management/users?${params.toString()}`);
      return response.data;
    },
  });
};

// Fetch user by ID
export const useUserQuery = (userId: string) => {
  return useQuery({
    queryKey: userManagementKeys.userDetail(userId),
    queryFn: async (): Promise<UserWithTenant> => {
      const response = await api.get<ApiResponse<UserWithTenant>>(`/user-management/users/${userId}`);
      return response.data.data!;
    },
    enabled: !!userId,
  });
};

// Fetch linking suggestions
export const useLinkingSuggestionsQuery = () => {
  return useQuery({
    queryKey: userManagementKeys.suggestions(),
    queryFn: async (): Promise<SuggestionsResponse> => {
      const response = await api.get<ApiResponse<SuggestionsResponse>>('/user-management/suggestions');
      return response.data.data!;
    },
  });
};

// Create user mutation
export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: {
      auth0Id: string;
      email: string;
      name: string;
      role: 'ADMIN' | 'USER';
    }): Promise<UserWithTenant> => {
      const response = await api.post<ApiResponse<UserWithTenant>>('/user-management/users', userData);
      return response.data.data!;
    },
    onSuccess: () => {
      // Invalidate users queries
      queryClient.invalidateQueries({ queryKey: userManagementKeys.users() });
      queryClient.invalidateQueries({ queryKey: userManagementKeys.suggestions() });
    },
  });
};

// Update user mutation
export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, userData }: {
      userId: string;
      userData: Partial<{
        name: string;
        email: string;
        role: 'ADMIN' | 'USER';
      }>;
    }): Promise<UserWithTenant> => {
      const response = await api.put<ApiResponse<UserWithTenant>>(`/user-management/users/${userId}`, userData);
      return response.data.data!;
    },
    onSuccess: (data, variables) => {
      // Invalidate and update queries
      queryClient.invalidateQueries({ queryKey: userManagementKeys.users() });
      queryClient.setQueryData(userManagementKeys.userDetail(variables.userId), data);
    },
  });
};

// Delete user mutation
export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string): Promise<void> => {
      await api.delete(`/user-management/users/${userId}`);
    },
    onSuccess: (_, userId) => {
      // Invalidate queries and remove user data
      queryClient.invalidateQueries({ queryKey: userManagementKeys.users() });
      queryClient.removeQueries({ queryKey: userManagementKeys.userDetail(userId) });
      queryClient.invalidateQueries({ queryKey: userManagementKeys.suggestions() });
    },
  });
};

// Link user to tenant mutation
export const useLinkUserToTenantMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, tenantId }: {
      userId: string;
      tenantId: string;
    }): Promise<Tenant> => {
      const response = await api.post<ApiResponse<Tenant>>('/user-management/link', {
        userId,
        tenantId
      });
      return response.data.data!;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: userManagementKeys.users() });
      queryClient.invalidateQueries({ queryKey: userManagementKeys.suggestions() });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
};

// Unlink user from tenant mutation
export const useUnlinkUserFromTenantMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, tenantId }: {
      userId: string;
      tenantId: string;
    }): Promise<Tenant> => {
      const response = await api.post<ApiResponse<Tenant>>('/user-management/unlink', {
        userId,
        tenantId
      });
      return response.data.data!;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: userManagementKeys.users() });
      queryClient.invalidateQueries({ queryKey: userManagementKeys.suggestions() });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
};