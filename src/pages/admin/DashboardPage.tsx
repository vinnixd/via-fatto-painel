import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import {
  Building2,
  Home,
  Key,
  MessageSquare,
  Eye,
  TrendingUp,
  Heart,
} from 'lucide-react';

interface DashboardStats {
  totalProperties: number;
  forSale: number;
  forRent: number;
  totalMessages: number;
  totalFavorites: number;
  totalViews: number;
}

interface RecentProperty {
  id: string;
  title: string;
  price: number;
  status: string;
  views: number;
  created_at: string;
}

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    forSale: 0,
    forRent: 0,
    totalMessages: 0,
    totalFavorites: 0,
    totalViews: 0,
  });
  const [recentProperties, setRecentProperties] = useState<RecentProperty[]>([]);
  const [topProperties, setTopProperties] = useState<RecentProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Total properties
        const { count: totalProperties } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true });

        // For sale
        const { count: forSale } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'venda');

        // For rent
        const { count: forRent } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'aluguel');

        // Total messages
        const { count: totalMessages } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true });

        // Total favorites
        const { count: totalFavorites } = await supabase
          .from('favorites')
          .select('*', { count: 'exact', head: true });

        // Total views
        const { data: viewsData } = await supabase
          .from('properties')
          .select('views');
        
        const totalViews = viewsData?.reduce((sum, p) => sum + (p.views || 0), 0) || 0;

        setStats({
          totalProperties: totalProperties || 0,
          forSale: forSale || 0,
          forRent: forRent || 0,
          totalMessages: totalMessages || 0,
          totalFavorites: totalFavorites || 0,
          totalViews,
        });

        // Recent properties
        const { data: recent } = await supabase
          .from('properties')
          .select('id, title, price, status, views, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentProperties(recent || []);

        // Top viewed properties
        const { data: top } = await supabase
          .from('properties')
          .select('id, title, price, status, views, created_at')
          .order('views', { ascending: false })
          .limit(5);

        setTopProperties(top || []);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const statCards = [
    { icon: Building2, label: 'Total de Imóveis', value: stats.totalProperties, color: 'bg-blue-500' },
    { icon: Home, label: 'À Venda', value: stats.forSale, color: 'bg-green-500' },
    { icon: Key, label: 'Para Aluguel', value: stats.forRent, color: 'bg-orange-500' },
    { icon: Eye, label: 'Visualizações', value: stats.totalViews, color: 'bg-purple-500' },
    { icon: MessageSquare, label: 'Mensagens', value: stats.totalMessages, color: 'bg-red-500' },
    { icon: Heart, label: 'Favoritos', value: stats.totalFavorites, color: 'bg-pink-500' },
  ];

  return (
    <AdminLayout>
      <AdminHeader title="Dashboard" subtitle="Visão geral do sistema" />
      
      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Properties */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Últimos Imóveis Adicionados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : recentProperties.length === 0 ? (
                <p className="text-muted-foreground">Nenhum imóvel cadastrado</p>
              ) : (
                <div className="space-y-3">
                  {recentProperties.map((property) => (
                    <div key={property.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{property.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(property.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary text-sm">{formatPrice(property.price)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          property.status === 'venda' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {property.status === 'venda' ? 'Venda' : 'Aluguel'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Viewed Properties */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Imóveis Mais Visualizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : topProperties.length === 0 ? (
                <p className="text-muted-foreground">Nenhum imóvel cadastrado</p>
              ) : (
                <div className="space-y-3">
                  {topProperties.map((property, index) => (
                    <div key={property.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                        <div>
                          <p className="font-medium text-sm line-clamp-1">{property.title}</p>
                          <p className="text-xs text-muted-foreground">{formatPrice(property.price)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span className="font-semibold">{property.views}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;
