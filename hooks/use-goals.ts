import useSWR from 'swr';
import { useWallet } from '@/context/wallet-context';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useGoals(filters?: { walletAddress?: string; category?: string; search?: string }) {
  const { wallet } = useWallet();

  const queryParams = new URLSearchParams();
  if (filters?.walletAddress) queryParams.append('walletAddress', filters.walletAddress);
  if (filters?.category) queryParams.append('category', filters.category);
  if (filters?.search) queryParams.append('search', filters.search);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/goals?${queryParams.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    goals: data?.goals || [],
    isLoading,
    error,
    mutate,
  };
}

export function useGoal(goalId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    goalId ? `/api/goals/${goalId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    goal: data?.goal,
    isLoading,
    error,
    mutate,
  };
}

export function useContributions(goalId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    goalId ? `/api/contributions/${goalId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    deposits: data?.deposits || [],
    isLoading,
    error,
    mutate,
  };
}
