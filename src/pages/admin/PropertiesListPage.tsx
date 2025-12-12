import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Eye, 
  Star, 
  Loader2, 
  Upload, 
  ImageIcon,
  MapPin,
  Home,
  Building2,
  MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  address_neighborhood: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  thumbnail?: string;
}

const PropertiesListPage = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 12;

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
      setTotalCount(count || 0);
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
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      venda: { label: 'Venda', variant: 'default' },
      aluguel: { label: 'Aluguel', variant: 'secondary' },
      vendido: { label: 'Vendido', variant: 'destructive' },
      alugado: { label: 'Alugado', variant: 'outline' },
    };
    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    if (['apartamento', 'cobertura', 'flat'].includes(type)) {
      return <Building2 className="h-3.5 w-3.5" />;
    }
    return <Home className="h-3.5 w-3.5" />;
  };

  return (
    <AdminLayout>
      <AdminHeader title="Imóveis" subtitle="Gerencie todos os imóveis cadastrados" />
      
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total de Imóveis</p>
              <p className="text-2xl font-bold text-primary">{totalCount}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">À Venda</p>
              <p className="text-2xl font-bold text-green-600">{properties.filter(p => p.status === 'venda').length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-500/10 to-orange-500/5">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Aluguel</p>
              <p className="text-2xl font-bold text-orange-600">{properties.filter(p => p.status === 'aluguel').length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Destaques</p>
              <p className="text-2xl font-bold text-yellow-600">{properties.filter(p => p.featured).length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, cidade..."
                  className="pl-10 bg-muted/50 border-0"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild className="gap-2">
                  <Link to="/admin/importar">
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">Importar CSV</span>
                  </Link>
                </Button>
                <Button asChild className="gap-2 shadow-md">
                  <Link to="/admin/imoveis/novo">
                    <Plus className="h-4 w-4" />
                    Novo Imóvel
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Properties Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : properties.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Home className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {search ? 'Nenhum imóvel encontrado' : 'Nenhum imóvel cadastrado'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {search ? 'Tente alterar os termos de busca' : 'Comece cadastrando seu primeiro imóvel'}
              </p>
              {!search && (
                <Button asChild>
                  <Link to="/admin/imoveis/novo">
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Imóvel
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {properties.map((property) => (
                <Card 
                  key={property.id} 
                  className="border-0 shadow-sm overflow-hidden group hover:shadow-lg transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                    {property.thumbnail ? (
                      <img 
                        src={property.thumbnail} 
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
                      </div>
                    )}
                    
                    {/* Overlays */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {getStatusBadge(property.status)}
                      {property.featured && (
                        <Badge className="bg-yellow-500 hover:bg-yellow-500 text-yellow-950">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Destaque
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="absolute top-3 right-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            size="icon" 
                            variant="secondary" 
                            className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/imovel/${property.slug}`} target="_blank" className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              Ver no site
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/imoveis/${property.id}`} className="flex items-center gap-2">
                              <Pencil className="h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleFeatured(property.id, property.featured)} className="flex items-center gap-2">
                            <Star className={`h-4 w-4 ${property.featured ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                            {property.featured ? 'Remover destaque' : 'Destacar'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDeleteId(property.id)}
                            className="text-destructive focus:text-destructive flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Price */}
                    <div className="absolute bottom-3 left-3">
                      <span className="bg-background/90 backdrop-blur-sm text-foreground font-bold px-3 py-1.5 rounded-lg text-sm">
                        {formatPrice(property.price)}
                      </span>
                    </div>

                    {/* Views */}
                    <div className="absolute bottom-3 right-3">
                      <span className="bg-background/80 backdrop-blur-sm text-muted-foreground px-2 py-1 rounded text-xs flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {property.views}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-1 mb-2 group-hover:text-primary transition-colors">
                      {property.title}
                    </h3>
                    
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-3">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="line-clamp-1">
                        {property.address_neighborhood ? `${property.address_neighborhood}, ` : ''}
                        {property.address_city} - {property.address_state}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 capitalize">
                        {getTypeIcon(property.type)}
                        {property.type}
                      </span>
                      {property.bedrooms > 0 && (
                        <span>{property.bedrooms} quartos</span>
                      )}
                      {property.area > 0 && (
                        <span>{property.area}m²</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {(page - 1) * itemsPerPage + 1} a {Math.min(page * itemsPerPage, totalCount)} de {totalCount} imóveis
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Anterior
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? 'default' : 'ghost'}
                          size="sm"
                          className="w-9"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
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
