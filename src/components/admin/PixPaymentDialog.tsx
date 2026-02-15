import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2, QrCode } from 'lucide-react';
import { toast } from 'sonner';

const PIX_KEY = '14eb662f-9010-4430-a206-7f16e9427bbc';
const PIX_CODE = '00020126810014br.gov.bcb.pix013614eb662f-9010-4430-a206-7f16e9427bbc0219Sistema Imobiliario5204000053039865802BR5922VINICIUS SILVA MACHADO6010PLANALTINA62190515SaaSImobiliario630420C0';

interface PixPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNumber: string | null;
  amount: number;
}

const PixPaymentDialog = ({ open, onOpenChange, invoiceNumber, amount }: PixPaymentDialogProps) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopy = async (text: string, type: 'key' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'key') {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
      toast.success('Copiado para a área de transferência!');
    } catch {
      toast.error('Erro ao copiar. Tente manualmente.');
    }
  };

  const formattedAmount = `R$ ${Number(amount).toFixed(2).replace('.', ',')}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">Pagamento via Pix</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Invoice info */}
          <div className="text-center space-y-1">
            {invoiceNumber && (
              <p className="text-sm text-muted-foreground">Fatura {invoiceNumber}</p>
            )}
            <p className="text-2xl font-bold">{formattedAmount}</p>
          </div>

          {/* QR Code placeholder */}
          <div className="flex justify-center">
            <div className="h-48 w-48 rounded-xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-2 bg-muted/30">
              <QrCode className="h-16 w-16 text-muted-foreground/40" />
              <span className="text-xs text-muted-foreground">Use o código abaixo</span>
            </div>
          </div>

          {/* PIX Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Chave Pix</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-lg px-3 py-2.5 text-sm font-mono break-all select-all">
                {PIX_KEY}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={() => handleCopy(PIX_KEY, 'key')}
              >
                {copiedKey ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedKey ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          </div>

          {/* PIX Copia e Cola */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pix Copia e Cola</label>
            <div className="bg-muted rounded-lg px-3 py-2.5 text-xs font-mono break-all max-h-20 overflow-y-auto select-all">
              {PIX_CODE}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5"
              onClick={() => handleCopy(PIX_CODE, 'code')}
            >
              {copiedCode ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedCode ? 'Código copiado!' : 'Copiar código Pix'}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Após o pagamento, a confirmação pode levar alguns minutos.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PixPaymentDialog;
