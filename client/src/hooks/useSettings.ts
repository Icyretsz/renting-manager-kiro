import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth0 } from '@auth0/auth0-react';
import api from '@/services/api';
import { Setting, ApiResponse } from '@/types';

// Query keys
export const settingsKeys = {
  all: ['settings'] as const,
  lists: () => [...settingsKeys.all, 'list'] as const,
  details: () => [...settingsKeys.all, 'detail'] as const,
  detail: (key: string) => [...settingsKeys.details(), key] as const,
};

// Fetch all settings
export const useSettingsQuery = () => {
  const { isAuthenticated, user } = useAuth0();
  return useQuery({
    queryKey: settingsKeys.lists(),
    queryFn: async (): Promise<Setting[]> => {
      const response = await api.get<ApiResponse<Setting[]>>('/settings');
      return response.data.data || [];
    },
    enabled: isAuthenticated && !!user,
  });
};

// Fetch single setting by key
export const useSettingQuery = (key: string) => {
  const { isAuthenticated, user } = useAuth0();

  return useQuery({
    queryKey: settingsKeys.detail(key),
    queryFn: async (): Promise<Setting> => {
      const response = await api.get<ApiResponse<Setting>>(`/settings/${key}`);
      if (!response.data.data) {
        throw new Error('Setting not found');
      }
      return response.data.data;
    },
    enabled: !!key && isAuthenticated && !!user,
  });
};

// Update setting mutation
export const useUpdateSettingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: number }) => {
      const response = await api.put<ApiResponse<Setting>>(`/settings/${key}`, { value });
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch settings queries
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      queryClient.setQueryData(settingsKeys.detail(variables.key), data);
    },
  });
};

// Create/upsert setting mutation
export const useUpsertSettingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: number; description?: string }) => {
      const response = await api.post<ApiResponse<Setting>>('/settings', { key, value, description });
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate and refetch settings queries
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
};

// Delete setting mutation
export const useDeleteSettingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (key: string) => {
      await api.delete(`/settings/${key}`);
    },
    onSuccess: () => {
      // Invalidate and refetch settings queries
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
};

// Initialize default settings mutation
export const useInitializeSettingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<void>>('/settings/initialize');
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch settings queries
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
};

// Helper hook to get setting value by key
export const useSettingValue = (key: string, defaultValue: number = 0): number => {
  const { data: settings } = useSettingsQuery();
  const setting = settings?.find(s => s.key === key);
  return setting ? Number(setting.value) : defaultValue;
};