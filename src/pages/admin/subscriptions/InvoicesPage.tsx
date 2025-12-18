import { useState } from 'react';
import SubscriptionsLayout from './SubscriptionsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Download, 
  Settings, 
  FileText, 
  Receipt, 
  CheckCircle2,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface Invoice {
  month: string;
  period: string;
  nfe: string;
  plan: string;
  amount: string;
  status: 'paid' | 'pending';
}

const invoices: Invoice[] = [
  { month: 'Dezembro 2025', period: '11/12/25 - 10/01/26', nfe: 'NFe #5335886', plan: 'Profissional', amount: 'R$ 139,00', status: 'paid' },
  { month: '', period: '14/06/25 - 14/07/25', nfe: 'NFe #5351240', plan: 'Essencial', amount: 'R$ 59,00', status: 'paid' },
  { month: 'Novembro 2025', period: '11/11/25 - 11/12/25', nfe: 'NFe #5191841', plan: 'Profissional', amount: 'R$ 139,00', status: 'paid' },
  { month: 'Outubro 2025', period: '12/10/25 - 11/11/25', nfe: 'NFe #5106998', plan: 'Profissional', amount: 'R$ 139,00', status: 'paid' },
  { month: 'Setembro 2025', period: '12/09/25 - 12/10/25', nfe: 'NFe #4920976', plan: 'Profissional', amount: 'R$ 139,00', status: 'paid' },
  { month: 'Agosto 2025', period: '13/08/25 - 12/09/25', nfe: 'NFe #4791000', plan: 'Profissional', amount: 'R$ 139,00', status: 'paid' },
];

const InvoicesPage = () => {
  const [showFiscalConfig, setShowFiscalConfig] = useState(false);
  
  // Group invoices by month
  const groupedInvoices = invoices.reduce((acc, invoice, index) => {
    const prevInvoice = invoices[index - 1];
    const isNewMonth = invoice.month && (!prevInvoice || prevInvoice.month !== invoice.month);
    
    if (isNewMonth || index === 0) {
      acc.push({ ...invoice, isFirst: true });
    } else {
      acc.push({ ...invoice, isFirst: false });
    }
    return acc;
  }, [] as (Invoice & { isFirst: boolean })[]);

  // Calculate stats
  const totalPaid = invoices.reduce((sum, inv) => {
    const value = parseFloat(inv.amount.replace('R$ ', '').replace(',', '.'));
    return sum + value;
  }, 0);

  return (
    <SubscriptionsLayout>
      <div className="max-w-5xl animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Faturas</h1>
          <p className="text-muted-foreground">
            Acompanhe seu histórico de pagamentos e baixe suas notas fiscais.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-green-500/20 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-semibold text-green-600">Em dia</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-primary/20 rounded-xl">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Faturas</p>
                <p className="font-semibold">{invoices.length} emitidas</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/20 rounded-xl">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Última</p>
                <p className="font-semibold">Dez/2025</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/20 rounded-xl">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total pago</p>
                <p className="font-semibold">R$ {totalPaid.toFixed(2).replace('.', ',')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fiscal Data Card */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-muted/50 to-transparent p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-background rounded-xl">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Dados fiscais</h3>
                <p className="text-sm text-muted-foreground">Configure os dados para emissão de notas fiscais</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setShowFiscalConfig(true)}
            >
              <Settings className="h-4 w-4" />
              Configurar
            </Button>
          </div>
        </Card>

        {/* Invoices Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Notas fiscais</h2>
            <Button variant="outline" size="sm">
              Exportar tudo
            </Button>
          </div>
          
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Mês</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>NFe / Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[80px] text-center">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedInvoices.map((invoice, index) => (
                  <TableRow key={index} className="group">
                    <TableCell className="font-medium">
                      {invoice.isFirst ? invoice.month : ''}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{invoice.period}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="text-primary hover:underline cursor-pointer font-medium">
                          {invoice.nfe}
                        </span>
                        <p className="text-xs text-muted-foreground">{invoice.plan}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={invoice.status === 'paid' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }
                      >
                        {invoice.status === 'paid' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{invoice.amount}</TableCell>
                    <TableCell className="text-center">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-50 group-hover:opacity-100 transition-opacity"
                        onClick={() => toast.success('Download iniciado!')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      {/* Fiscal Config Dialog */}
      <Dialog open={showFiscalConfig} onOpenChange={setShowFiscalConfig}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Configurar dados fiscais</DialogTitle>
            <p className="text-muted-foreground text-sm">
              Configure os dados que serão utilizados na emissão de notas fiscais.
            </p>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Nome ou razão social</Label>
              <Input placeholder="Digite o nome ou razão social" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">CPF ou CNPJ</Label>
              <Input placeholder="Digite o CPF ou CNPJ" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">CEP</Label>
                <Input placeholder="00000-000" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Estado</Label>
                <Input placeholder="UF" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowFiscalConfig(false)}>
                Cancelar
              </Button>
              <Button variant="admin" onClick={() => {
                toast.success('Dados fiscais salvos!');
                setShowFiscalConfig(false);
              }}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SubscriptionsLayout>
  );
};

export default InvoicesPage;
