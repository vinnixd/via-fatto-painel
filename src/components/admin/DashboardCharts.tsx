import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
} from 'recharts';
import { Eye, Loader2, Users, MessageSquare } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTenant } from '@/contexts/TenantContext';

interface ChartData {
  date: string;
  fullDate: string;
  views: number;
  leads: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-lg">
      <p className="text-xs font-semibold text-foreground mb-1">{payload[0]?.payload?.fullDate}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-foreground/60" />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-foreground">{entry.value?.toLocaleString('pt-BR')}</span>
        </div>
      ))}
    </div>
  );
};

const DashboardCharts = () => {
  const { tenantId } = useTenant();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (!tenantId) return;
    
    const fetchChartData = async () => {
      setLoading(true);
      try {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const startDate = startOfDay(subDays(new Date(), days - 1));
        const endDate = endOfDay(new Date());
        const allDays = eachDayOfInterval({ start: startDate, end: endDate });

        const { data: pageViews, error: viewsError } = await supabase
          .from('page_views')
          .select('view_date, view_count')
          .gte('view_date', format(startDate, 'yyyy-MM-dd'))
          .lte('view_date', format(endDate, 'yyyy-MM-dd'));

        if (viewsError) console.error('Error fetching page views:', viewsError);

        const { data: contacts, error: contactsError } = await supabase
          .from('contacts')
          .select('created_at')
          .eq('tenant_id', tenantId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (contactsError) console.error('Error fetching contacts:', contactsError);

        const viewsByDay: Record<string, number> = {};
        pageViews?.forEach(pv => {
          const day = pv.view_date;
          viewsByDay[day] = (viewsByDay[day] || 0) + (pv.view_count || 0);
        });

        const contactsByDay: Record<string, number> = {};
        contacts?.forEach(contact => {
          const day = format(parseISO(contact.created_at), 'yyyy-MM-dd');
          contactsByDay[day] = (contactsByDay[day] || 0) + 1;
        });

        const data: ChartData[] = allDays.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          return {
            date: format(day, 'dd/MM', { locale: ptBR }),
            fullDate: format(day, 'dd MMM yyyy', { locale: ptBR }),
            views: viewsByDay[dayKey] || 0,
            leads: contactsByDay[dayKey] || 0,
          };
        });

        setChartData(data);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [period, tenantId]);

  const totalViews = chartData.reduce((sum, d) => sum + d.views, 0);
  const totalLeads = chartData.reduce((sum, d) => sum + d.leads, 0);
  const avgViews = chartData.length ? Math.round(totalViews / chartData.length) : 0;
  const hasLeadData = totalLeads > 0;

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="border">
            <CardContent className="flex items-center justify-center h-80">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="flex items-center gap-1.5 bg-muted/60 rounded-lg p-1 w-fit">
        {(['7d', '30d', '90d'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              period === p
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Views Chart */}
        <Card className="border bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <Eye className="h-4 w-4 text-foreground/60" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Visualizações</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Últimos {period === '7d' ? '7' : period === '30d' ? '30' : '90'} dias
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {totalViews.toLocaleString('pt-BR')}
                </p>
                <p className="text-[10px] text-muted-foreground">~{avgViews}/dia</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    interval={Math.floor(chartData.length / 6)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value.toLocaleString('pt-BR')}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {/* Average reference line */}
                  <ReferenceLine
                    y={avgViews}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="4 4"
                    strokeOpacity={0.4}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    name="Visualizações"
                    stroke="hsl(var(--foreground))"
                    strokeWidth={1.5}
                    fill="url(#viewsGradient)"
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: 'hsl(var(--foreground))',
                      stroke: 'hsl(var(--card))',
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Leads Chart */}
        <Card className="border bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <Users className="h-4 w-4 text-foreground/60" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Leads (Mensagens)</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Últimos {period === '7d' ? '7' : period === '30d' ? '30' : '90'} dias
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {totalLeads.toLocaleString('pt-BR')}
                </p>
                <p className="text-[10px] text-muted-foreground">total de leads</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64">
              {!hasLeadData ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">Nenhum lead recebido no período</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Os dados aparecerão quando novos contatos forem recebidos
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      vertical={false}
                      opacity={0.5}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                      interval={Math.floor(chartData.length / 6)}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="leads"
                      name="Leads"
                      fill="hsl(var(--foreground))"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={32}
                      fillOpacity={0.7}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardCharts;
