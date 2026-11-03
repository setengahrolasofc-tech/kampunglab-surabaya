#!/usr/bin/env bash
# Menguji migrasi Rev. 4 + alur kerja end-to-end di PostgreSQL biasa (tanpa Supabase).
# Prasyarat: PostgreSQL 15+ berjalan, dan pengguna saat ini boleh membuat database (atau jalankan dengan sudo -u postgres).
# Pakai:  PSQL="psql -U postgres" bash supabase/tests/run-local.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
PSQL="${PSQL:-psql}"
$PSQL -q -v ON_ERROR_STOP=1 -f supabase/tests/mock-supabase.sql 2>&1 | grep -v NOTICE || true
$PSQL -q -v ON_ERROR_STOP=1 -d kl -f supabase/migrations/20261103090000_rev4_core.sql
$PSQL -q -v ON_ERROR_STOP=1 -d kl -f supabase/tests/rev4_workflow.sql
