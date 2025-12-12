import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PropertyFromDB {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  status: 'venda' | 'aluguel' | 'vendido' | 'alugado';
  type: string;
  profile: string;
  address_street: string | null;
  address_neighborhood: string | null;
  address_city: string;
  address_state: string;
  address_zipcode: string | null;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  garages: number;
  area: number;
  built_area: number | null;
  financing: boolean;
  documentation: string;
  featured: boolean;
  views: number;
  features: string[] | null;
  amenities: string[] | null;
  reference: string | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  images?: { id: string; url: string; alt: string; order_index: number }[];
}

export interface SiteConfig {
  id: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_background_url: string | null;
  about_title: string | null;
  about_text: string | null;
  about_image_url: string | null;
  about_image_position: 'top' | 'center' | 'bottom' | null;
  home_image_url: string | null;
  footer_text: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_youtube: string | null;
  social_linkedin: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  og_image_url: string | null;
}

export const useProperties = (options?: { featured?: boolean; limit?: number; status?: string }) => {
  return useQuery({
    queryKey: ['properties', options],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('active', true)
        .order('order_index', { ascending: true });

      if (options?.featured) {
        query = query.eq('featured', true);
      }

      if (options?.status) {
        query = query.eq('status', options.status as 'venda' | 'aluguel' | 'vendido' | 'alugado');
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch images for each property
      const propertiesWithImages = await Promise.all(
        (data || []).map(async (property) => {
          const { data: images } = await supabase
            .from('property_images')
            .select('*')
            .eq('property_id', property.id)
            .order('order_index');

          return { ...property, images: images || [] };
        })
      );

      return propertiesWithImages as PropertyFromDB[];
    },
  });
};

export const useProperty = (slug: string) => {
  return useQuery({
    queryKey: ['property', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Fetch images
      const { data: images } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', data.id)
        .order('order_index');

      // Increment views
      await supabase
        .from('properties')
        .update({ views: data.views + 1 })
        .eq('id', data.id);

      return { ...data, images: images || [] } as PropertyFromDB;
    },
    enabled: !!slug,
  });
};

export const useSiteConfig = () => {
  return useQuery({
    queryKey: ['site-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as SiteConfig | null;
    },
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
};
