import api from './api';
import { TenantStatus, UserProfile } from '@/types';

// Re-export types for backward compatibility
export type { TenantStatus, UserProfile };

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