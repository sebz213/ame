# Ame extraction preflight — Phase 0

Status: **Phase 0 complete, 1 of 4 passes. Critical path closed 2026-08-24
(decision D-47). Phase 1 unblocked, sequenced behind items 3–6 below.**
Date: 2026-08-24
Tree: `ame-hygiene-plan` @ `950ac36`
Owner: Sebastien Chery

The verdicts below are the audit as it stood when written and are not revised
after the fact (C8: annotate, never rewrite). What changed since is recorded in
"Critical path, closed 2026-08-24" at the end, and in D-47.

Every verdict below names the command that produced it. Re-run the command, get
the verdict. Nothing here rests on a reading.

---

## Verdicts

| Item | Verdict | One line |
|---|---|---|
| 0.1 IP check | **PASS, with one owner decision** | No employer code, tokens, or assets. Kindle Japan *product logic* is inside the Ame subset as demo data. |
| 0.2a Tokens are DTCG | **PASS** | All 8 token files validate against the DTCG 2025.10 schema. |
| 0.2b ROOT count | **FAIL** | `runs.log` has no `ROOT=` line and never has. The true count is 264, not 336. |
| 0.3 Staleness audit | **FAIL — target does not exist** | There is no D-50 through D-58. Decisions run D-1..D-46 and R-1..R-100. |
| 0.4 U1/U2 standalone | **FAIL** | The clause that enforces the README's central claim scans one portfolio-only file. |

---

## 0.1 IP check — PASS, with one owner decision

**Check run.** Full-history search, restricted to the paths an extraction would
carry (`packages/ame-tokens tokens components/ame components/ui app/ame content/ame`):

```bash
for term in Amazon amazon Kindle kindle Instrument a2z AWS; do
  echo "$term: $(git log --all --oneline -S"$term" -- $AME_PATHS | wc -l)"
done
```

| Term | Commits touching Ame paths |
|---|---|
| Amazon / amazon | 0 |
| AWS / a2z | 0 |
| Instrument | 1 |
| Kindle / kindle | 7 |

**Written answer: no.** No employer code, no employer design tokens, no employer
asset files are present in the Ame subset, in the tree or in the history.

Two results need stating rather than summarising:

**"Instrument" is a false positive.** The single hit is `tokens/deliverables.md`
in the initial commit: *"Instruments deliverables are executed, by an agent, a
pipeline, or an operator."* It is this repo's own noun for a measuring device —
the same word `docs/LEXICON.md` defines against *gate* and *dipstick*. It is not
the agency. Nothing to amend; **item 8.1 stands unchanged.**

**Kindle Japan is inside the Ame subset, and it is not code.** Three flowchart
presets in `components/ame/flowchart-presets.ts` carry Amazon internal product
logic as demo data:

| Preset | Eyebrow | What it depicts |
|---|---|---|
| reward mechanic | `KINDLE JAPAN · REWARD MECHANIC` | the tracking-vs-stacking trade-off |
| processing state | `KINDLE JAPAN · PROCESSING STATE` | async purchase lag branching into a silent failure |
| enrollment states | `KINDLE JAPAN · ENROLLMENT STATES` | the full member state machine |

Referenced onward by `content/ame/flowchart.mdx:52` and
`content/ame/foundations.mdx:27`.

This is not what 0.1 was written to catch — it is neither code nor token nor
asset — so the extraction plan does **not** change to a clean-room split. But it
is Amazon product behaviour, described in enough detail to be a state machine,
and publishing it is a confidentiality call, not an engineering one. **That call
is the owner's.** Two clean paths, both cheap:

1. Re-author the three presets with neutral content. Ame is a design system; the
   flowchart component's job is to show a grammar, and any content demonstrates
   it. This removes the question and shrinks the extracted surface. Recommended.
2. Keep them and clear it. Then 0.1's own instruction applies: ask before
   publishing, not after.

**Two Kindle assets exist but stay behind.** `public/kindle-mascot.svg` (10.1 MB)
and `public/kindle-ux-collection.svg` (15.0 MB), both LFS pointers. `public/` is
not in the Ame subset, so they do not travel. They are named here only because
`tokens/invariants.json` holds byte-budget waivers keyed to their paths, which
become dangling references in a standalone tree — see 0.4.

---

