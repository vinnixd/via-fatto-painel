import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TENANT_STORAGE_KEY = 'active_tenant_id';
const getResolvedTenantId = (): string | null => localStorage.getItem(TENANT_STORAGE_KEY);

export interface BlogPost {
  id: string;
  tenant_id: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  category: string | null;
  author_name: string | null;
  author_avatar_url: string | null;
  published: boolean;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  views: number;
  created_at: string;
  updated_at: string;
}

export const useBlogPosts = (filters?: { search?: string; category?: string; status?: 'published' | 'draft' }) => {
  const tenantId = getResolvedTenantId();

  return useQuery({
    queryKey: ['blog-posts', tenantId, filters],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select('*')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.status === 'published') {
        query = query.eq('published', true);
      } else if (filters?.status === 'draft') {
        query = query.eq('published', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as BlogPost[];
    },
    enabled: !!tenantId,
  });
};

export const useBlogPost = (id: string | undefined) => {
  return useQuery({
    queryKey: ['blog-post', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data as BlogPost | null;
    },
    enabled: !!id,
  });
};

export const useCreateBlogPost = () => {
  const queryClient = useQueryClient();
  const tenantId = getResolvedTenantId();

  return useMutation({
    mutationFn: async (post: Partial<BlogPost>) => {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert({ ...post, tenant_id: tenantId } as any)
        .select()
        .single();
      if (error) throw error;
      return data as BlogPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Artigo criado com sucesso!');
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate key') || error.message?.includes('unique')) {
        toast.error('Já existe um artigo com esse slug. Altere o título ou edite o slug.');
      } else {
        toast.error('Erro ao criar artigo: ' + error.message);
      }
    },
  });
};

export const useUpdateBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...post }: Partial<BlogPost> & { id: string }) => {
      const { data, error } = await supabase
        .from('blog_posts')
        .update(post as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as BlogPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post'] });
      toast.success('Artigo atualizado!');
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate key') || error.message?.includes('unique')) {
        toast.error('Já existe um artigo com esse slug.');
      } else {
        toast.error('Erro ao atualizar artigo: ' + error.message);
      }
    },
  });
};

export const useDeleteBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Artigo excluído!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir artigo: ' + error.message);
    },
  });
};

export const useToggleBlogPostPublished = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const updateData: any = { published };
      if (published) {
        // Only set published_at if not already set
        const { data: existing } = await supabase
          .from('blog_posts')
          .select('published_at')
          .eq('id', id)
          .single();
        if (!existing?.published_at) {
          updateData.published_at = new Date().toISOString();
        }
      }
      const { error } = await supabase.from('blog_posts').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success(variables.published ? 'Artigo publicado!' : 'Artigo despublicado!');
    },
    onError: (error: any) => {
      toast.error('Erro: ' + error.message);
    },
  });
};

export const useDuplicateBlogPost = () => {
  const queryClient = useQueryClient();
  const tenantId = getResolvedTenantId();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: original, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchError) throw fetchError;

      const { id: _id, created_at, updated_at, views, published, published_at, slug, ...rest } = original;
      const newSlug = `${slug}-copia-${Date.now().toString(36)}`;

      const { error } = await supabase
        .from('blog_posts')
        .insert({
          ...rest,
          tenant_id: tenantId,
          title: `${rest.title} (cópia)`,
          slug: newSlug,
          published: false,
          published_at: null,
          views: 0,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Artigo duplicado!');
    },
    onError: (error: any) => {
      toast.error('Erro ao duplicar: ' + error.message);
    },
  });
};
