import { useEffect, useState } from 'react';
import { PropertyFromDB, SiteConfig } from '@/hooks/useSupabaseData';
import {
  SEOConfig,
  buildPropertySEO,
  buildListingSEO,
  buildPageSEO,
  buildBlogPostSEO,
  ListingFilters,
  BlogPost,
  PageKey,
  generateOpenGraphMeta,
  generateTwitterMeta,
  generateLocalBusinessSchema,
} from '@/lib/seo';

// ============================================
// SEO HEAD COMPONENT PROPS
// ============================================

interface SEOHeadProps {
  // Option 1: Pass pre-built SEO config
  seoConfig?: SEOConfig;
  
  // Option 2: Legacy props for backward compatibility
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  noIndex?: boolean;
  
  // Data sources for auto-generation
  property?: PropertyFromDB;
  siteConfig?: SiteConfig | null;
  breadcrumbs?: { name: string; url: string }[];
  
  // For listing pages
  listingFilters?: ListingFilters;
  propertyCount?: number;
  
  // For blog pages
  blogPost?: BlogPost;
  
  // For institutional pages
  pageKey?: PageKey;
  
  // Debug mode
  debug?: boolean;
}

// ============================================
// SEO DEBUG PANEL (dev only)
// ============================================

interface SEODebugPanelProps {
  seoData: {
    title: string;
    description: string;
    canonicalUrl: string;
    ogImage: string;
    ogType: string;
    noIndex: boolean;
    schemas: object[];
  };
}

