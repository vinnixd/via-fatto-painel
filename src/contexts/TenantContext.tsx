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
  userRoleLoading: boolean;
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

// Fallback para ambientes de desenvolvimento/preview quando nenhum domínio é encontrado
// IMPORTANTE: Este ID deve existir na tabela tenants com status='active'
// MIGRADO em 2026-01-25: Via Fatto agora usa f136543f-bace-4e46-9908-d7c8e7e0982f
const DEV_FALLBACK_TENANT_ID = 'f136543f-bace-4e46-9908-d7c8e7e0982f';

type ResolutionReason = 'domains' | 'localStorage' | 'devFallback' | 'error';

interface ResolutionResult {
  tenantId: string | null;
  tenant: Tenant | null;
  domain: Domain | null;
  error: string | null;
  reason: ResolutionReason;
}

function isDevEnvironment(hostname: string): boolean {
  // Considera dev se tiver localhost, lovable, ou não tiver TLD real
  const devIndicators = ['localhost', 'lovable.app', 'lovableproject.com', '127.0.0.1'];
  return devIndicators.some(indicator => hostname.includes(indicator));
}

function isProductionDomain(hostname: string): boolean {
  // Produção se NÃO for dev E tiver um TLD válido
  return !isDevEnvironment(hostname) && hostname.includes('.');
}

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

async function resolveWithLogging(hostname: string): Promise<ResolutionResult> {
  const isDev = import.meta.env.DEV;
  const isDevEnv = isDevEnvironment(hostname);
  const isProd = isProductionDomain(hostname);
  
  if (isDev) {
    // Log do projeto Supabase para verificação de sincronização entre projetos
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseProjectId = supabaseUrl.replace('https://', '').split('.')[0];
    console.log('[TenantContext] ═══════════════════════════════════════');
    console.log('[TenantContext] 🔗 SUPABASE_PROJECT_ID:', supabaseProjectId);
    console.log('[TenantContext] Iniciando resolução de tenant');
    console.log('[TenantContext] hostname:', hostname);
    console.log('[TenantContext] isDevEnvironment:', isDevEnv);
    console.log('[TenantContext] isProductionDomain:', isProd);
  }

  // ========== PRIORIDADE 1: DOMAINS (SEMPRE) ==========
  const hostnameResult = await resolveTenantByHostname(hostname);
  
  if (isDev) {
    console.log('[TenantContext] tenant_id_from_domains:', hostnameResult.tenant?.id ?? 'null');
  }

  if (hostnameResult.tenant && !hostnameResult.error) {
    // CRITICAL: Se encontrou por domains, SEMPRE sobrescrever localStorage
    localStorage.setItem(TENANT_STORAGE_KEY, hostnameResult.tenant.id);
    
    if (isDev) {
      console.log('[TenantContext] ✓ Tenant resolvido por DOMAINS');
      console.log('[TenantContext] ✓ localStorage SOBRESCRITO com:', hostnameResult.tenant.id);
      console.log('[TenantContext] tenant_id_final:', hostnameResult.tenant.id);
      console.log('[TenantContext] reason: domains');
      console.log('[TenantContext] ═══════════════════════════════════════');
    }

    return {
      tenantId: hostnameResult.tenant.id,
      tenant: hostnameResult.tenant,
      domain: hostnameResult.domain,
      error: null,
      reason: 'domains'
    };
  }

  // Se é PRODUÇÃO e domains falhou, NÃO tentar fallbacks - retornar erro
  if (isProd) {
    if (isDev) {
      console.log('[TenantContext] ✗ PRODUÇÃO: domains falhou, bloqueando fallbacks');
      console.log('[TenantContext] tenant_id_final: null');
      console.log('[TenantContext] reason: error (production domain not configured)');
      console.log('[TenantContext] ═══════════════════════════════════════');
    }

    return {
      tenantId: null,
      tenant: null,
      domain: hostnameResult.domain,
      error: hostnameResult.error,
      reason: 'error'
    };
  }

  // ========== PRIORIDADE 2: LOCALSTORAGE (APENAS DEV) ==========
  const storedTenantId = localStorage.getItem(TENANT_STORAGE_KEY);
  
  if (isDev) {
    console.log('[TenantContext] tenant_id_from_localStorage:', storedTenantId ?? 'null');
  }

  if (storedTenantId) {
    const tenant = await fetchTenantById(storedTenantId);
    
    if (tenant) {
      if (isDev) {
        console.log('[TenantContext] ✓ Tenant resolvido por LOCALSTORAGE (dev fallback)');
        console.log('[TenantContext] tenant_id_final:', tenant.id);
        console.log('[TenantContext] reason: localStorage');
        console.log('[TenantContext] ═══════════════════════════════════════');
      }

      return {
        tenantId: tenant.id,
        tenant,
        domain: null,
        error: null,
        reason: 'localStorage'
      };
    }
  }

  // ========== PRIORIDADE 3: DEV_FALLBACK (APENAS DEV) ==========
  const fallbackTenant = await fetchTenantById(DEV_FALLBACK_TENANT_ID);
  
  if (fallbackTenant) {
    // Salvar no localStorage para próximas sessões
    localStorage.setItem(TENANT_STORAGE_KEY, DEV_FALLBACK_TENANT_ID);
    
    if (isDev) {
      console.log('[TenantContext] ✓ Tenant resolvido por DEV_FALLBACK (dev fallback)');
      console.log('[TenantContext] ✓ localStorage DEFINIDO com:', DEV_FALLBACK_TENANT_ID);
      console.log('[TenantContext] tenant_id_final:', DEV_FALLBACK_TENANT_ID);
      console.log('[TenantContext] reason: devFallback');
      console.log('[TenantContext] ═══════════════════════════════════════');
    }

    return {
      tenantId: DEV_FALLBACK_TENANT_ID,
      tenant: fallbackTenant,
      domain: null,
      error: null,
      reason: 'devFallback'
    };
  }

  // Todos os fallbacks falharam
  if (isDev) {
    console.log('[TenantContext] ✗ ERRO: todos os métodos de resolução falharam');
    console.log('[TenantContext] tenant_id_final: null');
    console.log('[TenantContext] reason: error');
    console.log('[TenantContext] ═══════════════════════════════════════');
  }

  return {
    tenantId: null,
    tenant: null,
    domain: null,
    error: 'ALL_RESOLUTION_METHODS_FAILED',
    reason: 'error'
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
  const [userRoleLoading, setUserRoleLoading] = useState(true);

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
      setUserRoleLoading(true);
      
      if (!tenant?.id) {
        setUserRole(null);
        setUserRoleLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setUserRole(null);
        setUserRoleLoading(false);
        return;
      }

      const role = await getUserTenantRole(tenant.id, user.id);
      setUserRole(role);
      setUserRoleLoading(false);
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
        userRoleLoading,
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
