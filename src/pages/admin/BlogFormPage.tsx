import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { Save, Loader2, CalendarIcon, AlertCircle, Sparkles, X, Plus, Wand2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/imageCompression';
import RichTextEditor from '@/components/admin/blog/RichTextEditor';
import { useProfile } from '@/hooks/useProfile';
import GenerateArticleDialog from '@/components/admin/blog/GenerateArticleDialog';
import {
  useBlogPost,
  useCreateBlogPost,
  useUpdateBlogPost,
  type BlogPost,
} from '@/hooks/useBlogPosts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

interface FaqItem {
  question: string;
  answer: string;
}

const BlogFormPage = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const { navigateAdmin } = useAdminNavigation();
  const { data: existingPost, isLoading: loadingPost } = useBlogPost(id);
  const createMutation = useCreateBlogPost();
  const updateMutation = useUpdateBlogPost();
  const { profile } = useProfile();

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
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
    tags: [] as string[],
    faq: [] as FaqItem[],
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [generatingSeo, setGeneratingSeo] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Load AI-generated article from sessionStorage
  useEffect(() => {
    if (!isEditing) {
      const aiArticle = sessionStorage.getItem('ai_generated_article');
      if (aiArticle) {
        sessionStorage.removeItem('ai_generated_article');
        try {
          const article = JSON.parse(aiArticle);
          setForm(prev => ({
            ...prev,
            title: article.title || '',
            subtitle: article.subtitle || '',
            slug: slugify(article.title || ''),
            excerpt: article.excerpt || '',
            content: article.content || '',
            category: article.category || '',
            seo_title: article.seo_title || '',
            seo_description: article.seo_description || '',
            tags: Array.isArray(article.tags) ? article.tags : [],
            faq: Array.isArray(article.faq) ? article.faq : [],
          }));
          toast.success('Artigo gerado com IA carregado! Revise e publique.');
        } catch {
          // ignore
        }
      }
    }
  }, [isEditing]);

  // Load existing post data
  useEffect(() => {
    if (existingPost) {
      setForm({
        title: existingPost.title || '',
        subtitle: (existingPost as any).subtitle || '',
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
        tags: Array.isArray((existingPost as any).tags) ? (existingPost as any).tags : [],
        faq: Array.isArray((existingPost as any).faq) ? (existingPost as any).faq : [],
      });
      setSlugManuallyEdited(true);
    }
  }, [existingPost]);

  // Auto-fill author from logged-in user profile (only for new posts)
  useEffect(() => {
    if (!isEditing && profile) {
      setForm(prev => ({
        ...prev,
        author_name: prev.author_name || profile.name || '',
        author_avatar_url: prev.author_avatar_url || profile.avatar_url || '',
      }));
    }
  }, [isEditing, profile]);

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

  const addTag = () => {
    const tag = newTag.trim();
    if (tag && !form.tags.includes(tag)) {
      updateField('tags', [...form.tags, tag]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    updateField('tags', form.tags.filter(t => t !== tag));
  };

  const addFaqItem = () => {
    updateField('faq', [...form.faq, { question: '', answer: '' }]);
  };

  const updateFaqItem = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...form.faq];
    updated[index] = { ...updated[index], [field]: value };
    updateField('faq', updated);
  };

  const removeFaqItem = (index: number) => {
    updateField('faq', form.faq.filter((_, i) => i !== index));
  };

  const handleArticleGenerated = (article: any) => {
    setForm(prev => ({
      ...prev,
      title: article.title || prev.title,
      subtitle: article.subtitle || prev.subtitle,
      slug: slugify(article.title || prev.title),
      excerpt: article.excerpt || prev.excerpt,
      content: article.content || prev.content,
      category: article.category || prev.category,
      seo_title: article.seo_title || prev.seo_title,
      seo_description: article.seo_description || prev.seo_description,
      tags: Array.isArray(article.tags) ? article.tags : prev.tags,
      faq: Array.isArray(article.faq) ? article.faq : prev.faq,
    }));
    setSlugManuallyEdited(false);
    toast.success('Artigo gerado! Revise o conteúdo antes de publicar.');
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
      subtitle: form.subtitle || null,
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
      tags: form.tags.length > 0 ? form.tags : [],
      faq: form.faq.length > 0 ? form.faq : [],
    };

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
      <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* AI Generate button for existing editing or regeneration */}
        {!isEditing && (
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => setShowGenerateDialog(true)}>
              <Wand2 className="h-4 w-4 mr-2" />
              Gerar / Regenerar com IA
            </Button>
          </div>
        )}

        <Tabs defaultValue="principal" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="principal">Principal</TabsTrigger>
            <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
            <TabsTrigger value="imagem">Imagem</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
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
                  <Label htmlFor="subtitle">Subtítulo</Label>
                  <Input
                    id="subtitle"
                    value={form.subtitle}
                    onChange={(e) => updateField('subtitle', e.target.value)}
                    maxLength={150}
                    placeholder="Subtítulo complementar"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{form.subtitle.length}/150 caracteres</p>
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
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Conteúdo do Artigo</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview(true)} disabled={!form.content}>
                    <Eye className="h-4 w-4 mr-1" />
                    Visualizar
                  </Button>
                </div>
              </CardHeader>
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

          {/* Tags */}
          <TabsContent value="tags" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Adicionar tag..."
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  />
                  <Button type="button" variant="outline" onClick={addTag} disabled={!newTag.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {form.tags.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma tag adicionada.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>FAQ - Perguntas Frequentes</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addFaqItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.faq.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma pergunta adicionada. Clique em "Adicionar" para criar.</p>
                )}
                {form.faq.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3 relative">
                    <button
                      type="button"
                      onClick={() => removeFaqItem(index)}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div>
                      <Label>Pergunta {index + 1}</Label>
                      <Input
                        value={item.question}
                        onChange={(e) => updateFaqItem(index, 'question', e.target.value)}
                        placeholder="Pergunta frequente..."
                      />
                    </div>
                    <div>
                      <Label>Resposta</Label>
                      <Textarea
                        value={item.answer}
                        onChange={(e) => updateFaqItem(index, 'answer', e.target.value)}
                        placeholder="Resposta..."
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
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
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>SEO</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={generatingSeo || !form.title.trim()}
                    onClick={async () => {
                      setGeneratingSeo(true);
                      try {
                        const { data, error } = await supabase.functions.invoke('generate-blog-seo', {
                          body: {
                            title: form.title,
                            excerpt: form.excerpt,
                            category: customCategory || form.category,
                            content: form.content,
                          },
                        });
                        if (error) throw error;
                        if (data?.error) { toast.error(data.error); return; }
                        if (data?.seo_title) updateField('seo_title', data.seo_title);
                        if (data?.seo_description) updateField('seo_description', data.seo_description);
                        toast.success('SEO gerado com IA!');
                      } catch (err: any) {
                        toast.error('Erro ao gerar SEO: ' + (err.message || 'Tente novamente'));
                      } finally {
                        setGeneratingSeo(false);
                      }
                    }}
                  >
                    {generatingSeo ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Gerar com IA
                  </Button>
                </div>
              </CardHeader>
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
          <Button type="button" variant="outline" onClick={() => setShowPreview(true)} disabled={!form.content}>
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {isEditing ? 'Salvar Alterações' : 'Criar Artigo'}
          </Button>
        </div>
      </form>

      {/* AI Generate Dialog */}
      <GenerateArticleDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        onGenerated={handleArticleGenerated}
      />

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview do Artigo</DialogTitle>
          </DialogHeader>
          <article className="prose prose-sm max-w-none dark:prose-invert">
            {form.cover_image_url && (
              <img src={form.cover_image_url} alt={form.title} className="w-full rounded-lg aspect-[3/1] object-cover" />
            )}
            <h1>{form.title}</h1>
            {form.subtitle && <p className="text-xl text-muted-foreground lead">{form.subtitle}</p>}
            {form.category && <Badge variant="secondary">{form.category}</Badge>}
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 not-prose mt-2">
                {form.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
              </div>
            )}
            <div dangerouslySetInnerHTML={{ __html: form.content }} />
            {form.faq.length > 0 && (
              <div className="mt-8">
                <h2>Perguntas Frequentes</h2>
                {form.faq.map((item, i) => (
                  <div key={i} className="mb-4">
                    <h3>{item.question}</h3>
                    <p>{item.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </article>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default BlogFormPage;
