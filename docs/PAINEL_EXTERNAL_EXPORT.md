# Via Fatto Painel - Export para Projeto Externo

Este documento contém toda a estrutura necessária para criar o projeto `via-fatto-painel-external` conectado a um Supabase externo.

## Pré-requisitos

1. Criar novo projeto React/Vite
2. Configurar `.env` com credenciais do Supabase externo

## Configuração do .env

```env
VITE_SUPABASE_URL=https://mpsusvpdjuqvjgdsvwpp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wc3VzdnBkanVxdmpnZHN2d3BwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyODg3MDMsImV4cCI6MjA4NDg2NDcwM30.yIQdN6qQutagNWGMAtlG8SgVuPRAbJPN3hrUwakjf-8
VITE_SUPABASE_PROJECT_ID=mpsusvpdjuqvjgdsvwpp
```

---

## Estrutura de Arquivos

```
via-fatto-painel-external/
├── .env                           # Configurar manualmente
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   ├── vite-env.d.ts
│   ├── integrations/
│   │   └── supabase/
│   │       └── client.ts          # Cliente Supabase (sem Cloud)
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── TenantContext.tsx      # SEM DEV_FALLBACK
│   ├── components/
│   │   ├── AdminRoutes.tsx
│   │   ├── ScrollToTop.tsx
│   │   ├── AppErrorBoundary.tsx
│   │   ├── RealtimeSyncProvider.tsx
│   │   ├── tenant/
│   │   │   └── TenantGate.tsx
│   │   ├── admin/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── AdminHeader.tsx
│   │   │   ├── AdminLink.tsx
│   │   │   ├── DashboardCharts.tsx
│   │   │   └── ImportProgressBar.tsx
│   │   └── ui/                    # shadcn components
│   ├── hooks/
│   │   ├── useAdminRoutes.ts
│   │   ├── useAdminNavigation.ts
│   │   ├── usePermissions.ts
│   │   ├── useProfile.ts
│   │   ├── useSupabaseData.ts
│   │   ├── useSiteConfig.ts       # (dentro de useSupabaseData)
│   │   ├── useUnreadCount.ts
│   │   └── useRealtimeSync.ts
│   ├── pages/
│   │   ├── NotFound.tsx
│   │   └── admin/
│   │       ├── AuthPage.tsx
│   │       ├── DashboardPage.tsx
│   │       ├── DesignerPage.tsx
│   │       ├── PropertiesListPage.tsx
│   │       ├── PropertyFormPage.tsx
│   │       ├── CategoriesPage.tsx
│   │       ├── MessagesPage.tsx
│   │       ├── PortaisPage.tsx
│   │       ├── PortalConfigPage.tsx
│   │       ├── UsersPage.tsx
│   │       ├── ProfilePage.tsx
│   │       ├── SettingsPage.tsx
│   │       ├── FavoritesListPage.tsx
│   │       ├── IntegrationsPage.tsx
│   │       ├── TenantDomainsPage.tsx
│   │       ├── TenantMembersPage.tsx
│   │       ├── InviteSignupPage.tsx
│   │       ├── ShareTestPage.tsx
│   │       ├── data/
│   │       │   ├── DataLayout.tsx
│   │       │   ├── ExportPage.tsx
│   │       │   └── ImportPage.tsx
│   │       └── subscriptions/
│   │           ├── SubscriptionsLayout.tsx
│   │           ├── PaymentsPage.tsx
│   │           ├── PlansPage.tsx
│   │           └── InvoicesPage.tsx
│   └── lib/
│       ├── utils.ts
│       └── constants.ts
```

---

## Arquivos Críticos (Versões Limpas)

### 1. `src/integrations/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

---

### 2. `src/contexts/TenantContext.tsx` (SEM DEV_FALLBACK)

