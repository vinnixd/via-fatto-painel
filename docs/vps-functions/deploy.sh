#!/bin/bash
# Deploy all AI Edge Functions to external Supabase
# Usage: bash deploy.sh
# Requires: supabase CLI linked to the external project

set -e

FUNCTIONS=(
  "improve-title"
  "improve-description"
  "batch-improve-descriptions"
  "generate-seo"
  "batch-generate-seo"
  "generate-blog-seo"
)

echo "=== Deploying AI Edge Functions (OpenAI) ==="
echo ""

for fn in "${FUNCTIONS[@]}"; do
  echo "Deploying: $fn..."
  supabase functions deploy "$fn"
  echo "✓ $fn deployed"
  echo ""
done

echo "=== All functions deployed successfully ==="
echo ""
echo "Required secrets (set via: supabase secrets set KEY=VALUE):"
echo "  - OPENAI_API_KEY"
echo "  - SUPABASE_URL"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
