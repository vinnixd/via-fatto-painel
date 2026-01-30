import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';

interface CreciInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const formatCreci = (value: string): string => {
  // Remove tudo que não é letra ou número
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Extrai as partes
  const letters = cleaned.replace(/[0-9]/g, '').slice(0, 2); // Máximo 2 letras (UF)
  const numbers = cleaned.replace(/[A-Z]/g, '').slice(0, 6); // Máximo 6 dígitos
  
  // Monta o formato CRECI/UF 123456
  if (!letters && !numbers) return '';
  if (!numbers) return `CRECI/${letters}`;
  if (!letters) return `CRECI/ ${numbers}`;
  return `CRECI/${letters} ${numbers}`;
};

const CreciInput = ({
  id,
  label,
  value,
  onChange,
  required = false,
}: CreciInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Se estiver apagando e ficou só "CRECI/" ou menos, limpa tudo
    if (inputValue.length <= 6) {
      onChange('');
      return;
    }
    
    // Remove o prefixo para processar
    const withoutPrefix = inputValue.replace(/^CRECI\/?/i, '').replace(/\s/g, '');
    const formatted = formatCreci(withoutPrefix);
    onChange(formatted);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      <div className="relative">
        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          type="text"
          placeholder="CRECI/SP 12345"
          className="pl-10 h-11 bg-background border-border/60 focus:border-primary"
          value={value}
          onChange={handleChange}
          required={required}
        />
      </div>
    </div>
  );
};

export default CreciInput;
