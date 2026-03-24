import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GeneratedArticle {
  title: string;
  subtitle: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  faq: { question: string; answer: string }[];
  seo_title: string;
  seo_description: string;
}

interface GenerateArticleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (article: GeneratedArticle) => void;
}

const AUDIENCES = [
  { value: 'comprador', label: 'Compradores' },
  { value: 'investidor', label: 'Investidores' },
  { value: 'primeira-casa', label: 'Primeira casa própria' },
  { value: 'alto-padrao', label: 'Alto padrão' },
  { value: 'jovens', label: 'Jovens profissionais' },
  { value: 'familias', label: 'Famílias' },
  { value: 'aposentados', label: 'Aposentados' },
  { value: 'locatarios', label: 'Locatários' },
];

const TONES = [
  { value: 'equilibrado', label: 'Equilibrado' },
  { value: 'tecnico', label: 'Mais técnico' },
  { value: 'simples', label: 'Mais simples' },
  { value: 'vendedor', label: 'Mais vendedor' },
];

const GenerateArticleDialog = ({ open, onOpenChange, onGenerated }: GenerateArticleDialogProps) => {
  const [tema, setTema] = useState('');
  const [cidade, setCidade] = useState('');
  const [publico, setPublico] = useState('');
  const [palavraChave, setPalavraChave] = useState('');
  const [tom, setTom] = useState('equilibrado');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!tema.trim()) {
      toast.error('Informe o tema do artigo.');
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-article', {
        body: { tema, cidade, publico, palavraChave, tom },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success('Artigo gerado com sucesso!');
      onGenerated(data as GeneratedArticle);
      onOpenChange(false);

      // Reset form
      setTema('');
      setCidade('');
      setPublico('');
      setPalavraChave('');
      setTom('equilibrado');
    } catch (err: any) {
      toast.error('Erro ao gerar artigo: ' + (err.message || 'Tente novamente'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Gerar Artigo com IA
          </DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para gerar um artigo completo otimizado para SEO.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="tema">Tema do artigo *</Label>
            <Input
              id="tema"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Ex: Vantagens de comprar apartamento na planta"
              disabled={generating}
            />
          </div>

          <div>
            <Label htmlFor="cidade">Cidade / Região</Label>
            <Input
              id="cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Ex: Brasília, São Paulo, Goiânia"
              disabled={generating}
            />
          </div>

          <div>
            <Label>Tipo de público</Label>
            <Select value={publico} onValueChange={setPublico} disabled={generating}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o público-alvo" />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCES.map(a => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="palavraChave">Palavra-chave principal (opcional)</Label>
            <Input
              id="palavraChave"
              value={palavraChave}
              onChange={(e) => setPalavraChave(e.target.value)}
              placeholder="Ex: apartamento na planta Brasília"
              disabled={generating}
            />
          </div>

          <div>
            <Label>Tom do conteúdo</Label>
            <Select value={tom} onValueChange={setTom} disabled={generating}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={generating || !tema.trim()}>
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando artigo...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Gerar Artigo
              </>
            )}
          </Button>
        </div>

        {generating && (
          <div className="text-center text-sm text-muted-foreground pb-2">
            <p>Isso pode levar até 30 segundos. Aguarde...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GenerateArticleDialog;