## 0.2a Tokens are actually DTCG — PASS

**Check run.** ajv 6 (draft-07) loaded with every schema under the DTCG
community-group `src/2025.10` tree, entry schema
`https://www.designtokens.org/schemas/2025.10/format.json`, run against all eight
token files.

```
PASS  base/color.json        PASS  base/type.json
PASS  base/effect.json       PASS  semantic/semantic.json
PASS  base/motion.json       PASS  component/component.json
PASS  base/shape.json
PASS  base/space.json
RESULT: all 8 files valid DTCG 2025.10
```

**The validator was negative-controlled before its pass was believed** (C9: the
disconfirming world ships with the claim). Nine deliberately malformed documents,
six correctly rejected:

| Negative case | Result |
|---|---|
| `colorSpace: "cmyk"` | REJECTED |
| srgb with 2 components | REJECTED |
| srgb component `2` (out of 0–1) | REJECTED |
| `hex: "#zzz"` | REJECTED |
| `$type: "bogusType"` | REJECTED |
| duration missing `unit` | REJECTED |
| valid control | accepted (correct) |
| dimension as bare number `16` | **accepted — schema gap** |
| `fontWeight: 1200` | **accepted — schema gap** |

The two leaks are limits of the published DTCG schema (group-level `$type`
inheritance is not expressible in JSON Schema), not of these tokens. **Both belong
in Scope and limits (3.4): "validated against the DTCG 2025.10 JSON Schema, which
does not check group-inherited `$type`."**

**Postulate 2 holds. "DTCG" may stand in the README.** One wording defect: the
tree says **DTOS** 2025.10 throughout — `ame.json`, `build.mjs`, every `$description`,
decision D-1, clause U4. There is no DTOS. The published format is DTCG. Per C6
the machine-readable surface must speak the parser's noun, so this is a global
rename, not a README-only edit.

---

## 0.2b ROOT count — FAIL

**Check run.**

```bash
grep -o "ROOT=[0-9]*" tokens/runs.log | wc -l   # → 0
```

`tokens/runs.log` contains no `ROOT=` line and no commit ever wrote one. `ROOT` in
this codebase is a path variable in eight scripts, nothing more. There is no
number in the log to match against a fresh count, so the claim as written has
never been true and cannot fail: it has no referent.

**The fresh count, run today:**

```bash
node tokens/check.mjs --no-log | head -1
# ame@0.1.0   mode: full   tokens: 264   aliases: 31
```

| Measure | Count | How |
|---|---|---|
| DTCG tokens | **264** | `buildTokens().tokens.length` |
| — base | 126 | |
| — semantic | 83 | |
| — component | 55 | |
| CSS custom properties, `.portfolio-root` | **292** | composites expand |
| CSS custom properties, dark override | 6 | |
| Aliases | 31 | gate header |

**336 is wrong and appears nowhere in the repo.** Per 0.2's rule — the claim
changes to what is true — README line 3.1 becomes:

> Ame is a React design system: **264** DTCG tokens compiled to CSS custom
> properties and TypeScript types. It rejects its own violations: a CI gate fails
> any build where app code reads a raw value.

If the second number is wanted, "264 DTCG tokens compiled to 292 CSS custom
properties" is also measured and also true.

**2.3 becomes real work, not a check.** The gate must be taught to append the
count to each `runs.log` line. It already computes it for the header; the line
format `D2=0 S1=8 …` just needs the field.

---

## 0.3 Staleness audit — FAIL, target does not exist

**Check run.**

```bash
grep -cE "^## D-[0-9]+" tokens/decisions.md   # → 46, D-1 .. D-46
grep -cE "^## R-[0-9]+" DECISIONS.md          # → 100, R-1 .. R-100
grep -nE "^#+ *D-5[0-9]" tokens/decisions.md DECISIONS.md   # → no match
```

