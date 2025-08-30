import { useMemo } from 'react';
import { useApiClient } from './api-client';
import { handleApiError } from './api-client';
import {
  Flipbook,
  CreateFlipbookData,
  UpdateFlipbookData,
  DashboardStats,
  ApiResponse,
} from './types';

export class FlipbookApi {
  constructor(private apiClient: ReturnType<typeof useApiClient>) {}

  // Get all flipbooks for the authenticated user
  async getAll(): Promise<Flipbook[]> {
    try {
      const response = await this.apiClient.get<ApiResponse<Flipbook[]>>('/flipbooks');
      console.log("API getAll response:", response.data);
      return response.data.data || [];
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Get a single flipbook by ID
  async getById(id: string): Promise<Flipbook | null> {
    try {
      const response = await this.apiClient.get<ApiResponse<Flipbook>>(`/flipbooks/${id}`);
      return response.data.data || null;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Create a new flipbook
  async create(data: CreateFlipbookData): Promise<Flipbook> {
    try {
      console.log("check111111111111")
      const formData = new FormData();
      console.log("isPublished value:", data.isPublished, typeof data.isPublished);
      formData.append('name', data.name);
      formData.append('pdf', data.pdf);
      formData.append('isPublished', data.isPublished ? 'true' : 'false');
      console.log("check22222222222")
      
      if (data.backgroundImage) {
        formData.append('backgroundImage', data.backgroundImage);
      }
      console.log("check33333333333")
      const response = await this.apiClient.post<ApiResponse<Flipbook>>(
        '/flipbooks',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.data) {
        return response.data.data;
      }
      console.log("check44444444444", response.data.error)
      throw new Error(response.data.error || 'Failed to create flipbook');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Update an existing flipbook
  async update(id: string, data: UpdateFlipbookData): Promise<Flipbook> {
    try {
      const formData = new FormData();
      
      if (data.name) formData.append('name', data.name);
      if (data.pdf) formData.append('pdf', data.pdf);
      if (data.backgroundImage) formData.append('backgroundImage', data.backgroundImage);
      if (data.isPublished !== undefined) formData.append('isPublished', data.isPublished ? 'true' : 'false');

      const response = await this.apiClient.put<ApiResponse<Flipbook>>(
        `/flipbooks/${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Failed to update flipbook');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Delete a flipbook
  async delete(id: string): Promise<void> {
    try {
      const response = await this.apiClient.delete<ApiResponse<never>>(`/flipbooks/${id}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete flipbook');
      }
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Toggle publish status
  async togglePublish(id: string): Promise<Flipbook> {
    try {
      const response = await this.apiClient.patch<ApiResponse<Flipbook>>(
        `/flipbooks/${id}/toggle-publish`
      );

      if (response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Failed to toggle publish status');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await this.apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats');
      console.log("Dashboard stats response:", response.data);
      return response.data.data || { total: 0, published: 0, unpublished: 0, recent: [] };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

// Hook to get FlipbookApi instance
export const useFlipbookApi = () => {
  const apiClient = useApiClient();
  
  // Memoize the API instance to prevent recreation on every render
  const flipbookApi = useMemo(() => {
    return new FlipbookApi(apiClient);
  }, [apiClient]);
  
  return flipbookApi;
};