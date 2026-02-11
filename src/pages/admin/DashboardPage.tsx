import { useEffect, useState } from 'react';
import AdminLink from '@/components/admin/AdminLink';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import DashboardCharts from '@/components/admin/DashboardCharts';
import PlanUsageCard from '@/components/admin/PlanUsageCard';
import { useProfile } from '@/hooks/useProfile';
import { useTenant } from '@/contexts/TenantContext';
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
  Sparkles,
  ExternalLink,
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
  const { profile } = useProfile();
  const { tenantId } = useTenant();
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
    if (!tenantId) return;
    
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
          supabase.from('properties').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
          supabase.from('properties').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'venda'),
          supabase.from('properties').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'aluguel'),
          supabase.from('properties').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('featured', true),
          supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
          supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('read', false),
          supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
          supabase.from('properties').select('views').eq('tenant_id', tenantId),
          supabase.from('properties').select('id, title, slug, price, status, views, featured, created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(5),
          supabase.from('properties').select('id, title, slug, price, status, views, featured, created_at').eq('tenant_id', tenantId).order('views', { ascending: false }).limit(5),
          supabase.from('contacts').select('id, name, email, message, read, created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(5),
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
  }, [tenantId]);

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

  const firstName = profile?.name?.split(' ')[0] || 'Usuário';

  const statCards = [
    { 
      icon: Building2, 
      label: 'Total de Imóveis', 
      value: stats.totalProperties, 
      link: '/admin/imoveis',
      sublabel: 'cadastrados',
    },
    { 
      icon: Home, 
      label: 'À Venda', 
      value: stats.forSale, 
      link: '/admin/imoveis',
      sublabel: 'disponíveis',
    },
    { 
      icon: Key, 
      label: 'Para Aluguel', 
      value: stats.forRent, 
      link: '/admin/imoveis',
      sublabel: 'disponíveis',
    },
    { 
      icon: Eye, 
      label: 'Visualizações', 
      value: stats.totalViews, 
      link: null,
      sublabel: 'no total',
    },
    { 
      icon: MessageSquare, 
      label: 'Mensagens', 
      value: stats.totalMessages, 
      link: '/admin/mensagens', 
      badge: stats.unreadMessages,
      sublabel: 'recebidas',
    },
    { 
      icon: Heart, 
      label: 'Favoritos', 
      value: stats.totalFavorites, 
      link: '/admin/favoritos',
      sublabel: 'salvos',
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Carregando dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-8">
        {/* Header - Greeting */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
              Olá, {firstName} 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Aqui está o resumo dos últimos 30 dias
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="admin" className="shadow-sm">
              <AdminLink to="/admin/imoveis/novo">
                <Plus className="h-4 w-4 mr-2" />
                Novo Imóvel
              </AdminLink>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Site
              </a>
            </Button>
          </div>
        </div>

        {/* ─── Section: Performance / KPIs ─── */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {statCards.map((stat, idx) => {
              const CardWrapper = stat.link ? AdminLink : 'div';
              return (
                <CardWrapper
                  key={stat.label}
                  to={stat.link || '#'}
                  className={`group block ${stat.link ? 'cursor-pointer' : ''}`}
                >
                  <Card
                    className="relative overflow-hidden border bg-card transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-3">
                        {/* Icon pill */}
                        <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center relative">
                          <stat.icon className="h-5 w-5 text-foreground/70" />
                          {stat.badge && stat.badge > 0 && (
                            <span className="absolute -top-1 -right-1 bg-foreground text-background text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                              {stat.badge}
                            </span>
                          )}
                        </div>
                        {/* Value */}
                        <div>
                          <p className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                            {stat.value.toLocaleString('pt-BR')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                        </div>
                      </div>
                      {stat.link && (
                        <ArrowUpRight className="absolute top-4 right-4 h-4 w-4 text-muted-foreground/20 group-hover:text-muted-foreground/60 transition-colors" />
                      )}
                    </CardContent>
                  </Card>
                </CardWrapper>
              );
            })}
          </div>
        </section>

        {/* ─── Section: Analytics ─── */}
        <section className="bg-muted/30 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 py-8 rounded-none">
          <DashboardCharts />
        </section>

        {/* ─── Section: Content & Relationships ─── */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Recent Properties */}
            <Card className="border bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Building2 className="h-4.5 w-4.5 text-foreground/70" />
                  </div>
                  <CardTitle className="text-base font-semibold">Últimos Imóveis</CardTitle>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground text-xs">
                  <AdminLink to="/admin/imoveis">
                    Ver todos <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </AdminLink>
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                {recentProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                      <Building2 className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-muted-foreground text-sm mb-4">Nenhum imóvel cadastrado</p>
                    <Button size="sm" asChild variant="outline">
                      <AdminLink to="/admin/imoveis/novo">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar
                      </AdminLink>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {recentProperties.map((property) => (
                      <AdminLink
                        key={property.id}
                        to={`/admin/imoveis/${property.id}`}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/60 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm line-clamp-1 group-hover:text-foreground transition-colors">
                              {property.title}
                            </p>
                            {property.featured && (
                              <Sparkles className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(property.created_at)}
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          <p className="font-semibold text-sm">{formatPrice(property.price)}</p>
                          <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {property.status === 'venda' ? 'Venda' : 'Aluguel'}
                          </span>
                        </div>
                      </AdminLink>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Viewed Properties */}
            <Card className="border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <TrendingUp className="h-4.5 w-4.5 text-foreground/70" />
                  </div>
                  <CardTitle className="text-base font-semibold">Mais Visualizados</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {topProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-muted-foreground text-sm">Nenhum imóvel cadastrado</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {topProperties.map((property, index) => (
                      <AdminLink
                        key={property.id}
                        to={`/admin/imoveis/${property.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/60 transition-colors group"
                      >
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-xs ${
                          index === 0
                            ? 'bg-foreground text-background'
                            : index <= 2
                              ? 'bg-muted-foreground/20 text-foreground'
                              : 'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1 group-hover:text-foreground transition-colors">
                            {property.title}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatPrice(property.price)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Eye className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">{property.views.toLocaleString('pt-BR')}</span>
                        </div>
                      </AdminLink>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Messages */}
            <Card className="border bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center relative">
                    <MessageSquare className="h-4.5 w-4.5 text-foreground/70" />
                    {stats.unreadMessages > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-foreground text-background text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {stats.unreadMessages}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-base font-semibold">Mensagens</CardTitle>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground text-xs">
                  <AdminLink to="/admin/mensagens">
                    Ver todas <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </AdminLink>
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                {recentMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-muted-foreground text-sm">Nenhuma mensagem recebida</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {recentMessages.map((msg) => (
                      <AdminLink
                        key={msg.id}
                        to="/admin/mensagens"
                        className={`block p-3 rounded-xl transition-all hover:bg-muted/60 ${
                          !msg.read ? 'bg-muted/40 ring-1 ring-border/50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm flex items-center gap-2">
                            {!msg.read ? (
                              <span className="h-2 w-2 rounded-full bg-foreground flex-shrink-0" />
                            ) : (
                              <CheckCircle className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
                            )}
                            {msg.name}
                          </p>
                          <span className="text-[10px] text-muted-foreground">{formatTimeAgo(msg.created_at)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 pl-[18px]">{msg.message}</p>
                      </AdminLink>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Plan Usage */}
            <PlanUsageCard />
          </div>
        </section>

        {/* ─── Quick Stats Footer ─── */}
        <section>
          <Card className="border bg-muted/20">
            <CardContent className="p-5 md:p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-6 md:gap-10">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-foreground/60" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground">{stats.featuredCount}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Em Destaque</p>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-border hidden md:block" />
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                      <Eye className="h-4 w-4 text-foreground/60" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground">{stats.totalViews.toLocaleString('pt-BR')}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Views Totais</p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visualizar Site
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;
