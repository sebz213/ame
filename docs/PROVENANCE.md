# Provenance: documents this tree cites that are not in it

**Date:** 2026-08-25 · **Status:** current

Ame was extracted from the monorepo that built it, with history and dates
preserved (`docs/AME-EXTRACTION-PREFLIGHT-2026-08-24.md`). The extraction carried
the token system, the gate, its fixtures, and its record. It did not carry the
portfolio those tokens paint, and some documents stayed with it.

Citations to those documents are left as written. A dated record is annotated,
never rewritten — that rule is why the decision log is worth reading at all — so
this file is the annotation rather than fifty edits. **A pointer to a missing
home is a second home with the value deleted; this gives every such pointer a
destination.**

## Documents that travelled

| Document | Why it is here |
|---|---|
| `STANDARD.md` | The repo standard the contract, invariants, and lexicon cite as their source, 21 times. Its `(publication)` and `(deploy)` clauses self-scope, so the ones about deployed routes simply do not bind here. |
| `CLAUDE.md` | The session contract: what to read before an edit, and the rule that a new check enters `contract.md`, `invariants.json`, and `check.mjs` in the same change. Every file it names is present. |
| `tokens/contract.md`, `decisions.md`, `outcomes.md`, `deliverables.md` | The four homes. |

## Documents that stayed, and what they were

| Cited as | What it is | Read this instead |
|---|---|---|
| `DECISIONS.md`, and any **R-number** (`R-8`, `R-100`) | The monorepo's repo-scale decision log: 100 entries covering the portfolio surface, its routes, and a separate research feature. Most of it has no subject here. | `docs/DECISION-STATUS-2026-08-24.md` classifies every entry and names the twelve R-entries that govern Ame, with what each one established. |
| `RUNBOOK.md` | Operator procedures for the monorepo — running the site, the docs surface, and the deploy. None of it applies to this package. | `README.md` § Getting started, and `CONTRIBUTING.md`. |
| `CHANGELOG.md` | The monorepo's changelog. | Not yet written here. `git log` is the record until a first tagged release earns one. |
| `AGENTS.md` | A pointer file that said "read `CLAUDE.md`". | `CLAUDE.md`, present. |
| `VENDORED.md` | A manifest for code the author did not write. Nothing in this tree is vendored, so clause VN left with its subject (D-53). | — |

## What this costs, stated

A reader following an R-number gets a table entry, not the argument. That is a
real loss and it is the price of not publishing a hundred decisions about a
different codebase. The twelve that govern Ame are summarised where they are
named; the rest were about the portfolio, and the portfolio is not what this
repository is for.
