import { useQuery } from '@tanstack/react-query';
import { useAuth0 } from '@auth0/auth0-react';
import api from '@/services/api';
import { User } from '@/types';

interface UserProfileResponse {
  success: boolean;
  data: User;
  message: string;
}

const fetchUserProfile = async (): Promise<User> => {
  const response = await api.get<UserProfileResponse>('/users/profile');
  return response.data.data;
};

export const useUserProfile = () => {
  const { isAuthenticated } = useAuth0();

  return useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchUserProfile,
    enabled: isAuthenticated, // Only fetch when authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};