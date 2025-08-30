import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { useAuth } from '@clerk/nextjs';
import { useMemo } from 'react';

// Create axios instance with base configuration
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    timeout: 30000, // 30 seconds for file uploads
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return client;
};

// Create a hook to get authenticated API client
export const useApiClient = () => {
  const { getToken } = useAuth();

  // Memoize the API client to prevent recreation on every render
  // Don't include getToken in dependencies since it's always a new reference
  const apiClient = useMemo(() => {
    const client = createApiClient();

    // Request interceptor to add auth token
    client.interceptors.request.use(
      async (config) => {
        try {
          // Get the current token on each request instead of capturing it in closure
          const token = await getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        // Handle common error scenarios
        if (error.response?.status === 401) {
          console.error('Unauthorized - redirecting to login');
          // Could trigger a redirect to login page here
        } else if (error.response?.status === 403) {
          console.error('Forbidden - insufficient permissions');
        } else if (error.response?.status && error.response.status >= 500) {
          console.error('Server error:', error.response?.data);
        }
        
        return Promise.reject(error);
      }
    );

    return client;
  }, []); // Empty dependency array since getToken is captured fresh on each request

  return apiClient;
};

// Base API client (for non-authenticated requests)
export const apiClient = createApiClient();

// Error handling utility
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
  }
  
  return 'An unexpected error occurred';
};