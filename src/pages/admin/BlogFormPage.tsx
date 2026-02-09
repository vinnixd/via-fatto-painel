import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Loader2, CalendarIcon, ImageIcon, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/imageCompression';
import RichTextEditor from '@/components/admin/blog/RichTextEditor';
import {
  useBlogPost,
  useCreateBlogPost,
  useUpdateBlogPost,
  type BlogPost,
} from '@/hooks/useBlogPosts';

const CATEGORIES = [
  'Mercado Imobiliário',
  'Dicas',
  'Dicas de Venda',
  'Investimentos',
  'Investimento',
  'Decoração',
  'Legislação',
  'Turismo',
  'Financiamento',
  'Guias',
  'Mercado',
];

const TENANT_STORAGE_KEY = 'active_tenant_id';

const slugify = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const BlogFormPage = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const { navigateAdmin } = useAdminNavigation();
  const { data: existingPost, isLoading: loadingPost } = useBlogPost(id);
  const createMutation = useCreateBlogPost();
  const updateMutation = useUpdateBlogPost();

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image_url: '',
    category: '',
    author_name: '',
    author_avatar_url: '',
    published: false,
    published_at: null as string | null,
    seo_title: '',
    seo_description: '',
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  useEffect(() => {
    if (existingPost) {
      setForm({
        title: existingPost.title || '',
        slug: existingPost.slug || '',
        excerpt: existingPost.excerpt || '',
        content: existingPost.content || '',
        cover_image_url: existingPost.cover_image_url || '',
        category: existingPost.category || '',
        author_name: existingPost.author_name || '',
        author_avatar_url: existingPost.author_avatar_url || '',
        published: existingPost.published,
        published_at: existingPost.published_at,
        seo_title: existingPost.seo_title || '',
        seo_description: existingPost.seo_description || '',
      });
      setSlugManuallyEdited(true);
    }
  }, [existingPost]);

  const updateField = (field: string, value: any) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'title' && !slugManuallyEdited) {
        updated.slug = slugify(value);
      }
      return updated;
    });
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG ou WebP.');
      return;
    }

    setUploading(true);
    try {
      const tenantId = localStorage.getItem(TENANT_STORAGE_KEY);
      const slug = form.slug || slugify(form.title) || 'post';
      const ext = file.name.split('.').pop();
      const path = `blog/${tenantId}/${slug}-cover.${ext}`;

      const compressed = await compressImage(file);
      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(path, compressed, { upsert: true, contentType: compressed.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(path);

      updateField('cover_image_url', publicUrl);
      toast.success('Imagem enviada!');
    } catch (err: any) {
      toast.error('Erro no upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error('Título é obrigatório.');
      return;
    }
    if (!form.excerpt.trim()) {
      toast.error('Resumo é obrigatório.');
      return;
    }
    if (!form.slug.trim()) {
      toast.error('Slug é obrigatório.');
      return;
    }

    const category = customCategory || form.category;
    const postData: any = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      content: form.content,
      cover_image_url: form.cover_image_url || null,
      category: category || null,
      author_name: form.author_name || null,
      author_avatar_url: form.author_avatar_url || null,
      published: form.published,
      published_at: form.published_at,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
    };

    // Auto-fill published_at when publishing
    if (form.published && !form.published_at) {
      postData.published_at = new Date().toISOString();
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id, ...postData });
      } else {
        await createMutation.mutateAsync(postData);
      }
      navigateAdmin('/admin/blog');
    } catch {
      // error handled by mutation
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  if (isEditing && loadingPost) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        <Tabs defaultValue="principal" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="principal">Principal</TabsTrigger>
            <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
            <TabsTrigger value="imagem">Imagem</TabsTrigger>
            <TabsTrigger value="autor">Autor</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          {/* Principal */}
          <TabsContent value="principal" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle>Informações Básicas</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    maxLength={120}
                    placeholder="Título do artigo"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{form.title.length}/120 caracteres</p>
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      updateField('slug', slugify(e.target.value));
                    }}
                    placeholder="url-do-artigo"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Gerado automaticamente a partir do título</p>
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={form.category} onValueChange={(v) => { updateField('category', v); setCustomCategory(''); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                      <SelectItem value="__custom">Outra (digitar)</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.category === '__custom' && (
                    <Input
                      className="mt-2"
                      placeholder="Digite a nova categoria"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="excerpt">Resumo *</Label>
                  <Textarea
                    id="excerpt"
                    value={form.excerpt}
                    onChange={(e) => updateField('excerpt', e.target.value)}
                    maxLength={300}
                    rows={3}
                    placeholder="Breve resumo do artigo..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">{form.excerpt.length}/300 caracteres</p>
                </div>
              </CardContent>
            </Card>

            {/* Publicação */}
            <Card>
              <CardHeader><CardTitle>Publicação</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Publicado</Label>
                    <p className="text-xs text-muted-foreground">O artigo ficará visível no site público</p>
                  </div>
                  <Switch checked={form.published} onCheckedChange={(v) => updateField('published', v)} />
                </div>
                <div>
                  <Label>Data de publicação</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.published_at
                          ? format(new Date(form.published_at), 'dd/MM/yyyy', { locale: ptBR })
                          : 'Selecionar data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.published_at ? new Date(form.published_at) : undefined}
                        onSelect={(date) => updateField('published_at', date?.toISOString() || null)}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conteúdo */}
          <TabsContent value="conteudo" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Conteúdo do Artigo</CardTitle></CardHeader>
              <CardContent>
                <RichTextEditor content={form.content} onChange={(html) => updateField('content', html)} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Imagem */}
          <TabsContent value="imagem" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Imagem de Capa</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Dimensões recomendadas: <strong>1920×630px</strong> (proporção ~3:1). Formatos aceitos: JPG, PNG, WebP.</span>
                </div>
                {form.cover_image_url && (
                  <div className="relative aspect-[3/1] rounded-lg overflow-hidden bg-muted">
                    <img src={form.cover_image_url} alt="Capa" className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <Label htmlFor="cover-upload">Upload de imagem</Label>
                  <Input
                    id="cover-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCoverUpload}
                    disabled={uploading}
                  />
                  {uploading && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Enviando...</p>}
                </div>
                <div>
                  <Label htmlFor="cover-url">Ou cole a URL</Label>
                  <Input
                    id="cover-url"
                    value={form.cover_image_url}
                    onChange={(e) => updateField('cover_image_url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Autor */}
          <TabsContent value="autor" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Autor</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="author_name">Nome do autor</Label>
                  <Input
                    id="author_name"
                    value={form.author_name}
                    onChange={(e) => updateField('author_name', e.target.value)}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="author_avatar">URL do avatar</Label>
                  <Input
                    id="author_avatar"
                    value={form.author_avatar_url}
                    onChange={(e) => updateField('author_avatar_url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                {form.author_avatar_url && (
                  <div className="flex items-center gap-3">
                    <img src={form.author_avatar_url} alt="Avatar" className="h-12 w-12 rounded-full object-cover" />
                    <span className="text-sm text-muted-foreground">{form.author_name || 'Autor'}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO */}
          <TabsContent value="seo" className="mt-4 space-y-4">
            <Card>
              <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Input
                    id="seo_title"
                    value={form.seo_title}
                    onChange={(e) => updateField('seo_title', e.target.value)}
                    maxLength={60}
                    placeholder={form.title || 'Título para mecanismos de busca'}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{form.seo_title.length}/60 caracteres</p>
                </div>
                <div>
                  <Label htmlFor="seo_description">SEO Description</Label>
                  <Textarea
                    id="seo_description"
                    value={form.seo_description}
                    onChange={(e) => updateField('seo_description', e.target.value)}
                    maxLength={160}
                    rows={3}
                    placeholder={form.excerpt || 'Descrição para mecanismos de busca'}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{form.seo_description.length}/160 caracteres</p>
                </div>
              </CardContent>
            </Card>

            {/* Google Preview */}
            <Card>
              <CardHeader><CardTitle>Preview no Google</CardTitle></CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-white">
                  <p className="text-[#1a0dab] text-lg leading-tight hover:underline cursor-pointer">
                    {form.seo_title || form.title || 'Título do artigo'}
                  </p>
                  <p className="text-[#006621] text-sm mt-1">
                    viafatto.com.br/blog/{form.slug || 'url-do-artigo'}
                  </p>
                  <p className="text-[#545454] text-sm mt-1 line-clamp-2">
                    {form.seo_description || form.excerpt || 'Descrição do artigo aparecerá aqui...'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save button - always visible */}
        <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-background py-4">
          <Button type="button" variant="outline" onClick={() => navigateAdmin('/admin/blog')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {isEditing ? 'Salvar Alterações' : 'Criar Artigo'}
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default BlogFormPage;
