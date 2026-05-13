# Prompts Completos de IA - Geração de Conteúdo Imobiliário

Este documento contém os prompts completos utilizados para geração de títulos, descrições e SEO de imóveis.

---

## 1. Geração de Títulos (improve-title)

### System Prompt
```
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

### User Prompt
```
Melhore este título de anúncio imobiliário:

Título atual: "${title}"

Informações do imóvel:
- Tipo: ${propertyInfo?.type || 'Não informado'}
- Status: ${propertyInfo?.status === 'venda' ? 'À venda' : 'Para alugar'}
- Quartos: ${propertyInfo?.bedrooms || 0}
- Suítes: ${propertyInfo?.suites || 0}
- Vagas: ${propertyInfo?.garages || 0}
- Área: ${propertyInfo?.area || 0}m²
- Bairro: ${propertyInfo?.neighborhood || 'Não informado'}
- Cidade: ${propertyInfo?.city || 'Não informado'}
- Características: ${propertyInfo?.features?.join(', ') || 'Não informado'}

Gere um título mais atraente e persuasivo.
```

### Payload de Entrada
```json
{
  "title": "Apartamento no centro",
  "propertyInfo": {
    "type": "apartamento",
    "status": "venda",
    "bedrooms": 3,
    "suites": 1,
    "garages": 2,
    "area": 120,
    "neighborhood": "Centro",
    "city": "São Paulo",
    "features": ["piscina", "churrasqueira", "salão de festas"]
  }
}
```

### Resposta Esperada
```json
{
  "improvedTitle": "Apartamento 3 Quartos com Piscina no Centro de SP"
}
```

---

## 2. Geração de Descrições (improve-description)

### System Prompt
```
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

### User Prompt
```
Gere uma descrição de imóvel seguindo EXATAMENTE o formato especificado.

Informações do imóvel:
- Tipo: ${typeLabel}
- Status: ${statusLabel}
- Quartos: ${propertyInfo?.bedrooms || 0}
- Suítes: ${propertyInfo?.suites || 0}
- Banheiros: ${propertyInfo?.bathrooms || 0}
- Vagas: ${propertyInfo?.garages || 0}
- Área total: ${propertyInfo?.area || 0}m²
- Área construída: ${propertyInfo?.built_area || 0}m²
- Bairro: ${propertyInfo?.neighborhood || 'Não informado'}
- Cidade: ${propertyInfo?.city || 'Não informado'}
- Características: ${propertyInfo?.features?.join(', ') || 'Não informado'}
- Comodidades: ${propertyInfo?.amenities?.join(', ') || 'Não informado'}

${description ? `Descrição original para referência: ${description}` : ''}

Gere a descrição AGORA, seguindo o formato com subtítulo, introdução, lista de destaques com ✓, fechamento e CTA.
```

### Mapeamento de Tipos
```javascript
const typeLabelMap = {
  casa: 'Casa',
  apartamento: 'Apartamento',
  terreno: 'Terreno',
  comercial: 'Imóvel Comercial',
  rural: 'Imóvel Rural',
  cobertura: 'Cobertura',
  flat: 'Flat',
  galpao: 'Galpão'
};

const statusLabel = propertyInfo?.status === 'venda' ? 'à venda' : 'para alugar';
```

### Payload de Entrada
```json
{
  "description": "Apartamento bom no centro",
  "propertyInfo": {
    "type": "apartamento",
    "status": "venda",
    "bedrooms": 3,
    "suites": 2,
    "bathrooms": 3,
    "garages": 2,
    "area": 157,
    "built_area": 145,
    "neighborhood": "Jardins",
    "city": "São Paulo",
    "features": ["piscina", "churrasqueira", "varanda gourmet"],
    "amenities": ["academia", "salão de festas", "playground"]
  }
}
```

### Resposta Esperada
```json
{
  "improvedDescription": "Apartamento impecável à venda — 157m² de puro conforto e sofisticação\n\nLocalizado no coração dos Jardins, este apartamento oferece o equilíbrio perfeito entre elegância e praticidade. Ideal para famílias que buscam qualidade de vida em uma das regiões mais nobres de São Paulo.\n\n✓ 3 quartos sendo 2 suítes\n\n✓ 2 vagas de garagem cobertas\n\n✓ Varanda gourmet integrada\n\n✓ Piscina e churrasqueira\n\n✓ Academia e salão de festas\n\n✓ Pronto para morar\n\nUma oportunidade única de viver com sofisticação e conforto nos Jardins.\n\nAgende sua visita e surpreenda-se!"
}
```

