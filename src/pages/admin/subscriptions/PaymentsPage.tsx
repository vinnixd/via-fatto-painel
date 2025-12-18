import { useState } from 'react';
import SubscriptionsLayout from './SubscriptionsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, Settings, ChevronLeft } from 'lucide-react';
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
    // Basic validation
    if (!fiscalData.nomeRazaoSocial.trim() || !fiscalData.cpfCnpj.trim()) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    toast.success('Dados fiscais salvos com sucesso!');
    setShowFiscalForm(false);
  };

  return (
    <SubscriptionsLayout>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold mb-2">Pagamentos</h1>
        <p className="text-muted-foreground mb-8">
          Tudo sobre pagamentos, assinaturas e vencimentos dos serviços.
        </p>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Payment Info */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Débito automático</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Plano - Profissional</p>
                    <p className="text-sm text-muted-foreground">Próximo pagamento: 10/01/2026</p>
                    <Button variant="link" className="p-0 h-auto text-primary text-sm">
                      Detalhes
                    </Button>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold">R$ 139,00</span>
                    <span className="text-muted-foreground text-sm">/mês</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Info */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Dados da conta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">Via Fatto</p>
                <a href="#" className="text-primary text-sm hover:underline">viafatto.com.br</a>
                <p className="text-sm text-muted-foreground">CPF: 769.800.651-49</p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-primary text-sm gap-2"
                  onClick={() => setShowFiscalForm(true)}
                >
                  <Settings className="h-3 w-3" />
                  Dados fiscais
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <Button variant="ghost" className="w-full justify-between">
                  <span>Inserir cupom</span>
                  <span>→</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Help Link */}
        <div className="flex items-center justify-center gap-2 mt-12 text-muted-foreground">
          <span className="text-sm">Mais sobre pagamentos e assinaturas</span>
          <ExternalLink className="h-4 w-4" />
        </div>
      </div>

      {/* Fiscal Data Dialog */}
      <Dialog open={showFiscalForm} onOpenChange={setShowFiscalForm}>
        <DialogContent className="sm:max-w-lg">
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

            <div className="space-y-2">
              <Label htmlFor="cep" className="text-sm text-muted-foreground">
                CEP
              </Label>
              <Input
                id="cep"
                value={fiscalData.cep}
                onChange={(e) => handleFiscalDataChange('cep', e.target.value)}
                placeholder="Digite o CEP"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado" className="text-sm text-muted-foreground">
                Estado
              </Label>
              <Input
                id="estado"
                value={fiscalData.estado}
                onChange={(e) => handleFiscalDataChange('estado', e.target.value)}
                placeholder="Digite o estado"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade" className="text-sm text-muted-foreground">
                Cidade
              </Label>
              <Input
                id="cidade"
                value={fiscalData.cidade}
                onChange={(e) => handleFiscalDataChange('cidade', e.target.value)}
                placeholder="Digite a cidade"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bairro" className="text-sm text-muted-foreground">
                Bairro
              </Label>
              <Input
                id="bairro"
                value={fiscalData.bairro}
                onChange={(e) => handleFiscalDataChange('bairro', e.target.value)}
                placeholder="Digite o bairro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rua" className="text-sm text-muted-foreground">
                Rua
              </Label>
              <Input
                id="rua"
                value={fiscalData.rua}
                onChange={(e) => handleFiscalDataChange('rua', e.target.value)}
                placeholder="Digite a rua"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero" className="text-sm text-muted-foreground">
                Número
              </Label>
              <Input
                id="numero"
                value={fiscalData.numero}
                onChange={(e) => handleFiscalDataChange('numero', e.target.value)}
                placeholder="Digite o número"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="complemento" className="text-sm text-muted-foreground">
                Complemento (opcional)
              </Label>
              <Input
                id="complemento"
                value={fiscalData.complemento}
                onChange={(e) => handleFiscalDataChange('complemento', e.target.value)}
                placeholder="Digite o complemento"
              />
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
