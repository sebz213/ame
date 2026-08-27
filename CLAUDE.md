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
- A RED GATE IS STOP-THE-LINE. No session carries feature work past a
  failing gate without recording what it did about it: fix, waive with a
  spec, or halt and say so. A gate that reads FAIL for a whole session
  becomes background noise, and the first thing that noise hides is the
  next real failure. The failing verdict is the work, not a condition to
  work around.
- A WAIVER IS A SPECIFICATION, NOT A BYPASS. Waiving anything records the
  clause, the measured value against the limit it exceeds, the reason, the
  owner, the date, the reduction target, and the trigger that ends it. A
  waived item stays visible in the gate's output and in its verdict, never
  silent, so a run reads PASS+2W rather than PASS. If it cannot be written
  down that way, it is not a waiver.
- DEPLOYS NEVER DISCOVER. The gate runs in CI as a required check, so a red
  gate blocks the merge and the deploy only ever builds a tree that already
  passed. Deploy is not where a violation should first have consequences,
  and the deploy build command stays the full gated script -- never a
  trimmed one, and least of all under deadline, which is when trimming it
  will look most reasonable.
