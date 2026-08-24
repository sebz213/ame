# examples/

Two fixtures. One obeys the token contract, one breaks it on purpose.

They exist because a gate that has never been seen to fail is not evidence. These
give the gate something real to reject, in the tree, on every run — so the claim
"a CI gate fails any build where app code reads a raw value" ships next to the
thing that demonstrates it rather than next to a description of it.

| Directory | The gate should | Proven by |
|---|---|---|
| `compliant/` | **pass** | `pnpm gate` — these files are in its scan surfaces like any other source |
| `violating/` | **fail** | `pnpm gate:fixtures` — exits 0 only when the gate rejected it |

## Run them

```bash
pnpm gate            # the real gate. examples/compliant is inside it.
pnpm gate:fixtures   # runs the gate against examples/violating and requires a rejection
```

`gate:fixtures` inverts the verdict: it passes when the gate says FAIL, and fails
when the gate says PASS. A gate that stopped catching these would turn the
fixture run red, which is the only way a silent regression in the gate itself
becomes visible.

## What `violating/` breaks, and which clause catches it

Every line below is deliberate. Each one is the smallest realistic version of a
mistake a person actually makes.

| File | Line | Mistake | Clause |
|---|---|---|---|
| `panel.css` | `color: var(--color-ink)` | binds a **base** primitive from a surface | U1, U2 |
| `panel.css` | `box-shadow: 0px 1px 6px 0px rgb(16 19 25 / 0.06)` | hand-writes a recipe the token layer already holds | D2 |
| `panel.css` | `--text-secondary` on `--background-utility` | renders a contrast pair no C clause measures | CV1 |
| `Panel.tsx` | `fontSize: '17px'` | a size off the type scale | S1 |
| `Panel.tsx` | `duration: 333` | a duration off the motion scale | S4 |

D2's report names the literal it found and the token it collided with, so the
failure tells you what to delete, not merely that something is wrong:

```
D2 restated: examples/violating/panel.css: "0px 1px 6px 0px rgb(16 19 25 / 0.06)" == elevation.glass-drop
```

## Why `compliant/` is in the real gate

If it were only checked by the fixture runner it would be decoration. It sits in
the same scan surfaces as application code, so it carries the same obligation:
when a clause changes, this example must still satisfy it, or the change is not
finished. It is the smallest complete answer to "what does correct look like."