**There is no D-50 through D-58.** The token decision series ends at D-46 ("The
viewer became the Ame Prototype Viewer"). The repo decision series is R-, and runs
to R-100. The work order names a range that has never existed, so the audit it
asks for cannot be performed as written.

The order's own rule applies — the task is rewritten, not faked. The reachable
version, and the one C10 actually wants:

> **0.3′** Read `tokens/decisions.md` D-1..D-46 against current code. Each entry
> gets one of: current / superseded by X / historical. Same for the R- entries
> that describe Ame rather than the portfolio. No entry ships describing a state
> the code has left. Annotate, never delete (C8).

Two defects found while establishing the range, both cheap and both in scope for
0.3′:

- **D-42 has no title.** Every other entry states its decision on the heading line.
- **D-1 through D-19 spell the format DTOS.** They are the origin of the naming
  defect 0.2a found. Under C8 these are annotated with the correction, not
  rewritten.

**Estimate: 46 + ~30 entries to classify.** This is the largest unstarted item in
Phase 0 and it did not have a scope until now.

---

## 0.4 U1/U2 standalone check — FAIL

**This is the finding that blocks Phase 1.**

The cascade clauses do not merely reference a few paths that stay behind. **The
clause that enforces the README's central claim scans exactly one file, and that
file is a portfolio file.**

```bash
node -e "console.log(require('./tokens/invariants.json').restated)"
# D2 → hand_written: [ "app/(portfolio)/portfolio.css" ]
```

D2 is the raw-value clause. Its own description says so: *"D1 catches a re-declared
custom property. It cannot see a hand-written literal that happens to equal a
token's resolved value."* In a standalone tree, `app/(portfolio)/portfolio.css`
does not exist, D2 scans nothing, and **"a CI gate fails any build where app code
reads a raw value" becomes a sentence with no instrument behind it** — which is
the exact failure C1 exists to prevent.

Full scope survey:

| Clause | Scans | In standalone |
|---|---|---|
| **D2** raw value | `app/(portfolio)/portfolio.css` | **empty — claim unenforced** |
| **U1** base binding | 9 paths, 2 portfolio-only | partial |
| **U2** base read | app/components tree, waivers on `components/ame/{nav,footer}.tsx` | **survives** |
| **U3** lib↛app | `lib/`, `app/` | partial |
| **U4** no system tokens on surface | `app/(portfolio)`, `components/portfolio` | **empty — vacuous pass** |
| **CV1** contrast coverage | `app`, `components` | partial |
| **K1** asset budget | `public/**`, incl. both Kindle SVGs | **empty, 10 dangling waivers** |

A clause that scans an empty set passes. U4 and K1 would report green in a repo
where they measure nothing, and D2 would report green while its claim went
unchecked. **Per 0.4's own instruction the gate config points at `examples/`
instead** — and 2.2's fixtures stop being a nice-to-have and become the thing that
keeps the central claim true after extraction.

**Postulate 1 is not broken, but it is not free.** The gate is not defective; its
scan surfaces are portfolio-shaped. Repointing D2, U1, U4, CV1 and K1 at
`examples/compliant/` and `examples/violating/` is the work, and it must happen
**before** the split, not after — the split should carry a gate config that already
points at paths that will exist.

---

## Found while checking, not asked for

Each affects a later phase and each is checked.

**1.2 already passes.** `LICENSE` is MIT, `Copyright (c) 2026 Sebastien Chery`.
No work.

**1.1 has a name collision.** The remote is *already* `github.com/sebz213/ame`:

```bash
gh repo view sebz213/ame --json name,visibility,createdAt,description,repositoryTopics
# {"name":"ame","visibility":"PRIVATE","createdAt":"2026-07-29T03:39:34Z",
#  "description":"","repositoryTopics":null}
```

The private repo holding the portfolio *and* Ame is called `ame`. The public
standalone repo cannot also be `ame` under this account without repurposing or
renaming one of them. **A decision is owed before 1.1 runs.**

**1.3 is untouched.** Description empty, topics null, on the repo that exists today.

**1.1's tooling is missing.** `git filter-repo` is not installed
(`git: 'filter-repo' is not a git command`). `git subtree split` is built in and
sufficient. 13 LFS files are tracked; none are in the Ame subset, but the split
command needs to not drag them.

**C8's record starts 2026-07-28.** First commit `e31f81a`, *"Initial commit: Ame,
portfolio and design system, pre-audit-fixes state plus substrate"* — 562 commits,
all after that date. Ame work predating it has no per-commit trail. The dated
public record is real and one month deep; **3.4 should say so rather than let the
reader assume otherwise.**

**2.1's command does not exist.** There is no `gate` script. The gate is
`pnpm gate` as of this document (see below), and `packageManager` pins pnpm 11.5.1, so `npm i` is the
wrong first line. Either add a `gate` alias or write the true command in the
60-second proof block. The proof block is the evaluator's first contact (C3) —
it cannot be the thing that fails.

**2.3's CI half already exists.** `.github/workflows/code.yml` runs `tokens:build`,
`docgen:check`, `gate`, lint, test, woven, and `next build` on every push
and PR. What is missing is the log line: CI never commits `runs.log`, so the ROOT
line will live in CI stdout, not in the file. Decide which one the README points at.

**2.4 is most of the way there.** 15 contrast pairs pass in the gate today (C1–C11
plus dark counterparts, min 7:1 on body and heading, 4.5:1 elsewhere), and **CV1
already proves no declarable pair was missed** — with its reach limit stated in its
own description: it sees a foreground and background set in the same rule, not a
colour inherited from a container. What 2.4 lacks is C9's half: **a deliberately
failing pair in `examples/violating/` that trips it.** Lift CV1's reach sentence
into Scope and limits verbatim; it is already written correctly.

---

## Decisions taken, 2026-08-24

Both owner decisions this audit surfaced were made the same day it was written.

**P-1. The Kindle Japan flowchart presets are re-authored as neutral demo data.**
The three presets in `components/ame/flowchart-presets.ts` are replaced with
generic content; `content/ame/flowchart.mdx` and `content/ame/foundations.mdx`
are updated alongside. The flowchart component's job is to demonstrate a grammar,
and any content demonstrates it, so nothing about the system is lost. This removes
the confidentiality question from the extraction rather than answering it —
0.1's "ask a lawyer before publishing" clause no longer applies, because there is
no longer anything to ask about.

**P-2. `sebz213/ame` is renamed `portfolio`; the public standalone repo takes the
name `ame`.** The private monorepo gets the name that states its contents (repo
standard N1: a name states exactly the concept it holds, never a generalization of
it — a repo containing a portfolio, its case studies, and a design system is not
named after one of the three). `ame` is then free for the standalone system, where
repo name, `package.json` name, and README title agree, as N1 requires. Remote
URLs update in the same pass; GitHub redirects the old path.

---

## What Phase 0 blocks, and what it does not

**Blocked until resolved:** *nothing — P-1 and P-2 cleared both.*

- **1.1** — unblocked by P-2, but still sequenced behind 0.4's gate repoint so the
  split carries a config that points at paths which will exist.
- **3.1** — the number is 264. Unblocked; needs only the sentence agreed.

**Unblocked, and now the critical path:**

1. ~~Repoint the clauses at `examples/`~~ — **done 2026-08-24, decision D-47.**
   Superseded in shape: nothing was repointed *away* from the portfolio
   surfaces, because they exist and are still the real subject while Ame lives
   in this tree. Instead the gate was taught to notice. See below.
2. ~~Build `examples/compliant/` and `examples/violating/` (2.2)~~ — **done
   2026-08-24, decision D-47.**
3. **Rename DTOS → DTCG** across `ame.json`, `build.mjs`, token `$description`s and
   clause text; annotate D-1..D-19 rather than rewriting them.
4. **0.3′** — classify D-1..D-46 and the Ame-relevant R- entries.
5. **P-1** — re-author the three flowchart presets and their two MDX references.
6. **P-2** — rename `sebz213/ame` to `portfolio`, update remotes, then 1.1 runs.

Everything above is mechanical. No decision is outstanding.

---

## Critical path, closed 2026-08-24

What 0.4 asked for was a repoint. What it needed was for the repoint to be
*checkable*, because a repoint that misses a clause fails silently in exactly the
way 0.4 described. Both shipped; decision D-47 carries the reasoning.

**X2 — every declared scan root must exist.** New clause in `contract.md` section
X, data in `invariants.json > scan_roots`, logic in `checkScanRoots`. It maps an
invariants key to the clause id that reads it — keys, never paths, so the roots
keep one home. A clause pointed at a path that is not there now fails loudly
instead of walking an empty tree and reporting green.

**X2 found a live defect on its first run.** `clients.sources` named `styles/`, a
directory that does not exist. H1's client census had been walking a phantom for
the life of the clause. Removed. The count did not move — which is precisely why
nothing had caught it, and precisely the failure mode 0.4 predicted for D2, U4
and K1 after extraction.

**`examples/` — the disconfirming world, in the tree.** `examples/compliant/` sits
inside the real gate's scan surfaces (`binding`, `uses_graph.base_read`,
`contrast_coverage`, `scales`, `duplication`, `restated`) and carries the same
obligations as application code. `examples/violating/` carries five deliberate
mistakes and is out of normal scope.

