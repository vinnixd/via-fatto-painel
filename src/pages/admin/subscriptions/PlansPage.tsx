import SubscriptionsLayout from './SubscriptionsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Sparkles, Zap, Crown, ArrowRight } from 'lucide-react';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: string;
  description: string;
  features: PlanFeature[];
  highlighted?: boolean;
  current?: boolean;
  icon: typeof Sparkles;
  gradient: string;
}

const plans: Plan[] = [
  {
    name: 'Essencial',
    price: 'R$ 79 a R$ 99',
    description: 'Ideal para corretor autônomo.',
    icon: Sparkles,
    gradient: 'from-blue-500/10 to-cyan-500/10',
    features: [
      { text: 'Site imobiliário profissional', included: true },
      { text: 'Painel administrativo', included: true },
      { text: 'Cadastro de imóveis', included: true },
      { text: 'Integração com WhatsApp', included: true },
      { text: 'Suporte básico', included: true },
      { text: 'Destaque de imóveis', included: false },
      { text: 'Mapa interativo', included: false },
      { text: 'CRM integrado', included: false },
    ],
  },
  {
    name: 'Profissional',
    price: 'R$ 129 a R$ 149',
    description: 'Ideal para corretores mais ativos.',
    icon: Zap,
    gradient: 'from-primary/10 to-violet-500/10',
    current: true,
    features: [
      { text: 'Tudo do Essencial', included: true },
      { text: 'Mais imóveis cadastrados', included: true },
      { text: 'Destaque de imóveis', included: true },
      { text: 'Mapa interativo', included: true },
      { text: 'Prioridade no suporte', included: true },
      { text: 'CRM integrado', included: false },
      { text: 'ChatBot no site', included: false },
      { text: 'Agentes de IA', included: false },
    ],
  },
  {
    name: 'Premium',
    price: 'R$ 199 a R$ 249',
    description: 'Ideal para imobiliárias.',
    icon: Crown,
    gradient: 'from-amber-500/20 to-orange-500/20',
    highlighted: true,
    features: [
      { text: 'Tudo do Profissional', included: true },
      { text: 'CRM integrado (quando disponível)', included: true },
      { text: 'ChatBot no site', included: true },
      { text: 'Agentes de IA (quando disponíveis)', included: true },
      { text: 'Automações de atendimento', included: true },
      { text: 'Acesso antecipado às novas funções', included: true },
    ],
  },
];

const PlansPage = () => {
  return (
    <SubscriptionsLayout>
      <div className="max-w-6xl animate-fade-in">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-3">Escolha o plano ideal para você</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Selecione o plano que melhor se adapta às suas necessidades. 
            Você pode fazer upgrade ou downgrade a qualquer momento.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            
            return (
              <Card 
                key={plan.name} 
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  plan.highlighted 
                    ? 'bg-sidebar text-sidebar-foreground border-sidebar ring-2 ring-sidebar scale-[1.02]' 
                    : plan.current 
                      ? 'ring-2 ring-primary'
                      : 'hover:border-primary/50'
                }`}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-50`} />
                
                {plan.current && (
                  <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                    Plano atual
                  </Badge>
                )}
                
                {plan.highlighted && (
                  <Badge className="absolute top-4 right-4 bg-amber-500 text-white">
                    Recomendado
                  </Badge>
                )}
                
                <CardHeader className="pb-4 relative">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    plan.highlighted 
                      ? 'bg-amber-500/20' 
                      : 'bg-primary/10'
                  }`}>
                    <Icon className={`h-6 w-6 ${plan.highlighted ? 'text-amber-400' : 'text-primary'}`} />
                  </div>
                  
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  
                  <div className="mt-3">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className={`text-sm ${plan.highlighted ? 'text-sidebar-foreground/70' : 'text-muted-foreground'}`}>
                      {' '}/ mês
                    </span>
                  </div>
                  
                  <p className={`text-sm mt-3 ${plan.highlighted ? 'text-sidebar-foreground/80' : 'text-muted-foreground'}`}>
                    👉 {plan.description}
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-4 relative">
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3 text-sm">
                        {feature.included ? (
                          <div className={`p-0.5 rounded-full ${plan.highlighted ? 'bg-green-400/20' : 'bg-green-500/10'}`}>
                            <Check className={`h-4 w-4 ${plan.highlighted ? 'text-green-400' : 'text-green-600'}`} />
                          </div>
                        ) : (
                          <div className={`p-0.5 rounded-full ${plan.highlighted ? 'bg-sidebar-foreground/10' : 'bg-muted'}`}>
                            <X className={`h-4 w-4 ${plan.highlighted ? 'text-sidebar-foreground/40' : 'text-muted-foreground/50'}`} />
                          </div>
                        )}
                        <span className={!feature.included ? (plan.highlighted ? 'text-sidebar-foreground/50' : 'text-muted-foreground/70') : ''}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6">
                    {plan.current ? (
                      <Button variant="outline" className="w-full" disabled>
                        Plano atual
                      </Button>
                    ) : plan.highlighted ? (
                      <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white gap-2 group">
                        Fazer upgrade
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full">
                        {plan.name === 'Essencial' ? 'Reduzir plano' : 'Subir de plano'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Compare Section */}
        <div className="mt-16">
          <Card className="bg-muted/30">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-3">Precisa de ajuda para escolher?</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Compare todos os recursos disponíveis em cada plano e descubra qual é o melhor para o seu negócio.
              </p>
              <Button variant="outline" size="lg">
                Comparar todos os planos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </SubscriptionsLayout>
  );
};

export default PlansPage;
