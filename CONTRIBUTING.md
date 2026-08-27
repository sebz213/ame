# Contributing

## Install, and the test that verifies it

```bash
pnpm install     # Node 24 (.nvmrc), pnpm 11.5.1 (package.json > packageManager)
pnpm gate        # green means the install works and the tree is clean
pnpm gate:fixtures
```

`pnpm gate` green **is** the install test. If it fails on a fresh clone, that is a
bug in this repository, not in your machine — open an issue with the output.

One thing the gate cannot tell you: the tokens are declared at `:root`, so they
are available anywhere on the page with no wrapper class. Set
`data-theme="dark"` on any ancestor and the emitted `[data-theme="dark"]` scope
re-points the themed names beneath it.

This paragraph used to say the tokens were emitted under a `.portfolio-root`
class, which was true before the extraction and false afterwards. Five documents
said it, the build contradicted all five, and no clause reads prose. That is the
shape of every documentation defect in this repository: the machine-checked half
is right and the sentence beside it is two versions old.

`pnpm build` runs the build and both gate halves in order, which is what CI runs.

## The one rule

**A new check enters `tokens/contract.md`, `tokens/invariants.json`, and
`tokens/check.mjs` in the same change.** A clause not written in the contract
does not bind; a clause with no data has nowhere to state its thresholds; a
clause with no check is a sentence. All three or none.

Two rules follow from it and are worth stating separately, because both have
been broken here and caught:

- **No threshold in the checker.** Numbers live in `invariants.json`. Clause Z2
  scans `check.mjs` for stray literals and fails on them.
- **No regex typed into rule data.** Rule data holds literal text; patterns are
  assembled in code, where the escape characters exist once. Clause D3 ratchets
  the sites that predate the rule, so the count can only fall.

## Changing a token

```bash
# edit packages/ame-tokens/{base,semantic,component}/*.json
pnpm ame build     # emits tokens.css — commit it, B4 compares it byte for byte
pnpm gate
```

Layering is enforced, not advised: a base token states a literal, a semantic
token references base, a component token references semantic or base. A surface
binds semantic or component and never base — clauses U1 and U2 catch it by name.

## Changing a rule

Read `tokens/contract.md` first; it states every condition and nothing else. The
reasoning is in `tokens/decisions.md` and the numbers are in `tokens/outcomes.md`
— three files, three kinds of statement, so a rule is never written twice.

If a drift baseline has to move, it moves **down**, in the same change that
earned it, with the run that measured it in `tokens/runs.log`. Clause X1 checks
that. A baseline moving up is a rule being relaxed and needs a decision entry
saying so.

## Recording a decision

Judgment calls become dated entries in `tokens/decisions.md`, appended, never
rewritten. If a later change supersedes an earlier entry, the earlier one stays
and the later one says what it replaced. The log is the record of what was
believed when, and an edited record is not one.

## What a pull request needs

1. `pnpm gate`, `pnpm gate:fixtures`, `pnpm lint`, `pnpm typecheck`, `pnpm test` green.
2. A decision entry if you made a judgment call.
3. A commit message that says what changed and why — not what file moved.
4. **A sign-off on every commit** (`git commit -s`), certifying the [DCO](DCO).

## The gate reads your change before I do

This repository is open to contributions and intends to stay that way. The
filter is not who you are — it is the gate, running as a required check on every
push. Nothing reaches a human until `pnpm gate` and `pnpm gate:fixtures` are
green, which means most of what a review would otherwise be spent on is already
settled before the conversation starts.

That arrangement is the whole claim of this project applied to itself. Ame exists
to argue that a machine can hold a standard human attention cannot; screening
contributions by taste instead would make that argument in one direction and
refuse it in the other.

**On the sign-off.** It is the one requirement here with real teeth, and it is
not paperwork. Projects have stopped accepting contributions entirely because
they could not establish who owned the code arriving — the licence a
contribution carries matters more than the code does, since bad code is
reversible and a licensing mistake is not. `git commit -s` is you stating you
wrote it or have the right to submit it. Every commit, no exceptions, including
mine.

**On AI.** Use it. It is good at this now, and pretending otherwise would be
strange in a repository whose own history says which commits were assisted. Two
conditions, both about you rather than the tool:

- **Say so** in the pull request. There is a box for "AI-assisted, and I have not
  fully reviewed it", and ticking it honestly costs nothing. Guessing does.
- **Be able to answer for it.** A change nobody has read will not be merged, and
  repeatedly submitting unread output is the one thing that ends access here.

The objection was never to the tool. It is to arriving with work you cannot
answer questions about, and that was possible long before the tool existed.

## Reporting a security issue

Not here — `SECURITY.md` has the private flow, the threat model stated honestly,
and the reason there is no bounty.

Do not "fix" `examples/violating`. Every mistake in that directory is
deliberate, and `gate:fixtures` passes only because the gate still rejects them.
