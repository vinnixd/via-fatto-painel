import { useState, useEffect } from 'react';
import SubscriptionsLayout from './SubscriptionsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ExternalLink, 
  Settings, 
  CreditCard, 
  Calendar,
  Receipt,
  Building2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  FileText,
  History,
} from 'lucide-react';
import { useCurrentSubscription, useUpdateFiscalData, useInvoices } from '@/hooks/useSubscription';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import { format, setDate, addMonths, isBefore, startOfDay, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PaymentsPage = () => {
  const [showFiscalForm, setShowFiscalForm] = useState(false);
  const { data: subscription, isLoading } = useCurrentSubscription();
  const { data: invoices } = useInvoices();
  const updateFiscalData = useUpdateFiscalData();
  const { navigateAdmin } = useAdminNavigation();

  const [fiscalData, setFiscalData] = useState({
    fiscal_name: '',
    fiscal_document: '',
    fiscal_cep: '',
    fiscal_state: '',
    fiscal_city: '',
    fiscal_neighborhood: '',
    fiscal_street: '',
    fiscal_number: '',
    fiscal_complement: '',
  });

  useEffect(() => {
    if (subscription) {
      setFiscalData({
        fiscal_name: subscription.fiscal_name || '',
        fiscal_document: subscription.fiscal_document || '',
        fiscal_cep: subscription.fiscal_cep || '',
        fiscal_state: subscription.fiscal_state || '',
        fiscal_city: subscription.fiscal_city || '',
        fiscal_neighborhood: subscription.fiscal_neighborhood || '',
        fiscal_street: subscription.fiscal_street || '',
        fiscal_number: subscription.fiscal_number || '',
        fiscal_complement: subscription.fiscal_complement || '',
      });
    }
  }, [subscription]);

  const handleFiscalDataChange = (field: keyof typeof fiscalData, value: string) => {
    setFiscalData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveFiscalData = () => {
    updateFiscalData.mutate(fiscalData, {
      onSuccess: () => setShowFiscalForm(false),
    });
  };

  const plan = subscription?.plan;
  const price = subscription?.billing_cycle === 'annual' 
    ? plan?.annual_price 
    : plan?.monthly_price;

  // Calculate next payment date
  const getNextPaymentDate = () => {
    const today = startOfDay(new Date());
    const billingDay = subscription?.billing_day || 1;
    let next = setDate(today, billingDay);
    if (isBefore(next, today) || next.getTime() === today.getTime()) {
      next = addMonths(setDate(today, billingDay), 1);
    }
    return next;
  };

  const nextPaymentDate = getNextPaymentDate();
  const daysUntilPayment = differenceInDays(nextPaymentDate, startOfDay(new Date()));

  // Determine contextual status
  const overdueCount = invoices?.filter(inv => inv.status === 'overdue').length || 0;
  const pendingCount = invoices?.filter(inv => inv.status === 'pending').length || 0;

  const getContextualStatus = () => {
    if (subscription?.status === 'suspended') {
      return {
        label: 'Suspenso – regularização necessária',
        description: 'Sua assinatura foi suspensa. Regularize seus pagamentos para reativar o acesso.',
        icon: AlertCircle,
        bgClass: 'bg-destructive/5 border-destructive/20',
        iconBgClass: 'bg-destructive/10',
        iconClass: 'text-destructive',
        textClass: 'text-destructive',
      };
    }
    if (overdueCount > 0) {
      return {
        label: 'Ação necessária – risco de suspensão',
        description: `Você tem ${overdueCount} fatura${overdueCount > 1 ? 's' : ''} em atraso. Regularize para evitar a suspensão.`,
        icon: AlertTriangle,
        bgClass: 'bg-amber-500/5 border-amber-500/20',
        iconBgClass: 'bg-amber-500/10',
        iconClass: 'text-amber-600',
        textClass: 'text-amber-700',
      };
    }
    if (pendingCount > 0) {
      return {
        label: 'Ativo – pagamento pendente',
        description: `Você tem ${pendingCount} fatura${pendingCount > 1 ? 's' : ''} pendente${pendingCount > 1 ? 's' : ''}.`,
        icon: Clock,
        bgClass: 'bg-amber-500/5 border-amber-500/20',
        iconBgClass: 'bg-amber-500/10',
        iconClass: 'text-amber-600',
        textClass: 'text-amber-700',
      };
    }
    return {
      label: 'Ativo – pagamentos em dia',
      description: 'Sua assinatura está ativa e todos os pagamentos estão em dia.',
      icon: CheckCircle2,
      bgClass: 'bg-green-500/5 border-green-500/20',
      iconBgClass: 'bg-green-500/10',
      iconClass: 'text-green-600',
      textClass: 'text-green-700',
    };
  };

  const status = getContextualStatus();
  const StatusIcon = status.icon;

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

  if (isLoading) {
    return (
      <SubscriptionsLayout>
        <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-24" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-64 lg:col-span-2" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </SubscriptionsLayout>
    );
  }

  return (
    <SubscriptionsLayout>
      <div className="max-w-5xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Pagamentos</h1>
          <p className="text-muted-foreground">
            Gerencie sua assinatura, métodos de pagamento e dados fiscais.
          </p>
        </div>

        {!subscription ? (
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma assinatura encontrada</h3>
            <p className="text-muted-foreground">Entre em contato com o suporte para ativar sua assinatura.</p>
          </Card>
        ) : (
          <>
            {/* Contextual Status Banner */}
            <Card className={`mb-8 border ${status.bgClass}`}>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`p-3 rounded-xl shrink-0 ${status.iconBgClass}`}>
                      <StatusIcon className={`h-5 w-5 ${status.iconClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${status.textClass}`}>{status.label}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{status.description}</p>
                    </div>
                  </div>
                  {overdueCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto shrink-0 border-amber-500/30 text-amber-700 hover:bg-amber-500/10"
                      onClick={() => navigateAdmin('/admin/assinaturas/faturas')}
                    >
                      Regularizar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Payment Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Subscription Card */}
                <Card className="overflow-hidden">
                  <div className="bg-muted/30 p-6 border-b">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-foreground/5 rounded-xl">
                        <CreditCard className="h-6 w-6 text-foreground/70" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">Assinatura {subscription.billing_cycle === 'annual' ? 'Anual' : 'Mensal'}</h3>
                        <p className="text-sm text-muted-foreground">Cobrança recorrente automática</p>
                      </div>
                      <Badge variant="outline" className="bg-muted/50">{plan?.name}</Badge>
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-5">
                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Valor do plano</p>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-3xl font-bold">R$ {price?.toFixed(2).replace('.', ',') || '0,00'}</span>
                          <span className="text-muted-foreground text-sm">/ mês</span>
                        </div>
                        {subscription.billing_cycle === 'annual' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Cobrado anualmente (R$ {((price || 0) * 12).toFixed(2).replace('.', ',')}/ano)
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Next Payment */}
                    <div className="bg-muted/30 rounded-lg p-4 flex items-center gap-4">
                      <div className="p-2 bg-background rounded-lg">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            Próxima cobrança em {daysUntilPayment} dia{daysUntilPayment !== 1 ? 's' : ''}
                          </p>
                          {daysUntilPayment <= 5 && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                              Em breve
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(nextPaymentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-2 border-t">
                      <Button variant="outline" size="sm" className="gap-2">
                        <CreditCard className="h-4 w-4" />
                        Alterar forma de pagamento
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => navigateAdmin('/admin/assinaturas/faturas')}
                      >
                        <History className="h-4 w-4" />
                        Ver histórico de cobranças
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Fiscal Data Card with Status */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">Dados fiscais</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Fiscal Status Badge */}
                    <div className={`flex items-center gap-2 text-sm rounded-lg p-2.5 ${
                      isFiscalComplete 
                        ? 'bg-green-500/5 text-green-700' 
                        : 'bg-amber-500/5 text-amber-700'
                    }`}>
                      {isFiscalComplete ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="font-medium">Dados fiscais completos</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">Dados fiscais incompletos</span>
                        </>
                      )}
                    </div>

                    {subscription.fiscal_name && (
                      <div className="space-y-1">
                        <p className="font-semibold">{subscription.fiscal_name}</p>
                        <p className="text-sm text-muted-foreground">{subscription.fiscal_document}</p>
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full justify-start gap-2"
                        onClick={() => setShowFiscalForm(true)}
                      >
                        <Settings className="h-4 w-4" />
                        {isFiscalComplete ? 'Editar dados fiscais' : 'Completar dados fiscais'}
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Notas fiscais são geradas automaticamente após confirmação do pagamento.
                    </p>
                  </CardContent>
                </Card>

                {/* Help Card */}
                <Card className="bg-muted/50">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-background rounded-lg">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Precisa de ajuda?</p>
                        <a href="#" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
                          Saiba mais sobre pagamentos e assinaturas
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Fiscal Data Dialog */}
      <Dialog open={showFiscalForm} onOpenChange={setShowFiscalForm}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Preencher dados</DialogTitle>
            <p className="text-muted-foreground text-sm">
              Preencha os dados indicando a pessoa ou empresa em que as notas devem ser geradas.
            </p>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="fiscal_name" className="text-sm text-muted-foreground">
                Nome ou razão social:
              </Label>
              <Input
                id="fiscal_name"
                value={fiscalData.fiscal_name}
                onChange={(e) => handleFiscalDataChange('fiscal_name', e.target.value)}
                placeholder="Digite o nome ou razão social"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiscal_document" className="text-sm text-muted-foreground">
                CPF ou CNPJ:
              </Label>
              <Input
                id="fiscal_document"
                value={fiscalData.fiscal_document}
                onChange={(e) => handleFiscalDataChange('fiscal_document', e.target.value)}
                placeholder="Digite o CPF ou CNPJ"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fiscal_cep" className="text-sm text-muted-foreground">CEP</Label>
                <Input
                  id="fiscal_cep"
                  value={fiscalData.fiscal_cep}
                  onChange={(e) => handleFiscalDataChange('fiscal_cep', e.target.value)}
                  placeholder="00000-000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fiscal_state" className="text-sm text-muted-foreground">Estado</Label>
                <Input
                  id="fiscal_state"
                  value={fiscalData.fiscal_state}
                  onChange={(e) => handleFiscalDataChange('fiscal_state', e.target.value)}
                  placeholder="UF"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fiscal_city" className="text-sm text-muted-foreground">Cidade</Label>
                <Input
                  id="fiscal_city"
                  value={fiscalData.fiscal_city}
                  onChange={(e) => handleFiscalDataChange('fiscal_city', e.target.value)}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fiscal_neighborhood" className="text-sm text-muted-foreground">Bairro</Label>
                <Input
                  id="fiscal_neighborhood"
                  value={fiscalData.fiscal_neighborhood}
                  onChange={(e) => handleFiscalDataChange('fiscal_neighborhood', e.target.value)}
                  placeholder="Bairro"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiscal_street" className="text-sm text-muted-foreground">Rua</Label>
              <Input
                id="fiscal_street"
                value={fiscalData.fiscal_street}
                onChange={(e) => handleFiscalDataChange('fiscal_street', e.target.value)}
                placeholder="Nome da rua"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fiscal_number" className="text-sm text-muted-foreground">Número</Label>
                <Input
                  id="fiscal_number"
                  value={fiscalData.fiscal_number}
                  onChange={(e) => handleFiscalDataChange('fiscal_number', e.target.value)}
                  placeholder="Nº"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fiscal_complement" className="text-sm text-muted-foreground">Complemento</Label>
                <Input
                  id="fiscal_complement"
                  value={fiscalData.fiscal_complement}
                  onChange={(e) => handleFiscalDataChange('fiscal_complement', e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowFiscalForm(false)}>
                Cancelar
              </Button>
              <Button 
                variant="admin" 
                onClick={handleSaveFiscalData}
                disabled={updateFiscalData.isPending}
              >
                {updateFiscalData.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SubscriptionsLayout>
  );
};

export default PaymentsPage;
