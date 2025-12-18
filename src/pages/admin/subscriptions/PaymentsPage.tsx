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
  Wallet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useCurrentSubscription, useUpdateFiscalData } from '@/hooks/useSubscription';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PaymentsPage = () => {
  const [showFiscalForm, setShowFiscalForm] = useState(false);
  const { data: subscription, isLoading } = useCurrentSubscription();
  const updateFiscalData = useUpdateFiscalData();

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

  // Load existing fiscal data when subscription is loaded
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Ativo</Badge>;
      case 'trial':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Trial</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Suspenso</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Cancelado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const plan = subscription?.plan;
  const price = subscription?.billing_cycle === 'annual' 
    ? plan?.annual_price 
    : plan?.monthly_price;
  
  const nextPaymentDate = subscription?.started_at 
    ? addMonths(new Date(subscription.started_at), 1)
    : new Date();

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
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 bg-green-500/20 rounded-xl">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-semibold text-green-600 capitalize">{subscription.status === 'active' ? 'Ativo' : subscription.status}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 bg-primary/20 rounded-xl">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Plano</p>
                    <p className="font-semibold">{plan?.name || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 bg-orange-500/20 rounded-xl">
                    <Calendar className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Próximo</p>
                    <p className="font-semibold">{format(nextPaymentDate, 'dd/MM/yyyy')}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/20 rounded-xl">
                    <Receipt className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valor</p>
                    <p className="font-semibold">R$ {price?.toFixed(0) || '0'}/{subscription.billing_cycle === 'annual' ? 'mês*' : 'mês'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Payment Info */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="overflow-hidden">
                  <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/20 rounded-xl">
                        <CreditCard className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Assinatura {subscription.billing_cycle === 'annual' ? 'Anual' : 'Mensal'}</h3>
                        <p className="text-sm text-muted-foreground">Cobrança {subscription.billing_cycle === 'annual' ? 'anual' : 'recorrente'}</p>
                      </div>
                      {getStatusBadge(subscription.status)}
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">Plano {plan?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Próximo pagamento: <span className="font-medium text-foreground">
                            {format(nextPaymentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold">R$ {price?.toFixed(2).replace('.', ',') || '0,00'}</span>
                        <span className="text-muted-foreground">/{subscription.billing_cycle === 'annual' ? 'mês' : 'mês'}</span>
                      </div>
                    </div>
                    {subscription.billing_cycle === 'annual' && (
                      <p className="text-xs text-muted-foreground mt-2">
                        *Cobrado anualmente (R$ {((price || 0) * 12).toFixed(2).replace('.', ',')}/ano)
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">Dados fiscais</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {subscription.fiscal_name ? (
                      <div className="space-y-1">
                        <p className="font-semibold text-lg">{subscription.fiscal_name}</p>
                        <p className="text-sm text-muted-foreground">{subscription.fiscal_document}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum dado fiscal cadastrado</p>
                    )}
                    <div className="pt-3 border-t">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full justify-start gap-2"
                        onClick={() => setShowFiscalForm(true)}
                      >
                        <Settings className="h-4 w-4" />
                        {subscription.fiscal_name ? 'Editar dados fiscais' : 'Cadastrar dados fiscais'}
                      </Button>
                    </div>
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
                        <a href="#" className="text-sm text-primary hover:underline">
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