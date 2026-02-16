# Edge Functions — Referência para Deploy Externo (VPS)

> Todas as funções usam **OpenAI API (`gpt-4o-mini`)** e requerem o secret `OPENAI_API_KEY` configurado no Supabase externo.

## Deploy

```bash
supabase functions deploy improve-title
supabase functions deploy improve-description
supabase functions deploy batch-improve-descriptions
supabase functions deploy generate-seo
supabase functions deploy batch-generate-seo
supabase functions deploy generate-blog-seo
```

---

## 1. `improve-title`

**Endpoint:** `POST /functions/v1/improve-title`

**Descrição:** Melhora o título de um imóvel para marketing. Máximo **60 caracteres**, sem reticências.

**Body:**
```json
{
  "title": "Casa 3 quartos",
  "propertyInfo": {
    "type": "casa",
    "status": "venda",
    "bedrooms": 3,
    "suites": 1,
    "garages": 2,
    "area": 150,
    "neighborhood": "Jardins",
    "city": "São Paulo",
    "features": ["piscina", "churrasqueira"]
  }
}
```

**Resposta:**
```json
{
  "improvedTitle": "Casa Exclusiva com Piscina nos Jardins"
}
```

**Regras de negócio:**
- Título truncado na última palavra que cabe em 60 chars (sem "...")
- Remove aspas da resposta da IA
- Texto em português brasileiro

---

## 2. `improve-description`

**Endpoint:** `POST /functions/v1/improve-description`

**Descrição:** Gera descrição profissional para um imóvel. **Texto puro** (sem markdown).

**Body:**
```json
{
  "description": "Casa com 3 quartos, piscina, área gourmet",
  "propertyInfo": {
    "type": "casa",
    "status": "venda",
    "bedrooms": 3,
    "suites": 1,
    "bathrooms": 2,
    "garages": 2,
    "area": 150,
    "builtArea": 120,
    "neighborhood": "Jardins",
    "city": "São Paulo",
    "state": "SP",
    "price": 850000,
    "condoFee": 500,
    "iptu": 200,
    "features": ["piscina", "churrasqueira", "área gourmet"],
    "amenities": ["portaria 24h", "academia"],
    "financing": true,
    "condition": "novo"
  }
}
```

**Resposta:**
```json
{
  "improvedDescription": "Residência de Alto Padrão nos Jardins\n\nDescubra esta casa excepcional...\n\n✓ 3 quartos sendo 1 suíte\n✓ Piscina privativa\n..."
}
```

**Regras de negócio:**
- Pós-processamento remove todo markdown (`**`, `##`, `_`, `` ` ``)
- Converte listas `- item` e `* item` para `✓ item`
- Estrutura fixa: Subtítulo → Introdução → Lista com ✓ → Fechamento → CTA

---

## 3. `batch-improve-descriptions`

**Endpoint:** `POST /functions/v1/batch-improve-descriptions`

**Descrição:** Processa em lote imóveis ativos sem descrição ou com descrição curta (< 100 chars). Máximo **50 imóveis** por execução.

**Body:** _(vazio ou `{}`)_

**Resposta:**
```json
{
  "success": true,
  "message": "Descrições melhoradas para 15 imóveis",
  "processed": 15,
  "errors": 2,
  "total": 17
}
```

**Regras de negócio:**
- Busca imóveis com `active = true` e descrição nula, vazia ou < 100 chars
- Delay de 500ms entre requisições (rate limiting)
- Atualiza diretamente no banco via `SUPABASE_SERVICE_ROLE_KEY`
- Mesma normalização de texto puro da função individual

---

## 4. `generate-seo`

**Endpoint:** `POST /functions/v1/generate-seo`

**Descrição:** Gera `seo_title` (máx 60 chars) e `seo_description` (máx 155 chars) para um imóvel.

**Body:**
```json
{
  "propertyInfo": {
    "type": "apartamento",
    "status": "aluguel",
    "title": "Apartamento 2 quartos centro",
    "city": "Curitiba",
    "state": "PR",
    "neighborhood": "Centro",
    "bedrooms": 2,
    "bathrooms": 1,
    "garages": 1,
    "area": 65,
    "price": 2500,
    "features": ["varanda", "elevador"]
  }
}
```

**Resposta:**
```json
{
  "seo_title": "Apartamento para Alugar no Centro de Curitiba",
  "seo_description": "Apartamento 2 quartos com varanda no Centro de Curitiba. 65m², 1 vaga. Agende sua visita!"
}
```

**Regras de negócio:**
- Fallback automático se a IA retornar JSON inválido
- Helper `extractJson` trata code blocks e trailing commas

---

## 5. `batch-generate-seo`

**Endpoint:** `POST /functions/v1/batch-generate-seo`

**Descrição:** Gera SEO em lote para imóveis ativos sem `seo_title` ou `seo_description`. Máximo **50 imóveis**.

**Body:** _(vazio ou `{}`)_

**Resposta:**
```json
{
  "success": true,
  "message": "SEO gerado para 30 imóveis",
  "processed": 30,
  "errors": 1,
  "total": 31
}
```

**Regras de negócio:**
- Filtra por `seo_title IS NULL OR seo_description IS NULL OR seo_title = '' OR seo_description = ''`
- Delay de 500ms entre requisições
- Fallback local se parsing do JSON falhar

---

## 6. `generate-blog-seo`

**Endpoint:** `POST /functions/v1/generate-blog-seo`

**Descrição:** Gera SEO para posts de blog.

**Body:**
```json
{
  "title": "10 Dicas para Comprar seu Primeiro Imóvel",
  "excerpt": "Guia completo para quem está comprando pela primeira vez",
  "category": "Dicas",
  "content": "<p>Comprar um imóvel é uma das maiores decisões...</p>"
}
```

**Resposta:**
```json
{
  "seo_title": "10 Dicas Essenciais para Comprar Seu Primeiro Imóvel",
  "seo_description": "Guia completo com dicas práticas para comprar seu primeiro imóvel com segurança. Confira agora!"
}
```

**Regras de negócio:**
- Strip HTML do content antes de enviar à IA (usa apenas primeiros 500 chars como contexto)
- Título obrigatório (retorna 400 se ausente)
- Fallback usa o título/excerpt original

---

## Secrets Necessários no Supabase Externo

| Secret | Usado por |
|---|---|
| `OPENAI_API_KEY` | Todas as 6 funções |
| `SUPABASE_URL` | `batch-improve-descriptions`, `batch-generate-seo` |
| `SUPABASE_SERVICE_ROLE_KEY` | `batch-improve-descriptions`, `batch-generate-seo` |

---

## Chamada via Frontend (exemplo)

```typescript
const { data, error } = await supabase.functions.invoke('improve-title', {
  body: { title: 'Casa 3 quartos', propertyInfo: { ... } }
});
```

---

## Erros Comuns

| Status | Significado |
|---|---|
| `429` | Rate limit da OpenAI. Aguardar e tentar novamente. |
| `402` | Créditos insuficientes na conta OpenAI. |
| `500` + `OPENAI_API_KEY is not configured` | Secret não definido no Supabase. |
