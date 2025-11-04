import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth0 } from '@auth0/auth0-react';
import api from '@/services/api';
import { Room, ApiResponse } from '@/types';
import { useAuthStore } from '@/stores/authStore';

// Query keys
export const roomKeys = {
  all: ['rooms'] as const,
  lists: () => [...roomKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...roomKeys.lists(), { filters }] as const,
  details: () => [...roomKeys.all, 'detail'] as const,
  detail: (id: number) => [...roomKeys.details(), id] as const,
};

// Fetch all rooms
export const useRoomsQuery = () => {
  const { isAuthenticated } = useAuth0();
  const { token, user } = useAuthStore();

  return useQuery({
    queryKey: roomKeys.lists(),
    queryFn: async (): Promise<Room[]> => {
      const response = await api.get<ApiResponse<Room[]>>('/rooms');
      return response.data.data || [];
    },
    enabled: isAuthenticated && !!token && !!user,
  });
};

// Fetch single room
export const useRoomQuery = (roomId: number) => {
  const { isAuthenticated } = useAuth0();
  const { token, user } = useAuthStore();

  return useQuery({
    queryKey: roomKeys.detail(roomId),
    queryFn: async (): Promise<Room> => {
      const response = await api.get<ApiResponse<Room>>(`/rooms/${roomId}`);
      if (!response.data.data) {
        throw new Error('Room not found');
      }
      return response.data.data;
    },
    enabled: !!roomId && isAuthenticated && !!token && !!user,
  });
};

// Update room mutation
export const useUpdateRoomMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, data }: { roomId: number; data: Partial<Room> }) => {
      const response = await api.put<ApiResponse<Room>>(`/rooms/${roomId}`, data);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch room queries
      queryClient.invalidateQueries({ queryKey: roomKeys.all });
      queryClient.setQueryData(roomKeys.detail(variables.roomId), data);
    },
  });
};