import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

type PageType = 'home' | 'properties' | 'property' | 'about' | 'contact' | 'favorites' | 'location';

interface TrackingOptions {
  pageType: PageType;
  pageSlug?: string;
  propertyId?: string;
}

export const trackPageView = async (options: TrackingOptions) => {
  try {
    const { error } = await supabase.rpc('track_page_view', {
      p_page_type: options.pageType,
      p_page_slug: options.pageSlug || null,
      p_property_id: options.propertyId || null,
    });
    
    if (error) {
      console.error('[PageTracking] Error tracking view:', error);
    } else {
      console.log('[PageTracking] View tracked:', options.pageType, options.pageSlug || '');
    }
  } catch (err) {
    console.error('[PageTracking] Failed to track:', err);
  }
};

export const usePageTracking = (options: TrackingOptions) => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(options);
  }, [location.pathname, options.pageType, options.pageSlug, options.propertyId]);
};

export const useAutoPageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let pageType: PageType = 'home';
    let pageSlug: string | undefined;

    if (path === '/' || path === '/home') {
      pageType = 'home';
    } else if (path === '/imoveis') {
      pageType = 'properties';
    } else if (path.startsWith('/imovel/')) {
      pageType = 'property';
      pageSlug = path.replace('/imovel/', '');
    } else if (path === '/sobre') {
      pageType = 'about';
    } else if (path === '/contato') {
      pageType = 'contact';
    } else if (path === '/favoritos') {
      pageType = 'favorites';
    } else if (path.startsWith('/localizacao/')) {
      pageType = 'location';
      pageSlug = path.replace('/localizacao/', '');
    } else {
      // Don't track admin pages or unknown routes
      return;
    }

    trackPageView({ pageType, pageSlug });
  }, [location.pathname]);
};
