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
    // Query domains table for this hostname
    const { data: domainData, error: domainError } = await supabase
      .from('domains')
      .select('*')
      .eq('hostname', hostname.toLowerCase())
      .eq('type', type)
      .single();

    if (domainError || !domainData) {
      // Try without type restriction for fallback
      const { data: anyDomain } = await supabase
        .from('domains')
        .select('*')
        .eq('hostname', hostname.toLowerCase())
        .single();

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
    const { data: tenantData, error: tenantError } = await supabase
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
    const { data, error } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single();

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
    
    // Skip resolution for localhost and lovable.app (use stored tenant or default)
    const isDevEnvironment = hostname.includes('localhost') || hostname.includes('lovable.app');
    
    if (isDevEnvironment) {
      // In dev, try to get stored tenant or use default
      const storedTenantId = localStorage.getItem(TENANT_STORAGE_KEY);
      
      if (storedTenantId) {
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', storedTenantId)
          .single();

        if (tenantData) {
          setTenant(tenantData as Tenant);
          setIsResolved(true);
          setLoading(false);
          return;
        }
      }

      // Get first available tenant for dev
      const { data: firstTenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('status', 'active')
        .limit(1)
        .single();

      if (firstTenant) {
        setTenant(firstTenant as Tenant);
        localStorage.setItem(TENANT_STORAGE_KEY, firstTenant.id);
        setIsResolved(true);
      } else {
        setError('NO_TENANT_AVAILABLE');
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
