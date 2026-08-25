# Decisions

Reasoning. The conditions themselves are in `contract.md`; the numbers are in
`outcomes.md`. Nothing here is enforced, and nothing enforced is argued here.

> **Trimmed 2026-08-25 to entries dated 2026-08-24 or later.** 75 earlier
> entries (D-1 through D-75) were removed from this file. They are not gone —
> `git log -p tokens/decisions.md` and any commit before this one still hold
> them in full, and the reasoning they carry has not been withdrawn. This note
> exists because a log that silently begins on a Tuesday reads as though the
> work did, and the dates are the part of this record that does the work.
>
> Two entries carried numbers this branch had already used, from a port off a
> stale branch: the keyword-links entry and the pills/language entry are now
> D-78 and D-79. The originals they collided with — D-52 on `type.control-size`
> and D-54 on the instrument being part of the experiment — were dated before
> the cut and left with the rest. `packages/ame-tokens/build.mjs` cites that
> D-54; the citation now points into git history rather than into this file.

## D-76 A layer-wide opacity is a ceiling, and it reverses D-nothing quietly

2026-08-24. The wall's scrim carried opacity 0.8, recorded in its own comment as a
deliberate choice: a fifth off the finished thing rather than a re-mix of eighteen
stops. That reasoning was right about cost and wrong about consequence. An element at
0.8 has a CEILING -- nothing drawn on it paints more than 80% of any colour, INCLUDING
the stop that says 100%. So the foot of the wall stopped at four fifths of the page's
own ground, and the last row was a cut rather than a dissolve.

Eyeballing a screenshot said "the scrim is not painting at all", which was wrong; a
magenta control proved the scrim covered the full 550px box. What settled it was
sampling the pixels: the wall's bottom row read luma 43 against a ground of 19, and
mottled to 67 wherever a bright tile ran into the edge. A LAYER THAT CANNOT REACH THE
COLOUR BEHIND IT CANNOT DISSOLVE INTO IT -- and no adjustment to the ramp's shape can
fix that, because the ceiling is applied after the ramp is drawn.

The fix moves the fifth off the element and onto the stops, chosen so that nothing
already tuned moves: every alpha is now the authored value times 0.8, so both ramps
composite exactly as before, and the only stop that changes behaviour is the linear's
last one, which reaches full ink at 98% and holds to the edge. Bottom row now reads 19
across the width, the same as the ground below it.

Two things to carry forward. Baking a constant into values makes those values no longer
the authored ones, so the authored numbers are written into the comment beside them --
otherwise the next relative change compounds against a scaled baseline (D-73). And
where a composite has to REACH a specific colour rather than merely approach it, the
opacity belongs in the stops, never on the element.

## D-77 The tracking ramp could not cross zero, so no headline could be tightened

2026-08-24. Ame's letter-spacing was checked against the ordinary typographic rule --
tighten large type, leave body alone, open up small type and capitals -- and it failed
at the top end for a structural reason rather than a taste one: every rung of
font.tracking was non-negative, floored at `tightest: 0`. A ramp that cannot go below
zero cannot tighten anything, so the 38px hero line ran at +0.04em and the 48px stat
figures at +0.023em, both of which push a headline apart rather than pulling it
together.

The ramp already KNEW the rule. `tighter` was documented as "the larger the type, the
less tracking it wants", and `tightest` as "at display sizes the letterforms already
have enough air, and any positive tracking reads as the word coming apart". Both
descriptions argue for negative values; both held positive ones. The floor was the
whole defect, and it had been argued against in its own docstring.

Swept at the base tier so every surface follows: tightest 0 -> -0.03, tighter
0.02 -> -0.02, tight 0.04 -> 0.02, base 0.07 -> 0.02, caps 0.14 -> 0.08. body stayed
at 0.05.