```typescript
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  settings?: Record<string, unknown>;
}

interface Domain {
  id: string;
  tenant_id: string;
  hostname: string;
  type: 'public' | 'admin';
  is_primary: boolean;
  verified: boolean;
  verify_token?: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  tenantId: string | null;
  loading: boolean;
  error: string | null;
  domain: Domain | null;
  isResolved: boolean;
  userRole: 'owner' | 'admin' | 'agent' | null;
  isTenantMember: boolean;
  isOwnerOrAdmin: boolean;
  canManageUsers: boolean;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

const TENANT_STORAGE_KEY = 'active_tenant_id';

function detectDomainType(hostname: string): 'admin' | 'public' {
  return hostname.startsWith('painel.') ? 'admin' : 'public';
}

async function fetchTenantById(tenantId: string): Promise<Tenant | null> {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .eq('status', 'active')
      .maybeSingle();

    if (error || !data) {
      console.warn('[TenantContext] Tenant não encontrado:', tenantId);
      return null;
    }

    return data as Tenant;
  } catch (err) {
    console.error('[TenantContext] Erro ao buscar tenant:', err);
    return null;
  }
}

async function resolveTenantByHostname(hostname: string): Promise<{
  tenant: Tenant | null;
  domain: Domain | null;
  error: string | null;
}> {
  try {
    const { data: domainData, error: domainError } = await supabase
      .from('domains')
      .select('*')
      .eq('hostname', hostname.toLowerCase())
      .eq('type', detectDomainType(hostname))
      .eq('verified', true)
      .maybeSingle();

    if (domainError) {
      console.error('[TenantContext] Erro ao buscar domínio:', domainError);
      return { tenant: null, domain: null, error: 'DOMAIN_QUERY_ERROR' };
    }

    if (!domainData) {
      return { tenant: null, domain: null, error: 'DOMAIN_NOT_FOUND' };
    }

    const domain = domainData as Domain;
    const tenant = await fetchTenantById(domain.tenant_id);
    
    if (!tenant) {
      return { tenant: null, domain, error: 'TENANT_NOT_FOUND' };
    }

    return { tenant, domain, error: null };
  } catch (err) {
    console.error('[TenantContext] Erro na resolução por hostname:', err);
    return { tenant: null, domain: null, error: 'RESOLUTION_ERROR' };
  }
}

async function resolveWithLogging(hostname: string): Promise<{
  tenantId: string | null;
  tenant: Tenant | null;
  domain: Domain | null;
  error: string | null;
}> {
  const isDev = import.meta.env.DEV;
  
  if (isDev) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseProjectId = supabaseUrl.replace('https://', '').split('.')[0];
    console.log('[TenantContext] ═══════════════════════════════════════');
    console.log('[TenantContext] 🔗 SUPABASE_PROJECT_ID:', supabaseProjectId);
    console.log('[TenantContext] Iniciando resolução de tenant');
    console.log('[TenantContext] hostname:', hostname);
  }

  // ÚNICA ESTRATÉGIA: Resolver por hostname via tabela domains
  const hostnameResult = await resolveTenantByHostname(hostname);
  
  if (isDev) {
    console.log('[TenantContext] tenant_id_from_domains:', hostnameResult.tenant?.id ?? 'null');
  }

  if (hostnameResult.tenant && !hostnameResult.error) {
    // Salvar no localStorage para referência
    localStorage.setItem(TENANT_STORAGE_KEY, hostnameResult.tenant.id);
    
    if (isDev) {
      console.log('[TenantContext] ✓ Tenant resolvido por DOMAINS');
      console.log('[TenantContext] tenant_id_final:', hostnameResult.tenant.id);
      console.log('[TenantContext] ═══════════════════════════════════════');
    }

    return {
      tenantId: hostnameResult.tenant.id,
      tenant: hostnameResult.tenant,
      domain: hostnameResult.domain,
      error: null
    };
  }

  // Se domínio não encontrado, retornar erro (SEM FALLBACK)
  if (isDev) {
    console.log('[TenantContext] ✗ ERRO: Domínio não configurado ou não verificado');
    console.log('[TenantContext] tenant_id_final: null');
    console.log('[TenantContext] ═══════════════════════════════════════');
  }

  return {
    tenantId: null,
    tenant: null,
    domain: hostnameResult.domain,
    error: hostnameResult.error
  };
}

async function getUserTenantRole(tenantId: string, userId: string): Promise<'owner' | 'admin' | 'agent' | null> {
  try {
    const { data, error } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data.role as 'owner' | 'admin' | 'agent';
  } catch {
    return null;
  }
}

interface TenantProviderProps {
  children: React.ReactNode;
}

export const TenantProvider = ({ children }: TenantProviderProps) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [domain, setDomain] = useState<Domain | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResolved, setIsResolved] = useState(false);
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'agent' | null>(null);

  const resolveTenant = useCallback(async () => {
    setLoading(true);
    setError(null);

    const hostname = window.location.hostname.toLowerCase();
    const result = await resolveWithLogging(hostname);
    
    setTenant(result.tenant);
    setDomain(result.domain);
    setError(result.error);
    setIsResolved(result.tenant !== null);
    setLoading(false);
  }, []);

  // Check user's role in tenant when tenant or auth changes
  useEffect(() => {
    const checkUserRole = async () => {
      if (!tenant?.id) {
        setUserRole(null);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setUserRole(null);
        return;
      }

      const role = await getUserTenantRole(tenant.id, user.id);
      setUserRole(role);
    };

    checkUserRole();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserRole();
    });

    return () => subscription.unsubscribe();
  }, [tenant?.id]);

  // Resolve tenant on mount
  useEffect(() => {
    resolveTenant();
  }, [resolveTenant]);

  const refreshTenant = useCallback(async () => {
    await resolveTenant();
  }, [resolveTenant]);

  const isTenantMember = userRole !== null;
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';
  const canManageUsers = isOwnerOrAdmin;

  return (
    <TenantContext.Provider
      value={{
        tenant,
        tenantId: tenant?.id ?? null,
        loading,
        error,
        domain,
        isResolved,
        userRole,
        isTenantMember,
        isOwnerOrAdmin,
        canManageUsers,
        refreshTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

export { resolveTenantByHostname };
```

