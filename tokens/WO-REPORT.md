# Ame work order: report

Executed 2026-07-29 against the premise capture taken the same day. Two work
orders were in scope: the Ame conversion (WO-1 to WO-8) and the dipstick
instrument (WO-D1 to WO-D5).

## Premises

All five passed before the first edit.

| | Checked | Found |
|---|---|---|
| P1 | `tokens/` holds the 11 named entries | present, plus `AUDIT.md` and `outcomes.md` |
| P2 | `build.mjs` writes both CSS homes from one string | lines 330 to 331, one `out`. Preserved: the two files are md5-identical at the end (`3ad9a74c…`) |
| P3 | `check.mjs` loads rules from `invariants.json`, hardcodes no threshold | rules loaded at line 20. The grep found the sRGB transfer-function constants, two float epsilons, and the DTOS `fontWeight` range. The last was a restated bound and moved to `invariants.json > type_bounds` (D-19) |
| P4 | `build && check` green before any edit | green. CSS captured, 13888 bytes |
| P5 | paint parity through every work order | held. Diff below |

## Work orders

| | Proof | Result |
|---|---|---|
| WO-1 package boundary | build and check pass; `ame@0.1.0` in both CSS homes; diff is the header line only | **pass**. B5 additionally falsified: bumping `ame.json` to 0.2.0 without rebuilding failed both files by name, exit 1 |
| WO-2 rules file | both files exist; a later agent session complies without mid-task correction | **pass on the artifact, pending on the proof.** `CLAUDE.md` and `tokens/deliverables.md` exist; the compliance proof accrues on the next session |
| WO-3 gate and pipeline | `pnpm build` runs the chain; a deliberate violation fails the check and lands in `runs.log` | **pass**. A temporary `text.temp-fail` token measured 1.29:1 against its 4.5 minimum, exit 1, logged `FAIL` at 00:11:38, reverted, next line `PASS` |
| WO-4 constraint deliverables | check passes with B5, G1, U1 active; H1 below 47; 7 statuses listed | **pass**. H1 47 to 35, U1 16 to 0, `tokens/deliverables.md` carries the 7-row table |
| WO-5 runbook and viewer contract | an operator follows a procedure cold; a renamed node fails the viewer loudly | **pass on the viewer, pending on the runbook.** See the drill note below |
| WO-6 run record | 2 consecutive runs produce 2 dated lines, including the deliberate failure | **pass**. `runs.log` holds 20 lines across full and shipped modes |
| WO-7 DTOS recheck | a conformance paragraph in `outcomes.md` with the date | **pass**. Spec folder reachable, so nothing was vendored. 4 disclosed gaps, up from 3 |
| WO-8 look back | this file | **pass** |
| WO-D1 ame command | 3 subcommands reach their targets; a wrong one exits 1 | **pass** |
| WO-D2 export schema | schema parses; the validator accepts a minimal example and rejects a missing `status` | **pass**. Rejection message: `constraints[2]: missing required field "status"` |
| WO-D3 code and map | one run, one file, 13 statuses printed | **pass** |
| WO-D4 self-validation | exit 1 without writing when a required field is absent | **pass** |
| WO-D5 look back | 2 exports differing only in timestamps; the absence drill flips i4 | **pass**. i4 went `absent` with `home: null`, then `present` with 3 procedures |

## The CSS diff against the P4 capture

Eight lines. No existing declaration changed value.

```
+ /* ame@0.1.0 · DTOS 2025.10 · generated, do not edit */     WO-1 header
- --ease-out-expo    - --ease-in-back                          WO-4 deletions, both proven clientless
+ --type-dense-leading      + --motion-overshoot-ease
+ --motion-slide-ease       + --motion-slide-duration
+ --motion-exit-ease                                           WO-4 additions
```

The two deletions are the exception P5 grants WO-4, and both tokens were proven
to have no reader and no hand-written copy before removal. The five additions are
not covered by the stated exception, so they are recorded rather than assumed
harmless: each is read only by a rule that previously held the same literal
inline, and each of the 8 rebound name pairs was compared in the emitted CSS and
resolves to the same value. D-17 carries the reasoning.

## New decisions

D-10 through D-22, in `tokens/decisions.md`. The work order said to continue from
D-7; D-7 through D-9 were taken by the July 28 pass, so numbering continues from
D-10 and D-22 records that.

