import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Bell, Mail, CreditCard, FileText, Users2 } from 'lucide-react';

const SettingsAlerts = () => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    contractExpireDays: 30,
    paymentExpireDays: 5,
    leadFollowUpDays: 7,
    emailNotifications: true,
    paymentReminders: true,
    contractAlerts: true,
    leadAlerts: true,
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    toast({ title: 'Configurações salvas com sucesso!' });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Configurações de Alertas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Configurações de Alertas
          </CardTitle>
          <CardDescription>
            Defina quando os alertas devem ser disparados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Vencimento de Contrato */}
            <div>
              <Label className="text-sm font-medium">Vencimento de Contrato</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input
                  type="number"
                  value={settings.contractExpireDays}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    contractExpireDays: parseInt(e.target.value) || 30 
                  }))}
                  className="w-20"
                  min={1}
                  max={90}
                />
                <span className="text-muted-foreground">dias antes</span>
              </div>
            </div>

            {/* Vencimento de Pagamento */}
            <div>
              <Label className="text-sm font-medium">Vencimento de Pagamento</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input
                  type="number"
                  value={settings.paymentExpireDays}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    paymentExpireDays: parseInt(e.target.value) || 5 
                  }))}
                  className="w-20"
                  min={1}
                  max={30}
                />
                <span className="text-muted-foreground">dias antes</span>
              </div>
            </div>

            {/* Follow-up de Lead */}
            <div>
              <Label className="text-sm font-medium">Follow-up de Lead</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input
                  type="number"
                  value={settings.leadFollowUpDays}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    leadFollowUpDays: parseInt(e.target.value) || 7 
                  }))}
                  className="w-20"
                  min={1}
                  max={30}
                />
                <span className="text-muted-foreground">dias sem contato</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notificações do Escritório */}
      <Card>
        <CardHeader>
          <CardTitle>Notificações do Escritório</CardTitle>
          <CardDescription>
            Escolha quais notificações o escritório deve receber
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Notificações por E-mail</p>
                <p className="text-sm text-muted-foreground">Receber alertas por e-mail</p>
              </div>
            </div>
            <Switch 
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => setSettings(prev => ({ 
                ...prev, 
                emailNotifications: checked 
              }))}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Lembretes de Pagamento</p>
                <p className="text-sm text-muted-foreground">Alertas sobre pagamentos próximos do vencimento</p>
              </div>
            </div>
            <Switch 
              checked={settings.paymentReminders}
              onCheckedChange={(checked) => setSettings(prev => ({ 
                ...prev, 
                paymentReminders: checked 
              }))}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Alertas de Contrato</p>
                <p className="text-sm text-muted-foreground">Alertas sobre contratos próximos do vencimento</p>
              </div>
            </div>
            <Switch 
              checked={settings.contractAlerts}
              onCheckedChange={(checked) => setSettings(prev => ({ 
                ...prev, 
                contractAlerts: checked 
              }))}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Users2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Alertas de Leads</p>
                <p className="text-sm text-muted-foreground">Alertas sobre leads sem contato recente</p>
              </div>
            </div>
            <Switch 
              checked={settings.leadAlerts}
              onCheckedChange={(checked) => setSettings(prev => ({ 
                ...prev, 
                leadAlerts: checked 
              }))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>
    </div>
  );
};

export default SettingsAlerts;
