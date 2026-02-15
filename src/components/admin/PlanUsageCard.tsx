import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AdminLink from '@/components/admin/AdminLink';
import { Building2, Users, ArrowRight, Crown } from 'lucide-react';

const UsageBar = ({ current, max, label, icon: Icon }: { current: number; max: number; label: string; icon: React.ElementType }) => {
  const ratio = max === Infinity ? 0 : current / max;
  const pct = Math.min(ratio * 100, 100);
  const atLimit = ratio >= 1;
  const nearLimit = ratio >= 0.8;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          {label}
        </span>
        <span className={`font-semibold ${atLimit ? 'text-destructive' : nearLimit ? 'text-amber-600' : 'text-foreground'}`}>
          {current} / {max === Infinity ? '∞' : max}
          {atLimit && <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 py-0">Limite</Badge>}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            atLimit ? 'bg-destructive' : nearLimit ? 'bg-amber-500' : 'bg-foreground/70'
          }`}
          style={{ width: `${max === Infinity ? 5 : pct}%` }}
        />
      </div>
    </div>
  );
};

const PlanUsageCard = () => {
  const { currentUsers, maxUsers, currentProperties, maxProperties, planName, isLoading } = useSubscriptionLimits();

  if (isLoading) return null;

  const usersNear = maxUsers !== Infinity && currentUsers / maxUsers >= 0.8;
  const propsNear = maxProperties !== Infinity && currentProperties / maxProperties >= 0.8;
  const showUpgrade = usersNear || propsNear;

  return (
    <Card className={`border bg-card ${showUpgrade ? 'border-amber-500/40' : ''}`}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <Crown className="h-4.5 w-4.5 text-foreground/70" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Uso do Plano</CardTitle>
            {planName && (
              <p className="text-xs text-muted-foreground mt-0.5">Plano {planName}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <UsageBar current={currentProperties} max={maxProperties} label="Imóveis" icon={Building2} />
        <UsageBar current={currentUsers} max={maxUsers} label="Usuários" icon={Users} />

        {showUpgrade && (
          <Button variant="admin" size="sm" className="w-full mt-2" asChild>
            <AdminLink to="/admin/assinaturas/upgrade">
              Fazer upgrade
              <ArrowRight className="h-4 w-4 ml-1" />
            </AdminLink>
          </Button>
        )}

        {!showUpgrade && (
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground text-xs" asChild>
            <AdminLink to="/admin/assinaturas/planos">
              Ver planos
            </AdminLink>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PlanUsageCard;
