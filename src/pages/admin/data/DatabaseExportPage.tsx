import { useState } from "react";
import DataLayout from "./DataLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Download, Database, Loader2, CheckCircle2, Info, FileJson, Table2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Tables to export with their display names
const EXPORTABLE_TABLES = [
  { name: 'tenants', label: 'Tenants (Inquilinos)', description: 'Configuração multi-tenant' },
  { name: 'tenant_users', label: 'Tenant Users', description: 'Usuários por tenant' },
  { name: 'domains', label: 'Domains', description: 'Domínios configurados' },
  { name: 'profiles', label: 'Profiles', description: 'Perfis de usuários' },
  { name: 'user_roles', label: 'User Roles', description: 'Papéis de usuários' },
  { name: 'site_config', label: 'Site Config', description: 'Configurações do site' },
  { name: 'properties', label: 'Properties', description: 'Imóveis cadastrados' },
  { name: 'property_images', label: 'Property Images', description: 'Imagens dos imóveis' },
  { name: 'categories', label: 'Categories', description: 'Categorias de imóveis' },
  { name: 'contacts', label: 'Contacts', description: 'Mensagens de contato' },
  { name: 'favorites', label: 'Favorites', description: 'Favoritos dos usuários' },
  { name: 'page_views', label: 'Page Views', description: 'Visualizações de páginas' },
  { name: 'portais', label: 'Portais', description: 'Portais de integração' },
  { name: 'portal_logs', label: 'Portal Logs', description: 'Logs dos portais' },
  { name: 'portal_publicacoes', label: 'Portal Publicações', description: 'Publicações em portais' },
  { name: 'portal_jobs', label: 'Portal Jobs', description: 'Jobs de sincronização' },
  { name: 'subscription_plans', label: 'Subscription Plans', description: 'Planos de assinatura' },
  { name: 'subscriptions', label: 'Subscriptions', description: 'Assinaturas ativas' },
  { name: 'invoices', label: 'Invoices', description: 'Faturas' },
  { name: 'invites', label: 'Invites', description: 'Convites pendentes' },
  { name: 'import_jobs', label: 'Import Jobs', description: 'Jobs de importação' },
  { name: 'role_permissions', label: 'Role Permissions', description: 'Permissões por papel' },
];

interface ExportResult {
  table: string;
  count: number;
  data: any[];
  error?: string;
}

