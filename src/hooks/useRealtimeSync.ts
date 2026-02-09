import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
 * Hook to subscribe to realtime changes in contacts table (new leads)
 */
export const useRealtimeContacts = () => {
  const queryClient = useQueryClient();
  const tenantId = getResolvedTenantId();

  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel(`contacts-changes-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contacts',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          if (import.meta.env.DEV) {
            console.log('[Realtime] new contact/lead detected:', payload.new);
          }

          const newLead = payload.new as { name?: string; origem?: string };
          
          // Show toast notification
          toast.info('Novo lead recebido!', {
            description: `${newLead.name || 'Novo contato'} via ${newLead.origem || 'site'}`,
            duration: 8000,
            action: {
              label: 'Ver leads',
              onClick: () => {
                window.location.href = '/admin/mensagens';
              },
            },
          });

          // Invalidate related queries
          queryClient.invalidateQueries({ queryKey: ['unread-contacts-count'] });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe((status) => {
        if (import.meta.env.DEV) {
          console.log('[Realtime] contacts subscription status:', status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, tenantId]);
};

/**
 * Combined hook to enable all realtime subscriptions
 * Use this in App.tsx or a top-level component
 */
export const useRealtimeSync = () => {
  useRealtimeSiteConfig();
  useRealtimeProperties();
  useRealtimePropertyImages();
  useRealtimeContacts();
};
