-- ============================================
-- FASE 2: Criar tabela portal_jobs
-- ============================================

-- Tabela portal_jobs para fila assíncrona
CREATE TABLE IF NOT EXISTS public.portal_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id uuid NOT NULL REFERENCES public.portais(id) ON DELETE CASCADE,
  imovel_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('publish', 'update', 'pause', 'delete')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'done', 'error')),
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  next_run_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para performance da fila
CREATE INDEX IF NOT EXISTS idx_portal_jobs_queue ON public.portal_jobs (portal_id, status, next_run_at);
CREATE INDEX IF NOT EXISTS idx_portal_jobs_imovel ON public.portal_jobs (imovel_id);

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_portal_jobs_updated_at ON public.portal_jobs;
CREATE TRIGGER update_portal_jobs_updated_at
  BEFORE UPDATE ON public.portal_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para portal_jobs (apenas admins - edge functions usam service_role que bypassa RLS)
ALTER TABLE public.portal_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage portal_jobs" ON public.portal_jobs;
CREATE POLICY "Admins can manage portal_jobs"
  ON public.portal_jobs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Comentários para documentação
COMMENT ON TABLE public.portal_jobs IS 'Fila assíncrona para operações de push nos portais imobiliários';
COMMENT ON COLUMN public.portal_jobs.action IS 'Ação: publish (novo), update (atualizar), pause (pausar), delete (remover)';
COMMENT ON COLUMN public.portal_jobs.status IS 'Status: queued (aguardando), processing (em execução), done (concluído), error (falhou)';