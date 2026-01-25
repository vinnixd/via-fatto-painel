-- Add UNIQUE constraint on site_config.tenant_id to prevent duplicates
-- First check if there are duplicates and keep only the most recent
WITH ranked_configs AS (
  SELECT id, tenant_id,
    ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY updated_at DESC) as rn
  FROM site_config
  WHERE tenant_id IS NOT NULL
)
DELETE FROM site_config
WHERE id IN (
  SELECT id FROM ranked_configs WHERE rn > 1
);

-- Add unique constraint
ALTER TABLE site_config
ADD CONSTRAINT site_config_tenant_id_unique UNIQUE (tenant_id);