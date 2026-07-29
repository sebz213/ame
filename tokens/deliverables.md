# Case Study Deliverable Standard

Source: `G:\Library Collection\Process Standardization\Portfolio Standards\Case Study Deliverable Standard.md`.
Copied in full. The operator's original is the authority; this copy is the
repo's home for it, so an agent session and the dipstick export read the same
13 items under the same names and in the same order. Markdown escape characters
from the operator's export (`1\.`, `\*\*`) are unescaped so the text renders;
no word is changed (decision D-11).

---

## Constraint

Constraints deliverables are bound by consumers.

1. **Global tokens** (`color.navy.500`, `unit.4`). Their only legitimate
   consumers are other tokens: the semantic tier references them by name, the
   way your brand file already does with `{color.navy.500.value}`.

2. **Semantic tokens** (`background.primary.light`). Consumed by components and
   surfaces. This is the tier most binding should happen against.

3. **Component tokens** (`button.padding.x`). One consumer each: the component
   they're scoped to.

4. **Named composites** (a `heading.lg` type style, a named elevation or motion
   value). Same binding behavior as tokens, just bundled.

5. **Component APIs**: the component name, its prop names, its prop values, and
   its addressable states (`<Button variant="primary">`, `disabled`). Every call
   site in every surface binds to these strings.

6. **Platform artifacts** of items 1 through 5: the generated CSS custom
   properties, SCSS variables, Swift or XML constants. Same names in transformed
   containers. A web surface binds `--background-primary-light`; parity is the
   invariant saying all containers agree.

7. **The package boundary**: `ame@x.y.z` in a consumer's manifest. The version
   name is the outermost thing bound by name, and it's what makes every other
   binding auditable.

The operational test, since the counterparty test can feel abstract: rename it
and see what breaks. Rename a semantic token and builds fail by name. That's a
deliverable. Change the type scale ratio and every build passes while the
invariant is violated. That's a clause, and it's why clauses need the gate while
deliverables don't.

One consequence worth writing into the block: the list above implies allowed
binding paths. Surfaces bind semantic and component tiers; only tokens bind
global tokens. A surface reaching `color.navy.500` directly resolves fine by name
and violates the layering clause, which is exactly the class of violation your
token tripwire greps for. So the deliverable list and the gate configuration
should agree with each other, and a reviewer can check that agreement in about a
minute.

The seven items are the exported names of the layer, and the invariants are its
unexported internals, the same visibility split a module makes, where Parnas's
rule decides what gets a name outsiders may use.

## Instruments

Instruments deliverables are executed, by an agent, a pipeline, or an operator.
The parallel test: unplug it and watch what reaches production unchallenged. If
removing it changes nothing, it was never an instrument.

1. **The rules file.** Executed by any agent at session start. It's the prime
   contract in text form: what correct means in this repo, stated before work
   begins. Its proof artifact is an agent producing compliant output without
   being corrected mid-task.

2. **The gate configuration.** Executed by CI on every merge, with no human
   deciding to run it. Today the token tripwire and grep; later the contrast
   check and performance budget. Its proof artifact is the one linked failed run.

3. **The transform pipeline.** Executed on every token change. It consumes the
   token source and manufactures the platform artifacts that constraints publish
   (the CSS variables, the Swift constants). This one was implicit in your block
   and deserves its own line, because it's the instrument that makes the parity
   invariant hold rather than merely being asserted.

4. **The release path runbook.** Executed by an operator, including future you.
   Its proof artifact is someone else following it without asking a question.

5. **The viewer, plus its input contract.** Executed by whoever produces
   prototypes. The deliverable is the machinery and the definition of a valid
   input (what makes a glb interchangeable), because that definition is what
   other producers bind to.

6. **The run record.** The history of gate and release executions, dated. This
   is the layer's memory, and it's what the changelog draws on when it claims the
   system grew under its own gate.

