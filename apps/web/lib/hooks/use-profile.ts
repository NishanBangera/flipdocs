"use client";

import { useMemo } from 'react';
import { useApiClient } from '@/lib/api-client';
import { handleApiError } from '@/lib/api-client';

export interface UserProfile {
  id: string;
  clerk_id: string;
  email: string;
  name?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export const useProfileApi = () => {
  const api = useApiClient();

  return useMemo(() => ({
    async getMe(): Promise<UserProfile> {
      try {
        const res = await api.get<{ data?: UserProfile; error?: string }>(`/user/me`);
        if (res.data.data) return res.data.data;
        throw new Error(res.data.error || 'Failed to fetch profile');
      } catch (e) {
        throw new Error(handleApiError(e));
      }
    },

    async updateProfile(payload: { name?: string; email?: string }) {
      try {
        const res = await api.put<{ data?: UserProfile; error?: string }>(`/user/me`, payload);
        if (res.data.data) return res.data.data;
        throw new Error(res.data.error || 'Failed to update profile');
      } catch (e) {
        throw new Error(handleApiError(e));
      }
    },

    async changePassword(newPassword: string) {
      try {
        const res = await api.put<{ success?: boolean; error?: string }>(`/user/password`, { newPassword });
        if (res.data.success) return true;
        throw new Error(res.data.error || 'Failed to change password');
      } catch (e) {
        throw new Error(handleApiError(e));
      }
    }
  }), [api]);
};