D-10 Ame's naming scope · D-11 the standard copied unescaped · D-12 lint deleted
· D-13 vercel.json and the v0 badge · D-14 the feed Suspense boundary · D-15 G1's
tightened pattern · D-16 X1's checkable half · D-17 the 16 rebound reads · D-18
two deleted curves, 35 kept · D-19 DTOS bounds out of the checker · D-20
dipstick's `--no-log` · D-21 the filename grammar and c5's limit · D-22 the
numbering.

## Baselines, and the runs that earned them

`baseline.json` at the end of the pass, each value matched by the run that
measured it.

| | Before | After |
|---|---|---|
| S1 font-size | 12 | 12 |
| S2 rem | 34 | 34 |
| S3 radius | 0 | 0 |
| S4 duration | 7 | **6** |
| S5 z-index | 8 | 8 |
| U1 base-tier reads | (new) | **0**, from 16 |
| H1 clientless | 47 | **35** |

```
2026-07-29T00:11:26Z  ame@0.1.0  full  PASS  S1=12 S2=34 S3=0 S4=7 S5=8 H1=47
2026-07-29T00:11:38Z  ame@0.1.0  full  FAIL  S1=12 S2=34 S3=0 S4=7 S5=8 H1=47
2026-07-29T00:11:47Z  ame@0.1.0  full  PASS  S1=12 S2=34 S3=0 S4=7 S5=8 H1=47
2026-07-29T00:27:10Z  ame@0.1.0  full  PASS  S1=12 S2=34 S3=0 S4=6 S5=8 U1=0 H1=35
2026-07-29T00:27:20Z  ame@0.1.0  shipped  FAIL  ...
2026-07-29T00:27:31Z  ame@0.1.0  full  PASS  S1=12 S2=34 S3=0 S4=6 S5=8 U1=0 H1=35
2026-07-29T00:27:41Z  ame@0.1.0  shipped  FAIL  ...
```

X1 earned its place on first run: the baseline still read H1=47 after the run
measured 42, and the check refused it by name.

## The shipped gate is red, on purpose

`pnpm build` exits 1 at the last link. G1 finds a placeholder in 45 emitted files
across 9 routes: the three case studies carry `[[CASE_N_TITLE]]` and
`[[CASE_N_LOGO]]`, and every portfolio route inherits `[[META_DESCRIPTION]]` from
the layout. 75 placeholders remain in source.

That is the standard working. The placeholders say "do not deploy" on their face,
and the gate now agrees with them. It goes green when real case-study content
lands; `RUNBOOK.md` procedure 3 is that path.

Everything before the last link passes: token build, full check, TypeScript, and
the static export of 33 pages.

## Pending proof artifacts

Two, both pending by design rather than skipped.

1. **The rules file (i1).** Its proof is an agent session producing compliant
   output without mid-task correction. It accrues on the next session, not in
   this one.
2. **The runbook (i4).** Its proof is an operator or a fresh agent following one
   procedure cold, without a question. Untried.

## What this work order ordered and I did not do

- **Per-work-order commits.** There is no git repository in this tree
  (`git rev-parse` fails). The work order says to note this rather than
  initialize git inside it, so it is noted. Every V clause in `STANDARD.md` is
  unbindable until a repository exists.
- **Linking the two new documents from the root README (R4).** There is no root
  README. The work order made the link conditional on the file existing; the
  clause stays unmet at repo level, and `R1` is unmet for the same reason.
- **The viewer drill through the running viewer.** The work order says to point
  `MODEL_PATH` at a copy with one node renamed and watch the viewer fail. I built
  that copy (a byte-length-preserving rename of `Display_Baked` inside the glb's
  JSON chunk) and ran the guard the viewer calls, against the mutated file's real
  node list. It threw, naming `Display_Baked`. The drill did not go through a
  browser session, so it proves the guard and its message, not the render path.
  The temporary glb was deleted.

## Two things worth the next operator's attention

- `public/models/iphone17-pro.glb` is 78.9 MB. `STANDARD.md` V4 caps a tracked
  file at 5 MB outside LFS. The moment this tree becomes a git repository, that
  file needs LFS or an external home, and moving it later means a history
  rewrite.
- `next.config.mjs` is traced into the Server Component graph through
  `component-preview.tsx` and `mdx-components.tsx`, which makes Turbopack warn
  that the whole project was traced. It is a warning, not a failure, and it was
  there before this pass.