**The gate rejects it, and names what it found:**

```
$ pnpm gate:fixtures
gate:fixtures  PASS  (examples/violating)

  The gate rejected the disconfirming fixture, for the stated reasons:
    U2   violation fired          D2   drift grew past baseline
    CV1  violation fired          U1   drift grew past baseline
                                  S1   drift grew past baseline
                                  S4   drift grew past baseline

  D2 restated: examples/violating/panel.css:
     "0px 1px 6px 0px rgb(16 19 25 / 0.06)" == component.glass.drop
```

That last line is work order 2.2's requirement met literally: the error names the
raw value it found and the token it collided with.

**The harness was disconfirmed before it was believed.** Neutering the violating
fixture turns `gate:fixtures` red on all six expected clauses plus the verdict
itself. It checks *which* clauses fired against `invariants.json >
fixtures.expect`, not merely that something did, so a clause that quietly stops
catching turns CI red instead of silent.

**The inversion has exactly one home.** `check.mjs --fixtures` widens a scan list
and is otherwise the same gate reaching the same verdict; `tokens/gate-fixtures.mjs`
is what turns "the gate said FAIL" into "the fixture run says PASS". The gate
itself has no mode in which failing is success.

**2.1's command now exists.** `tokens:check` → **`gate`**, `tokens:check:shipped`
→ `gate:shipped`, plus `gate:fixtures`. Renamed rather than aliased: two names for
one concept is the N3 defect this repo forbids, and `gate` is the better name —
the check decides contrast, layering, asset weight, CI wiring and the census, not
tokens alone, and it is the word `docs/LEXICON.md` already uses for the thing that
decides conformance. W1 verified it: every workflow step still resolves.

