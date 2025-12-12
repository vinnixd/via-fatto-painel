import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  Building2,
  Home,
  Key,
  MessageSquare,
  Eye,
  TrendingUp,
  Heart,
  Plus,
  ArrowRight,
  Mail,
  Clock,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface DashboardStats {
  totalProperties: number;
  forSale: number;
  forRent: number;
  totalMessages: number;
  unreadMessages: number;
  totalFavorites: number;
  totalViews: number;
  featuredCount: number;
}

interface RecentProperty {
  id: string;
  title: string;
  slug: string;
  price: number;
  status: string;
  views: number;
  featured: boolean;
  created_at: string;
}

interface RecentMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  created_at: string;
}

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    forSale: 0,
    forRent: 0,
    totalMessages: 0,
    unreadMessages: 0,
    totalFavorites: 0,
    totalViews: 0,
    featuredCount: 0,
  });
  const [recentProperties, setRecentProperties] = useState<RecentProperty[]>([]);
  const [topProperties, setTopProperties] = useState<RecentProperty[]>([]);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
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

        // Featured count
        const { count: featuredCount } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('featured', true);

        // Total messages
        const { count: totalMessages } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true });

        // Unread messages
        const { count: unreadMessages } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('read', false);

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
          unreadMessages: unreadMessages || 0,
          totalFavorites: totalFavorites || 0,
          totalViews,
          featuredCount: featuredCount || 0,
        });

        // Recent properties
        const { data: recent } = await supabase
          .from('properties')
          .select('id, title, slug, price, status, views, featured, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentProperties(recent || []);

        // Top viewed properties
        const { data: top } = await supabase
          .from('properties')
          .select('id, title, slug, price, status, views, featured, created_at')
          .order('views', { ascending: false })
          .limit(5);

        setTopProperties(top || []);

        // Recent messages
        const { data: messages } = await supabase
          .from('contacts')
          .select('id, name, email, message, read, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentMessages(messages || []);
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

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return formatDate(date);
  };

  const statCards = [
    { icon: Building2, label: 'Total de Imóveis', value: stats.totalProperties, color: 'bg-blue-500', link: '/admin/imoveis' },
    { icon: Home, label: 'À Venda', value: stats.forSale, color: 'bg-green-500', link: '/admin/imoveis' },
    { icon: Key, label: 'Para Aluguel', value: stats.forRent, color: 'bg-orange-500', link: '/admin/imoveis' },
    { icon: Eye, label: 'Visualizações', value: stats.totalViews, color: 'bg-purple-500', link: null },
    { icon: MessageSquare, label: 'Mensagens', value: stats.totalMessages, color: 'bg-red-500', link: '/admin/mensagens', badge: stats.unreadMessages },
    { icon: Heart, label: 'Favoritos', value: stats.totalFavorites, color: 'bg-pink-500', link: '/admin/favoritos' },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <AdminHeader title="Dashboard" subtitle="Visão geral do sistema" />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminHeader title="Dashboard" subtitle="Visão geral do sistema" />
      
      <div className="p-6">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button asChild>
            <Link to="/admin/imoveis/novo">
              <Plus className="h-4 w-4 mr-2" />
              Novo Imóvel
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/mensagens">
              <Mail className="h-4 w-4 mr-2" />
              Ver Mensagens
              {stats.unreadMessages > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {stats.unreadMessages}
                </span>
              )}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/designer">
              <TrendingUp className="h-4 w-4 mr-2" />
              Designer
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {statCards.map((stat) => {
            const CardWrapper = stat.link ? Link : 'div';
            return (
              <CardWrapper 
                key={stat.label} 
                to={stat.link || '#'}
                className={stat.link ? 'block hover:scale-105 transition-transform' : ''}
              >
                <Card className="border-0 shadow-sm h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center relative`}>
                        <stat.icon className="h-5 w-5 text-white" />
                        {stat.badge && stat.badge > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                            {stat.badge}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardWrapper>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Properties */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Últimos Imóveis
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/imoveis">
                  Ver todos <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentProperties.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">Nenhum imóvel cadastrado</p>
                  <Button size="sm" className="mt-4" asChild>
                    <Link to="/admin/imoveis/novo">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentProperties.map((property) => (
                    <Link 
                      key={property.id} 
                      to={`/admin/imoveis/${property.id}`}
                      className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm line-clamp-1">{property.title}</p>
                          {property.featured && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">★</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(property.created_at)}
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <p className="font-semibold text-primary text-sm">{formatPrice(property.price)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          property.status === 'venda' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {property.status === 'venda' ? 'Venda' : 'Aluguel'}
                        </span>
                      </div>
                    </Link>
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
                Mais Visualizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topProperties.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">Nenhum imóvel cadastrado</p>
              ) : (
                <div className="space-y-3">
                  {topProperties.map((property, index) => (
                    <Link 
                      key={property.id} 
                      to={`/admin/imoveis/${property.id}`}
                      className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${
                          index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-muted-foreground'
                        }`}>#{index + 1}</span>
                        <div>
                          <p className="font-medium text-sm line-clamp-1">{property.title}</p>
                          <p className="text-xs text-muted-foreground">{formatPrice(property.price)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span className="font-semibold">{property.views}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Mensagens Recentes
                {stats.unreadMessages > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {stats.unreadMessages} nova{stats.unreadMessages > 1 ? 's' : ''}
                  </span>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/mensagens">
                  Ver todas <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">Nenhuma mensagem recebida</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentMessages.map((msg) => (
                    <Link 
                      key={msg.id} 
                      to="/admin/mensagens"
                      className={`block p-3 rounded-lg transition-colors ${
                        msg.read ? 'bg-neutral-50 hover:bg-neutral-100' : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm flex items-center gap-2">
                          {msg.read ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-blue-500" />
                          )}
                          {msg.name}
                        </p>
                        <span className="text-xs text-muted-foreground">{formatTimeAgo(msg.created_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{msg.message}</p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Footer */}
        <div className="mt-8 p-4 bg-primary/5 rounded-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm">
              <span className="text-muted-foreground">
                <strong className="text-foreground">{stats.featuredCount}</strong> imóveis em destaque
              </span>
              <span className="text-muted-foreground">
                <strong className="text-foreground">{stats.totalViews}</strong> visualizações totais
              </span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/" target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4 mr-2" />
                Ver Site
              </a>
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;
