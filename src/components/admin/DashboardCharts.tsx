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
} from 'recharts';
import { Eye, Loader2, Users } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChartData {
  date: string;
  fullDate: string;
  views: number;
  leads: number;
}

const DashboardCharts = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      try {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const startDate = startOfDay(subDays(new Date(), days - 1));
        const endDate = endOfDay(new Date());

        // Get all days in the interval
        const allDays = eachDayOfInterval({ start: startDate, end: endDate });

        // Fetch real page views from page_views table
        const { data: pageViews, error: viewsError } = await supabase
          .from('page_views')
          .select('view_date, view_count')
          .gte('view_date', format(startDate, 'yyyy-MM-dd'))
          .lte('view_date', format(endDate, 'yyyy-MM-dd'));

        if (viewsError) {
          console.error('Error fetching page views:', viewsError);
        }

        // Fetch contacts (leads) with created_at
        const { data: contacts, error: contactsError } = await supabase
          .from('contacts')
          .select('created_at')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (contactsError) {
          console.error('Error fetching contacts:', contactsError);
        }

        // Group page views by day
        const viewsByDay: Record<string, number> = {};
        pageViews?.forEach(pv => {
          const day = pv.view_date;
          viewsByDay[day] = (viewsByDay[day] || 0) + (pv.view_count || 0);
        });

        // Group contacts by day
        const contactsByDay: Record<string, number> = {};
        contacts?.forEach(contact => {
          const day = format(parseISO(contact.created_at), 'yyyy-MM-dd');
          contactsByDay[day] = (contactsByDay[day] || 0) + 1;
        });

        // Create chart data for each day
        const data: ChartData[] = allDays.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const views = viewsByDay[dayKey] || 0;
          const leads = contactsByDay[dayKey] || 0;

          return {
            date: format(day, 'dd/MM', { locale: ptBR }),
            fullDate: format(day, 'dd MMM yyyy', { locale: ptBR }),
            views,
            leads,
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
  }, [period]);

  const totalViews = chartData.reduce((sum, d) => sum + d.views, 0);
  const totalLeads = chartData.reduce((sum, d) => sum + d.leads, 0);
  const avgViews = Math.round(totalViews / chartData.length) || 0;

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="border shadow-sm">
            <CardContent className="flex items-center justify-center h-80">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        {(['7d', '30d', '90d'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
              period === p
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Views Chart */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Eye className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Visualizações</CardTitle>
                  <p className="text-xs text-muted-foreground">Últimos {period === '7d' ? '7' : period === '30d' ? '30' : '90'} dias</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{totalViews.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-muted-foreground">~{avgViews}/dia</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    interval={Math.floor(chartData.length / 6)}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value.toLocaleString('pt-BR')}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                    labelFormatter={(_, payload) => payload[0]?.payload?.fullDate || ''}
                    formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Visualizações']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fill="url(#viewsGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Leads Chart */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Leads (Mensagens)</CardTitle>
                  <p className="text-xs text-muted-foreground">Últimos {period === '7d' ? '7' : period === '30d' ? '30' : '90'} dias</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{totalLeads.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-muted-foreground">total de leads</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    interval={Math.floor(chartData.length / 6)}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                    labelFormatter={(_, payload) => payload[0]?.payload?.fullDate || ''}
                    formatter={(value: number) => [value, 'Leads']}
                  />
                  <Bar 
                    dataKey="leads" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardCharts;
