-- Adicionar external_id em portal_publicacoes
ALTER TABLE public.portal_publicacoes 
  ADD COLUMN external_id text;

-- Índice para busca por external_id
CREATE INDEX idx_portal_publicacoes_external_id 
  ON public.portal_publicacoes (portal_id, external_id);

-- Comentário para documentação
COMMENT ON COLUMN public.portal_publicacoes.external_id IS 'ID do anúncio no portal externo para referência';