import { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';

const PIX_KEY = '14eb662f-9010-4430-a206-7f16e9427bbc';
const PIX_MERCHANT_NAME = 'VINICIUS SILVA MACHADO';
const PIX_MERCHANT_CITY = 'PLANALTINA';
const PIX_TXID = 'SaaSImobiliario';

/**
 * Generates EMV QR Code payload for PIX with amount
 * Based on BCB PIX specification
 */
function buildPixPayload(key: string, merchantName: string, merchantCity: string, amount: number, txId: string): string {
  const tlv = (id: string, value: string) => `${id}${String(value.length).padStart(2, '0')}${value}`;

  // Merchant Account Information (ID 26)
  const gui = tlv('00', 'br.gov.bcb.pix');
  const pixKey = tlv('01', key);
  const description = tlv('02', 'Sistema Imobiliario');
  const merchantAccount = tlv('26', gui + pixKey + description);

  let payload = '';
  payload += tlv('00', '01'); // Payload Format Indicator
  payload += merchantAccount;
  payload += tlv('52', '0000'); // Merchant Category Code
  payload += tlv('53', '986'); // Transaction Currency (BRL)
  payload += tlv('54', amount.toFixed(2)); // Transaction Amount
  payload += tlv('58', 'BR'); // Country Code
  payload += tlv('59', merchantName); // Merchant Name
  payload += tlv('60', merchantCity); // Merchant City
  payload += tlv('62', tlv('05', txId)); // Additional Data (TxID)

  // CRC16 placeholder
  payload += '6304';

  // Calculate CRC16 (CCITT-FALSE)
  const crc = crc16ccitt(payload);
  payload += crc;

  return payload;
}

function crc16ccitt(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
    crc &= 0xFFFF;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

interface PixPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNumber: string | null;
  amount: number;
}

const PixPaymentDialog = ({ open, onOpenChange, invoiceNumber, amount }: PixPaymentDialogProps) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const pixCode = useMemo(
    () => buildPixPayload(PIX_KEY, PIX_MERCHANT_NAME, PIX_MERCHANT_CITY, amount, PIX_TXID),
    [amount]
  );

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

  const handleConfirmPayment = useCallback(() => {
    setConfirmed(true);
    const end = Date.now() + 2500;
    const fire = () => {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, zIndex: 9999 });
      if (Date.now() < end) requestAnimationFrame(fire);
    };
    fire();
  }, []);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setConfirmed(false); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">Pagamento via Pix</DialogTitle>
        </DialogHeader>

        {confirmed ? (
          <div className="flex flex-col items-center gap-4 py-8 animate-fade-in">
            <div className="bg-green-500/10 p-4 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-center">Pagamento informado!</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Obrigado! Sua fatura será confirmada em breve. Você receberá uma notificação assim que o pagamento for processado.
            </p>
            <Button
              className="mt-2 gap-2"
              onClick={() => { setConfirmed(false); onOpenChange(false); }}
            >
              <PartyPopper className="h-4 w-4" />
              Fechar
            </Button>
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            {/* Invoice info */}
            <div className="text-center space-y-1">
              {invoiceNumber && (
                <p className="text-sm text-muted-foreground">Fatura {invoiceNumber}</p>
              )}
              <p className="text-2xl font-bold">{formattedAmount}</p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-xl">
                <QRCodeSVG value={pixCode} size={192} level="M" />
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
                {pixCode}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5"
                onClick={() => handleCopy(pixCode, 'code')}
              >
                {copiedCode ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedCode ? 'Código copiado!' : 'Copiar código Pix'}
              </Button>
            </div>

            {/* Confirm payment button */}
            <Button
              className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
              size="lg"
              onClick={handleConfirmPayment}
            >
              <CheckCircle2 className="h-5 w-5" />
              Já realizei o pagamento
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Após o pagamento, a confirmação pode levar alguns minutos.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PixPaymentDialog;
