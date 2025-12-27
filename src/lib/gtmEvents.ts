/**
 * Google Tag Manager Custom Events
 * These events can be captured in GTM to create tags for GA4, Facebook Pixel, etc.
 */

declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

// Ensure dataLayer exists
const getDataLayer = () => {
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
};

// Track WhatsApp button clicks
export const trackWhatsAppClick = (source: string, propertyId?: string, propertyTitle?: string) => {
  getDataLayer().push({
    event: 'whatsapp_click',
    event_category: 'engagement',
    event_label: source,
    property_id: propertyId || null,
    property_title: propertyTitle || null,
  });
  console.log('[GTM Event] whatsapp_click:', { source, propertyId, propertyTitle });
};

// Track favorite add/remove
export const trackFavorite = (action: 'add' | 'remove', propertyId: string, propertyTitle: string) => {
  getDataLayer().push({
    event: 'favorite_action',
    event_category: 'engagement',
    event_action: action,
    property_id: propertyId,
    property_title: propertyTitle,
  });
  console.log('[GTM Event] favorite_action:', { action, propertyId, propertyTitle });
};

// Track contact form submission
export const trackContactForm = (subject: string, hasPropertyId: boolean = false) => {
  getDataLayer().push({
    event: 'contact_form_submit',
    event_category: 'lead',
    event_label: subject,
    has_property_context: hasPropertyId,
  });
  console.log('[GTM Event] contact_form_submit:', { subject, hasPropertyId });
};

// Track property view
export const trackPropertyView = (propertyId: string, propertyTitle: string, propertyType: string, price: number) => {
  getDataLayer().push({
    event: 'property_view',
    event_category: 'engagement',
    property_id: propertyId,
    property_title: propertyTitle,
    property_type: propertyType,
    property_price: price,
  });
  console.log('[GTM Event] property_view:', { propertyId, propertyTitle, propertyType, price });
};

// Track property share
export const trackPropertyShare = (propertyId: string, propertyTitle: string, method: 'whatsapp' | 'copy') => {
  getDataLayer().push({
    event: 'property_share',
    event_category: 'engagement',
    event_action: method,
    property_id: propertyId,
    property_title: propertyTitle,
  });
  console.log('[GTM Event] property_share:', { propertyId, propertyTitle, method });
};

// Track search
export const trackSearch = (filters: { city?: string; type?: string; priceMin?: number; priceMax?: number }) => {
  getDataLayer().push({
    event: 'property_search',
    event_category: 'engagement',
    search_city: filters.city || null,
    search_type: filters.type || null,
    search_price_min: filters.priceMin || null,
    search_price_max: filters.priceMax || null,
  });
  console.log('[GTM Event] property_search:', filters);
};
