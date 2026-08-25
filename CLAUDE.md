# Session contract

Before any edit, read in order: STANDARD.md, tokens/contract.md,
tokens/deliverables.md. For token work also read tokens/invariants.json
and tokens/decisions.md.

Rules that bind every session:
- Thresholds and rule data live in tokens/invariants.json only. Never
  restate a threshold in code, config, or CI.
- One home per concept: no duplicate files, no second implementation,
  no rule stated in two places (STANDARD.md section H).
- A new check enters contract.md, invariants.json, and check.mjs in the
  same change.
- Surfaces bind semantic and component tokens. Only tokens reference
  base tokens.
- Placeholder tokens ([[...]]) never ship: the gate fails on them.
- Prove changes: node packages/ame-tokens/build.mjs && node tokens/check.mjs must
  pass before any change is called done. Every check run appends to
  tokens/runs.log.
- Record judgment calls as dated entries in tokens/decisions.md.
  Do not ask mid-task; decide, record, continue.
