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
  Percent,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useSubscriptionPlans, useCurrentSubscription, useUpdateBillingCycle, useChangePlan } from '@/hooks/useSubscription';

const PlansPage = () => {
  const { data: plans, isLoading: loadingPlans } = useSubscriptionPlans();
  const { data: subscription, isLoading: loadingSubscription } = useCurrentSubscription();
  const updateBillingCycle = useUpdateBillingCycle();
  const changePlan = useChangePlan();

  const isLoading = loadingPlans || loadingSubscription;
  const isAnnual = subscription?.billing_cycle === 'annual';
  const currentPlan = subscription?.plan;

  const handleBillingCycleChange = (checked: boolean) => {
    updateBillingCycle.mutate(checked ? 'annual' : 'monthly');
  };

  const getButtonConfig = (plan: typeof plans extends (infer T)[] | undefined ? T : never) => {
    const currentPrice = currentPlan?.monthly_price || 0;
    
    if (plan.monthly_price === currentPrice) {
      return { text: 'Seu plano atual', disabled: true, variant: 'outline' as const, isCurrentPlan: true };
    } else if (plan.monthly_price < currentPrice) {
      return { text: 'Migrar para este plano', disabled: false, variant: 'outline' as const, isCurrentPlan: false };
    } else {
      return { text: 'Fazer upgrade', disabled: false, variant: 'admin' as const, isCurrentPlan: false };
    }
  };

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'essencial': return Sparkles;
      case 'impulso': return Zap;
      case 'escala': return Crown;
      default: return Sparkles;
    }
  };

  // Generate comparative advantages
  const getComparativeText = (plan: { max_users: number; max_properties: number }) => {
    if (!currentPlan) return null;
    if (plan.max_users <= currentPlan.max_users && plan.max_properties <= currentPlan.max_properties) return null;
    
    const extras: string[] = [];
    if (plan.max_users > currentPlan.max_users) {
      extras.push(`+${plan.max_users - currentPlan.max_users} usuários`);
    }
    if (plan.max_properties > currentPlan.max_properties) {
      extras.push(`+${plan.max_properties - currentPlan.max_properties} imóveis`);
    }
    return extras;
  };

  // Calculate annual savings
  const getAnnualSavings = (monthlyPrice: number, annualPrice: number) => {
    const savingsPerMonth = monthlyPrice - annualPrice;
    return savingsPerMonth * 12;
  };

  if (isLoading) {
    return (
      <SubscriptionsLayout>
        <div className="max-w-6xl mx-auto animate-fade-in space-y-8">
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
      <div className="max-w-6xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3">Escolha o plano ideal para você</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Selecione o plano que melhor se adapta às suas necessidades.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
            Mensal
          </span>
          <Switch
            checked={isAnnual}
            onCheckedChange={handleBillingCycleChange}
            disabled={updateBillingCycle.isPending}
            className="data-[state=checked]:bg-foreground"
          />
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Anual
            </span>
            <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/20">
              <Percent className="h-3 w-3 mr-1" />
              20% OFF
            </Badge>
          </div>
        </div>

        {/* Annual Savings Info */}
        {isAnnual && currentPlan && (
          <div className="text-center mb-8">
            <p className="text-sm text-green-700 font-medium">
              Economize R$ {getAnnualSavings(currentPlan.monthly_price, currentPlan.annual_price).toFixed(0)} por ano no seu plano atual
            </p>
          </div>
        )}
        {!isAnnual && <div className="mb-6" />}

        {/* Plans Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {plans?.map((plan) => {
            const isHighlighted = plan.slug === 'impulso';
            const Icon = getPlanIcon(plan.slug);
            const price = isAnnual ? plan.annual_price : plan.monthly_price;
            const buttonConfig = getButtonConfig(plan);
            const comparative = getComparativeText(plan);
            
            return (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden transition-all duration-300 border-2 ${
                  buttonConfig.isCurrentPlan
                    ? 'border-foreground/10 opacity-90'
                    : isHighlighted 
                      ? 'border-foreground/30 hover:border-foreground/50 hover:shadow-xl scale-[1.02] ring-2 ring-foreground/10'
                      : 'border-border hover:border-foreground/30 hover:shadow-xl'
                }`}
              >
                {/* Current Plan Badge */}
                {buttonConfig.isCurrentPlan && (
                  <Badge className="absolute top-4 right-4 bg-foreground text-background gap-1">
                    <Check className="h-3 w-3" />
                    Seu plano atual
                  </Badge>
                )}

                {/* Popular Badge */}
                {isHighlighted && !buttonConfig.isCurrentPlan && (
                  <Badge className="absolute top-4 right-4 bg-foreground text-background gap-1">
                    <Sparkles className="h-3 w-3" />
                    Popular
                  </Badge>
                )}
                
                <CardHeader className="pb-4 relative">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    buttonConfig.isCurrentPlan ? 'bg-muted' : 'bg-foreground/5'
                  }`}>
                    <Icon className={`h-6 w-6 ${buttonConfig.isCurrentPlan ? 'text-foreground/50' : 'text-foreground/70'}`} />
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
                  {/* Comparative advantages */}
                  {comparative && comparative.length > 0 && (
                    <div className="bg-green-500/5 border border-green-500/15 rounded-lg p-3 space-y-1.5">
                      <p className="text-xs font-medium text-green-700 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Você terá:
                      </p>
                      {comparative.map((text, i) => (
                        <p key={i} className="text-sm text-green-700 font-medium">{text}</p>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Users and Properties */}
                    <div className="flex items-center gap-3 text-sm">
                      <div className="p-1 rounded-full bg-foreground/5">
                        <Check className="h-3.5 w-3.5 text-foreground/60" />
                      </div>
                      <span><Users className="h-4 w-4 inline mr-1" />{plan.max_users} Usuários</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="p-1 rounded-full bg-foreground/5">
                        <Check className="h-3.5 w-3.5 text-foreground/60" />
                      </div>
                      <span><Building2 className="h-4 w-4 inline mr-1" />{plan.max_properties} Imóveis</span>
                    </div>
                    
                    {/* Features from database */}
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <div className="p-1 rounded-full bg-foreground/5">
                          <Check className="h-3.5 w-3.5 text-foreground/60" />
                        </div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 space-y-4">
                    {buttonConfig.isCurrentPlan ? (
                      <Button 
                        className="w-full" 
                        variant="outline"
                        disabled
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Plano atual
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        variant="admin"
                        disabled={changePlan.isPending}
                        onClick={() => changePlan.mutate(plan.id)}
                      >
                        {changePlan.isPending ? 'Atualizando...' : plan.monthly_price > (currentPlan?.monthly_price || 0) ? 'Fazer upgrade' : 'Migrar para este plano'}
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trust Microcopy */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Cancelamento pode ser feito a qualquer momento. Sem multas ou taxas adicionais.
        </p>
      </div>
    </SubscriptionsLayout>
  );
};

export default PlansPage;
