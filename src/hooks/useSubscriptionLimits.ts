import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionLimits {
  maxUsers: number;
  maxProperties: number;
  currentUsers: number;
  currentProperties: number;
  canAddUser: boolean;
  canAddProperty: boolean;
  isLoading: boolean;
  planName: string | null;
}

export function useSubscriptionLimits(): SubscriptionLimits {
  const { data, isLoading } = useQuery({
    queryKey: ['subscription-limits'],
    queryFn: async () => {
      // Fetch subscription with plan
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .limit(1)
        .single();

      if (subError && subError.code !== 'PGRST116') throw subError;

      const plan = subscription?.plan as any;
      const maxUsers = plan?.max_users ?? Infinity;
      const maxProperties = plan?.max_properties ?? Infinity;
      const planName = plan?.name ?? null;

      // Count active users (profiles with status active)
      const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (userError) throw userError;

      // Count properties
      const { count: propertyCount, error: propError } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });

      if (propError) throw propError;

      return {
        maxUsers,
        maxProperties,
        currentUsers: userCount ?? 0,
        currentProperties: propertyCount ?? 0,
        planName,
      };
    },
    staleTime: 30_000,
  });

  return {
    maxUsers: data?.maxUsers ?? Infinity,
    maxProperties: data?.maxProperties ?? Infinity,
    currentUsers: data?.currentUsers ?? 0,
    currentProperties: data?.currentProperties ?? 0,
    canAddUser: (data?.currentUsers ?? 0) < (data?.maxUsers ?? Infinity),
    canAddProperty: (data?.currentProperties ?? 0) < (data?.maxProperties ?? Infinity),
    isLoading,
    planName: data?.planName ?? null,
  };
}