TWO RUNGS COULD NOT SIMPLY BE SHIFTED, and the reason is worth keeping. `tight` is
bound by a 38px display line AND by 13-15px labels -- its own description said "at any
size" -- and those two want opposite signs. Taking a token negative would have tightened
small text, which is the one place tracking must be positive. So the fix was not a value
but a BINDING: the hero line was repointed from tight-tracking to hero-tracking, and
hero-tracking from font.tracking.tight to font.tracking.tighter. One token per job, the
way the file's own note about a wrong NAME propagating already argued.

Same for `body`, which serves 18px prose and 12-15px labels. Its dominant use is the
small end -- 123 rendered elements against 7 -- so it kept 0.05, which is correct there
and 0.05 too wide for the prose. That gap is open, and closing it means splitting the
token, not moving it.

THE LARGEST NUMBER ON THE PAGE WAS TRACKED BY ACCIDENT. metric.tsx set no
letter-spacing, and letter-spacing inherits as a computed LENGTH rather than as the em
it was written in -- so a 48px figure inherited 1.12px from a 14px ancestor, which is
0.08em of that ancestor and 0.023em of itself. It happened to land near a defensible
value, which is exactly why it survived. It is now bound to the display rung.

Measured after: 48px and 38.4px both at -0.02em, 24px at +0.02em, 12-15px between
+0.02 and +0.05em. Gate counters unchanged except H1, which fell 13 -> 12 because
font.tracking.tighter had no consumer until the hero was repointed onto it -- the
orphan-token count is a live reading, not a static list.

Nothing is public, so nothing is urgent. Recorded now because the decision is
cheapest before the repo is shared and irreversible after.

## D-78 A résumé keyword links to its evidence, and KW1 stops the link going stale

2026-08-25. On the owner's instruction to give each résumé keyword a link to an
example, with the passage highlighted on arrival.

**The survey came first, and it is the finding.** Thirty-nine keywords across
five columns, checked against every published route. **Eighteen have a real
example. Twenty-one do not.** Rather than link all thirty-nine and let two thirds
point at pages that merely say the word, the map records both states and the
surface renders them differently: a keyword with evidence is a link, a keyword
without is plain text. An unbacked claim stated plainly is honest; an unbacked
claim wearing a link is a promise of evidence that delivers a mirror, which is
the failure the whole token contract exists to refuse, moved from values to
claims.

Some near-misses were rejected on purpose. **Next.js**, **Claude Code**,
**Product Designer** and **4 Years** all "appear" on the portfolio — in the
résumé grid itself. Linking a claim to its own restatement is circular, so they
stay unlinked. **Figma** appears only as a term-sheet `stack=` value: a claim
about a tool, not an example of using it. **Instrument** appears nowhere at all;
its two apparent hits are the word "instrumented" describing a measurement
method. **WCAG 2.2** is the painful one — the gate measures fifteen contrast
pairs against 4.5:1 and 7:1 on every run, and none of it is published on any
route, so the strongest unbacked claim in the grid is one the repo already proves
privately.

**The mechanism has no runtime.** `<Kw id="…">` wraps the passage and carries the
id; the browser scrolls; `:target` rings it (`.kw-anchor`, app/globals.css).
Nothing to hydrate, nothing to clean up, and a copied link works. The cost is
that re-clicking the same link does not re-flash, which is a fair price.

**A ring, not a background wash.** A wash would place text on a colour no C
clause measures — exactly what CV1 exists to prevent — so the highlight is an
outline, which changes no foreground pair and leaves the passage at the contrast
it was proven at. Under `prefers-reduced-motion` the ring is held rather than
animated: dropping it entirely would take the information from the readers most
likely to need it. Timing composes two existing semantic motion tokens rather
than introducing a third, and no base primitive is bound (U2).

**KW1, so a keyword cannot outlive its evidence.** contract.md section KW,
`invariants.json > keywords`, `checkKeywords` — one change, per CLAUDE.md. It
resolves every declared link against the file it names: a `<Kw>` wrapper whose
inner text must still contain the declared phrase, or a heading that must still
exist in a generated page. It also checks the other direction, so an anchor no
keyword claims fails too. Disconfirmed three ways before being believed —
anchor deleted, evidence reworded inside the anchor, orphan anchor added — each
producing the message naming what to do.

