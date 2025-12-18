import { useState } from 'react';
import SubscriptionsLayout from './SubscriptionsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ExternalLink, 
  Settings, 
  CreditCard, 
  Calendar,
  Receipt,
  Building2,
  Wallet,
  Gift,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

interface FiscalData {
  nomeRazaoSocial: string;
  cpfCnpj: string;
  cep: string;
  estado: string;
  cidade: string;
  bairro: string;
  rua: string;
  numero: string;
  complemento: string;
}

const PaymentsPage = () => {
  const [showFiscalForm, setShowFiscalForm] = useState(false);
  const [fiscalData, setFiscalData] = useState<FiscalData>({
    nomeRazaoSocial: '',
    cpfCnpj: '',
    cep: '',
    estado: '',
    cidade: '',
    bairro: '',
    rua: '',
    numero: '',
    complemento: '',
  });

  const handleFiscalDataChange = (field: keyof FiscalData, value: string) => {
    setFiscalData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveFiscalData = () => {
    if (!fiscalData.nomeRazaoSocial.trim() || !fiscalData.cpfCnpj.trim()) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    toast.success('Dados fiscais salvos com sucesso!');
    setShowFiscalForm(false);
  };

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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-green-500/20 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-semibold text-green-600">Ativo</p>
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
                <p className="font-semibold">Profissional</p>
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
                <p className="font-semibold">10/01/2026</p>
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
                <p className="font-semibold">R$ 139/mês</p>
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
                    <h3 className="font-semibold text-lg">Débito automático</h3>
                    <p className="text-sm text-muted-foreground">Cobrança recorrente ativa</p>
                  </div>
                  <Badge className="ml-auto bg-green-100 text-green-700 hover:bg-green-100">
                    Ativo
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Plano Profissional</p>
                    <p className="text-sm text-muted-foreground">
                      Próximo pagamento: <span className="font-medium text-foreground">10 de Janeiro de 2026</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold">R$ 139,00</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t flex gap-3">
                  <Button variant="outline" size="sm">
                    Ver histórico
                  </Button>
                  <Button variant="outline" size="sm">
                    Alterar método de pagamento
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Coupon Card */}
            <Card className="group hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-muted rounded-xl group-hover:bg-primary/10 transition-colors">
                    <Gift className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="font-medium">Inserir cupom de desconto</p>
                    <p className="text-sm text-muted-foreground">Aplique um código promocional</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Dados da conta</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="font-semibold text-lg">Via Fatto</p>
                  <a href="#" className="text-primary text-sm hover:underline inline-flex items-center gap-1">
                    viafatto.com.br
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="pt-3 border-t space-y-2">
                  <p className="text-sm text-muted-foreground">CPF: 769.800.651-49</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => setShowFiscalForm(true)}
                  >
                    <Settings className="h-4 w-4" />
                    Editar dados fiscais
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
              <Label htmlFor="nomeRazaoSocial" className="text-sm text-muted-foreground">
                Nome ou razão social:
              </Label>
              <Input
                id="nomeRazaoSocial"
                value={fiscalData.nomeRazaoSocial}
                onChange={(e) => handleFiscalDataChange('nomeRazaoSocial', e.target.value)}
                placeholder="Digite o nome ou razão social"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpfCnpj" className="text-sm text-muted-foreground">
                CPF ou CNPJ:
              </Label>
              <Input
                id="cpfCnpj"
                value={fiscalData.cpfCnpj}
                onChange={(e) => handleFiscalDataChange('cpfCnpj', e.target.value)}
                placeholder="Digite o CPF ou CNPJ"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep" className="text-sm text-muted-foreground">CEP</Label>
                <Input
                  id="cep"
                  value={fiscalData.cep}
                  onChange={(e) => handleFiscalDataChange('cep', e.target.value)}
                  placeholder="00000-000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado" className="text-sm text-muted-foreground">Estado</Label>
                <Input
                  id="estado"
                  value={fiscalData.estado}
                  onChange={(e) => handleFiscalDataChange('estado', e.target.value)}
                  placeholder="UF"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cidade" className="text-sm text-muted-foreground">Cidade</Label>
                <Input
                  id="cidade"
                  value={fiscalData.cidade}
                  onChange={(e) => handleFiscalDataChange('cidade', e.target.value)}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bairro" className="text-sm text-muted-foreground">Bairro</Label>
                <Input
                  id="bairro"
                  value={fiscalData.bairro}
                  onChange={(e) => handleFiscalDataChange('bairro', e.target.value)}
                  placeholder="Bairro"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rua" className="text-sm text-muted-foreground">Rua</Label>
              <Input
                id="rua"
                value={fiscalData.rua}
                onChange={(e) => handleFiscalDataChange('rua', e.target.value)}
                placeholder="Nome da rua"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero" className="text-sm text-muted-foreground">Número</Label>
                <Input
                  id="numero"
                  value={fiscalData.numero}
                  onChange={(e) => handleFiscalDataChange('numero', e.target.value)}
                  placeholder="Nº"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complemento" className="text-sm text-muted-foreground">Complemento</Label>
                <Input
                  id="complemento"
                  value={fiscalData.complemento}
                  onChange={(e) => handleFiscalDataChange('complemento', e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowFiscalForm(false)}>
                Cancelar
              </Button>
              <Button variant="admin" onClick={handleSaveFiscalData}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SubscriptionsLayout>
  );
};

export default PaymentsPage;
