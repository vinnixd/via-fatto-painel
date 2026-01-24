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
    
    // Skip resolution for localhost and lovable dev environments (use stored tenant or default)
    const isDevEnvironment = hostname.includes('localhost') || 
      hostname.includes('lovable.app') || 
      hostname.includes('lovableproject.com');
    
    if (isDevEnvironment) {
      // In dev, try to get stored tenant or use default
      const storedTenantId = localStorage.getItem(TENANT_STORAGE_KEY);
      
      if (storedTenantId) {
        try {
          const { data: tenantData } = await (supabase as any)
            .from('tenants')
            .select('*')
            .eq('id', storedTenantId)
            .maybeSingle();

          if (tenantData) {
            setTenant(tenantData as Tenant);
            setIsResolved(true);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.log('Could not fetch stored tenant, trying first available');
        }
      }

      // Get first available tenant for dev - using service role context
      // Since RLS blocks non-members, we'll set a default tenant for dev mode
      try {
        const { data: firstTenant, error: tenantError } = await (supabase as any)
          .from('tenants')
          .select('*')
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();

        if (tenantError) {
          console.log('RLS blocking tenant fetch, setting dev mode tenant');
          // Create a default dev tenant object for development
          const devTenant: Tenant = {
            id: 'a0000000-0000-0000-0000-000000000001',
            name: 'Minha Imobiliária',
            slug: 'minha-imobiliaria',
            status: 'active'
          };
          setTenant(devTenant);
          localStorage.setItem(TENANT_STORAGE_KEY, devTenant.id);
          setIsResolved(true);
          setLoading(false);
          return;
        }

        if (firstTenant) {
          setTenant(firstTenant as Tenant);
          localStorage.setItem(TENANT_STORAGE_KEY, firstTenant.id);
          setIsResolved(true);
        } else {
          // No tenants exist, create default for dev
          const devTenant: Tenant = {
            id: 'a0000000-0000-0000-0000-000000000001',
            name: 'Minha Imobiliária',
            slug: 'minha-imobiliaria',
            status: 'active'
          };
          setTenant(devTenant);
          localStorage.setItem(TENANT_STORAGE_KEY, devTenant.id);
          setIsResolved(true);
        }
      } catch (e) {
        console.log('Error fetching tenant, using default dev tenant');
        const devTenant: Tenant = {
          id: 'a0000000-0000-0000-0000-000000000001',
          name: 'Minha Imobiliária',
          slug: 'minha-imobiliaria',
          status: 'active'
        };
        setTenant(devTenant);
        localStorage.setItem(TENANT_STORAGE_KEY, devTenant.id);
        setIsResolved(true);
      }
      
      setLoading(false);
      return;
    }

    // Production: resolve by hostname
    const result = await resolveTenantByHostname(hostname, 'admin');
    
    setTenant(result.tenant);
    setDomain(result.domain);
    setError(result.error);
    setIsResolved(result.tenant !== null);

    if (result.tenant) {
      localStorage.setItem(TENANT_STORAGE_KEY, result.tenant.id);
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