**CI runs both halves.** `.github/workflows/code.yml` gained a `gate on fixtures`
step beside `gate`.

**Proof run, 2026-08-24:**

| Command | Result |
|---|---|
| `node packages/ame-tokens/build.mjs` | exit 0 |
| `pnpm gate` | PASS — `2026-08-24T20:32:47Z ame@0.1.0 full PASS D2=0 S1=8 S2=0 S3=0 S4=2 S5=0 U1=0 H1=16 D3=10` |
| `pnpm gate:fixtures` | PASS — gate rejected the fixture on all 6 clauses |
| `pnpm woven:check` | 14 rows, 11 surfaces, no violations |
| `tsc --noEmit` | exit 0 (examples/ is inside `include`, so both fixtures compile) |
| `vitest run` | 15 files, 140 tests, all passing |
| `eslint` | 0 errors, 44 pre-existing warnings |

**Postulate 1 now has an instrument.** "The gate's claim survives extraction" was
previously checkable only by an audit like this one. X2 makes it a gate check: an
extraction that leaves a scan surface behind fails on the first run instead of
passing quietly.

---

## Reproducing this document

```bash
# 0.1
git log --all --oneline -S"Amazon" -- packages/ame-tokens tokens components/ame \
  components/ui app/ame content/ame

# 0.2a  (needs ajv; not currently a declared dependency — see note)
node <validator> --schemas <DTCG src/2025.10> --tokens packages/ame-tokens

# 0.2b
node tokens/check.mjs --no-log | head -1
grep -c "ROOT=" tokens/runs.log

# 0.3
grep -cE "^## D-[0-9]+" tokens/decisions.md
grep -cE "^## R-[0-9]+" DECISIONS.md

# 0.4
node -e "console.log(require('./tokens/invariants.json').restated)"
```

The DTCG validator used for 0.2a is not yet in the tree. Wiring it in as
`tokens/dtcg-validate.mjs` adds `ajv` as a devDependency — a dependency decision,
so it is deferred to Phase 2 rather than taken here. **Until it is in the tree,
0.2a's PASS rests on a command that ships with this document instead of with the
repo, which is the condition C1 forbids. It is the first thing Phase 2 should fix.**