Data in `lib/portfolio/keywords.json` with `keywords.ts` as its typed view: the
split R-37 established for the component registry, for the same reason — a
checker in Node and a component in TypeScript must read one file.

**The check's stated reach.** KW1 proves the anchor is in the *source*. It does
not prove the source rendered. Both were verified by hand this pass — all twelve
`<Kw>` ids and all six heading ids are present in the built HTML — but that is a
measurement, not a clause, and a component that silently dropped its children
would pass KW1. Naming the gap rather than implying coverage; closing it means
running the check against the emitted tree, which is what `--shipped` mode
already does for G1.

**Twenty-one keywords are now a content work list**, exported as
`KEYWORDS_WITHOUT_EVIDENCE` rather than hidden. Publishing the gate's contrast
table would close WCAG 2.2 outright.

## D-79 The résumé keywords become pills, and the language switch gets one home

2026-08-25.

**The keywords are pills now, and the pill already existed.** `PortfolioExpertisePill`
was the expertise section's earlier treatment and had been left mounted only in
the `/ame` catalog. Rather than write a second pill, its `icon` and `tooltip`
became optional: the services row gives every pill a glyph, and 39 résumé
keywords would have needed 39 arbitrary ones when the label is already the
content. A pill with no tooltip no longer claims the single-open slot in the
tooltip coordinator, or hovering it would close the tooltip of the pill you were
reading, and it only takes a pointer cursor when it has somewhere to go.

The card's expertise variant now renders one `dd` per column holding a `ul` of
pills, which is the honest wrapper: the label is the term, the pills are the one
definition. The stack is even because a single `gap` sets every step rather than
each item carrying its own margin.

**A linked pill carries its reason.** The tooltip is the map's `because` — what
the reader will find, said before the click rather than after it. An unlinked
keyword is a pill with no href and no tooltip, because there is no example on a
published route yet; KW1 keeps the linked half honest.

**The language switch has one home.** The top bar's button held the whole
mechanism inline: the cycle, the timings, the bounce, the
`document.documentElement.lang` write. A mobile glass pill showing the same
language would have been a second switch that agrees with the first exactly
until one of them is edited. `hooks/use-language-cycle` is the switch;
`components/portfolio/language-pill.tsx` is the glass treatment, and the top bar
now reads the hook rather than its own copy. The timing constants moved with it —
179.4 / 772.8 / 993.6 and the derivation comment that explains them — because two
surfaces reading one number is the whole reason they are a constant.

The bounce is applied to the label, not the glass. Scaling a `backdrop-filter`
element re-rasterises the blur every frame and the edge crawls; scaling the text
inside it leaves the glass still. Same motion, drawn where it is cheap — the
reasoning of D-36, which grew `mask-size` rather than transforming the masked
element.

**Mobile: the viewer and its exit are one screen.** The phone filled the view and
gave the reader no visible reason to keep going. `.port-work-screen` makes the
card and a case-studies link a single viewport-tall block, the link pinned to its
bottom by `margin-top: auto` and resting 40px clear of the fold. The 40px is
clearance from the fold, not a gap under the card — a fixed margin would have set
a gap and only accidentally matched on one phone. `svh` rather than `vh`, because
a phone's dynamic toolbar makes `vh` taller than what is on screen, which would
put the link under the fold on exactly the browsers this exists for.

**The viewer's frame moved to CSS to be able to change at all.** A media query
cannot reach an inline style. It stays expressed in LAYOUT, never
`transform: scale()`: both the WebGL renderers and the CSS3D perspective are
built from `clientWidth`/`clientHeight`, so a transform hands the renderer one
size and paints another — the defect the card's own comment records measuring
(offsetWidth 976 against a painted 1073.6). Mobile takes the desktop overscan
10% further, 121%, which is the zoom: the card crops the same rectangle, so a
larger box puts more pixels behind that crop. Centred rather than top-anchored,
because on a short viewport a top anchor pushes the device's foot out of the
crop; at 121% the transparent top edge sits 10.5% clear of the card, so the
anchor was buying nothing.

