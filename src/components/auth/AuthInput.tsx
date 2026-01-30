import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LucideIcon } from 'lucide-react';

interface AuthInputProps {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon: LucideIcon;
  required?: boolean;
  helpText?: string;
}

const AuthInput = ({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon: Icon,
  required = true,
  helpText,
}: AuthInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          className="pl-10 h-11 bg-background border-border/60 focus:border-primary"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      </div>
      {helpText && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
};

export default AuthInput;
