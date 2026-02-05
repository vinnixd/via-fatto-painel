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

## 4. Configuração da API

### Endpoint
```
https://ai.gateway.lovable.dev/v1/chat/completions
```

### Headers
```javascript
{
  "Authorization": `Bearer ${LOVABLE_API_KEY}`,
  "Content-Type": "application/json"
}
```

### Body Base
```javascript
{
  "model": "google/gemini-2.5-flash",
  "messages": [
    { "role": "system", "content": systemPrompt },
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

// Créditos insuficientes (402)
if (response.status === 402) {
  return { error: "Créditos insuficientes. Adicione créditos ao workspace." };
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
- [ ] Configurar secret `LOVABLE_API_KEY`
- [ ] Criar edge function com CORS headers
- [ ] Implementar tratamento de erros 429/402
- [ ] Aplicar pós-processamento (normalização para descrições)
- [ ] Garantir limites de caracteres nas respostas
