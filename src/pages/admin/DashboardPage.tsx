import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
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
  ArrowUpRight,
  Mail,
  Clock,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Palette,
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
        const [
          totalPropertiesResult,
          forSaleResult,
          forRentResult,
          featuredCountResult,
          totalMessagesResult,
          unreadMessagesResult,
          totalFavoritesResult,
          viewsDataResult,
          recentResult,
          topResult,
          messagesResult,
        ] = await Promise.all([
          supabase.from('properties').select('*', { count: 'exact', head: true }),
          supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'venda'),
          supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'aluguel'),
          supabase.from('properties').select('*', { count: 'exact', head: true }).eq('featured', true),
          supabase.from('contacts').select('*', { count: 'exact', head: true }),
          supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('read', false),
          supabase.from('favorites').select('*', { count: 'exact', head: true }),
          supabase.from('properties').select('views'),
          supabase.from('properties').select('id, title, slug, price, status, views, featured, created_at').order('created_at', { ascending: false }).limit(5),
          supabase.from('properties').select('id, title, slug, price, status, views, featured, created_at').order('views', { ascending: false }).limit(5),
          supabase.from('contacts').select('id, name, email, message, read, created_at').order('created_at', { ascending: false }).limit(5),
        ]);

        const totalViews = viewsDataResult.data?.reduce((sum, p) => sum + (p.views || 0), 0) || 0;

        setStats({
          totalProperties: totalPropertiesResult.count || 0,
          forSale: forSaleResult.count || 0,
          forRent: forRentResult.count || 0,
          totalMessages: totalMessagesResult.count || 0,
          unreadMessages: unreadMessagesResult.count || 0,
          totalFavorites: totalFavoritesResult.count || 0,
          totalViews,
          featuredCount: featuredCountResult.count || 0,
        });

        setRecentProperties(recentResult.data || []);
        setTopProperties(topResult.data || []);
        setRecentMessages(messagesResult.data || []);
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
    { 
      icon: Building2, 
      label: 'Total de Imóveis', 
      value: stats.totalProperties, 
      gradient: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50 dark:bg-blue-950/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      link: '/admin/imoveis' 
    },
    { 
      icon: Home, 
      label: 'À Venda', 
      value: stats.forSale, 
      gradient: 'from-emerald-500 to-emerald-600',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      link: '/admin/imoveis' 
    },
    { 
      icon: Key, 
      label: 'Para Aluguel', 
      value: stats.forRent, 
      gradient: 'from-amber-500 to-orange-500',
      bgLight: 'bg-amber-50 dark:bg-amber-950/30',
      textColor: 'text-amber-600 dark:text-amber-400',
      link: '/admin/imoveis' 
    },
    { 
      icon: Eye, 
      label: 'Visualizações', 
      value: stats.totalViews, 
      gradient: 'from-violet-500 to-purple-600',
      bgLight: 'bg-violet-50 dark:bg-violet-950/30',
      textColor: 'text-violet-600 dark:text-violet-400',
      link: null 
    },
    { 
      icon: MessageSquare, 
      label: 'Mensagens', 
      value: stats.totalMessages, 
      gradient: 'from-rose-500 to-pink-600',
      bgLight: 'bg-rose-50 dark:bg-rose-950/30',
      textColor: 'text-rose-600 dark:text-rose-400',
      link: '/admin/mensagens', 
      badge: stats.unreadMessages 
    },
    { 
      icon: Heart, 
      label: 'Favoritos', 
      value: stats.totalFavorites, 
      gradient: 'from-pink-500 to-rose-500',
      bgLight: 'bg-pink-50 dark:bg-pink-950/30',
      textColor: 'text-pink-600 dark:text-pink-400',
      link: '/admin/favoritos' 
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Visão geral do seu sistema imobiliário</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25">
              <Link to="/admin/imoveis/novo">
                <Plus className="h-4 w-4 mr-2" />
                Novo Imóvel
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-2">
              <Link to="/admin/mensagens">
                <Mail className="h-4 w-4 mr-2" />
                Mensagens
                {stats.unreadMessages > 0 && (
                  <span className="ml-2 bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                    {stats.unreadMessages}
                  </span>
                )}
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-2">
              <Link to="/admin/designer">
                <Palette className="h-4 w-4 mr-2" />
                Designer
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {statCards.map((stat) => {
            const CardWrapper = stat.link ? Link : 'div';
            return (
              <CardWrapper 
                key={stat.label} 
                to={stat.link || '#'}
                className={`group block ${stat.link ? 'cursor-pointer' : ''}`}
              >
                <Card className={`relative overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 ${stat.link ? 'hover:-translate-y-1' : ''} ${stat.bgLight}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3">
                      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg relative`}>
                        <stat.icon className="h-5 w-5 text-white" />
                        {stat.badge && stat.badge > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                            {stat.badge}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className={`text-2xl md:text-3xl font-bold ${stat.textColor}`}>{stat.value.toLocaleString('pt-BR')}</p>
                        <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                      </div>
                    </div>
                    {stat.link && (
                      <ArrowUpRight className="absolute top-3 right-3 h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                    )}
                  </CardContent>
                </Card>
              </CardWrapper>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Recent Properties */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-base font-semibold">Últimos Imóveis</CardTitle>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary">
                <Link to="/admin/imoveis">
                  Ver todos <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              {recentProperties.length === 0 ? (
                <div className="text-center py-10">
                  <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <Building2 className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">Nenhum imóvel cadastrado</p>
                  <Button size="sm" asChild>
                    <Link to="/admin/imoveis/novo">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentProperties.map((property) => (
                    <Link 
                      key={property.id} 
                      to={`/admin/imoveis/${property.id}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">{property.title}</p>
                          {property.featured && (
                            <Sparkles className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(property.created_at)}
                        </div>
                      </div>
                      <div className="text-right ml-3">
                        <p className="font-semibold text-sm">{formatPrice(property.price)}</p>
                        <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          property.status === 'venda' 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
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
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-base font-semibold">Mais Visualizados</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {topProperties.length === 0 ? (
                <div className="text-center py-10">
                  <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">Nenhum imóvel cadastrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {topProperties.map((property, index) => (
                    <Link 
                      key={property.id} 
                      to={`/admin/imoveis/${property.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        index === 0 
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' 
                          : index === 1 
                            ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' 
                            : index === 2 
                              ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' 
                              : 'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">{property.title}</p>
                        <p className="text-xs text-muted-foreground">{formatPrice(property.price)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground bg-muted rounded-full px-2.5 py-1">
                        <Eye className="h-3.5 w-3.5" />
                        <span className="text-xs font-semibold">{property.views.toLocaleString('pt-BR')}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center relative">
                  <MessageSquare className="h-4 w-4 text-white" />
                  {stats.unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                      {stats.unreadMessages}
                    </span>
                  )}
                </div>
                <CardTitle className="text-base font-semibold">Mensagens</CardTitle>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary">
                <Link to="/admin/mensagens">
                  Ver todas <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              {recentMessages.length === 0 ? (
                <div className="text-center py-10">
                  <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">Nenhuma mensagem recebida</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentMessages.map((msg) => (
                    <Link 
                      key={msg.id} 
                      to="/admin/mensagens"
                      className={`block p-3 rounded-xl transition-all ${
                        msg.read 
                          ? 'bg-muted/50 hover:bg-muted' 
                          : 'bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50 ring-1 ring-blue-200 dark:ring-blue-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="font-medium text-sm flex items-center gap-2">
                          {msg.read ? (
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                          )}
                          {msg.name}
                        </p>
                        <span className="text-[10px] text-muted-foreground font-medium">{formatTimeAgo(msg.created_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 pl-6">{msg.message}</p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Footer */}
        <Card className="border-0 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 md:gap-8">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-primary">{stats.featuredCount}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Em Destaque</p>
                  </div>
                </div>
                <div className="h-8 w-px bg-border hidden md:block" />
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Eye className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-primary">{stats.totalViews.toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Views Totais</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild className="bg-white dark:bg-transparent border-2 shadow-sm">
                <a href="/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visualizar Site
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;
