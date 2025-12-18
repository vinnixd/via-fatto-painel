import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  MoreVertical,
  GripVertical,
  ArrowUpDown,
  Check,
  CheckSquare,
  Square,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  order_index: number;
  thumbnail?: string;
}

interface SortablePropertyCardProps {
  property: Property;
  isReorderMode: boolean;
  isSelectMode: boolean;
  isSelected: boolean;
  onSelectToggle: (id: string) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  getTypeIcon: (type: string) => React.ReactNode;
  formatPrice: (price: number) => string;
  toggleFeatured: (id: string, featured: boolean) => void;
  setDeleteId: (id: string) => void;
  onCardClick: (id: string) => void;
}

const SortablePropertyCard = ({
  property,
  isReorderMode,
  isSelectMode,
  isSelected,
  onSelectToggle,
  getStatusBadge,
  getTypeIcon,
  formatPrice,
  toggleFeatured,
  setDeleteId,
  onCardClick,
}: SortablePropertyCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: property.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`border-0 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 cursor-pointer ${
        isDragging ? 'ring-2 ring-primary z-50' : ''
      } ${isSelected ? 'ring-2 ring-destructive' : ''}`}
      onClick={() => {
        if (isSelectMode) {
          onSelectToggle(property.id);
        } else if (!isReorderMode) {
          onCardClick(property.id);
        }
      }}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
        {property.thumbnail ? (
          <img
            src={property.thumbnail}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}

        {/* Overlays */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {getStatusBadge(property.status)}
          {property.featured && (
            <Badge className="bg-yellow-500 hover:bg-yellow-500 text-yellow-950 text-xs px-1.5 py-0.5">
              <Star className="h-2.5 w-2.5 fill-current" />
            </Badge>
          )}
        </div>

        {/* Drag Handle, Select checkbox, or Actions */}
        <div className="absolute top-2 right-2">
          {isSelectMode ? (
            <div className={`h-6 w-6 rounded flex items-center justify-center ${
              isSelected ? 'bg-destructive text-destructive-foreground' : 'bg-background/80 backdrop-blur-sm'
            }`}>
              {isSelected ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </div>
          ) : isReorderMode ? (
            <Button
              size="icon"
              variant="secondary"
              className="h-6 w-6 bg-background/80 backdrop-blur-sm hover:bg-background cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-3 w-3" />
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-6 w-6 bg-background/80 backdrop-blur-sm hover:bg-background"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    to={`/imovel/${property.slug}`}
                    target="_blank"
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Ver no site
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to={`/admin/imoveis/${property.id}`}
                    className="flex items-center gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => toggleFeatured(property.id, property.featured)}
                  className="flex items-center gap-2"
                >
                  <Star
                    className={`h-4 w-4 ${
                      property.featured ? 'fill-yellow-500 text-yellow-500' : ''
                    }`}
                  />
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
          )}
        </div>

        {/* Price */}
        <div className="absolute bottom-2 left-2">
          <span className="bg-background/90 backdrop-blur-sm text-foreground font-semibold px-2 py-1 rounded text-xs">
            {formatPrice(property.price)}
          </span>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-2.5">
        <h3 className="font-medium text-sm line-clamp-1 mb-1 group-hover:text-primary transition-colors">
          {property.title}
        </h3>

        <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1.5">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="line-clamp-1">
            {property.address_city} - {property.address_state}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5 capitalize">
            {getTypeIcon(property.type)}
            {property.type}
          </span>
          {property.bedrooms > 0 && <span>{property.bedrooms}q</span>}
          {property.area > 0 && <span>{property.area}m²</span>}
        </div>
      </CardContent>
    </Card>
  );
};

const PropertiesListPage = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [bulkDeleteConfirmText, setBulkDeleteConfirmText] = useState('');
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const itemsPerPage = 24;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchProperties = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('properties')
        .select('*', { count: 'exact' });

      // When in reorder mode, sort by order_index, otherwise by created_at
      if (isReorderMode) {
        query = query.order('order_index', { ascending: true });
      } else {
        query = query.order('order_index', { ascending: true });
      }

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
            thumbnail: images?.[0]?.url || null,
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
  }, [page, search, isReorderMode]);

  // Listen for import job completion to refresh the list
  useEffect(() => {
    const channel = supabase
      .channel('import-jobs-list-refresh')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'import_jobs',
        },
        (payload) => {
          const job = payload.new as { status: string };
          if (job.status === 'completed') {
            // Refresh the properties list when import completes
            fetchProperties();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setProperties((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const saveOrder = async () => {
    setSavingOrder(true);
    try {
      // Update order_index for all properties in current view
      const updates = properties.map((property, index) => ({
        id: property.id,
        order_index: (page - 1) * itemsPerPage + index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('properties')
          .update({ order_index: update.order_index })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast.success('Ordem salva com sucesso!');
      setIsReorderMode(false);
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Erro ao salvar ordem');
    } finally {
      setSavingOrder(false);
    }
  };

  const toggleSelectProperty = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(properties.map(p => p.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (bulkDeleteConfirmText !== 'EXCLUIR') return;
    
    setBulkDeleting(true);
    let deletedCount = 0;
    
    try {
      const propertyIds = Array.from(selectedIds);
      
      // 1. Get ALL images from all properties at once
      const { data: allImages } = await supabase
        .from('property_images')
        .select('url, property_id')
        .in('property_id', propertyIds);
      
      // 2. Delete images from storage in batch (max 100 per request)
      if (allImages && allImages.length > 0) {
        const imagePaths = allImages
          .map(img => {
            try {
              const url = new URL(img.url);
              const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/property-images\/(.+)/);
              return pathMatch ? pathMatch[1] : null;
            } catch {
              return null;
            }
          })
          .filter((path): path is string => path !== null);
        
        // Delete in batches of 100
        for (let i = 0; i < imagePaths.length; i += 100) {
          const batch = imagePaths.slice(i, i + 100);
          await supabase.storage.from('property-images').remove(batch);
        }
      }
      
      // 3. Delete all property_images records at once
      await supabase
        .from('property_images')
        .delete()
        .in('property_id', propertyIds);
      
      // 4. Delete all favorites at once
      await supabase
        .from('favorites')
        .delete()
        .in('property_id', propertyIds);
      
      // 5. Delete all properties at once
      const { error, count } = await supabase
        .from('properties')
        .delete()
        .in('id', propertyIds);
      
      if (error) throw error;
      
      deletedCount = propertyIds.length;
      
      toast.success(
        `${deletedCount} imóveis excluídos com sucesso!`,
        { duration: 5000 }
      );
      
      setSelectedIds(new Set());
      setIsSelectMode(false);
      setShowBulkDeleteDialog(false);
      setBulkDeleteConfirmText('');
      fetchProperties();
    } catch (error) {
      console.error('Error in bulk delete:', error);
      toast.error('Erro durante a exclusão em massa');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      // 1. Get images to delete from storage
      const { data: images } = await supabase
        .from('property_images')
        .select('url')
        .eq('property_id', deleteId);
      
      // 2. Delete images from storage in batch
      if (images && images.length > 0) {
        const imagePaths = images
          .map(img => {
            try {
              const url = new URL(img.url);
              const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/property-images\/(.+)/);
              return pathMatch ? pathMatch[1] : null;
            } catch {
              return null;
            }
          })
          .filter((path): path is string => path !== null);
        
        if (imagePaths.length > 0) {
          await supabase.storage.from('property-images').remove(imagePaths);
        }
      }
      
      // 3. Delete related records
      await supabase.from('property_images').delete().eq('property_id', deleteId);
      await supabase.from('favorites').delete().eq('property_id', deleteId);

      // 4. Delete property
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

      setProperties(
        properties.map((p) => (p.id === id ? { ...p, featured: !featured } : p))
      );
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
    const statusConfig: Record<
      string,
      { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
    > = {
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
              <p className="text-2xl font-bold text-green-600">
                {properties.filter((p) => p.status === 'venda').length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-500/10 to-orange-500/5">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Aluguel</p>
              <p className="text-2xl font-bold text-orange-600">
                {properties.filter((p) => p.status === 'aluguel').length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Destaques</p>
              <p className="text-2xl font-bold text-yellow-600">
                {properties.filter((p) => p.featured).length}
              </p>
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
                  disabled={isReorderMode}
                />
              </div>
              <div className="flex gap-2">
                {isSelectMode ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsSelectMode(false);
                        setSelectedIds(new Set());
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={selectedIds.size === properties.length ? deselectAll : selectAll}
                    >
                      {selectedIds.size === properties.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowBulkDeleteDialog(true)}
                      disabled={selectedIds.size === 0}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir ({selectedIds.size})
                    </Button>
                  </>
                ) : isReorderMode ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsReorderMode(false);
                        fetchProperties();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="admin"
                      onClick={saveOrder}
                      disabled={savingOrder}
                      className="gap-2"
                    >
                      {savingOrder ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Salvar Ordem
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsSelectMode(true)}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Excluir Vários</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsReorderMode(true)}
                      className="gap-2"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                      <span className="hidden sm:inline">Ordenar</span>
                    </Button>
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
                  </>
                )}
              </div>
            </div>
            {isSelectMode && (
              <div className="mt-3 p-2 bg-destructive/10 rounded-lg text-sm text-destructive flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Clique nos imóveis para selecionar. Use "Selecionar Todos" para marcar todos da página.
              </div>
            )}
            {isReorderMode && (
              <div className="mt-3 p-2 bg-primary/10 rounded-lg text-sm text-primary flex items-center gap-2">
                <GripVertical className="h-4 w-4" />
                Arraste os imóveis para reordenar. Clique em "Salvar Ordem" quando terminar.
              </div>
            )}
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
                {search
                  ? 'Tente alterar os termos de busca'
                  : 'Comece cadastrando seu primeiro imóvel'}
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={properties.map((p) => p.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                  {properties.map((property) => (
                    <SortablePropertyCard
                      key={property.id}
                      property={property}
                      isReorderMode={isReorderMode}
                      isSelectMode={isSelectMode}
                      isSelected={selectedIds.has(property.id)}
                      onSelectToggle={toggleSelectProperty}
                      getStatusBadge={getStatusBadge}
                      getTypeIcon={getTypeIcon}
                      formatPrice={formatPrice}
                      toggleFeatured={toggleFeatured}
                      setDeleteId={setDeleteId}
                      onCardClick={(id) => navigate(`/admin/imoveis/${id}`)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Pagination */}
            {totalPages > 1 && !isReorderMode && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {(page - 1) * itemsPerPage + 1} a{' '}
                  {Math.min(page * itemsPerPage, totalCount)} de {totalCount} imóveis
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
              Tem certeza que deseja excluir este imóvel? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Excluir {selectedIds.size} imóveis
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Esta ação irá excluir permanentemente:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li><strong>{selectedIds.size}</strong> imóveis selecionados</li>
                <li>Todas as imagens associadas (banco e storage)</li>
                <li>Todos os favoritos relacionados</li>
              </ul>
              <p className="font-semibold text-destructive">
                Esta ação NÃO pode ser desfeita!
              </p>
              <div className="pt-2">
                <p className="text-sm mb-2">Digite <strong>EXCLUIR</strong> para confirmar:</p>
                <Input
                  placeholder="Digite EXCLUIR"
                  value={bulkDeleteConfirmText}
                  onChange={(e) => setBulkDeleteConfirmText(e.target.value.toUpperCase())}
                  className="font-mono"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setBulkDeleteConfirmText('');
            }}>
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkDeleteConfirmText !== 'EXCLUIR' || bulkDeleting}
            >
              {bulkDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Permanentemente
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default PropertiesListPage;
