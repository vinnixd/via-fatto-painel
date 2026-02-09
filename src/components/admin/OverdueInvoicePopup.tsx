import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, CreditCard } from 'lucide-react';
import { useInvoices } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DISMISSED_KEY = 'overdue-invoice-dismissed';

const funMessages = [
  '⚡ Eita! Parece que uma faturinha escapou do radar...',
  '🫣 Opa! Tem uma fatura pedindo atenção por aqui...',
  '💸 Alerta de fatura saudosa! Ela tá esperando por você...',
  '🔔 Psiu! Uma fatura tá batendo na porta...',
  '☕ Antes do café... que tal dar uma olhadinha nessa fatura?',
];

const OverdueInvoicePopup = () => {
  const { isAdmin } = useAuth();
  const { data: invoices } = useInvoices();
  const { navigateAdmin } = useAdminNavigation();
  const [open, setOpen] = useState(false);
  const [message] = useState(() => funMessages[Math.floor(Math.random() * funMessages.length)]);

  const overdueInvoices = invoices?.filter((inv) => inv.status === 'overdue') || [];
  const latestOverdue = overdueInvoices[0];

  useEffect(() => {
    if (!isAdmin || overdueInvoices.length === 0) return;

    // Check if already dismissed today
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      // Show again next day
      if (dismissedDate.toDateString() === now.toDateString()) return;
    }

    // Small delay so it doesn't flash on page load
    const timer = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(timer);
  }, [isAdmin, overdueInvoices.length]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, new Date().toISOString());
    setOpen(false);
  };

  const handleGoToInvoices = () => {
    setOpen(false);
    navigateAdmin('/admin/assinaturas/faturas');
  };

  if (!isAdmin || overdueInvoices.length === 0) return null;

  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center items-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <DialogTitle className="text-xl font-bold">
            {message}
          </DialogTitle>
          <DialogDescription className="text-center pt-2 space-y-2">
            <p>
              Você tem <strong className="text-foreground">{overdueInvoices.length} {overdueInvoices.length === 1 ? 'fatura em atraso' : 'faturas em atraso'}</strong> no valor total de{' '}
              <strong className="text-foreground">
                R$ {totalOverdue.toFixed(2).replace('.', ',')}
              </strong>.
            </p>
            {latestOverdue && (
              <p className="text-xs">
                Vencimento mais recente:{' '}
                <span className="font-medium">
                  {format(new Date(latestOverdue.due_date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </p>
            )}
            <p className="text-xs text-muted-foreground pt-1">
              Regularize para continuar aproveitando todos os recursos sem interrupções 😉
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button variant="outline" onClick={handleDismiss} className="flex-1">
            Lembrar depois
          </Button>
          <Button onClick={handleGoToInvoices} className="flex-1 gap-2">
            <CreditCard className="h-4 w-4" />
            Ver faturas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OverdueInvoicePopup;
