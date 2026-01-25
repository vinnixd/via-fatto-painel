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

// Fallback para ambientes de desenvolvimento/preview quando nenhum domínio é encontrado
// IMPORTANTE: Este valor DEVE ser idêntico no Site Público e no Painel Admin
const DEV_FALLBACK_TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

type ResolutionReason = 'domains' | 'localStorage' | 'devFallback';

interface ResolutionResult {
  tenantId: string | null;
  tenant: Tenant | null;
  domain: Domain | null;
  error: string | null;
  reason: ResolutionReason;
}

/**
 * Verifica se o hostname é um ambiente de desenvolvimento/preview
 */
function isDevEnvironment(hostname: string): boolean {
  return hostname.includes('localhost') || 
    hostname.includes('lovable.app') || 
    hostname.includes('lovableproject.com');
}

/**
 * Detecta o tipo de domínio esperado baseado no hostname
 */
function detectDomainType(hostname: string): 'admin' | 'public' {
  return hostname.startsWith('painel.') ? 'admin' : 'public';
}

/**
 * Busca tenant pelo ID
 */
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

/**
 * PRIORIDADE 1: Resolve tenant por hostname via tabela domains
 */
async function resolveTenantByHostname(hostname: string): Promise<{
  tenant: Tenant | null;
  domain: Domain | null;
  error: string | null;
}> {
  const domainType = detectDomainType(hostname);
  
  try {
    // Buscar domínio verificado pelo hostname
    const { data: domainData, error: domainError } = await supabase
      .from('domains')
      .select('*')
      .eq('hostname', hostname.toLowerCase())
      .eq('verified', true)
      .maybeSingle();

    if (domainError) {
      // Se tabela não existe ou outro erro
      if (domainError.code === 'PGRST204' || domainError.message?.includes('relation')) {
        return { tenant: null, domain: null, error: 'DOMAIN_TABLE_ERROR' };
      }
      console.error('[TenantContext] Erro ao buscar domínio:', domainError);
      return { tenant: null, domain: null, error: 'DOMAIN_QUERY_ERROR' };
    }

    if (!domainData) {
      // Tentar buscar sem filtro de verificação para dar feedback adequado
      const { data: unverifiedDomain } = await supabase
        .from('domains')
        .select('*')
        .eq('hostname', hostname.toLowerCase())
        .maybeSingle();

      if (unverifiedDomain && !unverifiedDomain.verified) {
        return {
          tenant: null,
          domain: unverifiedDomain as Domain,
          error: 'DOMAIN_NOT_VERIFIED'
        };
      }

      return { tenant: null, domain: null, error: 'DOMAIN_NOT_FOUND' };
    }

    const domain = domainData as Domain;

    // Validar tipo de domínio (admin vs public)
    if (domain.type !== domainType) {
      console.warn(`[TenantContext] Tipo de domínio incorreto: esperado ${domainType}, encontrado ${domain.type}`);
      // Ainda assim permitir acesso, apenas logando o warning
    }

    // Buscar dados do tenant
    const tenant = await fetchTenantById(domain.tenant_id);
    
    if (!tenant) {
      return {
        tenant: null,
        domain,
        error: 'TENANT_NOT_FOUND'
      };
    }

    return { tenant, domain, error: null };
  } catch (err) {
    console.error('[TenantContext] Erro na resolução por hostname:', err);
    return { tenant: null, domain: null, error: 'RESOLUTION_ERROR' };
  }
}

/**
 * PRIORIDADE 2: Fallback para localStorage
 */
async function resolveTenantFromStorage(): Promise<{
  tenant: Tenant | null;
  tenantId: string | null;
}> {
  const storedTenantId = localStorage.getItem(TENANT_STORAGE_KEY);
  
  if (!storedTenantId) {
    return { tenant: null, tenantId: null };
  }

  const tenant = await fetchTenantById(storedTenantId);
  return { tenant, tenantId: storedTenantId };
}

/**
 * PRIORIDADE 3: Fallback para DEV_FALLBACK_TENANT_ID
 */
async function resolveTenantFromDevFallback(): Promise<{
  tenant: Tenant | null;
  tenantId: string;
}> {
  const tenant = await fetchTenantById(DEV_FALLBACK_TENANT_ID);
  return { tenant, tenantId: DEV_FALLBACK_TENANT_ID };
}

/**
 * Resolver tenant com logging detalhado
 */
async function resolveWithLogging(hostname: string): Promise<ResolutionResult> {
  const isDev = import.meta.env.DEV;
  const isDevEnv = isDevEnvironment(hostname);
  
  // Log inicial
  if (isDev) {
    console.log('[TenantContext] ═══════════════════════════════════════');
    console.log('[TenantContext] Iniciando resolução de tenant');
    console.log('[TenantContext] hostname:', hostname);
    console.log('[TenantContext] isDevEnvironment:', isDevEnv);
  }

  // PRIORIDADE 1: Tentar resolver por hostname (sempre, mesmo em dev)
  const hostnameResult = await resolveTenantByHostname(hostname);
  
  if (isDev) {
    console.log('[TenantContext] tenant_id_from_domains:', hostnameResult.tenant?.id ?? 'null');
  }

  // Se encontrou domínio verificado, usar esse tenant
  if (hostnameResult.tenant && !hostnameResult.error) {
    // Salvar no localStorage para fallback futuro
    localStorage.setItem(TENANT_STORAGE_KEY, hostnameResult.tenant.id);
    
    if (isDev) {
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

  // Se domínio não encontrado mas é ambiente de produção, retornar erro
  if (!isDevEnv && hostnameResult.error) {
    if (isDev) {
      console.log('[TenantContext] tenant_id_final: null (produção sem domínio)');
      console.log('[TenantContext] reason: error');
      console.log('[TenantContext] ═══════════════════════════════════════');
    }

    return {
      tenantId: null,
      tenant: null,
      domain: hostnameResult.domain,
      error: hostnameResult.error,
      reason: 'domains'
    };
  }

  // PRIORIDADE 2: Ambiente dev/preview - tentar localStorage
  const storageResult = await resolveTenantFromStorage();
  
  if (isDev) {
    console.log('[TenantContext] tenant_id_from_localStorage:', storageResult.tenantId ?? 'null');
  }

  if (storageResult.tenant) {
    if (isDev) {
      console.log('[TenantContext] tenant_id_final:', storageResult.tenant.id);
      console.log('[TenantContext] reason: localStorage');
      console.log('[TenantContext] ═══════════════════════════════════════');
    }

    return {
      tenantId: storageResult.tenant.id,
      tenant: storageResult.tenant,
      domain: null,
      error: null,
      reason: 'localStorage'
    };
  }

  // PRIORIDADE 3: Usar DEV_FALLBACK_TENANT_ID como último recurso
  const fallbackResult = await resolveTenantFromDevFallback();
  
  if (fallbackResult.tenant) {
    localStorage.setItem(TENANT_STORAGE_KEY, fallbackResult.tenantId);
  }

  if (isDev) {
    console.log('[TenantContext] tenant_id_final:', fallbackResult.tenantId);
    console.log('[TenantContext] reason: devFallback');
    console.log('[TenantContext] ═══════════════════════════════════════');
  }

  return {
    tenantId: fallbackResult.tenantId,
    tenant: fallbackResult.tenant,
    domain: null,
    error: fallbackResult.tenant ? null : 'FALLBACK_TENANT_NOT_FOUND',
    reason: 'devFallback'
  };
}

/**
 * Get user's role in the current tenant
 */
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