**One thing caught in the writing.** The case-studies link was first pointed at
`#work-case-studies`, an id that does not exist — a dangling anchor, in the same
session that built KW1 to forbid exactly that. The real id is `#case-studies`.
KW1 does not cover in-page hrefs on the portfolio surface, only keyword links
into content, so nothing would have caught it. Worth knowing that the clause's
reach stops there.

H1 fell 16 → 15: the link binds `space.control-pad`, which had no client. The
baseline moved down in the change that earned it (X1).

## D-80 The resume is a legal-shell document, and the legal area drops the subnav

2026-08-25

**It lives in `content/legal/` and it is not a legal document.** The directory
is where the loader with `baseUrl: '/portfolio'` reads from, and that loader is
what puts a page at `/portfolio/<slug>`. Adding a third source for one page
would mean a second copy of the shell decision, the chrome mapping and the
route layout, to gain a directory name that reads better. The name describes
the route group it serves, not a claim about the contents. If a third
non-legal page arrives, rename the directory rather than duplicating the
loader.

**The download button is the home CTA's shape and not its colours.** Same
filled pill, same height, same shimmer, a download icon in place of the arrow.
The hero CTA binds the on-dark pair because it sits on the wall panel, which is
dark in both themes; this page takes the page background, so the pill binds
`text-body` on `background-page` -- the pair the Github button already uses. A
straight copy would have been white-on-white in light mode.

**The legal area makes the opposite mobile trade from the case studies.** Both
had two header rows on a phone, roughly 110px before a word of the article. On
a case study the subnav is worth keeping: it holds the search and the toggle
for a sidebar that is a tree of pages. A legal page has one document, its
sidebar is already hidden and inert, so the toggle opens nothing and the search
leaves the page it was opened from. So the band stays and the subnav goes --
`display: none`, not opacity, because unlike the sidebar this row holds no
column open, and a duplicate mark should leave the tab order too. Below md
only; above it neither rule applies.

**RESUME_URL stays `[[RESUME_URL]]` and G1 keeps blocking it.** The button
should point at a file and there is no file. A placeholder that fails the gate
is the honest state, and reading it from `lib/portfolio/contact` means the day
the file exists, one edit moves this button and the two Resume links that
already bind the same token.

**Flagged, then decided the same day: both links point at the page.** "Resume"
means two things here and they are not interchangeable, so there are now two
constants. `RESUME_PAGE` is where a reader goes to READ it; `RESUME_URL` is the
file they take AWAY. A link labelled Resume goes to the page -- it resolves
today, it carries the site's chrome, and the download button lives on it -- and
the download button is the only thing that still reads the file token. G1 is
therefore blocking exactly one thing, and it is the thing that is genuinely
missing.

## D-81 Scope is a property of the clause, so extraction stops being surgery

2026-08-25. Replaces the manifest-plus-overlay plan, which treated the symptom.

**What the 35 violations were saying.** Extracting the package twice produced,
both times, a list of clauses with no subject in the copy — and the second list
was longer and harder than the first, because the contract had grown 17 clauses
in a month. Each pass ended in judgment: is the resolver check Ame's? yes; is
the recipe-to-element mapping Ame's? no, its elements are this app's components.
Those are two clauses in one invariants block, and telling them apart was a
decision taken under time pressure with a checker open.

That is not sync friction. It is the contract not knowing it governs two
products. A process that recurs, worsens with scale, and puts the repo's central
claim at risk each time is one to close rather than to schedule.

**Every clause declares its subject.** `census.clauses[id].scope` is `package`
or `portfolio`; `package` means "runs everywhere", so a clause governing both
takes it. 37 package, 10 portfolio. A portfolio-scoped clause must also say why,
because `portfolio` is the claim that something does NOT belong to the published
product, and that is the half worth having to argue.

**The package declares what it is made of.** `package_manifest.paths`, read by
two things that must agree: the extraction copies it, and the gate filters every
scan root through it. A root outside the manifest is OUT OF SCOPE, not MISSING —
the distinction X2 exists to keep, so "the app is not here" and "something that
should be here is gone" remain different answers.

