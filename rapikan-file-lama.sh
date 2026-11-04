#!/usr/bin/env sh
# Jalankan dari folder utama proyek:  sh rapikan-file-lama.sh
# Memindahkan sisa alur lama (bukan menghapus permanen) agar `npm test` hijau dan dokumen tidak dobel.
set -e
mkdir -p tests/arsip-alur-lama
for f in admin-validation auth-validation domicile-match draft-schema form-documents simulation-validation territory-areas; do
  [ -f "tests/$f.test.mjs" ] && mv "tests/$f.test.mjs" tests/arsip-alur-lama/
done
[ -f tests/simulation-fixture.mjs ] && mv tests/simulation-fixture.mjs tests/arsip-alur-lama/
# Dokumen yang isinya identik dengan salinan di docs/arsip-alur-lama dihapus dari docs/ (arsipnya tetap ada).
for f in docs/*.md; do
  b=$(basename "$f")
  if [ -f "docs/arsip-alur-lama/$b" ] && cmp -s "$f" "docs/arsip-alur-lama/$b"; then rm "$f"; fi
done
[ -f PRD_KampungLab_Surabaya_v1.md ] && [ -f docs/arsip-alur-lama/PRD_KampungLab_Surabaya_v1.md ] && cmp -s PRD_KampungLab_Surabaya_v1.md docs/arsip-alur-lama/PRD_KampungLab_Surabaya_v1.md && rm PRD_KampungLab_Surabaya_v1.md
echo "Selesai. Jalankan: npm test"
