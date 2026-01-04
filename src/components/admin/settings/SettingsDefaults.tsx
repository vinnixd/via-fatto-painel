import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Settings } from 'lucide-react';

const SettingsDefaults = () => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    defaultDueDay: 5,
    defaultContractDuration: 12,
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
            <Settings className="h-5 w-5 text-primary" />
            Valores Padrão
          </CardTitle>
          <CardDescription>
            Configure os valores padrão utilizados ao criar novos registros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Dia de Vencimento Padrão */}
            <div>
              <Label className="text-sm font-medium">Dia de Vencimento Padrão</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input
                  type="number"
                  value={settings.defaultDueDay}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    defaultDueDay: parseInt(e.target.value) || 5 
                  }))}
                  className="w-20"
                  min={1}
                  max={28}
                />
                <span className="text-muted-foreground">de cada mês</span>
              </div>
              <p className="text-xs text-primary mt-2">
                Dia do mês para vencimento de pagamentos de aluguel
              </p>
            </div>

            {/* Duração Padrão do Contrato */}
            <div>
              <Label className="text-sm font-medium">Duração Padrão do Contrato</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input
                  type="number"
                  value={settings.defaultContractDuration}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    defaultContractDuration: parseInt(e.target.value) || 12 
                  }))}
                  className="w-20"
                  min={1}
                  max={60}
                />
                <span className="text-muted-foreground">meses</span>
              </div>
              <p className="text-xs text-primary mt-2">
                Duração padrão para novos contratos de locação
              </p>
            </div>
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

export default SettingsDefaults;
