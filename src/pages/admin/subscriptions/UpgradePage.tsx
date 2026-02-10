import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useSubscriptionPlans, useCurrentSubscription } from '@/hooks/useSubscription';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowRight, 
  Building2, 
  Check, 
  Crown, 
  Sparkles, 
  Users, 
  Zap,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';

const UpgradePage = () => {
  const { navigateAdmin } = useAdminNavigation();
  const { currentUsers, maxUsers, currentProperties, maxProperties, isLoading: limitsLoading } = useSubscriptionLimits();
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: subscription, isLoading: subLoading } = useCurrentSubscription();

  const isLoading = limitsLoading || plansLoading || subLoading;
  const currentPlan = subscription?.plan;

  // Find the next plan (higher price than current)
  const nextPlan = plans
    ?.filter(p => p.monthly_price > (currentPlan?.monthly_price || 0))
    ?.sort((a, b) => a.monthly_price - b.monthly_price)?.[0];

  const usersAtLimit = currentUsers >= maxUsers;
  const propertiesAtLimit = currentProperties >= maxProperties;

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'essencial': return Sparkles;
      case 'impulso': return Zap;
      case 'escala': return Crown;
      default: return Sparkles;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-foreground/5 mb-2">
            <TrendingUp className="h-7 w-7 text-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Hora de crescer!</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Você atingiu os limites do seu plano atual. Faça upgrade para continuar expandindo seus negócios.
          </p>
        </div>

        {/* Current Usage */}
        <Card className="border-2 border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Uso atual — Plano {currentPlan?.name || 'Atual'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Users Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Usuários
                </span>
                <span className={`font-semibold ${usersAtLimit ? 'text-destructive' : 'text-foreground'}`}>
                  {currentUsers} / {maxUsers}
                  {usersAtLimit && (
                    <Badge variant="destructive" className="ml-2 text-xs">Limite</Badge>
                  )}
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    usersAtLimit ? 'bg-destructive' : currentUsers / maxUsers >= 0.8 ? 'bg-amber-500' : 'bg-foreground/30'
                  }`}
                  style={{ width: `${Math.min((currentUsers / maxUsers) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Properties Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Imóveis
                </span>
                <span className={`font-semibold ${propertiesAtLimit ? 'text-destructive' : 'text-foreground'}`}>
                  {currentProperties} / {maxProperties}
                  {propertiesAtLimit && (
                    <Badge variant="destructive" className="ml-2 text-xs">Limite</Badge>
                  )}
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    propertiesAtLimit ? 'bg-destructive' : currentProperties / maxProperties >= 0.8 ? 'bg-amber-500' : 'bg-foreground/30'
                  }`}
                  style={{ width: `${Math.min((currentProperties / maxProperties) * 100, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Plan CTA */}
        {nextPlan ? (
          <Card className="border-2 border-foreground/20 bg-gradient-to-br from-foreground/[0.03] to-foreground/[0.08] overflow-hidden relative">
            <div className="absolute top-4 right-4">
              <Badge className="bg-foreground text-background gap-1">
                <Sparkles className="h-3 w-3" />
                Recomendado
              </Badge>
            </div>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = getPlanIcon(nextPlan.slug);
                  return (
                    <div className="h-12 w-12 rounded-xl bg-foreground/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-foreground" />
                    </div>
                  );
                })()}
                <div>
                  <CardTitle className="text-2xl">{nextPlan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{nextPlan.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Price */}
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-muted-foreground">R$</span>
                <span className="text-4xl font-bold">{nextPlan.monthly_price}</span>
                <span className="text-muted-foreground">/ mês</span>
              </div>

              {/* Comparison highlights */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background border">
                  <Users className="h-5 w-5 text-foreground/70" />
                  <div>
                    <p className="text-sm font-medium">
                      {maxUsers} → <span className="text-foreground font-bold">{nextPlan.max_users}</span> usuários
                    </p>
                    <p className="text-xs text-muted-foreground">+{nextPlan.max_users - maxUsers} vagas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background border">
                  <Building2 className="h-5 w-5 text-foreground/70" />
                  <div>
                    <p className="text-sm font-medium">
                      {maxProperties} → <span className="text-foreground font-bold">{nextPlan.max_properties}</span> imóveis
                    </p>
                    <p className="text-xs text-muted-foreground">+{nextPlan.max_properties - maxProperties} imóveis</p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                {nextPlan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-foreground/60" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Button
                variant="admin"
                size="lg"
                className="w-full text-base"
                onClick={() => navigateAdmin('/admin/assinaturas/planos')}
              >
                Fazer upgrade para {nextPlan.name}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Economize até <span className="font-semibold text-foreground">20%</span> no plano anual
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border text-center py-8">
            <CardContent>
              <Crown className="h-10 w-10 mx-auto mb-3 text-foreground/40" />
              <h3 className="text-lg font-semibold mb-1">Você já está no plano máximo</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Entre em contato para discutir um plano personalizado.
              </p>
              <Button variant="outline" onClick={() => navigateAdmin('/admin/assinaturas/planos')}>
                Ver todos os planos
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Back link */}
        <div className="text-center">
          <Button variant="ghost" onClick={() => navigateAdmin('/admin/assinaturas/planos')} className="text-muted-foreground">
            Ver todos os planos disponíveis
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UpgradePage;
