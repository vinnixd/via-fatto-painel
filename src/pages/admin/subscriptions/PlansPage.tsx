import { useState } from 'react';
import SubscriptionsLayout from './SubscriptionsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Check, 
  Sparkles, 
  Zap, 
  Crown, 
  Users, 
  Building2, 
  Bot, 
  BarChart3, 
  Globe, 
  Palette, 
  Share2,
  Percent
} from 'lucide-react';

interface PlanFeature {
  text: string;
  icon: typeof Users;
}

interface Plan {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: PlanFeature[];
  highlighted?: boolean;
  icon: typeof Sparkles;
  gradient: string;
  borderColor: string;
}

const plans: Plan[] = [
  {
    name: 'Essencial',
    monthlyPrice: 79,
    annualPrice: 63, // ~20% discount
    description: 'Plano ideal para corretores que estão crescendo.',
    icon: Sparkles,
    gradient: 'from-blue-500/10 to-cyan-500/10',
    borderColor: 'border-blue-500/20 hover:border-blue-500/40',
    features: [
      { text: '3 Usuários', icon: Users },
      { text: '300 Imóveis', icon: Building2 },
      { text: 'IA integrada', icon: Bot },
      { text: 'CRM Completo', icon: BarChart3 },
      { text: 'Site Imobiliário com SSL e SEO', icon: Globe },
      { text: 'Site Otimizado com CDN', icon: Zap },
      { text: 'Editor Visual do Site', icon: Palette },
      { text: 'Integração com Portais', icon: Share2 },
    ],
  },
  {
    name: 'Impulso',
    monthlyPrice: 129,
    annualPrice: 103, // ~20% discount
    description: 'Plano ideal para imobiliárias em expansão em ritmo acelerado.',
    icon: Zap,
    gradient: 'from-primary/10 to-violet-500/10',
    borderColor: 'border-primary/30 hover:border-primary/50',
    highlighted: true,
    features: [
      { text: '6 Usuários', icon: Users },
      { text: '800 Imóveis', icon: Building2 },
      { text: 'IA integrada', icon: Bot },
      { text: 'CRM Completo', icon: BarChart3 },
      { text: 'Site Imobiliário com SSL e SEO', icon: Globe },
      { text: 'Site Otimizado com CDN', icon: Zap },
      { text: 'Editor Visual do Site', icon: Palette },
      { text: 'Integração com Portais', icon: Share2 },
    ],
  },
  {
    name: 'Escala',
    monthlyPrice: 199,
    annualPrice: 159, // ~20% discount
    description: 'Plano completo para imobiliárias com grandes equipes.',
    icon: Crown,
    gradient: 'from-amber-500/10 to-orange-500/10',
    borderColor: 'border-amber-500/20 hover:border-amber-500/40',
    features: [
      { text: '12 Usuários', icon: Users },
      { text: '1600 Imóveis', icon: Building2 },
      { text: 'IA integrada', icon: Bot },
      { text: 'CRM Completo', icon: BarChart3 },
      { text: 'Site Imobiliário com SSL e SEO', icon: Globe },
      { text: 'Site Otimizado com CDN', icon: Zap },
      { text: 'Editor Visual do Site', icon: Palette },
      { text: 'Integração com Portais', icon: Share2 },
    ],
  },
];

const PlansPage = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <SubscriptionsLayout>
      <div className="max-w-6xl animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3">Escolha o plano ideal para você</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Selecione o plano que melhor se adapta às suas necessidades.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
            Mensal
          </span>
          <Switch
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
            className="data-[state=checked]:bg-primary"
          />
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Anual
            </span>
            {isAnnual && (
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                <Percent className="h-3 w-3 mr-1" />
                20% OFF
              </Badge>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            
            return (
              <Card 
                key={plan.name} 
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl border-2 ${plan.borderColor} ${
                  plan.highlighted ? 'scale-[1.02] ring-2 ring-primary/20' : ''
                }`}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-50`} />
                
                {plan.highlighted && (
                  <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground gap-1">
                    <Sparkles className="h-3 w-3" />
                    Popular
                  </Badge>
                )}
                
                <CardHeader className="pb-4 relative">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    plan.highlighted 
                      ? 'bg-primary/20' 
                      : plan.name === 'Escala' 
                        ? 'bg-amber-500/20' 
                        : 'bg-blue-500/10'
                  }`}>
                    <Icon className={`h-6 w-6 ${
                      plan.highlighted 
                        ? 'text-primary' 
                        : plan.name === 'Escala' 
                          ? 'text-amber-500' 
                          : 'text-blue-500'
                    }`} />
                  </div>
                  
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  
                  <p className="text-sm text-muted-foreground mt-2">
                    {plan.description}
                  </p>
                  
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <span className="text-4xl font-bold">{price}</span>
                    <span className="text-muted-foreground">/ {isAnnual ? 'mês*' : 'mês'}</span>
                  </div>
                  
                  {isAnnual && (
                    <p className="text-xs text-muted-foreground mt-1">
                      *Cobrado anualmente (R$ {price * 12}/ano)
                    </p>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-4 relative">
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => {
                      return (
                        <div key={index} className="flex items-center gap-3 text-sm">
                          <div className={`p-1 rounded-full ${
                            plan.highlighted 
                              ? 'bg-primary/10 text-primary' 
                              : 'bg-green-500/10 text-green-600'
                          }`}>
                            <Check className="h-3.5 w-3.5" />
                          </div>
                          <span>{feature.text}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-6">
                    <Button 
                      className="w-full" 
                      variant={plan.highlighted ? "default" : "outline"}
                    >
                      Contratar Plano
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </SubscriptionsLayout>
  );
};

export default PlansPage;
