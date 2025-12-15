import { useState, useRef } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminHeader from "@/components/admin/AdminHeader";
import ImportProgressBar from "@/components/admin/ImportProgressBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Download, Loader2, Info, DollarSign, FileText, ListChecks } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface ImportStats {
  withPrice: number;
  withDescription: number;
  withSpecs: number;
  totalProcessed: number;
  imagensImportadas?: number;
}

interface ProblemProperty {
  title: string;
  permalink: string;
  issues: string[];
}

interface ImportResult {
  total_linhas: number;
  imoveis_criados: number;
  imoveis_atualizados: number;
  imagens_importadas: number;
  erros: Array<{ linha: number; titulo: string; motivo: string }>;
  stats?: ImportStats;
  problemProperties?: ProblemProperty[];
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

      // Check if it's a background processing response
      if (data.success && data.jobId) {
        setResult({
          total_linhas: data.totalRows,
          imoveis_criados: 0,
          imoveis_atualizados: 0,
          imagens_importadas: 0,
          erros: []
        });
        toast.success(`Importação de ${data.totalRows} imóveis iniciada em segundo plano!`);
      } else {
        setResult(data);
        
        if (data.erros?.length === 0) {
          toast.success(`Importação concluída! ${data.imoveis_criados} criados, ${data.imoveis_atualizados} atualizados.`);
        } else {
          toast.warning(`Importação concluída com ${data.erros.length} erros.`);
        }
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
        {/* Import Progress Bar - shows real-time stats */}
        <ImportProgressBar />
        
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
                <strong className="text-foreground">Colunas suportadas:</strong>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="text-xs font-medium text-foreground">Obrigatórias:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="secondary">Title</Badge>
                      <Badge variant="secondary">Permalink</Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-foreground">Opcionais (recomendadas):</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline">Content</Badge>
                      <Badge variant="outline">Image URL</Badge>
                      <Badge variant="outline">Estado e Cidade</Badge>
                      <Badge variant="outline">Tipo do Imóvel</Badge>
                      <Badge variant="outline">Finalidade</Badge>
                      <Badge variant="outline">Destaque</Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-foreground">Preço e Especificações:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline" className="border-primary text-primary">Preço</Badge>
                      <Badge variant="outline">Quartos</Badge>
                      <Badge variant="outline">Suítes</Badge>
                      <Badge variant="outline">Banheiros</Badge>
                      <Badge variant="outline">Vagas</Badge>
                      <Badge variant="outline">Área</Badge>
                      <Badge variant="outline">Área Construída</Badge>
                    </div>
                  </div>
                </div>
              </li>
              <li>
                <strong className="text-foreground">Extração automática do Content:</strong>
                <p className="mt-1 text-xs">
                  Se não houver colunas específicas, o sistema extrai automaticamente do campo Content:
                </p>
                <ul className="mt-1 text-xs list-disc list-inside ml-4 space-y-0.5">
                  <li><strong>Preço:</strong> R$ 480.000,00 ou "Valor: R$ 480.000"</li>
                  <li><strong>Quartos:</strong> "3 quartos", "quartos: 3"</li>
                  <li><strong>Suítes:</strong> "2 suítes", "suítes: 2"</li>
                  <li><strong>Banheiros:</strong> "2 banheiros"</li>
                  <li><strong>Vagas:</strong> "2 vagas", "garagem: 2"</li>
                  <li><strong>Área:</strong> "Área total: 1.000 m²", "1000m2"</li>
                </ul>
              </li>
              <li>
                <strong className="text-foreground">Faça upload do arquivo</strong> e clique em "Importar imóveis".
              </li>
            </ol>
            
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Atualização automática</AlertTitle>
              <AlertDescription>
                Se um imóvel com o mesmo slug ou URL já existir, ele será atualizado em vez de duplicado.
                A descrição do Content é limpa de HTML e formatada automaticamente.
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
              {/* Main Stats */}
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

              {/* Data Quality Stats */}
              {result.stats && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="p-2 bg-green-500/20 rounded-full">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{result.stats.withPrice}</p>
                      <p className="text-xs text-muted-foreground">Com preço</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="p-2 bg-blue-500/20 rounded-full">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{result.stats.withDescription}</p>
                      <p className="text-xs text-muted-foreground">Com descrição</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="p-2 bg-purple-500/20 rounded-full">
                      <ListChecks className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{result.stats.withSpecs}</p>
                      <p className="text-xs text-muted-foreground">Com especificações</p>
                    </div>
                  </div>
                </div>
              )}

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

              {/* Problem Properties (imported but with missing data) */}
              {result.problemProperties && result.problemProperties.length > 0 && (
                <div className="border border-yellow-500/30 rounded-lg overflow-hidden">
                  <div className="bg-yellow-500/10 px-4 py-2 font-medium text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    Imóveis com dados incompletos ({result.problemProperties.length})
                  </div>
                  <div className="divide-y max-h-64 overflow-y-auto">
                    {result.problemProperties.map((prop, index) => (
                      <div key={index} className="px-4 py-3 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{prop.title}</p>
                            {prop.permalink && (
                              <p className="text-xs text-muted-foreground truncate">{prop.permalink}</p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 justify-end">
                            {prop.issues.map((issue, i) => (
                              <Badge key={i} variant="outline" className="text-xs border-yellow-500/50 text-yellow-600">
                                {issue}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors list */}
              {result.erros.length > 0 && (
                <div className="border border-destructive/30 rounded-lg overflow-hidden">
                  <div className="bg-destructive/10 px-4 py-2 font-medium text-sm flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    Erros encontrados ({result.erros.length})
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
