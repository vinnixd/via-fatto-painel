import { useEffect } from 'react';
import { useSiteConfig } from './useSupabaseData';

export const useFavicon = () => {
  const { data: siteConfig } = useSiteConfig();

  useEffect(() => {
    if (siteConfig?.favicon_url) {
      // Update or create favicon link
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = siteConfig.favicon_url;
      favicon.type = 'image/png';

      // Also update apple-touch-icon if exists
      let appleFavicon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
      if (!appleFavicon) {
        appleFavicon = document.createElement('link');
        appleFavicon.rel = 'apple-touch-icon';
        document.head.appendChild(appleFavicon);
      }
      appleFavicon.href = siteConfig.favicon_url;
    }
  }, [siteConfig?.favicon_url]);
};