function SEODebugPanel({ seoData }: SEODebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-purple-600 text-white px-3 py-2 rounded-lg shadow-lg text-xs font-medium hover:bg-purple-700"
      >
        SEO Debug
      </button>
      
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-96 max-h-[80vh] overflow-auto bg-gray-900 text-white rounded-lg shadow-2xl p-4 text-xs">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm">SEO Debug Panel</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
              ✕
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-purple-400 font-medium">Title ({seoData.title.length}/60)</label>
              <p className={`mt-1 ${seoData.title.length > 60 ? 'text-red-400' : 'text-green-400'}`}>
                {seoData.title}
              </p>
            </div>
            
            <div>
              <label className="text-purple-400 font-medium">Description ({seoData.description.length}/155)</label>
              <p className={`mt-1 ${seoData.description.length > 155 ? 'text-red-400' : 'text-green-400'}`}>
                {seoData.description}
              </p>
            </div>
            
            <div>
              <label className="text-purple-400 font-medium">Canonical URL</label>
              <p className="mt-1 text-blue-400 break-all">{seoData.canonicalUrl}</p>
            </div>
            
            <div>
              <label className="text-purple-400 font-medium">OG Image</label>
              <p className="mt-1 text-blue-400 break-all">{seoData.ogImage || '(none)'}</p>
              {seoData.ogImage && (
                <img src={seoData.ogImage} alt="OG Preview" className="mt-2 w-full h-auto rounded border border-gray-700" />
              )}
            </div>
            
            <div className="flex gap-4">
              <div>
                <label className="text-purple-400 font-medium">Type</label>
                <p className="mt-1">{seoData.ogType}</p>
              </div>
              <div>
                <label className="text-purple-400 font-medium">Robots</label>
                <p className={`mt-1 ${seoData.noIndex ? 'text-yellow-400' : 'text-green-400'}`}>
                  {seoData.noIndex ? 'noindex, nofollow' : 'index, follow'}
                </p>
              </div>
            </div>
            
            <div>
              <label className="text-purple-400 font-medium">Schemas ({seoData.schemas.length})</label>
              <pre className="mt-1 text-xs overflow-auto max-h-40 bg-gray-800 p-2 rounded">
                {JSON.stringify(seoData.schemas.map(s => (s as any)['@type']), null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN SEO HEAD COMPONENT
// ============================================

export function SEOHead({
  seoConfig,
  title,
  description,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  noIndex = false,
  property,
  siteConfig,
  breadcrumbs,
  listingFilters,
  propertyCount,
  blogPost,
  pageKey,
  debug = false,
}: SEOHeadProps) {
  const [debugData, setDebugData] = useState<any>(null);

  useEffect(() => {
    const baseUrl = window.location.origin;
    let config: SEOConfig | null = seoConfig || null;

    // Auto-generate SEO config based on provided data
    if (!config) {
      if (property) {
        config = buildPropertySEO(property, siteConfig || null, baseUrl);
      } else if (listingFilters !== undefined) {
        config = buildListingSEO(listingFilters, propertyCount || 0, siteConfig || null, baseUrl);
      } else if (blogPost) {
        config = buildBlogPostSEO(blogPost, siteConfig || null, baseUrl);
      } else if (pageKey) {
        config = buildPageSEO(pageKey, siteConfig || null, baseUrl);
      }
    }

    // Build final SEO values
    const seoTitle = config?.title || title || siteConfig?.seo_title || 'Imobiliária';
    const seoDescription = config?.description || description || siteConfig?.seo_description || '';
    const seoCanonical = config?.canonicalUrl || canonicalUrl || window.location.href.split('?')[0];
    const seoImage = config?.ogImage || ogImage || siteConfig?.og_image_url || '';
    const seoOgType = config?.ogType || ogType;
    const seoNoIndex = config?.noIndex || noIndex;
    const seoSchemas = config?.schemas || [];
    const seoBreadcrumbs = config?.breadcrumbs || breadcrumbs || [];
    const seoArticle = config?.article;

    // Set debug data
    if (debug) {
      setDebugData({
        title: seoTitle,
        description: seoDescription,
        canonicalUrl: seoCanonical,
        ogImage: seoImage,
        ogType: seoOgType,
        noIndex: seoNoIndex,
        schemas: seoSchemas,
      });
    }

    // Set document title
    document.title = seoTitle;

    // Helper to set/update meta tags
    const setMetaTag = (name: string, content: string, isProperty = false) => {
      if (!content) return;
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Helper to set/update link tags
    const setLinkTag = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = href;
    };

    // Basic meta tags
    setMetaTag('description', seoDescription);
    if (config?.keywords || siteConfig?.seo_keywords) {
      setMetaTag('keywords', config?.keywords || siteConfig?.seo_keywords || '');
    }

    // Robots
    if (seoNoIndex) {
      setMetaTag('robots', 'noindex, nofollow');
    } else {
      setMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    }

    // Canonical URL
    setLinkTag('canonical', seoCanonical);

    // Open Graph
    const ogMeta = generateOpenGraphMeta(seoTitle, seoDescription, seoCanonical, seoImage, seoOgType, seoArticle);
    Object.entries(ogMeta).forEach(([key, value]) => {
      if (value) setMetaTag(key, value, true);
    });

    // Twitter Card
    const twitterMeta = generateTwitterMeta(seoTitle, seoDescription, seoImage);
    Object.entries(twitterMeta).forEach(([key, value]) => {
      if (value) setMetaTag(key, value);
    });

    // Structured Data (JSON-LD)
    const removeExistingSchemas = () => {
      document.querySelectorAll('script[type="application/ld+json"][data-seo]').forEach(el => el.remove());
    };

    const addSchema = (schema: object | null, id: string) => {
      if (!schema) return;
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo', id);
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    };

    removeExistingSchemas();

    // Add LocalBusiness schema (always for site context)
    if (!property && !blogPost) {
      addSchema(generateLocalBusinessSchema(siteConfig || null, baseUrl), 'local-business');
    }

    // Add all schemas from config
    seoSchemas.forEach((schema, index) => {
      const schemaType = (schema as any)['@type'] || `schema-${index}`;
      addSchema(schema, schemaType.toLowerCase().replace(/\s+/g, '-'));
    });

    // Cleanup on unmount
    return () => {
      removeExistingSchemas();
    };
  }, [
    seoConfig,
    title,
    description,
    canonicalUrl,
    ogImage,
    ogType,
    noIndex,
    property,
    siteConfig,
    breadcrumbs,
    listingFilters,
    propertyCount,
    blogPost,
    pageKey,
    debug,
  ]);

  return debug && debugData ? <SEODebugPanel seoData={debugData} /> : null;
}

export default SEOHead;
