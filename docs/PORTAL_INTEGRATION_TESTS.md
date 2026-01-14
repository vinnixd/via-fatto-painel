# Testes de Integração de Portais - Guia Completo

## Sumário
1. [Testes Automatizados](#testes-automatizados)
2. [Checklist Manual](#checklist-manual)
3. [Logs e Diagnóstico](#logs-e-diagnóstico)
4. [Causas Comuns de Falha](#causas-comuns-de-falha)

---

## Testes Automatizados

### 1. Criar e Processar Jobs

#### Via Console (Browser)

```javascript
// 1. Criar um job de teste
const { data: job, error } = await supabase
  .from('portal_jobs')
  .insert({
    portal_id: 'SEU_PORTAL_ID', // UUID do portal OLX
    imovel_id: 'SEU_IMOVEL_ID', // UUID de um imóvel de teste
    action: 'publish',
    status: 'queued',
    next_run_at: new Date().toISOString()
  })
  .select()
  .single();

console.log('Job criado:', job);
```

#### Via Edge Function (Manual Trigger)

```bash
# Processar fila de jobs
curl -X POST https://lwxrneoeoqzlekusqgml.supabase.co/functions/v1/portal-push/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ANON_KEY"
```

### 2. Testar Retry/Backoff

```javascript
// Criar job com attempts para testar retry
const { data } = await supabase
  .from('portal_jobs')
  .insert({
    portal_id: 'PORTAL_ID',
    imovel_id: 'IMOVEL_ID',
    action: 'publish',
    status: 'queued',
    attempts: 2, // Já teve 2 tentativas
    max_attempts: 5,
    next_run_at: new Date().toISOString()
  })
  .select()
  .single();

// O próximo run deve incrementar attempts e aplicar backoff exponencial
// next_run_at = now + 2^attempts minutos
```

### 3. Verificar Segurança de Logs

**O que NÃO deve aparecer nos logs:**
- `access_token`
- `refresh_token`
- `client_secret`

**Como verificar:**

1. Abrir Console do Supabase → Edge Function Logs
2. Buscar por "portal-push" ou "portal-test"
3. Verificar que tokens não aparecem em nenhuma mensagem

**Logs seguros (esperado):**
```
[OLX] Testing connection...
[OLX] Connection test successful
[OLX] Publishing property: abc123-def456
[OLX] Publishing ad with category: 1020
```

**Logs INSEGUROS (não deve acontecer):**
```
[OLX] Token: eyJhbGciOiJIUzI1NiIs...  ❌ ERRADO
[OLX] Credentials: { access_token: "..." }  ❌ ERRADO
```

---

## Checklist Manual

### Pré-requisitos
- [ ] Conta OLX Pro ativa
- [ ] Client ID e Client Secret da API OLX
- [ ] Access Token obtido via OAuth2
- [ ] Pelo menos 1 imóvel cadastrado com:
  - [ ] CEP válido
  - [ ] Pelo menos 1 foto
  - [ ] Preço definido
  - [ ] Título e descrição

### Etapa 1: Configurar Credenciais

1. [ ] Acessar **Admin → Portais → OLX → Configurar**
2. [ ] Ir na aba **Conexão**
3. [ ] Preencher campos:
   - [ ] Client ID
   - [ ] Client Secret  
   - [ ] Access Token
   - [ ] (Opcional) Refresh Token
   - [ ] Telefone para contato
4. [ ] Clicar **Salvar Configurações**
5. [ ] Verificar toast de sucesso

**Logs esperados:** Nenhum (apenas salvou no banco)

### Etapa 2: Testar Conexão

1. [ ] Clicar **Testar Conexão**
2. [ ] Aguardar resposta (até 10s)
3. [ ] Verificar resultado:
   - ✅ **Sucesso:** "Conexão estabelecida com sucesso"
   - ❌ **Erro comum:** "Token inválido ou expirado"

**Logs a verificar:**
```
Portal test for olx: X properties, Y warnings, API: true
[OLX] Testing connection...
[OLX] Connection test successful
```

### Etapa 3: Publicar Imóvel

1. [ ] Ir na aba **Publicações**
2. [ ] Localizar imóvel de teste
3. [ ] Verificar status atual (deve ser "Pendente" ou sem status)
4. [ ] Clicar **Publicar**
5. [ ] Verificar toast "Job de publicação criado"
6. [ ] Clicar **Processar Fila Agora**
7. [ ] Aguardar processamento (5-30s)
8. [ ] Atualizar página
9. [ ] Verificar status mudou para **Publicado**
10. [ ] Verificar `external_id` preenchido

**Logs esperados:**
```
[portal-push] Processing 1 jobs
[OLX] Publishing property: UUID_DO_IMOVEL
[OLX] Publishing ad with category: 1020
[OLX] Import response: { statusCode: 0, statusMessage: "Ads in queue..." }
[OLX] Published successfully. Token: abc123
```

**Consulta SQL para verificar:**
```sql
SELECT 
  pp.status,
  pp.external_id,
  pp.payload_snapshot->'subject' as titulo,
  pp.updated_at
FROM portal_publicacoes pp
WHERE pp.imovel_id = 'UUID_DO_IMOVEL'
  AND pp.portal_id = 'UUID_PORTAL_OLX';
```

### Etapa 4: Atualizar Imóvel

1. [ ] Editar o imóvel (mudar preço ou descrição)
2. [ ] Voltar para Portais → OLX → Publicações
3. [ ] Clicar **Atualizar** no imóvel modificado
4. [ ] Processar fila
5. [ ] Verificar status permanece **Publicado**
6. [ ] Verificar `updated_at` foi atualizado

**Logs esperados:**
```
[OLX] Updating property: UUID_DO_IMOVEL
[OLX] Import response: { statusCode: 0... }
```

### Etapa 5: Remover Anúncio

1. [ ] Clicar **Remover** no imóvel
2. [ ] Processar fila
3. [ ] Verificar status mudou para **Desativado**

**Logs esperados:**
```
[OLX] Removing ad: EXTERNAL_ID
[OLX] Remove successful
```

---

## Logs e Diagnóstico

### Onde Ver os Logs

**1. Console do Navegador (Frontend)**
- Abrir DevTools (F12)
- Aba Console
- Filtrar por "portal" ou "OLX"

**2. Edge Function Logs**
- Via Lovable: Verificar contexto de edge functions
- Logs automáticos aparecem após cada chamada

**3. Tabela portal_logs**
```sql
SELECT 
  pl.id,
  pl.status,
  pl.total_itens,
  pl.tempo_geracao_ms,
  pl.detalhes->'error' as erro,
  pl.detalhes->'action' as acao,
  pl.created_at
FROM portal_logs pl
WHERE pl.portal_id = 'UUID_PORTAL_OLX'
ORDER BY pl.created_at DESC
LIMIT 10;
```

**4. Tabela portal_jobs (histórico de processamento)**
```sql
SELECT 
  pj.id,
  pj.action,
  pj.status,
  pj.attempts,
  pj.last_error,
  pj.next_run_at,
  pj.updated_at
FROM portal_jobs pj
WHERE pj.portal_id = 'UUID_PORTAL_OLX'
ORDER BY pj.created_at DESC
LIMIT 20;
```

---

## Causas Comuns de Falha

### 1. Token Inválido/Expirado

**Sintoma:**
```
Error: Token inválido ou expirado. Autorize novamente via OAuth.
```

**Causa:** Access token expirou (duram ~1 hora)

**Solução:**
1. Obter novo access_token via refresh_token
2. Ou refazer fluxo OAuth completo
3. Atualizar campo Access Token na configuração

---

### 2. Imóvel Sem CEP

**Sintoma:**
```
Error: CEP é obrigatório para OLX
```

**Causa:** Campo `address_zipcode` vazio no imóvel

**Solução:**
1. Editar imóvel
2. Preencher CEP válido (formato: 00000-000)
3. Salvar e tentar novamente

---

### 3. Imóvel Sem Fotos

**Sintoma:**
```
Error: Pelo menos 1 imagem é obrigatória para OLX
```

**Causa:** Nenhuma foto cadastrada

**Solução:**
1. Adicionar pelo menos 1 foto ao imóvel
2. Preferencialmente 5-20 fotos de boa qualidade

---

### 4. Rate Limit (429)

**Sintoma:**
```
[OLX] Rate limited. Waiting 60s before retry 1/3
```

**Causa:** Muitas requisições em pouco tempo (limite: 5000/min)

**Solução:**
- Aguardar automaticamente (backoff exponencial)
- O sistema faz até 3 retentativas
- Se persistir, aguardar 10 minutos

---

### 5. Categoria Inválida

**Sintoma:**
```
OLX returned errors: [{ "category": "invalid_category" }]
```

**Causa:** Tipo de imóvel não mapeado corretamente

**Solução:**
- Verificar se tipo do imóvel está entre os suportados:
  - apartamento, casa, cobertura, flat, loft, terreno, comercial, galpao, rural

---

### 6. Credenciais Não Configuradas

**Sintoma:**
```
Error: Missing OLX access_token
```

**Causa:** Campo access_token vazio na configuração

**Solução:**
1. Ir em Portais → OLX → Conexão
2. Preencher todos os campos obrigatórios
3. Salvar

---

### 7. Job Travado em "Processing"

**Sintoma:** Job nunca sai de status "processing"

**Causa:** Edge function travou ou foi interrompida

**Solução:**
```sql
-- Resetar jobs travados há mais de 5 minutos
UPDATE portal_jobs
SET 
  status = 'queued',
  next_run_at = NOW()
WHERE 
  status = 'processing'
  AND updated_at < NOW() - INTERVAL '5 minutes';
```

---

### 8. Payload Muito Grande

**Sintoma:**
```
Request body too large
```

**Causa:** Descrição ou muitas imagens

**Solução:**
- Descrição: máximo 6000 caracteres
- Imagens: máximo 20 fotos
- Título: máximo 90 caracteres

---

## Mensagens de Erro Amigáveis

| Código Técnico | Mensagem para Usuário |
|---------------|----------------------|
| `Missing OLX access_token` | Configure o Token de Acesso nas credenciais do portal |
| `Token inválido ou expirado` | Sua autorização expirou. Clique em "Autorizar" para renovar |
| `CEP é obrigatório` | Este imóvel precisa ter CEP cadastrado para ser publicado na OLX |
| `1 imagem é obrigatória` | Adicione pelo menos uma foto ao imóvel |
| `Rate limited` | Muitas requisições. O sistema tentará novamente em alguns minutos |
| `Portal not configured` | Configure as credenciais da OLX antes de publicar |
| `Property not found` | O imóvel foi removido ou não existe mais |
| `Network error` | Erro de conexão. Verifique sua internet e tente novamente |

---

## Script de Teste Completo

```javascript
// Executar no console do navegador após login no admin

async function runPortalTests() {
  const supabase = window.supabase; // Assumindo que está disponível
  
  console.log('=== INICIANDO TESTES DE PORTAL ===\n');
  
  // 1. Buscar portal OLX
  console.log('1. Buscando portal OLX...');
  const { data: portal } = await supabase
    .from('portais')
    .select('*')
    .eq('slug', 'olx')
    .single();
  
  if (!portal) {
    console.error('❌ Portal OLX não encontrado!');
    return;
  }
  console.log('✅ Portal encontrado:', portal.id);
  
  // 2. Verificar credenciais (sem expor valores)
  console.log('\n2. Verificando credenciais...');
  const creds = portal.config?.api_credentials || {};
  const hasClientId = !!creds.client_id;
  const hasClientSecret = !!creds.client_secret;
  const hasAccessToken = !!creds.access_token;
  
  console.log('   Client ID:', hasClientId ? '✅ Configurado' : '❌ Faltando');
  console.log('   Client Secret:', hasClientSecret ? '✅ Configurado' : '❌ Faltando');
  console.log('   Access Token:', hasAccessToken ? '✅ Configurado' : '❌ Faltando');
  
  if (!hasAccessToken) {
    console.error('❌ Configure o Access Token antes de continuar');
    return;
  }
  
  // 3. Testar conexão
  console.log('\n3. Testando conexão com OLX...');
  const testResponse = await fetch(
    `${window.location.origin.replace('localhost:8080', 'lwxrneoeoqzlekusqgml.supabase.co')}/functions/v1/portal-test`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ portalId: portal.id })
    }
  );
  const testResult = await testResponse.json();
  
  if (testResult.apiConnection?.ok) {
    console.log('✅ Conexão OK!', testResult.apiConnection.accountInfo);
  } else {
    console.error('❌ Falha na conexão:', testResult.apiConnection?.error);
  }
  
  // 4. Verificar imóveis disponíveis
  console.log('\n4. Verificando imóveis disponíveis...');
  console.log('   Total:', testResult.totalItems);
  console.log('   Warnings:', testResult.warnings);
  
  // 5. Verificar jobs pendentes
  console.log('\n5. Verificando jobs na fila...');
  const { data: jobs } = await supabase
    .from('portal_jobs')
    .select('*')
    .eq('portal_id', portal.id)
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log('   Jobs recentes:', jobs?.length || 0);
  jobs?.forEach(j => {
    console.log(`   - ${j.action}: ${j.status} (tentativas: ${j.attempts})`);
  });
  
  // 6. Verificar publicações
  console.log('\n6. Verificando publicações...');
  const { data: pubs } = await supabase
    .from('portal_publicacoes')
    .select('status, external_id')
    .eq('portal_id', portal.id);
  
  const statusCount = {};
  pubs?.forEach(p => {
    statusCount[p.status] = (statusCount[p.status] || 0) + 1;
  });
  console.log('   Por status:', statusCount);
  
  console.log('\n=== TESTES CONCLUÍDOS ===');
}

runPortalTests();
```

---

## Executando Testes

### No Navegador
1. Fazer login no admin
2. Abrir DevTools (F12)
3. Colar o script acima no Console
4. Pressionar Enter

### Via API
```bash
# Health check
curl https://lwxrneoeoqzlekusqgml.supabase.co/functions/v1/portal-push/health

# Processar jobs manualmente
curl -X POST https://lwxrneoeoqzlekusqgml.supabase.co/functions/v1/portal-push/run \
  -H "Content-Type: application/json"
```

### SQL Queries de Diagnóstico

```sql
-- Ver últimos 10 jobs com detalhes
SELECT 
  j.id,
  j.action,
  j.status,
  j.attempts,
  j.last_error,
  p.title as imovel,
  por.nome as portal
FROM portal_jobs j
JOIN properties p ON p.id = j.imovel_id
JOIN portais por ON por.id = j.portal_id
ORDER BY j.created_at DESC
LIMIT 10;

-- Ver logs de erro recentes
SELECT 
  l.created_at,
  l.status,
  l.detalhes->>'error' as erro,
  l.detalhes->>'action' as acao,
  por.nome as portal
FROM portal_logs l
JOIN portais por ON por.id = l.portal_id
WHERE l.status = 'error'
ORDER BY l.created_at DESC
LIMIT 10;
```