### Função de Normalização (Pós-processamento)
```javascript
function normalizePropertyDescription(description) {
  const text = (description ?? '').replace(/\r\n/g, '\n').trim();
  if (!text) return '';

  const inputLines = text.split('\n');
  const outputLines = [];

  for (const rawLine of inputLines) {
    const line = rawLine.trim();
    if (!line) {
      outputLines.push('');
      continue;
    }

    // Separa itens com checkmark que vieram na mesma linha
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

## 3. Geração de SEO (generate-seo)

### System Prompt
```
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

### User Prompt
```
Gere SEO title e meta description para este imóvel:

Tipo: ${type}
Status: ${status}
Título atual: ${title}
Cidade: ${city}
Estado: ${state}
Bairro: ${neighborhood}
Quartos: ${bedrooms}
Banheiros: ${bathrooms}
Vagas: ${garages}
Área: ${area}m²
Preço: ${price > 0 ? `R$ ${price.toLocaleString('pt-BR')}` : 'Sob consulta'}
Características: ${featuresList}

Retorne APENAS o JSON com seo_title e seo_description.
```

### Mapeamento de Labels
```javascript
const propertyTypeLabels = {
  casa: 'Casa',
  apartamento: 'Apartamento',
  terreno: 'Terreno',
  comercial: 'Imóvel Comercial',
  rural: 'Imóvel Rural',
  cobertura: 'Cobertura',
  flat: 'Flat',
  galpao: 'Galpão',
};

const statusLabels = {
  venda: 'à Venda',
  aluguel: 'para Alugar',
};
```

### Payload de Entrada
```json
{
  "propertyInfo": {
    "type": "apartamento",
    "status": "venda",
    "title": "Apartamento Luxuoso nos Jardins",
    "city": "São Paulo",
    "state": "SP",
    "neighborhood": "Jardins",
    "bedrooms": 3,
    "bathrooms": 3,
    "garages": 2,
    "area": 157,
    "price": 1500000,
    "features": ["piscina", "churrasqueira", "varanda gourmet"]
  }
}
```

### Resposta Esperada
```json
{
  "seo_title": "Apartamento 3 Quartos à Venda nos Jardins | 157m²",
  "seo_description": "Apartamento de luxo com 3 quartos, piscina e churrasqueira nos Jardins, SP. 157m², 2 vagas. Agende sua visita!"
}
```

### Fallback (quando parsing falha)
```javascript
const basicTitle = `${type} ${status} em ${city} ${state}`.substring(0, 60);
const basicDesc = `${type} ${status} ${neighborhood ? `no ${neighborhood}, ` : ''}${city}. ${bedrooms > 0 ? `${bedrooms} quartos, ` : ''}${area > 0 ? `${area}m². ` : ''}Agende visita!`.substring(0, 155);

seoData = {
  seo_title: basicTitle,
  seo_description: basicDesc
};
```

---

## 4. Tela "SEO - Otimização para Google" (Aba do Formulário de Imóvel)

### Visão Geral

A aba **SEO** dentro do formulário "Editar Imóvel" permite configurar título e descrição otimizados para Google **por imóvel**. Inclui um botão de geração automática com IA.

### Estrutura da Interface

```
┌─────────────────────────────────────────────────────┐
│  🔗 SEO - Otimização para Google                    │
│  Configure o título e descrição que aparecerão      │
│  nos resultados de busca                            │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │  ✨ Gerar SEO com IA                          │  │
│  │  Gere automaticamente título e descrição      │  │
│  │  otimizados para mecanismos de busca usando   │  │
│  │  inteligência artificial.                     │  │
│  │                                                │  │
│  │  [ ✨ Gerar SEO Automático ]                  │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  Título SEO (máx. 60 caracteres)            0/60    │
│  ┌───────────────────────────────────────────────┐  │
│  │ Ex: Casa à Venda em Brasília DF | 3 Quartos   │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  Meta Description (máx. 155 caracteres)    0/155    │
│  ┌───────────────────────────────────────────────┐  │
│  │ Ex: Casa à venda no Lago Sul, Brasília DF     │  │
│  │ com 3 quartos, suíte master...                │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ Dicas para SEO ──────────────────────────────┐  │
│  │ • Inclua o tipo de imóvel e localização       │  │
│  │ • Use palavras-chave como "à venda", "para    │  │
│  │   alugar", número de quartos                  │  │
│  │ • A meta description deve ter um CTA          │  │
│  │ • Evite textos genéricos ou duplicados        │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Campos no Banco de Dados (tabela `properties`)

| Campo | Tipo | Limite | Descrição |
|-------|------|--------|-----------|
| `seo_title` | text | 60 chars | Title tag otimizado para Google |
| `seo_description` | text | 155 chars | Meta description otimizada |

### Fluxo de Geração com IA

```
Usuário clica "Gerar SEO Automático"
        │
        ▼
Frontend monta payload com dados do imóvel
        │
        ▼
