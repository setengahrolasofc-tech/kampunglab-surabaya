#!/usr/bin/env bash
# Hapus file di src/ yang tidak ada di Rev. 4 (sisa alur lama).
# Jalankan dari root repo. Tanpa argumen = hanya menampilkan daftar (dry run).
# Dengan --hapus = benar-benar menghapus.
set -euo pipefail
[ -d src ] || { echo "Jalankan dari root repo (folder yang berisi src/)."; exit 1; }
MANIFEST=$(mktemp)
cat > "$MANIFEST" <<'LIST'
src/app/admin/actions.ts
src/app/admin/audit/page.tsx
src/app/admin/blacklist/page.tsx
src/app/admin/mandat/page.tsx
src/app/admin/page.tsx
src/app/admin/parameter/page.tsx
src/app/admin/pengajuan/[id]/page.tsx
src/app/admin/sengketa/page.tsx
src/app/admin/statistik/page.tsx
src/app/auth/actions.ts
src/app/auth/callback/route.ts
src/app/berkas/route.ts
src/app/daftar/page.tsx
src/app/dashboard/actions.ts
src/app/dashboard/page.tsx
src/app/dashboard/pengajuan/[id]/bantuan/page.tsx
src/app/dashboard/pengajuan/[id]/logbook/page.tsx
src/app/dashboard/pengajuan/[id]/page.tsx
src/app/dashboard/pengajuan/[id]/poster/page.tsx
src/app/dashboard/pengajuan/[id]/serah-terima/page.tsx
src/app/dashboard/pengajuan/[id]/uji/page.tsx
src/app/dashboard/pengajuan/baru/page.tsx
src/app/dokumen/page.tsx
src/app/etalase/[id]/actions.ts
src/app/etalase/[id]/page.tsx
src/app/etalase/page.tsx
src/app/globals.css
src/app/icon.svg
src/app/kelurahan/actions.ts
src/app/kelurahan/masalah/page.tsx
src/app/kelurahan/page.tsx
src/app/kelurahan/pengajuan/[id]/page.tsx
src/app/layout.tsx
src/app/lupa-kata-sandi/page.tsx
src/app/masuk/page.tsx
src/app/menunggu-verifikasi/page.tsx
src/app/not-found.tsx
src/app/notifikasi/actions.ts
src/app/notifikasi/page.tsx
src/app/page.tsx
src/app/panduan/page.tsx
src/app/papan-masalah/page.tsx
src/app/rapor/[id]/page.tsx
src/app/ubah-kata-sandi/page.tsx
src/app/uji/[id]/actions.ts
src/app/uji/[id]/page.tsx
src/app/verifikasi/page.tsx
src/components/auth-forms.tsx
src/components/berkas-link.tsx
src/components/flash.tsx
src/components/innovation-views.tsx
src/components/logo.tsx
src/components/new-draft-form.tsx
src/components/notification-bell.tsx
src/components/print-button.tsx
src/components/project-nav.tsx
src/components/site-chrome.tsx
src/components/submit-button.tsx
src/components/survey-form.tsx
src/components/ui.tsx
src/components/upload-field.tsx
src/lib/auth/session.ts
src/lib/auth/surabaya-areas.mjs
src/lib/auth/types.ts
src/lib/auth/validation.mjs
src/lib/client-ip.ts
src/lib/domain/format.mjs
src/lib/domain/innovation-rules.mjs
src/lib/domain/survey.mjs
src/lib/domain/workflow.mjs
src/lib/errors.ts
src/lib/flash.ts
src/lib/form.ts
src/lib/loaders.ts
src/lib/supabase/admin.ts
src/lib/supabase/browser.ts
src/lib/supabase/config.mjs
src/lib/supabase/public.ts
src/lib/supabase/server.ts
src/lib/templates.ts
src/lib/types.ts
src/proxy.ts
LIST
EXTRA=$(find src -type f | sed 's#^\./##' | sort | comm -23 - "$MANIFEST" || true)
if [ -z "$EXTRA" ]; then echo "Tidak ada file lama. src/ sudah bersih."; exit 0; fi
echo "$EXTRA"; echo "--- $(echo "$EXTRA" | wc -l) file bukan bagian Rev. 4"
if [ "${1:-}" = "--hapus" ]; then
  echo "$EXTRA" | while IFS= read -r f; do rm -f -- "$f"; done
  find src -type d -empty -delete
  echo "Selesai dihapus. Lanjut: git add -A && git commit -m 'bersihkan file lama' && git push"
else
  echo "Dry run. Jalankan lagi dengan: bash bersihkan-src.sh --hapus"
fi
