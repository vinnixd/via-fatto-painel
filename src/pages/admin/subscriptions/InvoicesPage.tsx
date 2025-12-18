import { useState } from 'react';
import SubscriptionsLayout from './SubscriptionsLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Download, 
  FileText, 
  Receipt, 
  CheckCircle2,
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useInvoices, useCurrentSubscription } from '@/hooks/useSubscription';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const InvoicesPage = () => {
  const { data: invoices, isLoading: loadingInvoices } = useInvoices();
  const { data: subscription, isLoading: loadingSubscription } = useCurrentSubscription();

  const isLoading = loadingInvoices || loadingSubscription;

  // Calculate stats
  const totalPaid = invoices?.reduce((sum, inv) => {
    if (inv.status === 'paid') {
      return sum + Number(inv.amount);
    }
    return sum;
  }, 0) || 0;

  const paidCount = invoices?.filter(inv => inv.status === 'paid').length || 0;
  const lastInvoice = invoices?.[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Pago</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
      case 'overdue':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Atrasado</Badge>;
      case 'canceled':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  if (isLoading) {
    return (
      <SubscriptionsLayout>
        <div className="max-w-5xl animate-fade-in space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </SubscriptionsLayout>
    );
  }

  return (
    <SubscriptionsLayout>
      <div className="max-w-5xl animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Faturas</h1>
          <p className="text-muted-foreground">
            Acompanhe seu histórico de pagamentos e baixe suas notas fiscais.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-green-500/20 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-semibold text-green-600">Em dia</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-primary/20 rounded-xl">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Faturas</p>
                <p className="font-semibold">{paidCount} pagas</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/20 rounded-xl">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Última</p>
                <p className="font-semibold">
                  {lastInvoice 
                    ? format(new Date(lastInvoice.due_date), 'MMM/yyyy', { locale: ptBR })
                    : 'N/A'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/20 rounded-xl">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total pago</p>
                <p className="font-semibold">R$ {totalPaid.toFixed(2).replace('.', ',')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fiscal Data Card */}
        {subscription && (
          <Card className="mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-muted/50 to-transparent p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-background rounded-xl">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Dados fiscais</h3>
                  <p className="text-sm text-muted-foreground">
                    {subscription.fiscal_name 
                      ? `${subscription.fiscal_name} - ${subscription.fiscal_document}`
                      : 'Nenhum dado fiscal cadastrado'
                    }
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Invoices Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Histórico de faturas</h2>
          </div>
          
          {!invoices || invoices.length === 0 ? (
            <Card className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma fatura encontrada</h3>
              <p className="text-muted-foreground">As faturas aparecerão aqui quando forem geradas.</p>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fatura</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-[80px] text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="group">
                      <TableCell>
                        <span className="text-primary hover:underline cursor-pointer font-medium">
                          {invoice.invoice_number || `#${invoice.id.slice(0, 8)}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(invoice.due_date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        {subscription?.plan?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.status)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        R$ {Number(invoice.amount).toFixed(2).replace('.', ',')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 opacity-50 group-hover:opacity-100 transition-opacity"
                          onClick={() => toast.info('Funcionalidade de download em breve!')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </div>
    </SubscriptionsLayout>
  );
};

export default InvoicesPage;