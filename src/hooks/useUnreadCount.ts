import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export function useUnreadCount() {
  const { tenantId } = useTenant();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-contacts-count', tenantId],
    queryFn: async () => {
      if (!tenantId) return 0;

      const { count, error } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('read', false)
        .eq('tenant_id', tenantId);

      if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!tenantId,
    refetchInterval: 30000,
  });

  return unreadCount;
}
