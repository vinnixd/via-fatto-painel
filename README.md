# Painel Via Fatto Imobiliária

Painel administrativo do sistema imobiliário Via Fatto.

- **URL:** https://painel.viafatto.com.br
- **Stack:** React + Vite + TypeScript + Tailwind CSS + shadcn-ui
- **Backend:** Supabase (Project: `wzllexcaitqfkfjmqbyy`)

## Desenvolvimento local

```sh
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build de produção
npm run build
```

## Deploy

```bash
ssh -i C:/Users/felix/.ssh/viafatto root@68.168.222.135 \
  "cd /var/www/painel.viafatto.com.br/app && git pull && npm run build && cp -r dist/. /var/www/painel.viafatto.com.br/public_html/ && echo DEPLOY_OK"
```

## Repositório

https://github.com/vinnixd/via-fatto-painel
