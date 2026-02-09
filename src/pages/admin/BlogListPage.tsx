import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminLink from '@/components/admin/AdminLink';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, Pencil, Trash2, Copy, MoreVertical, Loader2, Eye, ImageIcon, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  useBlogPosts,
  useDeleteBlogPost,
  useToggleBlogPostPublished,
  useDuplicateBlogPost,
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

const BlogListPage = () => {
  const { navigateAdmin } = useAdminNavigation();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: posts, isLoading } = useBlogPosts({
    search: search || undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    status: statusFilter !== 'all' ? (statusFilter as 'published' | 'draft') : undefined,
  });

  const deleteMutation = useDeleteBlogPost();
  const togglePublished = useToggleBlogPostPublished();
  const duplicateMutation = useDuplicateBlogPost();

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  // Extract unique categories from posts
  const allCategories = [...new Set([...CATEGORIES, ...(posts?.map(p => p.category).filter(Boolean) as string[] || [])])].sort();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header actions */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar artigos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {allCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="published">Publicados</SelectItem>
                <SelectItem value="draft">Rascunhos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => navigateAdmin('/admin/blog/novo')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Artigo
          </Button>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{posts?.length || 0} artigos</span>
          <span>•</span>
          <span>{posts?.filter(p => p.published).length || 0} publicados</span>
          <span>•</span>
          <span>{posts?.filter(p => !p.published).length || 0} rascunhos</span>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !posts?.length ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Nenhum artigo encontrado</p>
            <p className="text-sm">Crie seu primeiro artigo clicando em "Novo Artigo"</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Capa</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead className="hidden md:table-cell">Categoria</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Publicação</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">Views</TableHead>
                  <TableHead className="w-[100px]">Publicado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id} className="cursor-pointer" onClick={() => navigateAdmin(`/admin/blog/${post.id}`)}>
                    <TableCell>
                      {post.cover_image_url ? (
                        <img src={post.cover_image_url} alt="" className="h-10 w-16 object-cover rounded" />
                      ) : (
                        <div className="h-10 w-16 rounded bg-muted flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium line-clamp-1">{post.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1 md:hidden">{post.category || '—'}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {post.category ? (
                        <Badge variant="secondary" className="text-xs">{post.category}</Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={post.published ? 'default' : 'outline'} className="text-xs">
                        {post.published ? 'Publicado' : 'Rascunho'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                      {post.published_at
                        ? format(new Date(post.published_at), 'dd/MM/yyyy', { locale: ptBR })
                        : '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-right text-muted-foreground">
                      <span className="flex items-center justify-end gap-1">
                        <Eye className="h-3 w-3" />
                        {post.views}
                      </span>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={post.published}
                        onCheckedChange={(checked) =>
                          togglePublished.mutate({ id: post.id, published: checked })
                        }
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigateAdmin(`/admin/blog/${post.id}`)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateMutation.mutate(post.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteId(post.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir artigo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O artigo será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default BlogListPage;