Chama edge function `generate-seo`
        │
        ▼
Edge function envia prompt à Anthropic API
(modelo: claude-haiku-4-5-20251001)
        │
        ▼
IA retorna JSON: { seo_title, seo_description }
        │
        ▼
Frontend preenche os campos automaticamente
        │
        ▼
Usuário revisa e salva o imóvel
```

### Payload Enviado ao Edge Function

O frontend coleta os dados do imóvel e envia:

```json
{
  "propertyInfo": {
    "type": "casa",
    "status": "venda",
    "title": "Casa Moderna no Lago Sul",
    "city": "Brasília",
    "state": "DF",
    "neighborhood": "Lago Sul",
    "bedrooms": 3,
    "bathrooms": 4,
    "garages": 2,
    "area": 200,
    "price": 2500000,
    "features": ["suíte master", "churrasqueira", "área gourmet"]
  }
}
```

### Edge Function: `generate-seo`

**Caminho:** `supabase/functions/generate-seo/index.ts`

**Comportamento:**
1. Recebe `propertyInfo` no body
2. Mapeia `type` e `status` para labels em português
3. Monta system prompt (especialista SEO) + user prompt (dados do imóvel)
4. Chama a Anthropic API
5. Faz parsing do JSON da resposta
6. Se parsing falha → gera fallback básico
7. Trunca `seo_title` em 60 chars e `seo_description` em 155 chars
8. Retorna JSON

### Prompts Utilizados

**(Mesmos da Seção 3 acima)**

- **System:** Especialista SEO → regras de limite, palavra-chave no início, CTA, localização
- **User:** Dados completos do imóvel formatados

### Resposta da IA → Campos Preenchidos

```json
{
  "seo_title": "Casa 3 Quartos à Venda no Lago Sul | 200m²",
  "seo_description": "Casa moderna com 3 quartos, suíte master e área gourmet no Lago Sul, Brasília DF. 200m², 2 vagas. Agende sua visita!"
}
```

Esses valores são inseridos diretamente nos inputs da tela e salvos na tabela `properties` junto com o imóvel.

### Chamada Frontend (exemplo)

```typescript
const generateSeo = async () => {
  setGenerating(true);
  try {
    const { data, error } = await supabase.functions.invoke('generate-seo', {
      body: {
        propertyInfo: {
          type: property.type,
          status: property.status,
          title: property.title,
          city: property.address_city,
          state: property.address_state,
          neighborhood: property.address_neighborhood,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          garages: property.garages,
          area: property.area,
          price: property.price,
          features: property.features?.slice(0, 3) || [],
        }
      }
    });

    if (error) throw error;

    // Preenche os campos na tela
    setSeoTitle(data.seo_title);
    setSeoDescription(data.seo_description);
    toast.success('SEO gerado com sucesso!');
  } catch (err) {
    toast.error('Erro ao gerar SEO');
  } finally {
    setGenerating(false);
  }
};
```

### Validações na Interface

| Regra | Implementação |
|-------|---------------|
| Contador de caracteres | Exibido como `X/60` e `X/155` ao lado do label |
| Truncamento | Backend trunca antes de retornar |
| Placeholder | Exemplos reais como guia visual |
| Dicas | Card amarelo com boas práticas de SEO |

---

## 5. Configuração da API

### Endpoint
```
https://api.anthropic.com/v1/messages
```

### Headers
```javascript
{
  "x-api-key": ANTHROPIC_API_KEY,
  "anthropic-version": "2023-06-01",
  "Content-Type": "application/json"
}
```

### Body Base
```javascript
{
  "model": "claude-haiku-4-5-20251001",
  "max_tokens": 512,
  "system": systemPrompt,
  "messages": [
    { "role": "user", "content": userPrompt }
  ]
}
```

### Tratamento de Erros
```javascript
// Rate limit (429)
if (response.status === 429) {
  return { error: "Limite de requisições excedido. Tente novamente em alguns minutos." };
}
```

---

## 5. CORS Headers (Obrigatório)

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// No início da função
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}

// Em todas as respostas
return new Response(JSON.stringify(data), {
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});
```

---

## 6. Resumo para Replicação Rápida

| Função | Entrada Principal | Saída | Limite |
|--------|-------------------|-------|--------|
| improve-title | title, propertyInfo | improvedTitle | 60 chars |
| improve-description | description, propertyInfo | improvedDescription | - |
| generate-seo | propertyInfo | seo_title, seo_description | 60/155 chars |

### Checklist de Implementação
- [ ] Configurar secret `ANTHROPIC_API_KEY`
- [ ] Criar edge function com CORS headers
- [ ] Implementar tratamento de erros 429/402
- [ ] Aplicar pós-processamento (normalização para descrições)
- [ ] Garantir limites de caracteres nas respostas