---

### 3. `vite.config.ts`

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  base: "/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

---

### 4. `package.json` (Dependências essenciais)

```json
{
  "name": "via-fatto-painel-external",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.0",
    "@radix-ui/react-accordion": "^1.2.0",
    "@radix-ui/react-alert-dialog": "^1.1.1",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-checkbox": "^1.1.1",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-popover": "^1.1.1",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-scroll-area": "^1.1.0",
    "@radix-ui/react-select": "^2.1.1",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.1",
    "@radix-ui/react-tooltip": "^1.1.4",
    "@supabase/supabase-js": "^2.87.1",
    "@tanstack/react-query": "^5.56.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.462.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.53.0",
    "react-router-dom": "^6.26.2",
    "recharts": "^2.12.7",
    "sonner": "^1.5.0",
    "tailwind-merge": "^2.5.2",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react-swc": "^3.5.0",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.0",
    "vite": "^5.1.0"
  }
}
```

---

## Checklist de Arquivos para Copiar

### Arquivos de Configuração (copiar como estão)
- [x] `tailwind.config.ts`
- [x] `tsconfig.json`
- [x] `postcss.config.js`
- [x] `index.html`

### Styles (copiar como estão)
- [x] `src/index.css`
- [x] `src/App.css`

### Main Entry Points
- [x] `src/main.tsx`
- [x] `src/App.tsx`
- [x] `src/vite-env.d.ts`

### Contexts (copiar como estão)
- [x] `src/contexts/AuthContext.tsx`
- [ ] `src/contexts/TenantContext.tsx` → **USAR VERSÃO LIMPA ACIMA**

