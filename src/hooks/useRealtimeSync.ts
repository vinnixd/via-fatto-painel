import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const TENANT_STORAGE_KEY = 'active_tenant_id';

const getResolvedTenantId = (): string | null => {
  return localStorage.getItem(TENANT_STORAGE_KEY);
};

/**
 * Hook to subscribe to realtime changes in Supabase tables
 * Automatically invalidates React Query cache when changes occur
 */
export const useRealtimeSiteConfig = () => {
  const queryClient = useQueryClient();
  const tenantId = getResolvedTenantId();

  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel(`site-config-changes-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_config',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          if (import.meta.env.DEV) {
            console.log('[Realtime] site_config change detected:', payload.eventType);
          }
          
          // Invalidate the site-config query to trigger a refetch
          queryClient.invalidateQueries({ queryKey: ['site-config', tenantId] });
        }
      )
      .subscribe((status) => {
        if (import.meta.env.DEV) {
          console.log('[Realtime] site_config subscription status:', status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, tenantId]);
};

/**
 * Hook to subscribe to realtime changes in properties table
 */
export const useRealtimeProperties = () => {
  const queryClient = useQueryClient();
  const tenantId = getResolvedTenantId();

  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel(`properties-changes-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'properties',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          if (import.meta.env.DEV) {
            console.log('[Realtime] properties change detected:', payload.eventType);
          }
          
          // Invalidate all property-related queries
          queryClient.invalidateQueries({ queryKey: ['properties'] });
          queryClient.invalidateQueries({ queryKey: ['property'] });
          queryClient.invalidateQueries({ queryKey: ['similar-properties'] });
        }
      )
      .subscribe((status) => {
        if (import.meta.env.DEV) {
          console.log('[Realtime] properties subscription status:', status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, tenantId]);
};

/**
 * Hook to subscribe to realtime changes in property_images table
 */
export const useRealtimePropertyImages = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('property-images-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'property_images',
        },
        (payload) => {
          if (import.meta.env.DEV) {
            console.log('[Realtime] property_images change detected:', payload.eventType);
          }
          
          // Invalidate property queries (images are nested)
          queryClient.invalidateQueries({ queryKey: ['properties'] });
          queryClient.invalidateQueries({ queryKey: ['property'] });
        }
      )
      .subscribe((status) => {
        if (import.meta.env.DEV) {
          console.log('[Realtime] property_images subscription status:', status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

/**
 * Combined hook to enable all realtime subscriptions
 * Use this in App.tsx or a top-level component
 */
export const useRealtimeSync = () => {
  useRealtimeSiteConfig();
  useRealtimeProperties();
  useRealtimePropertyImages();
};
