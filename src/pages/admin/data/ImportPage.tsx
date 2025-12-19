import { useState, useRef } from "react";
import DataLayout from "./DataLayout";
import AdminHeader from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Download, Loader2, Info, DollarSign, FileText, ListChecks, FileDown, Search } from "lucide-react";
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

interface ValidationIssue {
  linha: number;
  titulo: string;
  problemas: string[];
}

interface ValidationResult {
  totalLinhas: number;
  linhasValidas: number;
  linhasComProblemas: number;
  colunasFaltando: string[];
  issues: ValidationIssue[];
  resumo: {
    semTitulo: number;
    semPermalink: number;
    precoInvalido: number;
    semCidade: number;
    numerosInvalidos: number;
  };
}

const REQUIRED_COLUMNS = ['Title', 'Permalink'];
const RECOMMENDED_COLUMNS = ['Content', 'Image URL', 'Estado e Cidade', 'Tipo do Imóvel', 'Finalidade', 'Preço'];

const ImportPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadSampleCSV = () => {
    const headers = [
      'Title',
      'Slug',
      'Permalink',
      'Content',
      'Estado e Cidade',
      'Bairro',
      'Rua',
      'CEP',
      'Latitude',
      'Longitude',
      'Tipo do Imóvel',
      'Finalidade',
      'Perfil',
      'Preço',
      'Condomínio',
      'Condomínio Isento',
      'IPTU',
      'Quartos',
      'Suítes',
      'Banheiros',
      'Vagas',
      'Área Total',
      'Área Construída',
      'Características',
      'Amenidades',
      'Destaque',
      'Financiamento',
      'Documentação',
      'Ativo',
      'Referência',
      'SEO Título',
      'SEO Descrição',
      'Image URL'
    ];

    const sampleRow = [
      'Casa moderna em condomínio fechado',
      'casa-moderna-condominio',
      'casa-moderna-condominio',
      'Excelente casa com 3 quartos, sendo 1 suíte, sala ampla, cozinha planejada e área gourmet.',
      'SP > São Paulo',
      'Jardim Europa',
      'Rua das Flores, 123',
      '01234-567',
      '-23.5505',
      '-46.6333',
      'Casa',
      'Venda',
      'residencial',
      '850000',
      '500',
      'Não',
      '3500',
      '3',
      '1',
      '2',
      '2',
      '250',
      '180',
      'Piscina; Churrasqueira; Jardim',
      'Academia; Playground; Salão de festas',
      'Destaque',
      'Sim',
      'regular',
      'Sim',
      'REF-001',
      'Casa moderna à venda em São Paulo',
      'Linda casa com 3 quartos em condomínio fechado no Jardim Europa',
      'https://exemplo.com/imagem1.jpg, https://exemplo.com/imagem2.jpg'
    ];

    const csvContent = [
      headers.join(','),
      sampleRow.map(value => {
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modelo_importacao_imoveis.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    toast.success('Modelo CSV baixado com sucesso!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error("Por favor, selecione um arquivo CSV");
        return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Limite máximo: 50MB");
        return;
      }
      setFile(selectedFile);
      setResult(null);
      setValidationResult(null);
      setError(null);
    }
  };

  const parseCSV = (text: string): { headers: string[]; rows: string[][] } => {
    const lines: string[] = [];
    let currentLine = '';
    let insideQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === '"') {
        if (insideQuotes && text[i + 1] === '"') {
          currentLine += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
        currentLine += char;
      } else if ((char === '\n' || char === '\r') && !insideQuotes) {
        if (currentLine.trim()) {
          lines.push(currentLine);
        }
        currentLine = '';
        if (char === '\r' && text[i + 1] === '\n') {
          i++;
        }
      } else {
        currentLine += char;
      }
    }
    
    if (currentLine.trim()) {
      lines.push(currentLine);
    }

    const parseRow = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result;
    };

    const headers = lines.length > 0 ? parseRow(lines[0]) : [];
    const rows = lines.slice(1).map(parseRow);
    
    return { headers, rows };
  };

  const handleValidate = async () => {
    if (!file) {
      toast.error("Selecione um arquivo CSV primeiro");
      return;
    }

    setValidating(true);
    setError(null);
    setValidationResult(null);

    try {
      const text = await file.text();
      const { headers, rows } = parseCSV(text);

      // Check missing required columns
      const colunasFaltando = REQUIRED_COLUMNS.filter(
        col => !headers.some(h => h.toLowerCase() === col.toLowerCase())
      );

      // Check missing recommended columns
      const colunasRecomendadasFaltando = RECOMMENDED_COLUMNS.filter(
        col => !headers.some(h => h.toLowerCase() === col.toLowerCase())
      );

      // Find column indices
      const getColIndex = (name: string) => 
        headers.findIndex(h => h.toLowerCase() === name.toLowerCase());

      const titleIdx = getColIndex('Title');
      const permalinkIdx = getColIndex('Permalink');
      const precoIdx = getColIndex('Preço');
      const cidadeIdx = getColIndex('Estado e Cidade');
      const quartosIdx = getColIndex('Quartos');
      const suitesIdx = getColIndex('Suítes');
      const banheirosIdx = getColIndex('Banheiros');
      const vagasIdx = getColIndex('Vagas');
      const areaIdx = getColIndex('Área Total');

      const issues: ValidationIssue[] = [];
      const resumo = {
        semTitulo: 0,
        semPermalink: 0,
        precoInvalido: 0,
        semCidade: 0,
        numerosInvalidos: 0,
      };

      rows.forEach((row, index) => {
        const problemas: string[] = [];
        
        // Helper to get value - handles "0" correctly
        const getValue = (idx: number): string => {
          if (idx < 0 || idx >= row.length) return '';
          const val = row[idx];
          if (val === null || val === undefined) return '';
          // Remove surrounding quotes but preserve the value
          return String(val).replace(/^"|"$/g, '');
        };
        
        // Helper to check if numeric value is valid (0 is valid, empty or NaN is not)
        const isValidNumber = (str: string): boolean => {
          if (str === '') return false; // Empty is not valid
          const cleaned = str.replace(/[^\d.,\-]/g, '').replace(',', '.');
          if (cleaned === '' || cleaned === '-') return false;
          const num = parseFloat(cleaned);
          return !isNaN(num) && num >= 0;
        };
        
        const titulo = getValue(titleIdx);
        
        // Check required fields
        if (titleIdx < 0 || !titulo) {
          problemas.push('Título ausente');
          resumo.semTitulo++;
        }
        
        const permalink = getValue(permalinkIdx);
        if (permalinkIdx < 0 || !permalink) {
          problemas.push('Permalink ausente');
          resumo.semPermalink++;
        }

        // Check price (0 is valid for "preço sob consulta", empty/invalid is a warning)
        if (precoIdx >= 0) {
          const precoStr = getValue(precoIdx);
          if (precoStr !== '' && precoStr !== '0' && precoStr !== '0.00' && precoStr !== '0,00') {
            const cleaned = precoStr.replace(/[^\d.,\-]/g, '').replace(',', '.');
            const preco = parseFloat(cleaned);
            if (isNaN(preco) || preco < 0) {
              problemas.push('Preço inválido');
              resumo.precoInvalido++;
            }
          }
          // "0" and empty are both valid (0 = sob consulta, empty = will try to extract from content)
        }

        // Check city
        if (cidadeIdx >= 0) {
          const cidade = getValue(cidadeIdx);
          if (!cidade) {
            problemas.push('Cidade ausente');
            resumo.semCidade++;
          }
        }

        // Check numeric fields - 0 is valid, only report if value exists but is invalid
        const numericFields = [
          { idx: quartosIdx, name: 'Quartos' },
          { idx: suitesIdx, name: 'Suítes' },
          { idx: banheirosIdx, name: 'Banheiros' },
          { idx: vagasIdx, name: 'Vagas' },
          { idx: areaIdx, name: 'Área' },
        ];

        numericFields.forEach(({ idx, name }) => {
          if (idx >= 0) {
            const valStr = getValue(idx);
            // Only validate if there's a value (empty is ok, will use defaults)
            if (valStr !== '' && !isValidNumber(valStr)) {
              problemas.push(`${name} inválido`);
              resumo.numerosInvalidos++;
            }
          }
        });

        if (problemas.length > 0) {
          issues.push({
            linha: index + 2, // +2 because of header and 0-index
            titulo: titulo || `Linha ${index + 2}`,
            problemas,
          });
        }
      });

      const validationData: ValidationResult = {
        totalLinhas: rows.length,
        linhasValidas: rows.length - issues.length,
        linhasComProblemas: issues.length,
        colunasFaltando: [...colunasFaltando, ...colunasRecomendadasFaltando.map(c => `${c} (recomendado)`)],
        issues,
        resumo,
      };

      setValidationResult(validationData);

      if (issues.length === 0 && colunasFaltando.length === 0) {
        toast.success('CSV validado com sucesso! Todas as linhas estão corretas.');
      } else if (colunasFaltando.length > 0) {
        toast.error(`Colunas obrigatórias faltando: ${colunasFaltando.join(', ')}`);
      } else {
        toast.warning(`${issues.length} linha(s) com problemas encontradas.`);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao validar arquivo';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setValidating(false);
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

      if (data.success && data.jobId) {
        setResult({
          total_linhas: data.totalRows,
          imoveis_criados: 0,
          imoveis_atualizados: 0,
          imagens_importadas: 0,
          erros: []
        });
        toast.success(
          `Importação de ${data.totalRows} imóveis iniciada! Você pode navegar para outras páginas - o processo continua em segundo plano.`,
          { duration: 8000 }
        );
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
    setValidationResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <DataLayout>
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
            
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button variant="secondary" onClick={downloadSampleCSV} className="flex-1">
                <FileDown className="mr-2 h-4 w-4" />
                Baixar modelo CSV
              </Button>
            </div>
            
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
                variant="outline"
                onClick={handleValidate} 
                disabled={!file || validating || importing}
                className="flex-1"
              >
                {validating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Validar CSV
                  </>
                )}
              </Button>
              <Button 
                variant="admin"
                onClick={handleImport} 
                disabled={!file || importing || validating}
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

        {/* Validation Results Card */}
        {validationResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {validationResult.linhasComProblemas === 0 && validationResult.colunasFaltando.filter(c => !c.includes('recomendado')).length === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
                Resultado da validação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Validation Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">{validationResult.totalLinhas}</p>
                  <p className="text-sm text-muted-foreground">Total de linhas</p>
                </div>
                <div className="bg-green-500/10 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{validationResult.linhasValidas}</p>
                  <p className="text-sm text-muted-foreground">Linhas válidas</p>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{validationResult.linhasComProblemas}</p>
                  <p className="text-sm text-muted-foreground">Linhas com problemas</p>
                </div>
              </div>

              {/* Missing Columns */}
              {validationResult.colunasFaltando.length > 0 && (
                <div className="border border-yellow-500/30 rounded-lg overflow-hidden">
                  <div className="bg-yellow-500/10 px-4 py-2 font-medium text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    Colunas não encontradas ({validationResult.colunasFaltando.length})
                  </div>
                  <div className="px-4 py-3 flex flex-wrap gap-2">
                    {validationResult.colunasFaltando.map((col, idx) => (
                      <Badge 
                        key={idx} 
                        variant={col.includes('recomendado') ? 'outline' : 'destructive'}
                        className={col.includes('recomendado') ? 'border-yellow-500/50 text-yellow-600' : ''}
                      >
                        {col}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Issues Summary */}
              {(validationResult.resumo.semTitulo > 0 || validationResult.resumo.semPermalink > 0 || 
                validationResult.resumo.precoInvalido > 0 || validationResult.resumo.semCidade > 0 ||
                validationResult.resumo.numerosInvalidos > 0) && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {validationResult.resumo.semTitulo > 0 && (
                    <div className="bg-destructive/10 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-destructive">{validationResult.resumo.semTitulo}</p>
                      <p className="text-xs text-muted-foreground">Sem título</p>
                    </div>
                  )}
                  {validationResult.resumo.semPermalink > 0 && (
                    <div className="bg-destructive/10 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-destructive">{validationResult.resumo.semPermalink}</p>
                      <p className="text-xs text-muted-foreground">Sem permalink</p>
                    </div>
                  )}
                  {validationResult.resumo.precoInvalido > 0 && (
                    <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-yellow-600">{validationResult.resumo.precoInvalido}</p>
                      <p className="text-xs text-muted-foreground">Preço inválido</p>
                    </div>
                  )}
                  {validationResult.resumo.semCidade > 0 && (
                    <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-yellow-600">{validationResult.resumo.semCidade}</p>
                      <p className="text-xs text-muted-foreground">Sem cidade</p>
                    </div>
                  )}
                  {validationResult.resumo.numerosInvalidos > 0 && (
                    <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-yellow-600">{validationResult.resumo.numerosInvalidos}</p>
                      <p className="text-xs text-muted-foreground">Números inválidos</p>
                    </div>
                  )}
                </div>
              )}

              {/* Success message */}
              {validationResult.linhasComProblemas === 0 && validationResult.colunasFaltando.filter(c => !c.includes('recomendado')).length === 0 ? (
                <Alert className="bg-green-500/10 border-green-500">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-600">CSV validado com sucesso!</AlertTitle>
                  <AlertDescription>
                    Todas as {validationResult.totalLinhas} linhas estão corretas. Você pode prosseguir com a importação.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/5">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-600">Atenção: problemas encontrados</AlertTitle>
                  <AlertDescription>
                    Corrija os problemas acima antes de importar para melhores resultados. 
                    A importação ainda funcionará, mas alguns dados podem ficar incompletos.
                  </AlertDescription>
                </Alert>
              )}

              {/* Issues List */}
              {validationResult.issues.length > 0 && (
                <div className="border border-yellow-500/30 rounded-lg overflow-hidden">
                  <div className="bg-yellow-500/10 px-4 py-2 font-medium text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    Linhas com problemas ({validationResult.issues.length})
                  </div>
                  <div className="divide-y max-h-64 overflow-y-auto">
                    {validationResult.issues.slice(0, 50).map((issue, index) => (
                      <div key={index} className="px-4 py-3 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                Linha {issue.linha}
                              </Badge>
                              <span className="font-medium truncate">{issue.titulo}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 justify-end">
                            {issue.problemas.map((problema, i) => (
                              <Badge key={i} variant="outline" className="text-xs border-yellow-500/50 text-yellow-600">
                                {problema}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    {validationResult.issues.length > 50 && (
                      <div className="px-4 py-3 text-sm text-center text-muted-foreground">
                        ... e mais {validationResult.issues.length - 50} linha(s) com problemas
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setValidationResult(null)}>
                  Fechar validação
                </Button>
                <Button 
                  variant="admin" 
                  onClick={handleImport}
                  disabled={importing || validationResult.colunasFaltando.filter(c => !c.includes('recomendado')).length > 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Importar mesmo assim
                </Button>
              </div>
            </CardContent>
          </Card>
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

              {/* Problem Properties */}
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

              {/* Error List */}
              {result.erros.length > 0 && (
                <div className="border border-destructive/30 rounded-lg overflow-hidden">
                  <div className="bg-destructive/10 px-4 py-2 font-medium text-sm">
                    Erros encontrados ({result.erros.length})
                  </div>
                  <div className="divide-y max-h-64 overflow-y-auto">
                    {result.erros.map((erro, index) => (
                      <div key={index} className="px-4 py-3 text-sm">
                        <div className="flex items-start gap-2">
                          <Badge variant="destructive" className="text-xs">
                            Linha {erro.linha}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{erro.titulo}</p>
                            <p className="text-muted-foreground text-xs">{erro.motivo}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={resetForm}>
                  Importar outro arquivo
                </Button>
                <Button variant="admin" asChild>
                  <Link to="/admin/imoveis">Ver imóveis</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DataLayout>
  );
};

export default ImportPage;
