import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFlipbookApi } from '../api';
import {
  Flipbook,
  CreateFlipbookData,
  UpdateFlipbookData,
  DashboardStats,
} from '../types';
import { toast } from 'sonner';

// Query keys for caching
export const flipbookKeys = {
  all: ['flipbooks'] as const,
  lists: () => [...flipbookKeys.all, 'list'] as const,
  list: (filters: string) => [...flipbookKeys.lists(), { filters }] as const,
  details: () => [...flipbookKeys.all, 'detail'] as const,
  detail: (id: string) => [...flipbookKeys.details(), id] as const,
  dashboard: ['dashboard'] as const,
};

// Hook to fetch all flipbooks
export const useFlipbooks = () => {
  const api = useFlipbookApi();
  
  return useQuery({
    queryKey: flipbookKeys.lists(),
    queryFn: () => api.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch a single flipbook
export const useFlipbook = (id: string) => {
  const api = useFlipbookApi();
  
  return useQuery({
    queryKey: flipbookKeys.detail(id),
    queryFn: () => api.getById(id),
    enabled: !!id,
  });
};

// Hook to fetch dashboard stats
export const useDashboardStats = () => {
  const api = useFlipbookApi();
  
  return useQuery({
    queryKey: flipbookKeys.dashboard,
    queryFn: () => api.getDashboardStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook to create a flipbook
export const useCreateFlipbook = () => {
  const api = useFlipbookApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateFlipbookData) => api.create(data),
    onSuccess: () => {
      // Invalidate and refetch flipbooks list
      queryClient.invalidateQueries({ queryKey: flipbookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: flipbookKeys.dashboard });
      toast?.success('Flipbook created successfully!');
    },
    onError: (error: Error) => {
      toast?.error(error.message || 'Failed to create flipbook');
    },
  });
};

// Hook to update a flipbook
export const useUpdateFlipbook = () => {
  const api = useFlipbookApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFlipbookData }) => 
      api.update(id, data),
    onSuccess: (updatedFlipbook: Flipbook) => {
      // Update the specific flipbook in cache
      queryClient.setQueryData(
        flipbookKeys.detail(updatedFlipbook.id),
        updatedFlipbook
      );
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: flipbookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: flipbookKeys.dashboard });
      
      toast?.success('Flipbook updated successfully!');
    },
    onError: (error: Error) => {
      toast?.error(error.message || 'Failed to update flipbook');
    },
  });
};

// Hook to delete a flipbook
export const useDeleteFlipbook = () => {
  const api = useFlipbookApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: flipbookKeys.detail(deletedId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: flipbookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: flipbookKeys.dashboard });
      
      toast?.success('Flipbook deleted successfully!');
    },
    onError: (error: Error) => {
      toast?.error(error.message || 'Failed to delete flipbook');
    },
  });
};

// Hook to toggle publish status
export const useTogglePublish = () => {
  const api = useFlipbookApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.togglePublish(id),
    onSuccess: (updatedFlipbook: Flipbook) => {
      // Update the specific flipbook in cache
      queryClient.setQueryData(
        flipbookKeys.detail(updatedFlipbook.id),
        updatedFlipbook
      );
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: flipbookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: flipbookKeys.dashboard });
      
      const status = updatedFlipbook.is_published ? 'published' : 'unpublished';
      toast?.success(`Flipbook ${status} successfully!`);
    },
    onError: (error: Error) => {
      toast?.error(error.message || 'Failed to toggle publish status');
    },
  });
};