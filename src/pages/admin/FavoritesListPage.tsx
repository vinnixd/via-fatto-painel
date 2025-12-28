import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Heart, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface Favorite {
  id: string;
  property_id: string;
  user_hash: string;
  email: string;
  phone: string;
  created_at: string;
  property?: {
    title: string;
    slug: string;
  };
}

const FavoritesListPage = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select(`
            *,
            property:property_id (
              title,
              slug
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setFavorites((data as any[]) || []);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Heart className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Lista de Favoritos</h3>
              <span className="text-sm text-muted-foreground">({favorites.length} registros)</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : favorites.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum favorito registrado
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Imóvel</TableHead>
                      <TableHead>Hash do Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {favorites.map((favorite) => (
                      <TableRow key={favorite.id}>
                        <TableCell>
                          <p className="font-medium line-clamp-1">
                            {favorite.property?.title || 'Imóvel removido'}
                          </p>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {favorite.user_hash.substring(0, 16)}...
                        </TableCell>
                        <TableCell>{favorite.email || '-'}</TableCell>
                        <TableCell>{favorite.phone || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(favorite.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          {favorite.property?.slug && (
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={`/imovel/${favorite.property.slug}`} target="_blank">
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default FavoritesListPage;
