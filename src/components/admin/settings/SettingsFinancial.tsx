import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, AlertTriangle } from 'lucide-react';

const SettingsFinancial = () => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    lateFee: 2,
    dailyInterest: 0.033,
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    toast({ title: 'Configurações salvas com sucesso!' });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Configurações Financeiras
          </CardTitle>
          <CardDescription>
            Configure multas e juros para pagamentos em atraso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Multa por Atraso */}
            <div>
              <Label className="text-sm font-medium">Multa por Atraso (%)</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input
                  type="number"
                  value={settings.lateFee}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    lateFee: parseFloat(e.target.value) || 0 
                  }))}
                  className="w-24"
                  min={0}
                  max={10}
                  step={0.1}
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-primary mt-2">
                Percentual de multa aplicado sobre o valor em atraso
              </p>
            </div>

            {/* Juros Diário */}
            <div>
              <Label className="text-sm font-medium">Juros Diário (%)</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input
                  type="number"
                  value={settings.dailyInterest}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    dailyInterest: parseFloat(e.target.value) || 0 
                  }))}
                  className="w-24"
                  min={0}
                  max={1}
                  step={0.001}
                />
                <span className="text-muted-foreground">% ao dia</span>
              </div>
              <p className="text-xs text-primary mt-2">
                Percentual de juros aplicado por dia de atraso
              </p>
            </div>
          </div>

          {/* Warning Alert */}
          <Alert className="border-warning/50 bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning">
              <strong>Atenção:</strong> Certifique-se de que as taxas de multa e juros estão de acordo com a legislação vigente. O limite máximo de multa é geralmente 2% e juros de 1% ao mês.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsFinancial;
