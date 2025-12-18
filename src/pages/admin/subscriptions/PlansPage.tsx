import SubscriptionsLayout from './SubscriptionsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Check, 
  Sparkles, 
  Zap, 
  Crown, 
  Users, 
  Building2, 
  Percent
} from 'lucide-react';
import { useSubscriptionPlans, useCurrentSubscription, useUpdateBillingCycle } from '@/hooks/useSubscription';

const PlansPage = () => {
  const { data: plans, isLoading: loadingPlans } = useSubscriptionPlans();
  const { data: subscription, isLoading: loadingSubscription } = useCurrentSubscription();
  const updateBillingCycle = useUpdateBillingCycle();

  const isLoading = loadingPlans || loadingSubscription;
  const isAnnual = subscription?.billing_cycle === 'annual';

  const handleBillingCycleChange = (checked: boolean) => {
    updateBillingCycle.mutate(checked ? 'annual' : 'monthly');
  };

  const getButtonConfig = (planPrice: number) => {
    const currentPlanPrice = subscription?.plan?.monthly_price || 0;
    
    if (planPrice === currentPlanPrice) {
      return { text: 'Plano Atual', disabled: true, variant: 'outline' as const };
    } else if (planPrice < currentPlanPrice) {
      return { text: 'Reduzir Plano', disabled: false, variant: 'outline' as const };
    } else {
      return { text: 'Subir de plano', disabled: false, variant: 'default' as const };
    }
  };

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'essencial':
        return Sparkles;
      case 'impulso':
        return Zap;
      case 'escala':
        return Crown;
      default:
        return Sparkles;
    }
  };

  const getPlanStyle = (slug: string, isHighlighted: boolean) => {
    if (isHighlighted) {
      return {
        gradient: 'from-primary/10 to-violet-500/10',
        borderColor: 'border-primary/30 hover:border-primary/50',
        iconBg: 'bg-primary/20',
        iconColor: 'text-primary',
      };
    }
    switch (slug) {
      case 'essencial':
        return {
          gradient: 'from-blue-500/10 to-cyan-500/10',
          borderColor: 'border-blue-500/20 hover:border-blue-500/40',
          iconBg: 'bg-blue-500/10',
          iconColor: 'text-blue-500',
        };
      case 'escala':
        return {
          gradient: 'from-amber-500/10 to-orange-500/10',
          borderColor: 'border-amber-500/20 hover:border-amber-500/40',
          iconBg: 'bg-amber-500/20',
          iconColor: 'text-amber-500',
        };
      default:
        return {
          gradient: 'from-primary/10 to-primary/5',
          borderColor: 'border-primary/20',
          iconBg: 'bg-primary/10',
          iconColor: 'text-primary',
        };
    }
  };

  if (isLoading) {
    return (
      <SubscriptionsLayout>
        <div className="max-w-6xl animate-fade-in space-y-8">
          <div className="text-center">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </SubscriptionsLayout>
    );
  }

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
            onCheckedChange={handleBillingCycleChange}
            disabled={updateBillingCycle.isPending}
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
          {plans?.map((plan) => {
            const isHighlighted = plan.slug === 'impulso';
            const Icon = getPlanIcon(plan.slug);
            const style = getPlanStyle(plan.slug, isHighlighted);
            const price = isAnnual ? plan.annual_price : plan.monthly_price;
            const buttonConfig = getButtonConfig(plan.monthly_price);
            
            return (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl border-2 ${style.borderColor} ${
                  isHighlighted ? 'scale-[1.02] ring-2 ring-primary/20' : ''
                }`}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-50`} />
                
                {isHighlighted && (
                  <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground gap-1">
                    <Sparkles className="h-3 w-3" />
                    Popular
                  </Badge>
                )}
                
                <CardHeader className="pb-4 relative">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${style.iconBg}`}>
                    <Icon className={`h-6 w-6 ${style.iconColor}`} />
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
                    {/* Users and Properties */}
                    <div className="flex items-center gap-3 text-sm">
                      <div className={`p-1 rounded-full ${isHighlighted ? 'bg-primary/10 text-primary' : 'bg-green-500/10 text-green-600'}`}>
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span><Users className="h-4 w-4 inline mr-1" />{plan.max_users} Usuários</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className={`p-1 rounded-full ${isHighlighted ? 'bg-primary/10 text-primary' : 'bg-green-500/10 text-green-600'}`}>
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span><Building2 className="h-4 w-4 inline mr-1" />{plan.max_properties} Imóveis</span>
                    </div>
                    
                    {/* Features from database */}
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <div className={`p-1 rounded-full ${isHighlighted ? 'bg-primary/10 text-primary' : 'bg-green-500/10 text-green-600'}`}>
                          <Check className="h-3.5 w-3.5" />
                        </div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 space-y-4">
                    <Button 
                      className="w-full" 
                      variant={buttonConfig.disabled ? "outline" : (isHighlighted ? "default" : buttonConfig.variant)}
                      disabled={buttonConfig.disabled}
                    >
                      {buttonConfig.text}
                    </Button>
                    
                    {!isAnnual && (
                      <p className="text-xs text-center text-muted-foreground">
                        Contrate o plano anual e ganhe até <span className="font-semibold text-primary">20% de desconto</span>.
                      </p>
                    )}
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