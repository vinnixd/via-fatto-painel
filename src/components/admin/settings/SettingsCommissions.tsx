import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Percent, Building2, Home } from 'lucide-react';

const SettingsCommissions = () => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [commissions, setCommissions] = useState({
    saleCommission: 6,
    rentalCommission: 100,
    rentalMonths: 1,
  });

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 500));
    toast({ title: 'Configurações salvas com sucesso!' });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            Taxas de Comissão
          </CardTitle>
          <CardDescription>
            Configure as taxas padrão de comissão para vendas e locações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Venda de Imóveis */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Venda de Imóveis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Taxa de Comissão (%)</Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Input
                      type="number"
                      value={commissions.saleCommission}
                      onChange={(e) => setCommissions(prev => ({ 
                        ...prev, 
                        saleCommission: parseFloat(e.target.value) || 0 
                      }))}
                      className="w-24"
                      min={0}
                      max={100}
                      step={0.1}
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-primary mt-2">
                    Comissão padrão sobre o valor de venda do imóvel
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Locação de Imóveis */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" />
                  Locação de Imóveis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Taxa de Comissão (%)</Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Input
                      type="number"
                      value={commissions.rentalCommission}
                      onChange={(e) => setCommissions(prev => ({ 
                        ...prev, 
                        rentalCommission: parseFloat(e.target.value) || 0 
                      }))}
                      className="w-24"
                      min={0}
                      max={100}
                      step={1}
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Meses de Comissão</Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Input
                      type="number"
                      value={commissions.rentalMonths}
                      onChange={(e) => setCommissions(prev => ({ 
                        ...prev, 
                        rentalMonths: parseInt(e.target.value) || 1 
                      }))}
                      className="w-24"
                      min={1}
                      max={12}
                    />
                    <span className="text-muted-foreground">mês(es)</span>
                  </div>
                  <p className="text-xs text-primary mt-2">
                    Quantidade de meses de aluguel como comissão
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsCommissions;
