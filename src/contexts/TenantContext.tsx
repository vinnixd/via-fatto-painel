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

// Em ambiente dev, usar tenant Via Fatto
const DEV_TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

/**
 * Resolve tenant by hostname from domains table
 */
async function resolveTenantByHostname(hostname: string, type: 'admin' | 'public' = 'admin'): Promise<{
  tenant: Tenant | null;
  domain: Domain | null;
  error: string | null;
}> {
  try {
    // Query domains table for this hostname using rpc or direct query
    // Using any to bypass TypeScript restrictions for new tables
    const { data: domainData, error: domainError } = await (supabase as any)
      .from('domains')
      .select('*')
      .eq('hostname', hostname.toLowerCase())
      .eq('type', type)
      .maybeSingle();

    if (domainError) {
      console.error('Error querying domains:', domainError);
      // If table doesn't exist yet, treat as not found
      if (domainError.code === 'PGRST204' || domainError.message?.includes('relation')) {
        return { tenant: null, domain: null, error: 'DOMAIN_NOT_FOUND' };
      }
    }

    if (!domainData) {
      // Try without type restriction for fallback
      const { data: anyDomain } = await (supabase as any)
        .from('domains')
        .select('*')
        .eq('hostname', hostname.toLowerCase())
        .maybeSingle();

      if (!anyDomain) {
        return { 
          tenant: null, 
          domain: null, 
          error: 'DOMAIN_NOT_FOUND' 
        };
      }

      // Domain exists but wrong type
      if (anyDomain.type !== type) {
        return {
          tenant: null,
          domain: anyDomain as Domain,
          error: 'WRONG_DOMAIN_TYPE'
        };
      }

      // Domain exists but not verified
      if (!anyDomain.verified) {
        return {
          tenant: null,
          domain: anyDomain as Domain,
          error: 'DOMAIN_NOT_VERIFIED'
        };
      }
    }

    const domain = domainData as Domain;

    // Check if domain is verified
    if (!domain.verified) {
      return {
        tenant: null,
        domain,
        error: 'DOMAIN_NOT_VERIFIED'
      };
    }

    // Fetch tenant details
    const { data: tenantData, error: tenantError } = await (supabase as any)
      .from('tenants')
      .select('*')
      .eq('id', domain.tenant_id)
      .single();

    if (tenantError || !tenantData) {
      return {
        tenant: null,
        domain,
        error: 'TENANT_NOT_FOUND'
      };
    }

    // Check tenant status
    if (tenantData.status !== 'active') {
      return {
        tenant: tenantData as Tenant,
        domain,
        error: 'TENANT_INACTIVE'
      };
    }

    return {
      tenant: tenantData as Tenant,
      domain,
      error: null
    };
  } catch (err) {
    console.error('Error resolving tenant:', err);
    return {
      tenant: null,
      domain: null,
      error: 'RESOLUTION_ERROR'
    };
  }
}

/**
 * Get user's role in the current tenant
 */
async function getUserTenantRole(tenantId: string, userId: string): Promise<'owner' | 'admin' | 'agent' | null> {
  try {
    const { data, error } = await (supabase as any)
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
    
    // Debug log for tenant resolution
    if (import.meta.env.DEV) {
      console.log('[TenantContext] Resolving tenant for hostname:', hostname);
    }
    
    // Skip resolution for localhost and lovable dev environments (use stored tenant or default)
    const isDevEnvironment = hostname.includes('localhost') || 
      hostname.includes('lovable.app') || 
      hostname.includes('lovableproject.com');
    
    if (isDevEnvironment) {
      // In dev, ALWAYS use Via Fatto tenant to ensure consistency with public site
      // Ignore stored tenant to prevent mismatch issues
      console.log('[TenantContext] Dev environment - using Via Fatto tenant:', DEV_TENANT_ID);
      
      // Get Via Fatto tenant for dev - ensure same tenant as public site
      try {
        const { data: viaFattoTenant, error: tenantError } = await (supabase as any)
          .from('tenants')
          .select('*')
          .eq('id', DEV_TENANT_ID)
          .maybeSingle();

        if (tenantError || !viaFattoTenant) {
          console.log('Could not fetch Via Fatto tenant, using fallback');
          // Fallback: use the tenant ID even if we can't fetch full details
          const devTenant: Tenant = {
            id: DEV_TENANT_ID,
            name: 'Via Fatto Imóveis',
            slug: 'via-fatto',
            status: 'active'
          };
          setTenant(devTenant);
          localStorage.setItem(TENANT_STORAGE_KEY, devTenant.id);
          setIsResolved(true);
          setLoading(false);
          return;
        }

        setTenant(viaFattoTenant as Tenant);
        localStorage.setItem(TENANT_STORAGE_KEY, viaFattoTenant.id);
        setIsResolved(true);
      } catch (e) {
        console.log('Error fetching tenant, using Via Fatto fallback');
        const devTenant: Tenant = {
          id: DEV_TENANT_ID,
          name: 'Via Fatto Imóveis',
          slug: 'via-fatto',
          status: 'active'
        };
        setTenant(devTenant);
        localStorage.setItem(TENANT_STORAGE_KEY, devTenant.id);
        setIsResolved(true);
      }
      
      setLoading(false);
      return;
    }

    // Production: resolve by hostname - try admin first, then public
    // Detect if this is a painel subdomain
    const isAdminSubdomain = hostname.startsWith('painel.');
    const domainType = isAdminSubdomain ? 'admin' : 'public';
    
    let result = await resolveTenantByHostname(hostname, domainType);
    
    // If not found with primary type, try the other type as fallback
    if (result.error === 'DOMAIN_NOT_FOUND' || result.error === 'WRONG_DOMAIN_TYPE') {
      const fallbackType = domainType === 'admin' ? 'public' : 'admin';
      result = await resolveTenantByHostname(hostname, fallbackType);
    }
    
    setTenant(result.tenant);
    setDomain(result.domain);
    setError(result.error);
    setIsResolved(result.tenant !== null);

    if (result.tenant) {
      localStorage.setItem(TENANT_STORAGE_KEY, result.tenant.id);
      // Debug log for successful resolution
      if (import.meta.env.DEV) {
        console.log('[TenantContext] Tenant resolved:', {
          hostname,
          tenant_id: result.tenant.id,
          tenant_name: result.tenant.name,
          domain_type: result.domain?.type
        });
      }
    }

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