### Components Core (copiar como estão)
- [x] `src/components/AdminRoutes.tsx`
- [x] `src/components/ScrollToTop.tsx`
- [x] `src/components/AppErrorBoundary.tsx`
- [x] `src/components/RealtimeSyncProvider.tsx`
- [x] `src/components/tenant/TenantGate.tsx`

### Admin Components (copiar como estão)
- [x] `src/components/admin/AdminLayout.tsx`
- [x] `src/components/admin/AdminSidebar.tsx`
- [x] `src/components/admin/AdminHeader.tsx`
- [x] `src/components/admin/AdminLink.tsx`
- [x] `src/components/admin/DashboardCharts.tsx`
- [x] `src/components/admin/ImportProgressBar.tsx`

### UI Components (copiar diretório inteiro)
- [x] `src/components/ui/*` (todos os shadcn components)

### Hooks (copiar como estão)
- [x] `src/hooks/useAdminRoutes.ts`
- [x] `src/hooks/useAdminNavigation.ts`
- [x] `src/hooks/usePermissions.ts`
- [x] `src/hooks/useProfile.ts`
- [x] `src/hooks/useSupabaseData.ts`
- [x] `src/hooks/useUnreadCount.ts`
- [x] `src/hooks/useRealtimeSync.ts`
- [x] `src/hooks/useBrandColors.ts`
- [x] `src/hooks/useFavicon.ts`
- [x] `src/hooks/use-mobile.tsx`
- [x] `src/hooks/use-toast.ts`

### Pages (copiar como estão)
- [x] `src/pages/NotFound.tsx`
- [x] `src/pages/admin/*` (todo o diretório)

### Lib (copiar como estão)
- [x] `src/lib/utils.ts`
- [x] `src/lib/constants.ts`
- [x] `src/lib/gtmEvents.ts`
- [x] `src/lib/imageCompression.ts`
- [x] `src/lib/seo.ts`

### Supabase Client
- [ ] `src/integrations/supabase/client.ts` → **USAR VERSÃO LIMPA ACIMA**
- [x] `src/integrations/supabase/types.ts` (copiar como está)

---

## Garantias Implementadas

### ✅ Nenhuma dependência de plataformas externas
- `vite.config.ts` não usa plugins desnecessários
- `supabase/client.ts` usa variáveis de ambiente padrão

### ✅ Nenhum DEV_TENANT_ID
- `TenantContext.tsx` resolve APENAS por hostname
- Sem fallback para desenvolvimento

### ✅ Resolução de tenant por domains
- Query: `domains.hostname = hostname AND type = 'admin' AND verified = true`

### ✅ Todas as queries filtram por tenant_id
- `useProperties` → `.eq('tenant_id', tenantId)`
- `useSiteConfig` → `.eq('tenant_id', tenantId)`
- `useSimilarProperties` → `.eq('tenant_id', tenantId)`

### ✅ Painel funcional com variáveis de ambiente
- Apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` necessários

---

## Teste de Sincronização

Após configurar o projeto:

1. **No Painel**: Alterar `hero_title` em Designer
2. **Verificar no Supabase**: Query `SELECT hero_title FROM site_config WHERE tenant_id = 'f136543f-bace-4e46-9908-d7c8e7e0982f'`
3. **No Site Público**: Atualizar página e verificar título

---

## Configuração de Domínio

Para o painel funcionar, adicione o domínio na tabela `domains`:

```sql
INSERT INTO public.domains (hostname, tenant_id, type, verified, is_primary)
VALUES (
  'painel.viafatto.com.br',
  'f136543f-bace-4e46-9908-d7c8e7e0982f',
  'admin',
  true,
  true
);
```

---

## Suporte

Após criar o projeto e copiar os arquivos:
1. Execute `npm install` ou `bun install`
2. Configure o `.env`
3. Execute `npm run dev`
4. Acesse via hostname configurado na tabela domains
