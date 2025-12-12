import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, Pencil, Trash2, Eye, Star, Loader2, Upload, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Property {
  id: string;
  title: string;
  slug: string;
  price: number;
  status: string;
  type: string;
  featured: boolean;
  views: number;
  created_at: string;
  address_city: string;
  address_state: string;
  thumbnail?: string;
}

const PropertiesListPage = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const fetchProperties = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('properties')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      // Fetch thumbnails for each property
      const propertiesWithThumbnails = await Promise.all(
        (data || []).map(async (property) => {
          const { data: images } = await supabase
            .from('property_images')
            .select('url')
            .eq('property_id', property.id)
            .order('order_index', { ascending: true })
            .limit(1);
          
          return {
            ...property,
            thumbnail: images?.[0]?.url || null
          };
        })
      );

      setProperties(propertiesWithThumbnails);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Erro ao carregar imóveis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [page, search]);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      // Delete related images first
      await supabase.from('property_images').delete().eq('property_id', deleteId);
      
      // Delete property
      const { error } = await supabase.from('properties').delete().eq('id', deleteId);

      if (error) throw error;

      toast.success('Imóvel excluído com sucesso');
      fetchProperties();
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Erro ao excluir imóvel');
    } finally {
      setDeleteId(null);
    }
  };

  const toggleFeatured = async (id: string, featured: boolean) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ featured: !featured })
        .eq('id', id);

      if (error) throw error;

      setProperties(properties.map(p => 
        p.id === id ? { ...p, featured: !featured } : p
      ));
      toast.success(featured ? 'Destaque removido' : 'Imóvel destacado');
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast.error('Erro ao atualizar destaque');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <AdminLayout>
      <AdminHeader title="Imóveis" subtitle="Gerencie todos os imóveis cadastrados" />
      
      <div className="p-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar imóveis..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link to="/admin/importar">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar CSV
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/admin/imoveis/novo">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Imóvel
                  </Link>
                </Button>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {search ? 'Nenhum imóvel encontrado' : 'Nenhum imóvel cadastrado'}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Imóvel</TableHead>
                        <TableHead>Localização</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Views</TableHead>
                        <TableHead className="text-center">Destaque</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {properties.map((property) => (
                        <TableRow key={property.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {property.thumbnail ? (
                                <img 
                                  src={property.thumbnail} 
                                  alt={property.title}
                                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium line-clamp-1">{property.title}</p>
                                <p className="text-xs text-muted-foreground capitalize">{property.type}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{property.address_city}, {property.address_state}</p>
                          </TableCell>
                          <TableCell className="font-semibold">{formatPrice(property.price)}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              property.status === 'venda' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                              {property.status === 'venda' ? 'Venda' : 'Aluguel'}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                              {property.views}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleFeatured(property.id, property.featured)}
                              className={property.featured ? 'text-yellow-500' : 'text-muted-foreground'}
                            >
                              <Star className="h-4 w-4" fill={property.featured ? 'currentColor' : 'none'} />
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" asChild>
                                <Link to={`/imovel/${property.slug}`} target="_blank">
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon" asChild>
                                <Link to={`/admin/imoveis/${property.id}`}>
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteId(property.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Anterior
                    </Button>
                    <span className="flex items-center px-4 text-sm text-muted-foreground">
                      Página {page} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Próxima
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este imóvel? Esta ação não pode ser desfeita.
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

export default PropertiesListPage;
