import { useEffect } from 'react';
import { useSiteConfig } from './useSupabaseData';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

export const useTrackingScripts = () => {
  const { data: siteConfig, isLoading } = useSiteConfig();

  useEffect(() => {
    console.log('[Tracking] Hook called, siteConfig:', siteConfig ? 'loaded' : 'not loaded', 'isLoading:', isLoading);
    
    if (!siteConfig) {
      console.log('[Tracking] Waiting for siteConfig...');
      return;
    }

    console.log('[Tracking] Config loaded:', {
      gtm: siteConfig.gtm_container_id,
      ga: siteConfig.google_analytics_id,
      fbPixel: siteConfig.facebook_pixel_id
    });

    // Google Tag Manager
    if (siteConfig.gtm_container_id) {
      injectGTM(siteConfig.gtm_container_id);
    }

    // Google Analytics
    if (siteConfig.google_analytics_id) {
      injectGA(siteConfig.google_analytics_id);
    }

    // Facebook Pixel
    if (siteConfig.facebook_pixel_id) {
      injectFBPixel(siteConfig.facebook_pixel_id);
    }
  }, [siteConfig?.gtm_container_id, siteConfig?.google_analytics_id, siteConfig?.facebook_pixel_id, isLoading]);
};

function injectGTM(containerId: string) {
  // Check if already injected
  if (document.getElementById('gtm-script')) return;

  // GTM Script
  const script = document.createElement('script');
  script.id = 'gtm-script';
  script.innerHTML = `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${containerId}');
  `;
  document.head.appendChild(script);

  // GTM NoScript (for body)
  const noscript = document.createElement('noscript');
  noscript.id = 'gtm-noscript';
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${containerId}`;
  iframe.height = '0';
  iframe.width = '0';
  iframe.style.display = 'none';
  iframe.style.visibility = 'hidden';
  noscript.appendChild(iframe);
  document.body.insertBefore(noscript, document.body.firstChild);

  console.log(`[Tracking] GTM ${containerId} injected`);
}

function injectGA(measurementId: string) {
  // Check if already injected
  if (document.getElementById('ga-script')) return;

  // GA4 or Universal Analytics
  const isGA4 = measurementId.startsWith('G-');

  if (isGA4) {
    // GA4 Script
    const script = document.createElement('script');
    script.id = 'ga-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    const configScript = document.createElement('script');
    configScript.id = 'ga-config';
    configScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}');
    `;
    document.head.appendChild(configScript);
  } else {
    // Universal Analytics (UA)
    const script = document.createElement('script');
    script.id = 'ga-script';
    script.innerHTML = `
      (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
      (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
      m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
      })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
      ga('create', '${measurementId}', 'auto');
      ga('send', 'pageview');
    `;
    document.head.appendChild(script);
  }

  console.log(`[Tracking] GA ${measurementId} injected`);
}

function injectFBPixel(pixelId: string) {
  // Check if already injected
  if (document.getElementById('fb-pixel-script')) return;

  const script = document.createElement('script');
  script.id = 'fb-pixel-script';
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);

  // NoScript fallback
  const noscript = document.createElement('noscript');
  noscript.id = 'fb-pixel-noscript';
  const img = document.createElement('img');
  img.height = 1;
  img.width = 1;
  img.style.display = 'none';
  img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
  noscript.appendChild(img);
  document.body.appendChild(noscript);

  console.log(`[Tracking] Facebook Pixel ${pixelId} injected`);
}