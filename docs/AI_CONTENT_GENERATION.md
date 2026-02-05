# Guia de Geração de Conteúdo com IA

Este documento descreve a estrutura completa de geração de conteúdo com IA para anúncios imobiliários no projeto Via Fatto Painel.

## Índice

1. [Visão Geral](#visão-geral)
2. [Configuração](#configuração)
3. [Edge Functions](#edge-functions)
4. [Prompts Detalhados](#prompts-detalhados)
5. [Payloads e Respostas](#payloads-e-respostas)
6. [Tratamento de Erros](#tratamento-de-erros)
7. [Como Replicar](#como-replicar)

---

## Visão Geral

O sistema utiliza o **Lovable AI Gateway** para gerar:
- **Títulos** otimizados para conversão
- **Descrições** estruturadas com formato padronizado
- **SEO** (meta title e meta description) para melhor ranqueamento

### Stack Tecnológica

| Componente | Tecnologia |
|------------|------------|
| AI Gateway | `https://ai.gateway.lovable.dev/v1/chat/completions` |
| Modelo | `google/gemini-3-flash-preview` |
| Backend | Supabase Edge Functions (Deno) |
| Autenticação | `LOVABLE_API_KEY` (automático no Lovable Cloud) |

---

## Configuração

### Secrets Necessários

```bash
# Automáticos no Lovable Cloud
LOVABLE_API_KEY          # Chave do Lovable AI Gateway
SUPABASE_URL             # URL do projeto Supabase
SUPABASE_SERVICE_ROLE_KEY # Chave de serviço (para funções batch)
```

### Config.toml

```toml
# supabase/config.toml
project_id = "seu-project-id"

[functions.improve-title]
verify_jwt = false

[functions.improve-description]
verify_jwt = false

[functions.generate-seo]
verify_jwt = false

[functions.batch-improve-descriptions]
verify_jwt = false

[functions.batch-generate-seo]
verify_jwt = false
```

---

## Edge Functions

### 1. `improve-title` - Melhoria de Título Individual

**Arquivo:** `supabase/functions/improve-title/index.ts`

**Propósito:** Gera títulos otimizados para anúncios imobiliários (máx. 60 caracteres).

**Payload de Entrada:**
```json
{
  "title": "Apartamento 3 quartos centro",
  "propertyInfo": {
    "type": "apartamento",
    "status": "venda",
    "bedrooms": 3,
    "suites": 1,
    "garages": 2,
    "area": 120,
    "neighborhood": "Centro",
    "city": "São Paulo",
    "features": ["piscina", "churrasqueira", "academia"]
  }
}
```

**Resposta:**
```json
{
  "improvedTitle": "Apartamento Exclusivo 3 Quartos com Piscina no Centro"
}
```

---

### 2. `improve-description` - Geração de Descrição

**Arquivo:** `supabase/functions/improve-description/index.ts`

**Propósito:** Gera descrições estruturadas com formato padronizado (subtítulo, introdução, destaques, fechamento e CTA).

**Payload de Entrada:**
```json
{
  "description": "Apartamento bonito no centro...",
  "propertyInfo": {
    "type": "apartamento",
    "status": "venda",
    "bedrooms": 3,
    "suites": 1,
    "bathrooms": 2,
    "garages": 2,
    "area": 120,
    "built_area": 100,
    "neighborhood": "Centro",
    "city": "São Paulo",
    "features": ["ar condicionado", "armários embutidos"],
    "amenities": ["piscina", "academia", "salão de festas"]
  }
}
```

**Resposta:**
```json
{
  "improvedDescription": "Apartamento impecável à venda — 120m² de puro conforto e sofisticação\n\nDescubra este apartamento excepcional no coração do Centro de São Paulo. Um espaço pensado para quem valoriza qualidade de vida e praticidade.\n\n✓ 3 quartos espaçosos\n✓ 1 suíte master\n✓ 2 vagas de garagem\n✓ Ar condicionado em todos os ambientes\n✓ Armários embutidos\n✓ Área de lazer completa\n\nUma oportunidade única para quem busca morar bem em localização privilegiada.\n\nAgende sua visita e surpreenda-se!"
}
```

---

### 3. `generate-seo` - Geração de SEO

**Arquivo:** `supabase/functions/generate-seo/index.ts`

**Propósito:** Gera meta title (máx. 60 chars) e meta description (máx. 155 chars) otimizados para Google.

**Payload de Entrada:**
```json
{
  "propertyInfo": {
    "type": "apartamento",
    "status": "venda",
    "title": "Apartamento 3 Quartos Centro",
    "city": "São Paulo",
    "state": "SP",
    "neighborhood": "Centro",
    "bedrooms": 3,
    "bathrooms": 2,
    "garages": 2,
    "area": 120,
    "price": 850000,
    "features": ["piscina", "churrasqueira"]
  }
}
```

**Resposta:**
```json
{
  "seo_title": "Apartamento 3 Quartos à Venda Centro SP | 120m²",
  "seo_description": "Apartamento 3 quartos no Centro de São Paulo. 120m², 2 vagas, piscina. Oportunidade única! Agende sua visita agora."
}
```

---

### 4. `batch-improve-descriptions` - Descrições em Lote

**Arquivo:** `supabase/functions/batch-improve-descriptions/index.ts`

**Propósito:** Processa automaticamente todos os imóveis sem descrição.

**Payload de Entrada:**
```json
{}
```

**Resposta:**
```json
{
  "updated": 15,
  "errors": ["Imóvel X: AI error"]
}
```

---

### 5. `batch-generate-seo` - SEO em Lote

**Arquivo:** `supabase/functions/batch-generate-seo/index.ts`

**Propósito:** Processa automaticamente todos os imóveis sem SEO configurado.

**Payload de Entrada:**
```json
{}
```

**Resposta:**
```json
{
  "success": true,
  "message": "SEO gerado para 10 imóveis",
  "processed": 10,
  "errors": 0,
  "total": 10
}
```

---

## Prompts Detalhados

### Prompt de Sistema - Título

```text
Você é um especialista em marketing imobiliário. Sua tarefa é melhorar títulos de anúncios de imóveis para maximizar cliques e conversão.

Diretrizes OBRIGATÓRIAS:
1. O título deve ser CURTO (máximo 60 caracteres)
2. Destaque os principais diferenciais do imóvel
3. Use palavras que chamam atenção: "Exclusivo", "Único", "Oportunidade", etc.
4. Inclua características marcantes (piscina, vista, área gourmet, etc.)
5. Mencione a localização se for um diferencial
6. Use letra maiúscula no início de cada palavra importante
7. Não use pontuação no final
8. Mantenha em português brasileiro

IMPORTANTE: Retorne APENAS o título melhorado, sem explicações adicionais.
```

### Prompt de Sistema - Descrição

```text
Você é um especialista em marketing imobiliário. Gere descrições de imóveis SEMPRE neste formato EXATO:

FORMATO OBRIGATÓRIO (siga exatamente esta estrutura):

[SUBTÍTULO] - Uma linha curta e impactante sobre o imóvel (ex: "Apartamento impecável à venda — 157m² de puro conforto e sofisticação")

[INTRODUÇÃO] - Um parágrafo curto e envolvente (2-3 linhas) apresentando o imóvel.

[DESTAQUES] - Lista de 5 a 7 itens com "✓" no início de cada linha. Cada item deve ser curto (até 6 palavras). Exemplos:
✓ 2 suítes espaçosas
✓ 3 vagas de garagem
✓ Acabamentos de alto padrão
✓ Mobiliário de excelente qualidade
✓ Living integrado e iluminado
✓ Pronto para morar — é entrar e se apaixonar!

[FECHAMENTO] - Uma frase curta destacando o valor do imóvel (1-2 linhas).

[CTA] - Chamada para ação (ex: "Agende sua visita e surpreenda-se!")

REGRAS:
- NÃO use títulos como "Subtítulo:", "Introdução:", "Destaques:", etc.
- NÃO escreva parágrafos longos
- Os itens da lista DEVEM começar com "✓ " (checkmark)
- Mantenha o texto CONCISO e ORGANIZADO
- Use português brasileiro
```

### Prompt de Sistema - SEO

```text
Você é um especialista em SEO para sites imobiliários no Brasil. 
Sua tarefa é gerar title tags e meta descriptions otimizados para Google.

REGRAS IMPORTANTES:
1. Title SEO: máximo 60 caracteres, incluir palavra-chave principal no início
2. Meta Description: máximo 155 caracteres, incluir CTA (chamada para ação)
3. Usar linguagem persuasiva e profissional em português brasileiro
4. Incluir localização (cidade, bairro) quando disponível
5. Incluir características principais (quartos, área) quando relevantes
6. Evitar caracteres especiais desnecessários
7. Criar urgência e exclusividade

FORMATO DE SAÍDA (JSON):
{
  "seo_title": "título otimizado aqui",
  "seo_description": "descrição meta otimizada aqui"
}
```

---

## Payloads e Respostas

### Estrutura Base de Chamada à API

```typescript
const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "google/gemini-3-flash-preview",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
  }),
});
```

### Estrutura da Resposta da API

```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "google/gemini-3-flash-preview",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Conteúdo gerado pela IA"
      },
      "finish_reason": "stop"
    }
  ]
}
```

### Extraindo o Conteúdo

```typescript
const data = await response.json();
const content = data.choices?.[0]?.message?.content;
```

---

## Tratamento de Erros

### CORS Headers (Obrigatório)

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// No início da função
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

### Erros Comuns

| Status | Erro | Tratamento |
|--------|------|------------|
| 429 | Rate Limit | "Limite de requisições excedido. Tente novamente em alguns minutos." |
| 402 | Créditos | "Créditos insuficientes. Adicione créditos ao workspace." |
| 500 | Erro Geral | Logar erro e retornar mensagem genérica |

### Código de Tratamento

```typescript
if (!response.ok) {
  const errorText = await response.text();
  console.error("AI Gateway error:", response.status, errorText);
  
  if (response.status === 429) {
    return new Response(JSON.stringify({ 
      error: "Limite de requisições excedido. Tente novamente em alguns minutos." 
    }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  if (response.status === 402) {
    return new Response(JSON.stringify({ 
      error: "Créditos insuficientes. Adicione créditos ao workspace." 
    }), {
      status: 402,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  throw new Error(`AI Gateway error: ${response.status}`);
}
```

---

## Como Replicar

### Passo 1: Criar Edge Function

```bash
# Estrutura de pastas
supabase/
  functions/
    minha-funcao-ia/
      index.ts
```

### Passo 2: Template Base

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inputData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Seu prompt de sistema aqui...`;
    const userPrompt = `Seu prompt de usuário com ${inputData}...`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      // Tratamento de erros...
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

### Passo 3: Configurar config.toml

```toml
[functions.minha-funcao-ia]
verify_jwt = false
```

### Passo 4: Chamar do Frontend

```typescript
import { supabase } from "@/integrations/supabase/client";

const { data, error } = await supabase.functions.invoke('minha-funcao-ia', {
  body: { inputData: "dados de entrada" }
});

if (error) {
  console.error('Erro:', error);
  return;
}

console.log('Resultado:', data.result);
```

---

## Função Auxiliar: Normalização de Descrição

Usada para formatar corretamente os checkmarks:

```typescript
function normalizePropertyDescription(description: string): string {
  const text = (description ?? '').replace(/\r\n/g, '\n').trim();
  if (!text) return '';

  const inputLines = text.split('\n');
  const outputLines: string[] = [];

  for (const rawLine of inputLines) {
    const line = rawLine.trim();
    if (!line) {
      outputLines.push('');
      continue;
    }

    // Separa múltiplos checkmarks na mesma linha
    const items = line.match(/[✓✔]\s*[^✓✔]+/g);
    if (items && items.length > 1) {
      items.forEach((it, idx) => {
        outputLines.push(it.trim());
        if (idx < items.length - 1) outputLines.push('');
      });
      continue;
    }

    outputLines.push(line);
  }

  return outputLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
```

---

## Mapeamento de Tipos

```typescript
const propertyTypeLabels: Record<string, string> = {
  casa: 'Casa',
  apartamento: 'Apartamento',
  terreno: 'Terreno',
  comercial: 'Imóvel Comercial',
  rural: 'Imóvel Rural',
  cobertura: 'Cobertura',
  flat: 'Flat',
  galpao: 'Galpão',
  loft: 'Loft',
};

const statusLabels: Record<string, string> = {
  venda: 'à Venda',
  aluguel: 'para Alugar',
};
```

---

## Rate Limiting para Batch

Para funções batch, adicione delay entre requisições:

```typescript
// Delay de 500ms entre requisições para evitar rate limiting
await new Promise(resolve => setTimeout(resolve, 500));
```

---

## Checklist de Implementação

- [ ] Criar pasta da edge function em `supabase/functions/`
- [ ] Implementar `index.ts` com template base
- [ ] Adicionar CORS headers
- [ ] Configurar `config.toml`
- [ ] Tratar erros 429 e 402
- [ ] Adicionar logging para debug
- [ ] Testar via `supabase.functions.invoke()`
- [ ] Documentar payload de entrada e saída

---

## Recursos Adicionais

- [Lovable AI Docs](https://docs.lovable.dev/features/ai)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Gemini API Reference](https://ai.google.dev/docs)
