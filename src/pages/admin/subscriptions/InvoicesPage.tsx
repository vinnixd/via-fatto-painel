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
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  CreditCard,
  Settings,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useInvoices, useCurrentSubscription } from '@/hooks/useSubscription';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PixPaymentDialog from '@/components/admin/PixPaymentDialog';

const InvoicesPage = () => {
  const { data: invoices, isLoading: loadingInvoices } = useInvoices();
  const { data: subscription, isLoading: loadingSubscription } = useCurrentSubscription();
  const [pixDialogOpen, setPixDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<{ number: string | null; amount: number } | null>(null);

  const isLoading = loadingInvoices || loadingSubscription;

  // Calculate stats
  const totalPaid = invoices?.reduce((sum, inv) => {
    if (inv.status === 'paid') return sum + Number(inv.amount);
    return sum;
  }, 0) || 0;

  const paidCount = invoices?.filter(inv => inv.status === 'paid').length || 0;
  const overdueCount = invoices?.filter(inv => inv.status === 'overdue').length || 0;
  const pendingCount = invoices?.filter(inv => inv.status === 'pending').length || 0;

  // Contextual status message
  const getStatusMessage = () => {
    if (overdueCount > 0) {
      return {
        label: `${overdueCount} fatura${overdueCount > 1 ? 's' : ''} vencida${overdueCount > 1 ? 's' : ''}`,
        icon: AlertCircle,
        bgClass: 'bg-destructive/5 border-destructive/20',
        iconBgClass: 'bg-destructive/10',
        iconClass: 'text-destructive',
        textClass: 'text-destructive',
      };
    }
    if (pendingCount > 0) {
      return {
        label: `${pendingCount} fatura${pendingCount > 1 ? 's' : ''} em aberto`,
        icon: AlertTriangle,
        bgClass: 'bg-amber-500/5 border-amber-500/20',
        iconBgClass: 'bg-amber-500/10',
        iconClass: 'text-amber-600',
        textClass: 'text-amber-700',
      };
    }
    return {
      label: 'Pagamentos em dia',
      icon: CheckCircle2,
      bgClass: 'bg-green-500/5 border-green-500/20',
      iconBgClass: 'bg-green-500/10',
      iconClass: 'text-green-600',
      textClass: 'text-green-700',
    };
  };

  const statusInfo = getStatusMessage();
  const StatusIcon = statusInfo.icon;

  // Fiscal data completeness
  const isFiscalComplete = !!(
    subscription?.fiscal_name &&
    subscription?.fiscal_document &&
    subscription?.fiscal_cep &&
    subscription?.fiscal_city &&
    subscription?.fiscal_state &&
    subscription?.fiscal_street &&
    subscription?.fiscal_number
  );

  const openPixDialog = (invoiceNumber: string | null, amount: number) => {
    setSelectedInvoice({ number: invoiceNumber, amount });
    setPixDialogOpen(true);
  };

  const getActionButton = (status: string, invoiceNumber: string | null, amount: number) => {
    switch (status) {
      case 'pending':
        return (
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5 text-amber-700 border-amber-500/30 hover:bg-amber-500/10"
            onClick={() => openPixDialog(invoiceNumber, amount)}
          >
            <CreditCard className="h-3.5 w-3.5" />
            Pagar agora
          </Button>
        );
      case 'overdue':
        return (
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => openPixDialog(invoiceNumber, amount)}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            Regularizar pagamento
          </Button>
        );
      case 'paid':
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1.5 text-muted-foreground"
            onClick={() => toast.info('Funcionalidade de download em breve!')}
          >
            <Download className="h-3.5 w-3.5" />
            Baixar nota fiscal
          </Button>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Pago</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Em aberto</Badge>;
      case 'overdue':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Vencida</Badge>;
      case 'canceled':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  if (isLoading) {
    return (
      <SubscriptionsLayout>
        <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-20" />
          <Skeleton className="h-64" />
        </div>
      </SubscriptionsLayout>
    );
  }

  return (
    <SubscriptionsLayout>
      <div className="max-w-5xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Faturas</h1>
          <p className="text-muted-foreground">
            Acompanhe seu histórico de pagamentos e baixe suas notas fiscais.
          </p>
        </div>

        {/* Contextual Status Banner */}
        <Card className={`mb-6 border ${statusInfo.bgClass}`}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-2.5 rounded-xl shrink-0 ${statusInfo.iconBgClass}`}>
              <StatusIcon className={`h-5 w-5 ${statusInfo.iconClass}`} />
            </div>
            <div className="flex-1">
              <p className={`font-semibold ${statusInfo.textClass}`}>{statusInfo.label}</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{paidCount} paga{paidCount !== 1 ? 's' : ''}</span>
              <span>R$ {totalPaid.toFixed(2).replace('.', ',')} total</span>
            </div>
          </CardContent>
        </Card>

        {/* Fiscal Data Card */}
        {subscription && (
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                isFiscalComplete ? 'bg-green-500/10' : 'bg-amber-500/10'
              }`}>
                {isFiscalComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">
                  {isFiscalComplete ? 'Dados fiscais completos' : 'Dados fiscais incompletos'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {subscription.fiscal_name 
                    ? `${subscription.fiscal_name} — ${subscription.fiscal_document}`
                    : 'Notas fiscais são geradas automaticamente após confirmação do pagamento.'
                  }
                </p>
              </div>
              {!isFiscalComplete && (
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                  <Settings className="h-3.5 w-3.5" />
                  Completar dados fiscais
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Invoices Table */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Histórico de faturas</h2>
          
          {!invoices || invoices.length === 0 ? (
            <Card className="p-8 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="group">
                      <TableCell>
                        <span className="font-medium">
                          {invoice.invoice_number || `#${invoice.id.slice(0, 8)}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(invoice.due_date + 'T12:00:00'), 'dd/MM/yyyy')}
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
                      <TableCell className="text-right">
                        {getActionButton(invoice.status, invoice.invoice_number, Number(invoice.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </div>

      {selectedInvoice && (
        <PixPaymentDialog
          open={pixDialogOpen}
          onOpenChange={setPixDialogOpen}
          invoiceNumber={selectedInvoice.number}
          amount={selectedInvoice.amount}
        />
      )}
    </SubscriptionsLayout>
  );
};

export default InvoicesPage;