The filter substitutes rather than admits: a clause scanning `components` in
this repo scans `components/ame` in the package, because admitting the parent on
account of a listed child would walk the portfolio and report its files as the
package's.

**Extraction is now selection.** `node tokens/extract.mjs --out <dir> --verify`
copies the manifest, writes the package's own `package.json` and CI workflow —
written, not copied, because the monorepo's name scripts the package has no
subject for and W1 would rightly fail on every one — then installs from clean
and runs `gate --scope package`. One instrument judges the output and it is not
the script: the extracted tree passes its own gate, or the run fails and prints
the violations, each of which is a one-line fix in `invariants.json`.

**A skipped clause is reported, never passed.** The run prints what it did not
ask, so silence cannot be mistaken for a green light.

**Two baselines, because a drift count measures a tree.** The package has 116
clientless tokens against this repo's 15, since the surfaces that consume them
are the application. Judging the package against the app's numbers would fail it
for being itself; lowering the app's to suit would blind this repo. Package
scope reads `baseline.package.json`, and X1's rule holds on each independently.

**The regression class, not the instance.** `packages/ame-tokens/package.json`
said `UNLICENSED` while the root LICENSE said MIT — fixed downstream during the
first extraction and re-broken by the second copy, because the source was never
changed. It is MIT here now, so no copy can carry the contradiction again.

**Enforced where it is written.** `tests/clause-scope.test.ts` fails a clause
added without a scope, on the run that adds it, rather than leaving it to
surface as a mystery violation at the next sync. It is a test and not a clause
because the gate reads scope to decide what to run, and a clause reading scope
to police scope would ask the mechanism to validate itself.

**Named gaps, not silent ones.** `examples/` and `tokens/gate-fixtures.mjs` are
in the published package but not in this tree — they were built during the first
extraction and never came back upstream. The manifest states what exists, so
they are absent from it and recorded in `package_manifest.$gap`; porting them
back is one line here once they land. Nothing has been pushed to `ame/main`: the
merge condition is a green fresh-clone run, and that is a CI job on a branch of
the standalone rather than a local claim.

## D-82 The fixtures come home, and the extraction carries them

2026-08-25. Closes the gap D-81 named rather than leaving it recorded.

`examples/` and `tokens/gate-fixtures.mjs` were built during the first
extraction and never came back upstream. Two consequences, and the second is the
worse one: this repo had no disconfirming world, so every clause here was proven
only in the direction that passes; and the manifest could not name them, so the
next sync would have deleted them from the package. A gap that deletes evidence
on the next run of the thing that found it is not a gap to record.

**Adapted, not copied.** The fixtures bound unprefixed names; this branch emits
`--ame-*`. Every token they name still exists here and `--ame-color-ink` is still
base-tier, so the violating fixture still trips U1 and U2 for the reason it was
written to.

**FX1 enters all three homes in one change**, and its census record is
`structural` on purpose. `check.mjs --fixtures` only widens a scan list; the
inversion lives in `gate-fixtures.mjs`. A `checkFixtures()` inside the gate would
be a mode in which the gate failing is the gate succeeding, which is the one
thing it must not have — Z1 was right to refuse the first record that named one.

**Two lists, because the clauses read roots two ways.** A walker takes a
directory and descends it; D1 and D2 open a stylesheet and read it. Handing a
directory to the second is exactly how the first attempt failed, so
`scan_extends` and `file_extends` are declared rather than inferred from whether
a path has a dot in it.

**The evidence must name the fixture.** The runner's D2 check accepted any
restated line, and this tree carries restated values of its own — so the run
passed while the thing it exists to demonstrate went uncaught. It now requires
the line to name `examples/violating`. Found by reading the output rather than
the exit code, which is the whole argument for printing the evidence.

Disconfirmed before believed: neutering the fixture fails the run on U2, CV1 and
the missing evidence line. `extract --verify` runs both halves now, so the local
proof and the CI proof are the same proof.
