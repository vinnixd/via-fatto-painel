import { useState, useRef } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminHeader from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface ImportResult {
  total_linhas: number;
  imoveis_criados: number;
  imoveis_atualizados: number;
  imagens_importadas: number;
  erros: Array<{ linha: number; titulo: string; motivo: string }>;
}

const ImportPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error("Por favor, selecione um arquivo CSV");
        return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) { // 50MB limit
        toast.error("Arquivo muito grande. Limite máximo: 50MB");
        return;
      }
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Selecione um arquivo CSV primeiro");
      return;
    }

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Você precisa estar logado para importar imóveis");
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-properties-csv`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao importar imóveis');
      }

      setResult(data);
      
      if (data.erros?.length === 0) {
        toast.success(`Importação concluída! ${data.imoveis_criados} criados, ${data.imoveis_atualizados} atualizados.`);
      } else {
        toast.warning(`Importação concluída com ${data.erros.length} erros.`);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setImporting(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <AdminLayout>
      <AdminHeader 
        title="Importar Imóveis (CSV)" 
        subtitle="Importe imóveis em massa a partir de um arquivo CSV exportado do WordPress"
      />
      
      <div className="space-y-6">
        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Como importar imóveis
            </CardTitle>
            <CardDescription>
              Siga os passos abaixo para importar seus imóveis do WordPress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">Exporte seus imóveis do WordPress</strong> usando o plugin WP All Export em formato CSV.
              </li>
              <li>
                <strong className="text-foreground">Certifique-se que o CSV contém as colunas:</strong>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary">Title</Badge>
                  <Badge variant="secondary">Content</Badge>
                  <Badge variant="secondary">Permalink</Badge>
                  <Badge variant="secondary">Image URL</Badge>
                  <Badge variant="secondary">Estado e Cidade</Badge>
                  <Badge variant="secondary">Tipo do Imóvel</Badge>
                  <Badge variant="secondary">Finalidade</Badge>
                  <Badge variant="secondary">Destaque</Badge>
                </div>
              </li>
              <li>
                <strong className="text-foreground">Faça upload do arquivo</strong> usando o formulário abaixo.
              </li>
              <li>
                <strong className="text-foreground">Clique em "Importar imóveis"</strong> e aguarde o processamento.
              </li>
            </ol>
            
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Dica importante</AlertTitle>
              <AlertDescription>
                Se um imóvel com o mesmo slug ou URL já existir, ele será atualizado em vez de duplicado. 
                As imagens serão baixadas automaticamente e salvas no storage do sistema.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload do arquivo CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
                disabled={importing}
              />
              
              {file ? (
                <div className="space-y-2">
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-primary" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button variant="outline" size="sm" onClick={resetForm} disabled={importing}>
                    Remover arquivo
                  </Button>
                </div>
              ) : (
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="mt-2 font-medium">Clique para selecionar o arquivo CSV</p>
                  <p className="text-sm text-muted-foreground">ou arraste e solte aqui</p>
                  <p className="text-xs text-muted-foreground mt-2">Limite máximo: 50MB</p>
                </label>
              )}
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleImport} 
                disabled={!file || importing}
                className="flex-1"
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Importar imóveis
                  </>
                )}
              </Button>
            </div>

            {importing && (
              <div className="space-y-2">
                <Progress value={undefined} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">
                  Processando arquivo... Isso pode levar alguns minutos dependendo do tamanho.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Erro na importação</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results Card */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Resultado da importação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">{result.total_linhas}</p>
                  <p className="text-sm text-muted-foreground">Total de linhas</p>
                </div>
                <div className="bg-green-500/10 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{result.imoveis_criados}</p>
                  <p className="text-sm text-muted-foreground">Imóveis criados</p>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{result.imoveis_atualizados}</p>
                  <p className="text-sm text-muted-foreground">Imóveis atualizados</p>
                </div>
                <div className="bg-purple-500/10 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">{result.imagens_importadas}</p>
                  <p className="text-sm text-muted-foreground">Imagens importadas</p>
                </div>
              </div>

              {/* Success message */}
              {result.erros.length === 0 ? (
                <Alert className="bg-green-500/10 border-green-500">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-600">Importação concluída com sucesso!</AlertTitle>
                  <AlertDescription>
                    Todos os imóveis foram importados sem erros.{" "}
                    <Link to="/admin/imoveis" className="underline font-medium">
                      Ver imóveis
                    </Link>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Importação concluída com {result.erros.length} erro(s)</AlertTitle>
                  <AlertDescription>
                    Alguns imóveis não puderam ser importados. Veja os detalhes abaixo.
                  </AlertDescription>
                </Alert>
              )}

              {/* Errors list */}
              {result.erros.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2 font-medium text-sm">
                    Erros encontrados
                  </div>
                  <div className="divide-y max-h-64 overflow-y-auto">
                    {result.erros.map((erro, index) => (
                      <div key={index} className="px-4 py-3 text-sm">
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="shrink-0">
                            Linha {erro.linha}
                          </Badge>
                          <div>
                            <p className="font-medium">{erro.titulo}</p>
                            <p className="text-muted-foreground">{erro.motivo}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={resetForm}>
                  Importar outro arquivo
                </Button>
                <Button asChild>
                  <Link to="/admin/imoveis">Ver imóveis</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default ImportPage;
