import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useUnreadCount() {
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-contacts-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('read', false);

      if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }

      return count || 0;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return unreadCount;
}