One boundary matters more than the others: the thresholds are not deliverables of
this layer. The 4.5:1 ratio, the budget number, the scale values are constraint
clauses. The gate should import them from the constraint layer, never restate
them as literals in its own config, because a threshold living in two places can
drift, and drift between the contract and its monitor is the worst failure mode
available to you: a gate that passes while the contract is violated. One home per
condition applies to the machinery too.

So the symmetric picture across your block: constraints deliver names that
consumers bind, instruments deliver executables that producers run, and each
instrument carries its own falsifiability artifact (a failed run, a followed
runbook, a caught violation). The demand-side point from your draft holds here:
this layer's deliverables are the ones reviewers almost never see, which is why
showing all six with dates outweighs a thicker constraints section.

The gate importing its thresholds from constraints is the same relation as
Meyer's monitor evaluating the class's own assertions rather than a second copy
of them, one contract text, one checker, no private edition of the rules.

---

# Status in this repo, measured 2026-07-29

Each of the 7 constraint items: where it lives, and what its rename test breaks.
The instrument items are measured continuously by `pnpm ame dipstick`; these 7
are the constraint half.

| | Deliverable | Home | Rename test breaks | Status |
|---|---|---|---|---|
| 1 | Global tokens | `tokens/base/` | Every semantic token referencing it; `build.mjs` throws on the unresolved reference before any CSS is written. | present |
| 2 | Semantic tokens | `tokens/semantic/` | Every component token and every surface reading the generated name; the emitted property disappears and the rule falls back to nothing. | present |
| 3 | Component tokens | `tokens/component/` | The one element scoped to it. 16 of them are currently read by no element, which is the H1 count, not a rename risk. | present |
| 4 | Named composites | `tokens/semantic/` (`elevation.*` shadows, `type.*` and `motion.*` roles) | Every surface binding the role. The `motion.*` set now binds; most of `type.*` does not. | partial |
| 5 | Component APIs | `components/ui/`, `components/portfolio/` | Every call site, by prop name and value string. Not measured beyond file count; no API-surface extraction exists. | partial |
| 6 | Platform artifacts | `tokens/build/portfolio.tokens.css` and `app/(portfolio)/portfolio.tokens.css` | The `@import` in `portfolio.css`, and every `var()` on the surface. Parity between the two homes is postcondition B4; the version stamp is B5. | present |
| 7 | Package boundary | `tokens/ame.json` | Nothing yet: no consumer names `ame@x.y.z` in a manifest. The version is stamped on both artifacts and checked by B5, so the binding is auditable before it is bound. | present |

The binding-path consequence in the section above is invariant **U1**, evaluated
in `check.mjs`: no surface reads a base-tier custom property. It measured 16
violations when it was written and 0 after the surfaces were repointed at
semantic roles. The deliverable list and the gate agree, and the agreement is a
number rather than a claim.

## Named composites: what was decided

47 tokens had no client when this pass began. Per set:

- **Bound** (13): the glass system, `motion.enter-ease`, `motion.spring-ease`,
  `motion.reduced-duration`, `type.meta-size`, `type.body-tracking`,
  `type.lead-leading`, `type.root-tracking`, `type.body-synthesis`, and three new
  roles (`motion.slide-*`, `motion.exit-ease`, `motion.overshoot-ease`,
  `type.dense-leading`). Five of these were clientless *because the surface
  restated the value by hand*; binding them removed the second home too.
- **Deleted** (2): `ease.out-expo` and `ease.in-back`. Grep proved zero readers
  and zero hand-written copies of either curve.
- **Kept, with reason** (35): the remaining `type.*` roles, 16 `component.*`
  tokens, `font.leading.*`, `font.weight.*`, `space.grid-gap`,
  `space.control-pad`, `border.*`, `background.card`, `motion.state-duration`,
  `motion.exit-duration`. These describe values the markup currently sets through
  Tailwind classes. Binding them is a component rewrite, not a token change. The
  count is baselined at 35 so it cannot grow, and D-18 records the reason.
