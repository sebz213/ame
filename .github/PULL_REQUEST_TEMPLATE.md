<!--
  Contributions are welcome here, and the gate is what reads them first.

  Nothing below is bureaucracy for its own sake. This project's whole claim is
  that a machine can hold a standard a human cannot hold by attention alone, so
  it would be incoherent to review contributions any other way: the gate is the
  bouncer, and a human reads what it lets through.
-->

## What this changes

One sentence on what it does, and one on why. If it touches more than one
concept, say why it is still a single undoable change.

## The gate

`pnpm gate` and `pnpm gate:fixtures` must both be green. CI runs them on every
push and they are required to merge, so this is not a promise — it is a
statement about a run that either exists or does not.

- [ ] `pnpm gate` is green on this branch
- [ ] `pnpm gate:fixtures` is green (the gate still rejects the violating fixture)
- [ ] A baseline that moved down is recorded in `tokens/runs.log`, in this change

**If you added a check**, the one rule applies: it enters `tokens/contract.md`,
`tokens/invariants.json` and `tokens/check.mjs` in the *same* change. A clause
not in the contract does not bind, a clause with no data has nowhere to state
its thresholds, and a clause with no check is a sentence.

- [ ] Not applicable — this adds no check
- [ ] All three files, in this change

## Provenance

- [ ] Every commit is signed off (`git commit -s`), certifying the
      [DCO](DCO) — that you wrote this, or have the right to submit it.

This is the one requirement with teeth, and it is here because "we cannot take
this because we do not know who owns it" is a real reason projects have stopped
accepting contributions. The sign-off is you saying you do know.

## Tooling

**AI-assisted contributions are welcome.** State plainly whether you used one:

- [ ] Written by hand
- [ ] AI-assisted, and I have read every line and understood it
- [ ] AI-assisted, and I have not fully reviewed it

The third box is an honest option and choosing it is not held against you —
saying so is worth more than a quiet guess. But a change nobody has read will
not be merged, and submitting unread output repeatedly is the one thing that
ends access here. The objection was never to the tool. It is to arriving with
work you cannot answer questions about.

## Naming

- [ ] Would another reader derive the same meaning from every new name? One word
      per concept, one concept per word — `docs/LEXICON.md` holds the vocabulary.
