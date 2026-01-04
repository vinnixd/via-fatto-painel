import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Users, Building2, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
  {
    id: 'start',
    name: 'Start',
    description: 'Para quem está começando',
    price: 72,
    discount: 19,
    maxUsers: 1,
    maxProperties: 30,
    features: [
      '1 usuário',
      '30 imóveis ativos',
      'CRM básico (leads, funil)',
      'Cadastro de imóveis',
      'Agenda de visitas',
      'Financeiro básico',
      'Vitrine básica do site',
      'PDF simples de apresentação',
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Zatch PRO',
    description: 'Para imobiliárias pequenas e médias',
    price: 147,
    discount: 12,
    maxUsers: 5,
    maxProperties: 150,
    features: [
      '5 usuários',
      '150 imóveis ativos',
      'CRM completo',
      'Gestão completa de imóveis',
      'Gestão de proprietários',
      'Controle de comissões',
      'Repasses para proprietários',
      'Financeiro completo',
      'Relatórios essenciais',
      'Vitrine personalizada',
      'PDF profissional',
      'Notificações e alertas',
      'Integração com portais',
      'Bônus: +70 documentos',
    ],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Zatch Premium',
    description: 'Para imobiliárias estruturadas',
    price: 250,
    discount: 10,
    maxUsers: 15,
    maxProperties: -1, // Unlimited
    features: [
      '15 usuários',
      'Imóveis ilimitados',
      'Tudo do plano PRO',
      'Relatórios avançados',
      'Diagnóstico da imobiliária',
      'Prioridade no suporte',
      'Acesso antecipado a novas funções',
      'Acesso ao bônus',
    ],
    popular: false,
  },
];

const billingOptions = [
  { id: 'monthly', label: 'Mensal', discount: 0 },
  { id: 'semiannual', label: 'Semestral', discount: 11 },
  { id: 'annual', label: 'Anual', discount: 19 },
];

const SettingsSubscription = () => {
  const [billingCycle, setBillingCycle] = useState('annual');
  const currentPlan = 'pro'; // Mock current plan
  const usersCount = 1;
  const propertiesCount = 0;

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Seu plano: Zatch PRO
          </CardTitle>
          <CardDescription>Assinatura ativa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Users Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Usuários</span>
                </div>
                <span className="text-sm font-medium">{usersCount} / 5</span>
              </div>
              <Progress value={(usersCount / 5) * 100} className="h-2" />
            </div>

            {/* Properties Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Imóveis ativos</span>
                </div>
                <span className="text-sm font-medium">{propertiesCount} / 150</span>
              </div>
              <Progress value={(propertiesCount / 150) * 100} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Cycle Selector */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 p-1 bg-muted rounded-lg">
          {billingOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setBillingCycle(option.id)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-all',
                billingCycle === option.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {option.label}
              {option.discount > 0 && (
                <span className="ml-1 text-xs">-{option.discount}%</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plans Title */}
      <div className="text-center">
        <h3 className="text-lg font-semibold">Todos os planos</h3>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlan;
          const selectedBilling = billingOptions.find(b => b.id === billingCycle);
          const discount = selectedBilling?.discount || 0;
          const discountedPrice = Math.round(plan.price * (1 - discount / 100));

          return (
            <Card 
              key={plan.id} 
              className={cn(
                'relative',
                isCurrentPlan && 'ring-2 ring-primary',
                plan.popular && 'border-primary'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Mais popular
                  </Badge>
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="outline">Seu plano</Badge>
                </div>
              )}
              
              <CardHeader className="text-center pt-6">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="text-center">
                <div className="mb-4">
                  <span className="text-sm text-muted-foreground">R$ </span>
                  <span className="text-4xl font-bold">{discountedPrice}</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                
                {discount > 0 && (
                  <Badge variant="secondary" className="mb-4">
                    Economia de {discount}%
                  </Badge>
                )}

                <div className="space-y-2 text-left mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Até {plan.maxUsers} usuário{plan.maxUsers > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {plan.maxProperties === -1 ? 'Imóveis ilimitados' : `Até ${plan.maxProperties} imóveis`}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-left">
                      <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  {isCurrentPlan ? (
                    <Button variant="outline" className="w-full" disabled>
                      Plano atual
                    </Button>
                  ) : plan.id === 'start' ? (
                    <Button variant="ghost" className="w-full text-muted-foreground" disabled>
                      Downgrade não disponível
                    </Button>
                  ) : (
                    <Button className="w-full">
                      <Crown className="h-4 w-4 mr-2" />
                      Assinar agora
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help Section */}
      <Card>
        <CardContent className="py-6 text-center">
          <h4 className="font-semibold mb-2">Precisa de ajuda para escolher?</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Entre em contato conosco para tirar dúvidas ou solicitar um plano personalizado.
          </p>
          <Button variant="outline">Falar com suporte</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsSubscription;
