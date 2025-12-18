import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthly_price: number;
  annual_price: number;
  max_users: number;
  max_properties: number;
  features: string[];
  is_active: boolean;
}

export interface Subscription {
  id: string;
  plan_id: string | null;
  billing_cycle: 'monthly' | 'annual';
  status: 'active' | 'canceled' | 'suspended' | 'trial';
  started_at: string;
  expires_at: string | null;
  fiscal_name: string | null;
  fiscal_document: string | null;
  fiscal_cep: string | null;
  fiscal_state: string | null;
  fiscal_city: string | null;
  fiscal_neighborhood: string | null;
  fiscal_street: string | null;
  fiscal_number: string | null;
  fiscal_complement: string | null;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
}

export interface Invoice {
  id: string;
  subscription_id: string | null;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'canceled';
  due_date: string;
  paid_at: string | null;
  payment_method: string | null;
  invoice_number: string | null;
  created_at: string;
}

// Fetch all plans
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('monthly_price', { ascending: true });
      
      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });
}

// Fetch current subscription with plan details
export function useCurrentSubscription() {
  return useQuery({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as Subscription | null;
    },
  });
}

// Fetch invoices
export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('due_date', { ascending: false });
      
      if (error) throw error;
      return data as Invoice[];
    },
  });
}

// Update fiscal data
export function useUpdateFiscalData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fiscalData: {
      fiscal_name: string;
      fiscal_document: string;
      fiscal_cep: string;
      fiscal_state: string;
      fiscal_city: string;
      fiscal_neighborhood: string;
      fiscal_street: string;
      fiscal_number: string;
      fiscal_complement?: string;
    }) => {
      // Get the current subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id')
        .limit(1)
        .single();

      if (!subscription) throw new Error('Nenhuma assinatura encontrada');

      const { error } = await supabase
        .from('subscriptions')
        .update(fiscalData)
        .eq('id', subscription.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      toast.success('Dados fiscais salvos com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao salvar dados fiscais: ' + error.message);
    },
  });
}

// Update billing cycle
export function useUpdateBillingCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (billingCycle: 'monthly' | 'annual') => {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id')
        .limit(1)
        .single();

      if (!subscription) throw new Error('Nenhuma assinatura encontrada');

      const { error } = await supabase
        .from('subscriptions')
        .update({ billing_cycle: billingCycle })
        .eq('id', subscription.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      toast.success('Ciclo de cobrança atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar ciclo: ' + error.message);
    },
  });
}
