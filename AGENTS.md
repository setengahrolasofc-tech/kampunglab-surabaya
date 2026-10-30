<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## KampungLab project rules

- Read `PRD_KampungLab_Surabaya_v1.md` and `docs/PROJECT_STATUS.md` before changing product behavior.
- Distinguish handbook requirements, implementation proposals, and unresolved `D-xx` decisions. Do not silently approve policy proposals.
- Inspect actual files, schema, cloud projects, and account permissions. Never invent an existing table, API, migration, or integration.
- KampungLab records decisions and external fund transfers. Do not add wallets, payment gateways, automatic disbursement, or automatic approvals.
- Privileged roles require verified, scoped mandates. A role selected on registration is not authorization.
- The repository is public. Never commit secrets, real participant data, official identity documents, or financial evidence.
- Read the installed Next.js documentation for the APIs being used. Keep dependency versions exact and commit `package-lock.json`.
- Use Server Components by default; introduce client state only for a real interaction.
- Run relevant lint, typecheck, and build checks. Report browser/UAT, database, and deployment verification separately and honestly.
- Keep interface text in Indonesian. The current visual identity is provisional.
