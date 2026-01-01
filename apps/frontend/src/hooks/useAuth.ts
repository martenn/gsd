import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UserDto } from '@gsd/types';
import { getMe, logout as logoutApi } from '../lib/api/auth';

export function useAuth() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const result = await getMe();
      console.log('Auth check successful:', result);
      return result;
    },
    retry: false,
    staleTime: 10 * 60 * 1000,
  });

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/';
    },
  });

  return {
    user: data?.user ?? null,
    isLoading,
    isAuthenticated: !!data?.user,
    logout: () => logoutMutation.mutate(),
    error,
  };
}

export type UseAuthReturn = {
  user: UserDto | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  error: Error | null;
};
