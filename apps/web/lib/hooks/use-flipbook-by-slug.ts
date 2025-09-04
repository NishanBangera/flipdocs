import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Flipbook } from "@/lib/types";

export interface FlipbookBySlugResponse {
  data?: Flipbook;
  error?: string;
}

async function fetchFlipbookBySlug(slug: string): Promise<Flipbook> {
  const response = await apiClient.get<FlipbookBySlugResponse>(`/view/${slug}`);
  if (response.data.error || !response.data.data) {
    throw new Error(response.data.error || 'Flipbook not found');
  }
  return response.data.data;
}

export function useFlipbookBySlug(slug: string) {
  return useQuery({
    queryKey: ['flipbook', 'slug', slug],
    queryFn: () => fetchFlipbookBySlug(slug),
    enabled: !!slug,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}