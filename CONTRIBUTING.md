# Contributing
 
## Install and verify
 
```bash
pnpm install     # Node 24 (.nvmrc), pnpm 11.5.1 (package.json > packageManager)
pnpm gate        # the install test
pnpm gate:fixtures
```
 
`pnpm gate` green **is** the install test. If it fails on a fresh clone, that is a bug in this repository, not in your machine; open an issue with the output.
 
Do not "fix" `examples/violating`. Every mistake in that directory is deliberate, and `gate:fixtures` passes only because the gate still rejects them.
 
The tokens are emitted under a `.portfolio-root` class, which must sit on an ancestor of anything binding them, with `[data-theme="dark"]` under it for the themed aliases.
 
`pnpm build` runs the token build, the gate, and the fixture run in order, which is what CI runs.
 
## The one rule
 
**A new check enters `tokens/contract.md`, `tokens/invariants.json`, and `tokens/check.mjs` in the same change.** A clause not written in the contract does not bind; a clause with no data has nowhere to state its thresholds; a clause with no check is a sentence. All three or none.
 
Two rules follow from it, and both have been broken here and caught:
 
- **No threshold in the checker.** Numbers live in `invariants.json`. Clause Z2 scans `check.mjs` for stray literals and fails on them.
- **No regex typed into rule data.** Rule data holds literal text; patterns are assembled in code, where the escape characters exist once. Clause D3 ratchets the sites that predate the rule, so the count can only fall.
## Changing a token
 
```bash
# edit packages/ame-tokens/{base,semantic,component}/*.json
pnpm ame build     # emits tokens.css; commit it, B4 compares it byte for byte
pnpm gate
```
 
Layering is enforced, not advised: a base token states a literal, a semantic token references base, a component token references semantic or base. A surface binds semantic or component, never base; clauses U1 and U2 catch violations by name.
 
## Changing a rule
 
Read `tokens/contract.md` first; it states every condition and nothing else. Reasoning lives in `tokens/decisions.md` and numbers in `tokens/outcomes.md`: one file per kind of statement, so a rule is never written twice.
 
If a drift baseline has to move, it moves **down**, in the same change that earned it, with the run that measured it in `tokens/runs.log`. Clause X1 checks that. A baseline moving up is a rule being relaxed, and needs a decision entry saying so.
 
## Recording a decision
 
Judgment calls become dated entries in `tokens/decisions.md`, appended, never rewritten. If a later change supersedes an earlier entry, the earlier one stays and the later one says what it replaced. The log is the record of what was believed when, and an edited record is not one.
 
## What a pull request needs
 
1. `pnpm gate`, `pnpm gate:fixtures`, `pnpm lint`, `pnpm typecheck`, `pnpm test` green.
2. A decision entry if you made a judgment call.
3. A commit message that says what changed and why, not which files moved.
4. **A sign-off on every commit** (`git commit -s`), certifying the [DCO](DCO).
## The gate reads your change before I do
 
Nothing reaches a human until `pnpm gate` and `pnpm gate:fixtures` are green.

 
**On the sign-off.** It is the one requirement here enforced without exception. `git commit -s` is you stating you wrote it or have the right to submit it. Every commit, including mine.
 
**On AI.**
 
- **Say so** in the pull request. The template has a box for "AI-assisted, and I have not fully reviewed it."
- **Answer for it.** A change nobody has read will not be merged.

 
## Reporting a security issue
 
Use the private flow in [SECURITY.md](SECURITY.md); it also carries the threat model and the reason there is no bounty.
