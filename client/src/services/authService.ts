import api from './api';

export interface TenantStatus {
  isLinked: boolean;
  tenant: {
    id: string;
    roomId: number;
    roomNumber: number;
    floor: number;
  } | null;
}

export interface UserProfile {
  id: string;
  auth0Id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  tenantRoom: {
    roomId: number;
    roomNumber: number;
    floor: number;
    moveInDate: string;
  } | null;
}

export const authService = {
  /**
   * Check if user is linked to a tenant
   */
  async checkTenantStatus(): Promise<TenantStatus> {
    const response = await api.get('/auth/tenant-status');
    return response.data.data;
  },

  /**
   * Get user profile
   */
  async getProfile(): Promise<UserProfile> {
    const response = await api.get('/auth/profile');
    return response.data.data;
  },

  /**
   * Update user profile
   */
  async updateProfile(data: { name: string }): Promise<UserProfile> {
    const response = await api.put('/auth/profile', data);
    return response.data.data;
  },
};