const DatabaseExportPage = () => {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTable, setCurrentTable] = useState('');
  const [selectedTables, setSelectedTables] = useState<string[]>(
    EXPORTABLE_TABLES.map(t => t.name)
  );

  const toggleTable = (tableName: string) => {
    setSelectedTables(prev => 
      prev.includes(tableName) 
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const selectAll = () => {
    setSelectedTables(EXPORTABLE_TABLES.map(t => t.name));
  };

  const selectNone = () => {
    setSelectedTables([]);
  };

  const exportTable = async (tableName: string): Promise<ExportResult> => {
    try {
      // Use type assertion to handle dynamic table names
      const { data, error } = await (supabase
        .from(tableName as any)
        .select('*') as any);

      if (error) {
        console.error(`Error exporting ${tableName}:`, error);
        return { table: tableName, count: 0, data: [], error: error.message };
      }

      return { table: tableName, count: data?.length || 0, data: data || [] };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { table: tableName, count: 0, data: [], error: errorMessage };
    }
  };

  const handleExport = async () => {
    if (selectedTables.length === 0) {
      toast.error("Selecione pelo menos uma tabela para exportar");
      return;
    }

    setExporting(true);
    setProgress(0);

    const results: ExportResult[] = [];
    const totalTables = selectedTables.length;

    try {
      for (let i = 0; i < selectedTables.length; i++) {
        const tableName = selectedTables[i];
        setCurrentTable(tableName);
        setProgress(((i + 1) / totalTables) * 100);

        const result = await exportTable(tableName);
        results.push(result);
      }

      // Prepare export data
      const exportData = {
        exportedAt: new Date().toISOString(),
        sourceProject: 'via-fatto-painel',
        supabaseProjectId: 'mpsusvpdjuqvjgdsvwpp',
        tables: results.reduce((acc, result) => {
          acc[result.table] = {
            count: result.count,
            data: result.data,
            error: result.error || null
          };
          return acc;
        }, {} as Record<string, any>),
        summary: {
          totalTables: results.length,
          successfulTables: results.filter(r => !r.error).length,
          totalRecords: results.reduce((sum, r) => sum + r.count, 0),
          errors: results.filter(r => r.error).map(r => ({ table: r.table, error: r.error }))
        }
      };

      // Generate and download JSON file
      const fileContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([fileContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `database_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      const successCount = results.filter(r => !r.error).length;
      const totalRecords = results.reduce((sum, r) => sum + r.count, 0);
      
      toast.success(
        `Exportação concluída! ${successCount}/${results.length} tabelas, ${totalRecords} registros`
      );

      if (results.some(r => r.error)) {
        toast.warning("Algumas tabelas não puderam ser exportadas (verifique permissões RLS)");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao exportar: ${errorMessage}`);
    } finally {
      setExporting(false);
      setProgress(0);
      setCurrentTable('');
    }
  };

  return (
    <DataLayout>
      <div className="space-y-6">
        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Exportar Banco de Dados Completo
            </CardTitle>
            <CardDescription>
              Exporte todas as tabelas do banco de dados para migração para Supabase externo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Como usar este export</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  1. Selecione as tabelas que deseja exportar
                </p>
                <p>
                  2. Clique em "Exportar Banco de Dados" para baixar o JSON
                </p>
                <p>
                  3. No Supabase externo, use o SQL Editor para importar os dados
                </p>
                <p className="text-muted-foreground text-xs mt-2">
                  Nota: A estrutura das tabelas (schema) já existe no Supabase externo mpsusvpdjuqvjgdsvwpp.
                  Este export contém apenas os DADOS.
                </p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Table Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table2 className="h-5 w-5" />
              Selecionar Tabelas
            </CardTitle>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Selecionar Todas
              </Button>
              <Button variant="outline" size="sm" onClick={selectNone}>
                Limpar Seleção
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {EXPORTABLE_TABLES.map((table) => (
                <div 
                  key={table.name}
                  className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox 
                    id={table.name}
                    checked={selectedTables.includes(table.name)}
                    onCheckedChange={() => toggleTable(table.name)}
                    disabled={exporting}
                  />
                  <div className="flex-1">
                    <Label 
                      htmlFor={table.name} 
                      className="cursor-pointer font-medium text-sm"
                    >
                      {table.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {table.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Badge variant="secondary">
                {selectedTables.length} tabelas selecionadas
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Export Progress Card */}
        {exporting && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">
                    Exportando: <strong>{currentTable}</strong>
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {Math.round(progress)}% concluído
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Export Button Card */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              variant="admin"
              onClick={handleExport} 
              disabled={exporting || selectedTables.length === 0}
              className="w-full"
              size="lg"
            >
              {exporting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <FileJson className="mr-2 h-5 w-5" />
                  Exportar Banco de Dados ({selectedTables.length} tabelas)
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Import Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Instruções de Importação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">No Supabase Externo (SQL Editor):</h4>
              <pre className="text-xs overflow-x-auto bg-background p-3 rounded border">
{`-- Exemplo de importação para tabela 'properties'
-- Após fazer parse do JSON exportado:

INSERT INTO properties (id, title, slug, ...)
SELECT 
  (value->>'id')::uuid,
  value->>'title',
  value->>'slug',
  ...
FROM json_array_elements('[... dados do JSON ...]');

-- Ou use um script Node.js/Python para 
-- inserir os dados via Supabase SDK`}
              </pre>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Script de Importação (Node.js):</h4>
              <pre className="text-xs overflow-x-auto bg-background p-3 rounded border">
{`const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://mpsusvpdjuqvjgdsvwpp.supabase.co',
  'SUA_SERVICE_ROLE_KEY' // Use service role para bypass RLS
);

const exportData = JSON.parse(
  fs.readFileSync('database_export_YYYY-MM-DD.json')
);

async function importTable(tableName, data) {
  const { error } = await supabase
    .from(tableName)
    .upsert(data, { onConflict: 'id' });
  
  if (error) console.error(tableName, error);
  else console.log(\`Imported \${data.length} rows to \${tableName}\`);
}

// Importar na ordem correta (dependências primeiro)
const importOrder = [
  'tenants', 'profiles', 'user_roles', 'tenant_users',
  'domains', 'site_config', 'categories', 'properties',
  'property_images', 'contacts', 'favorites', 'page_views',
  'portais', 'portal_logs', 'portal_publicacoes', 'portal_jobs',
  'subscription_plans', 'subscriptions', 'invoices', 'invites',
  'import_jobs', 'role_permissions'
];

for (const table of importOrder) {
  if (exportData.tables[table]?.data?.length > 0) {
    await importTable(table, exportData.tables[table].data);
  }
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </DataLayout>
  );
};

export default DatabaseExportPage;
