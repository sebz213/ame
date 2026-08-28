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
>
> A third arrived the same way on 2026-08-26. The hydration entry below was
> written as D-74 on 2026-08-23, before this trim, and was carried in later with
> the fix it explains; 74 had since been removed with the rest, so it is D-88
> here. Its date is the date it was reasoned, not the date it landed — which is
> the whole point of keeping the dates.

## D-76 A layer-wide opacity is a ceiling, and it reverses D-nothing quietly

2026-08-24. The wall's scrim carried opacity 0.8, recorded in its own comment as a
deliberate choice: a fifth off the finished thing rather than a re-mix of eighteen
stops. That reasoning was right about cost and wrong about consequence. An element at
0.8 has a ceiling -- nothing drawn on it paints more than 80% of any colour, including
the stop that says 100%. So the foot of the wall stopped at four fifths of the page's
own ground, and the last row was a cut rather than a dissolve.

Eyeballing a screenshot said "the scrim is not painting at all", which was
wrong; a magenta control proved the scrim covered the full 550px box. What
settled it was sampling the pixels. The wall's bottom row read luma 43 against
a ground of 19, and mottled to 67 wherever a bright tile ran into the edge. A
layer that cannot reach the colour behind it cannot dissolve into it. No
adjustment to the ramp's shape can fix that, because the ceiling is applied
after the ramp is drawn.

The fix moves the fifth off the element and onto the stops, chosen so nothing
already tuned moves. Every alpha is now the authored value times 0.8, so both
ramps composite exactly as before. Only one stop changes behaviour: the
linear's last, which reaches full ink at 98% and holds to the edge. Bottom row
now reads 19 across the width, the same as the ground below it.

Two things to carry forward. Baking a constant into values makes those values
no longer the authored ones. The authored numbers are written into the comment
beside them. Otherwise the next relative change compounds against a scaled
baseline (D-73). And where a composite has to reach a specific colour rather
than merely approach it, the opacity belongs in the stops, never on the
element.

## D-77 The tracking ramp could not cross zero, so no headline could be tightened

2026-08-24. Ame's letter-spacing was checked against the ordinary typographic
rule: tighten large type, leave body alone, open up small type and capitals.
It failed at the top end for a structural reason rather than a taste one.
Every rung of font.tracking was non-negative, floored at `tightest: 0`. A ramp
that cannot go below zero cannot tighten anything. The 38px hero line ran at
+0.04em and the 48px stat figures at +0.023em. Both push a headline apart
rather than pulling it together.

The ramp already knew the rule. `tighter` was documented as "the larger the
type, the less tracking it wants". `tightest` was documented as "at display
sizes the letterforms already have enough air, and any positive tracking reads
as the word coming apart". Both descriptions argue for negative values; both
held positive ones. The floor was the whole defect, and it had been argued
against in its own docstring.

Swept at the base tier so every surface follows. tightest 0 -> -0.03, tighter
0.02 -> -0.02, tight 0.04 -> 0.02, base 0.07 -> 0.02, caps 0.14 -> 0.08. body
stayed at 0.05.

Two rungs could not simply be shifted, and the reason is worth keeping. `tight` is
bound by a 38px display line AND by 13-15px labels -- its own description said "at any
size" -- and those two want opposite signs. Taking a token negative would have tightened
small text, which is the one place tracking must be positive. So the fix was not a value
but a binding: the hero line was repointed from tight-tracking to hero-tracking, and
hero-tracking from font.tracking.tight to font.tracking.tighter. One token per job, the
way the file's own note about a wrong name propagating already argued.

Same for `body`, which serves 18px prose and 12-15px labels. Its dominant use is the
small end -- 123 rendered elements against 7 -- so it kept 0.05, which is correct there
and 0.05 too wide for the prose. That gap is open, and closing it means splitting the
token, not moving it.

The largest number on the page was tracked by accident. `metric.tsx` set no
letter-spacing, and letter-spacing inherits as a computed length rather than
as the em it was written in. So a 48px figure inherited 1.12px from a 14px
ancestor. That is 0.08em of the ancestor and 0.023em of itself. It happened to
land near a defensible value, which is exactly why it survived. It is now
bound to the display rung.

Measured after: 48px and 38.4px both at -0.02em, 24px at +0.02em, 12-15px
between +0.02 and +0.05em. Gate counters unchanged except H1, which fell 13 ->
12. font.tracking.tighter had no consumer until the hero was repointed onto
it. The orphan-token count is a live reading, not a static list.

Nothing is public, so nothing is urgent. Recorded now because the decision is
cheapest before the repo is shared and irreversible after.

## D-78 A résumé keyword links to its evidence, and KW1 stops the link going stale

2026-08-25. On the owner's instruction to give each résumé keyword a link to an
example, with the passage highlighted on arrival.

**The survey came first, and it is the finding.** Thirty-nine keywords across
five columns, checked against every published route. **Eighteen have a real
example. Twenty-one do not.** Linking all thirty-nine would let two thirds
point at pages that merely say the word. The map records both states instead,
and the surface renders them differently. A keyword with evidence is a link; a
keyword without is plain text. An unbacked claim stated plainly is honest. An
unbacked claim wearing a link promises evidence and delivers a mirror. That is
the failure the whole token contract exists to refuse, moved from values to
claims.

Some near-misses were rejected on purpose. **Next.js**, **Claude Code**,
**Product Designer** and **4 Years** all "appear" on the portfolio — in the
résumé grid itself. Linking a claim to its own restatement is circular, so
they stay unlinked. **Figma** appears only as a term-sheet `stack=` value: a
claim about a tool, not an example of using it. **Instrument** appears nowhere
at all; its two apparent hits are the word "instrumented" describing a
measurement method. **WCAG 2.2** is the painful one. The gate measures fifteen
contrast pairs against 4.5:1 and 7:1 on every run, and none of it is published
on any route. The strongest unbacked claim in the grid is one the repo already
proves privately.

**The mechanism has no runtime.** `<Kw id="…">` wraps the passage and carries the
id; the browser scrolls; `:target` rings it (`.kw-anchor`, app/globals.css).
Nothing to hydrate, nothing to clean up, and a copied link works. The cost is
that re-clicking the same link does not re-flash, which is a fair price.

**A ring, not a background wash.** A wash would place text on a colour no C
clause measures, which is what CV1 exists to prevent. The highlight is an
outline instead. It changes no foreground pair and leaves the passage at the
contrast it was proven at. Under `prefers-reduced-motion` the ring is held
rather than animated: dropping it entirely would take the information from the
readers most likely to need it. Timing composes two existing semantic motion
tokens rather than introducing a third, and no base primitive is bound (U2).

**KW1, so a keyword cannot outlive its evidence.** contract.md section KW,
`invariants.json > keywords`, `checkKeywords` — one change, per CLAUDE.md. It
resolves every declared link against the file it names. Either a `<Kw>`
wrapper whose inner text still contains the declared phrase, or a heading that
still exists in a generated page. It also checks the other direction, so an
anchor no keyword claims fails too. Disconfirmed three ways before being
believed — anchor deleted, evidence reworded inside the anchor, orphan anchor
added — each producing the message naming what to do.

Data in `lib/portfolio/keywords.json`, with `keywords.ts` as its typed view.
R-37 established that split for the component registry, for the same reason. A
checker in Node and a component in TypeScript must read one file.

**The check's stated reach.** KW1 proves the anchor is in the *source*. It
does not prove the source rendered. Both were verified by hand this pass. All
twelve `<Kw>` ids and all six heading ids are present in the built HTML. That
is a measurement, not a clause: a component that silently dropped its children
would pass KW1. Naming the gap rather than implying coverage; closing it means
running the check against the emitted tree, which is what `--shipped` mode
already does for G1.

**Twenty-one keywords are now a content work list**, exported as
`KEYWORDS_WITHOUT_EVIDENCE` rather than hidden. Publishing the gate's contrast
table would close WCAG 2.2 outright.

## D-79 The résumé keywords become pills, and the language switch gets one home

2026-08-25.

**The keywords are pills now, and the pill already existed.**
`PortfolioExpertisePill` was the expertise section's earlier treatment and had
been left mounted only in the `/ame` catalog. Rather than write a second pill,
its `icon` and `tooltip` became optional. The services row gives every pill a
glyph. 39 résumé keywords would have needed 39 arbitrary ones, when the label
is already the content. A pill with no tooltip no longer claims the
single-open slot in the tooltip coordinator. Otherwise hovering it would close
the tooltip of the pill you were reading. It only takes a pointer cursor when
it has somewhere to go.

The card's expertise variant now renders one `dd` per column holding a `ul` of
pills. That is the honest wrapper: the label is the term, and the pills are
the one definition. The stack is even because a single `gap` sets every step
rather than each item carrying its own margin.

**A linked pill carries its reason.** The tooltip is the map's `because` — what
the reader will find, said before the click rather than after it. An unlinked
keyword is a pill with no href and no tooltip, because there is no example on a
published route yet; KW1 keeps the linked half honest.

**The language switch has one home.** The top bar's button held the whole
mechanism inline: the cycle, the timings, the bounce, the
`document.documentElement.lang` write. A mobile glass pill showing the same
language would have been a second switch that agrees with the first exactly
until one of them is edited. `hooks/use-language-cycle` is the switch;
`components/portfolio/language-pill.tsx` is the glass treatment, and the top
bar now reads the hook rather than its own copy. The timing constants moved
with it: 179.4 / 772.8 / 993.6, and the derivation comment that explains them.
Two surfaces reading one number is the whole reason they are a constant.

The bounce is applied to the label, not the glass. Scaling a `backdrop-filter`
element re-rasterises the blur every frame and the edge crawls; scaling the text
inside it leaves the glass still. Same motion, drawn where it is cheap — the
reasoning of D-36, which grew `mask-size` rather than transforming the masked
element.

**Mobile: the viewer and its exit are one screen.** The phone filled the view
and gave the reader no visible reason to keep going. `.port-work-screen` makes
the card and a case-studies link a single viewport-tall block, the link pinned
to its bottom by `margin-top: auto` and resting 40px clear of the fold. The
40px is clearance from the fold, not a gap under the card — a fixed margin
would have set a gap and only accidentally matched on one phone. `svh` rather
than `vh`. A phone's dynamic toolbar makes `vh` taller than what is on screen,
which would put the link under the fold on exactly the browsers this exists
for.

**The viewer's frame moved to CSS to be able to change at all.** A media query
cannot reach an inline style. It stays expressed in layout, never `transform:
scale()`. Both the WebGL renderers and the CSS3D perspective are built from
`clientWidth`/`clientHeight`. A transform hands the renderer one size and
paints another. The card's own comment records measuring that defect:
offsetWidth 976 against a painted 1073.6. Mobile takes the desktop overscan
10% further, 121%, which is the zoom: the card crops the same rectangle, so a
larger box puts more pixels behind that crop. Centred rather than
top-anchored. On a short viewport a top anchor pushes the device's foot out of
the crop. At 121% the transparent top edge sits 10.5% clear of the card, so
the anchor was buying nothing.

**One thing caught in the writing.** The case-studies link was first pointed
at `#work-case-studies`, an id that does not exist. A dangling anchor, in the
same session that built KW1 to forbid exactly that. The real id is
`#case-studies`. KW1 does not cover in-page hrefs on the portfolio surface,
only keyword links into content, so nothing would have caught it. Worth
knowing that the clause's reach stops there.

H1 fell 16 → 15: the link binds `space.control-pad`, which had no client. The
baseline moved down in the change that earned it (X1).

## D-80 The resume is a legal-shell document, and the legal area drops the subnav

2026-08-25

**It lives in `content/legal/` and it is not a legal document.** The directory
is where the loader with `baseUrl: '/portfolio'` reads from, and that loader
is what puts a page at `/portfolio/<slug>`. Adding a third source for one page
would mean a second copy of the shell decision, the chrome mapping and the
route layout. The gain would be a directory name that reads better. The name
describes the route group it serves, not a claim about the contents. If a
third non-legal page arrives, rename the directory rather than duplicating the
loader.

**The download button is the home CTA's shape and not its colours.** Same
filled pill, same height, same shimmer, a download icon in place of the arrow.
The hero CTA binds the on-dark pair because it sits on the wall panel, which
is dark in both themes. This page takes the page background, so the pill binds
`text-body` on `background-page`. That is the pair the Github button already
uses. A straight copy would have been white-on-white in light mode.

**The legal area makes the opposite mobile trade from the case studies.** Both
had two header rows on a phone, roughly 110px before a word of the article. On
a case study the subnav is worth keeping: it holds the search and the toggle
for a sidebar that is a tree of pages. A legal page has one document, its
sidebar is already hidden and inert, so the toggle opens nothing and the
search leaves the page it was opened from. So the band stays and the subnav
goes. `display: none`, not opacity: unlike the sidebar this row holds no
column open, and a duplicate mark should leave the tab order too. Below md
only; above it neither rule applies.

**RESUME_URL stays `[[RESUME_URL]]` and G1 keeps blocking it.** The button
should point at a file and there is no file. A placeholder that fails the gate
is the honest state. Reading it from `lib/portfolio/contact` means that the
day the file exists, one edit moves this button and the two Resume links
already bound to the same token.

**Flagged, then decided the same day: both links point at the page.** "Resume"
means two things here and they are not interchangeable, so there are now two
constants. `RESUME_PAGE` is where a reader goes to read it; `RESUME_URL` is
the file they take away. A link labelled Resume goes to the page. It resolves
today, it carries the site's chrome, and the download button lives on it. That
button is the only thing still reading the file token. G1 is therefore
blocking exactly one thing, and it is the thing that is genuinely missing.

## D-81 Scope is a property of the clause, so extraction stops being surgery

2026-08-25. Replaces the manifest-plus-overlay plan, which treated the symptom.

What the 35 violations were saying. Extracting the package twice produced,
both times, a list of clauses with no subject in the copy. The second list was
longer and harder than the first, because the contract had grown 17 clauses in
a month. Each pass ended in judgment: is the resolver check Ame's? yes; is the
recipe-to-element mapping Ame's? no, its elements are this app's components.
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
two things that must agree: the extraction copies it, and the gate filters
every scan root through it. A root outside the manifest is out of scope, not
missing. X2 exists to keep that distinction, so "the app is not here" and
"something that should be here is gone" remain different answers.

The filter substitutes rather than admits. A clause scanning `components` in
this repo scans `components/ame` in the package. Admitting the parent on
account of a listed child would walk the portfolio and report its files as the
package's.

Extraction is now selection. `node tokens/extract.mjs --out <dir> --verify`
copies the manifest, then writes the package's own `package.json` and CI
workflow. Written, not copied: the monorepo's name scripts the package has no
subject for, and W1 would rightly fail on every one. It then installs from
clean and runs `gate --scope package`. One instrument judges the output, and
it is not the script. Either the extracted tree passes its own gate, or the
run fails and prints the violations. Each is a one-line fix in
`invariants.json`.

**A skipped clause is reported, never passed.** The run prints what it did not
ask, so silence cannot be mistaken for a green light.

**Two baselines, because a drift count measures a tree.** The package has 116
clientless tokens against this repo's 15, since the surfaces that consume them
are the application. Judging the package against the app's numbers would fail it
for being itself; lowering the app's to suit would blind this repo. Package
scope reads `baseline.package.json`, and X1's rule holds on each independently.

The regression class, not the instance. `packages/ame-tokens/package.json`
said `UNLICENSED` while the root LICENSE said MIT. The first extraction fixed
it downstream and the second copy re-broke it, because the source was never
changed. It is MIT here now, so no copy can carry the contradiction again.

Enforced where it is written. `tests/clause-scope.test.ts` fails a clause
added without a scope, on the run that adds it. It does not leave the gap to
surface as a mystery violation at the next sync. It is a test and not a
clause. The gate reads scope to decide what to run, so a clause reading scope
to police scope would ask the mechanism to validate itself.

Named gaps, not silent ones. `examples/` and `tokens/gate-fixtures.mjs` are in
the published package but not in this tree. They were built during the first
extraction and never came back upstream. The manifest states what exists, so
they are absent from it and recorded in `package_manifest.$gap`; porting them
back is one line here once they land. Nothing has been pushed to `ame/main`.
The merge condition is a green fresh-clone run. That is a CI job on a branch
of the standalone, not a local claim.

## D-82 The fixtures come home, and the extraction carries them

2026-08-25. Closes the gap D-81 named rather than leaving it recorded.

`examples/` and `tokens/gate-fixtures.mjs` were built during the first
extraction and never came back upstream. Two consequences follow, and the
second is worse. This repo had no disconfirming world, so every clause here
was proven only in the direction that passes. And the manifest could not name
them, so the next sync would have deleted them from the package. A gap that
deletes evidence on the next run of the thing that found it is not a gap to
record.

**Adapted, not copied.** The fixtures bound unprefixed names; this branch emits
`--ame-*`. Every token they name still exists here and `--ame-color-ink` is still
base-tier, so the violating fixture still trips U1 and U2 for the reason it was
written to.

**FX1 enters all three homes in one change**, and its census record is
`structural` on purpose. `check.mjs --fixtures` only widens a scan list; the
inversion lives in `gate-fixtures.mjs`. A `checkFixtures()` inside the gate
would be a mode where the gate failing is the gate succeeding. That is the one
thing it must not have. Z1 was right to refuse the first record that named
one.

**Two lists, because the clauses read roots two ways.** A walker takes a
directory and descends it; D1 and D2 open a stylesheet and read it. Handing a
directory to the second is how the first attempt failed. So `scan_extends` and
`file_extends` are declared, not inferred from whether a path has a dot in it.

The evidence must name the fixture. The runner's D2 check accepted any
restated line, and this tree carries restated values of its own. The run
passed while the thing it exists to demonstrate went uncaught. It now requires
the line to name `examples/violating`. Found by reading the output rather than
the exit code, which is the whole argument for printing the evidence.

Disconfirmed before believed: neutering the fixture fails the run on U2, CV1 and
the missing evidence line. `extract --verify` runs both halves now, so the local
proof and the CI proof are the same proof.

## D-83 A clause that goes quiet is worse than a clause that fails

2026-08-25. Found by a fresh clone, which is the only reason it was found.

W5 reported eight uninvoked scripts on a clean clone of a tree that reported
none. The scripts had not moved. W1 and W5 read `run:` lines out of the CI
workflow. Their patterns end in `$`. The parser split on `\n` and left the
`\r`. In a JS regex `\r` is a line terminator, so `$` never matched on a CRLF
checkout. Both clauses parsed nothing. W5 concluded nothing was ever invoked
and fired on everything. W1, which verifies that CI names scripts that exist,
simply stopped verifying — and printed no different output while doing it.

The failure mode is the point. A clause that fails loudly is doing its job; a
clause that silently stops asking is a clause the tree still gets credit for.
W1 would have kept passing indefinitely on every Windows contributor's machine
while checking nothing. B4's CRLF failure has the same shape. That makes it a
pattern rather than an incident. Reasoning about text cleared the tree twice.
A clone on another machine refused it in one run, both times.

Fixed in two halves, because either alone leaves the hole open. The parser drops
the `\r`, since no clause may depend on a checkout setting to keep asking its
question. And `.gitattributes` takes `* text=auto eol=lf`, so the tree a
contributor holds is byte-identical to the tree CI holds — the LFS paths keep
their own `-text` and are unaffected. The second half is what makes B4's
byte-compare meaningful for anyone not on Linux.

What is not fixed: nothing structurally prevents the next clause from going
quiet the same way. Clauses need disconfirming fixtures, the way the gate now
has one: a case each clause must fail on. A clause that stops asking is then
caught by the thing it stops catching. `examples/` (D-82) is that instrument
for the gate as a whole; it does not yet exist per clause. Recorded as open,
not solved.

## D-84 A manifest's silence means two different things, so the sync must be shown the tree it replaces

2026-08-25. Found by making a diff readable, not by adding a check.

The sync branch had been built as an orphan commit: a fresh `git init` over
the extracted tree. It passed CI. It had no common ancestor with `main`, so it
could not be merged. It read as a rewrite of all 73 files, and its diff said
nothing about what it changed. Rebuilding it as a commit on main took one
command. It showed two deletions at once: the extraction preflight and the
decision-status classification. `docs/PROVENANCE.md` cites both as the
evidence for its claims. The sync would have removed the documents and left
the citations pointing at them.

Why nothing caught it. `package_manifest.paths` lists what travels, and a sync
overwrites a whole tree, so a file the manifest does not name is deleted. But
not naming a file is also exactly how the manifest says *this is not mine* — the
monorepo's own README, its app routes, its public assets. Omission carries both
meanings and they are indistinguishable from inside the manifest. No amount of
reading it more carefully separates them, which is why the fixtures went the
same way in D-82 and why a person, not an instrument, found both.

The separation has to come from outside: `extract.mjs --against <published
tree>` enumerates what the package currently holds and refuses any extraction
that cannot account for a file in it. Deletion stays possible, because files do
leave, but it costs `--allow-delete` — a sentence in a commit message instead of
a silence. It requires `--verify`, since `pnpm-lock.yaml` is written by that
install and an unverified tree would report a deletion that is only an artefact
of stopping early.

Two things generalise. Preferring the orphan commit chose a clean-looking
result over a legible one. The illegibility was load-bearing. The check that
would have caught this was `git diff`, available the entire time. And every
manifest in this system has the same ambiguity — `scan_roots`, `reachability
.exempt`, `uninvoked_exempt` all encode *deliberately absent* and *forgotten*
identically. Only the package manifest has an instrument that can tell them
apart. Recorded as the general case, unsolved.

## D-85 The licence moves to Apache-2.0, and the name stops being a convention

2026-08-26. Owner's call, taken on a reading of the option space.

MIT and Apache-2.0 grant the same freedoms in practice: fork it, change it,
sell what you build. The difference that decided it is section 6. MIT says
nothing about names, so under it a fork could ship as "Ame" and a reader could
not tell whose work they were looking at. Apache-2.0 withholds trademark rights
explicitly, which turns a sentence in the README — *the marks are not licensed
for reuse* — into a term of the licence itself. The permission to reuse the work
was never in question; the ambiguity about whose work it is was.

The patent grant, usually the headline reason to prefer Apache-2.0, is close to
irrelevant here: a token system and a text-scanning gate are not patentable
subject matter worth granting. It is section 6 or nothing.

The prose gets a second offer. Four documents carry the reasoning rather than
the mechanism: `tokens/contract.md`, `tokens/decisions.md`, `STANDARD.md` and
`docs/LEXICON.md`. They are the part most likely to be quoted in a post, a
paper or a talk. A software licence answers the wrong question about prose.
Those four are offered under either Apache-2.0 or CC BY 4.0, at the reader's
choice. The file list lives in `LICENSE-DOCS` and nowhere else. Nothing is
withheld by the addition; it exists to remove an argument.

**Clean to do, and only because nothing was published.** `git log` shows one
human author across 623 commits; the dependabot bumps and the assistant
commits carry no independent copyright claim. A relicence with outside
contributors needs their consent, and this one had no one to ask. It also
avoids the usual catch. An MIT release already in someone's hands stays MIT
forever, and this repository has always been private. Doing this after
publication would have been a different and much worse decision.

**What it cost, and the thing worth keeping.** The identifier turned out to
live in eight places. Seven were updated by hand and the eighth, the package
README's "MIT, stated in LICENSE", survived — the front door of the published
package, contradicting the licence beside it. That is the README-figures
failure exactly (264 tokens over a tree holding 339), in a place where being
wrong costs more than a stale count. So the licence became a checked
invariant. Clause L1 reads every declaring file on every gate run. It failed
on its first run, against a tree already called finished. Dated records are
deliberately not read, because a CHANGELOG that says MIT is correct about the
day it describes and rewriting it would be the worse lie.

**Not settled by this.** `components/ame/icons/` ships 218 glyphs from a
Storybook export whose rights are unestablished, and they travel into the
published package. Apache-2.0 asserts the licensor may license what is in the
tree; that assertion is only as good as the provenance under it. Recorded in
the README's Rights section as open, and it blocks publication more directly
than R-3's fonts ever did, since the fonts do not travel and these do.

## D-86 The icons were always MIT, and nothing in the tree knew it

2026-08-26. Closes the question D-85 left open, and not in the direction the
open question implied.

The 218 glyphs under `components/ame/icons/` are a Storybook export of the
Schweizerische Eidgenossenschaft's icon set, MIT licensed. MIT permits exactly
this use — redistribution inside an Apache-2.0 tree, commercially, modified —
so the answer is that the relicence was fine and the icons may ship.

The finding is that the tree could not answer this. VN1 exists to make an
unrecorded third-party file impossible. Every file under a vendored root is
listed in `VENDORED.md`, and every listed path exists. A component cannot be
added without recording it. It did not catch 218 third-party files, because it
governs *declared roots* and `components/ame/icons` was never declared one.
The clause was working perfectly, on a set that did not include the thing. A
rule scoped by a list has the list's blind spots, and nothing measures what a
list omits. D-84's manifest has the same shape, where omission means both not
mine and forgotten. The two sit three entries apart in this log.

What surfaced it was asking what a licence asserts. Apache-2.0 says the
licensor may license what is in the tree. That assertion is only as good as
the provenance under it. Reading the tree for provenance found none for the
icons. No instrument was involved.

**MIT is permissive, not unconditional.** The permission notice must be included
in all copies or substantial portions, and 218 glyphs is a substantial portion.
So the notice is the term that makes the use lawful, not paperwork about it —
which means it cannot depend on nobody deleting a file. It is reproduced in
`THIRD-PARTY-NOTICES` (a copy, because a link is not one) and clause L1 reads
the text on every gate run. Verified by deleting the line and watching the gate
go red.

L1 got a second lesson in the same session. Its stale-identifier scan fired on
`NOTICE`, which legitimately says the icon set is MIT. A true statement about
someone else's work read as a stale claim about this project. The fix was not
to rewrite the sentence until the checker was happy. That dodges a linter
rather than fixing it. A paragraph naming a declared third-party holder is now
exempt. Paragraph and not line because the first attempt failed on where a
line break happened to fall, and a rule whose verdict depends on typography is
measuring the wrong thing.

**Still open.** `components/ame/icons` is documented but is still not a declared
vendored root, so the structural gap that let 218 files sit unrecorded is
described rather than closed. Making it one interacts with VN2, which asserts
`components/ui` has one home across three enforcement sites, and that is its own
change rather than a footnote to this one.

## D-87 Two clauses shared an ID and the gate did not notice

2026-08-26. Caused while writing D-86's clause, found by reading the README.

The licence clause was written as **L1**. `L1` was already taken — *"a base
token states a literal, it references nothing"*, the first of the four layering
clauses. The new entry overwrote the old one in `census.clauses`, so the
layering clause lost its census record and the licence clause took its name.

The gate stayed green through all of it. Z1 is the bijection census: every
contract clause maps to an invariant and a check, and every check is claimed
by a clause. It passed because both entries were structurally valid: a real
invariant and a real check function. A duplicate key in an object is not a
mismatch either. It is one key. `contract.md` carried two clauses both
labelled `L1` and nothing compared them. Z1 verifies that the mapping
*resolves*, never that the identifiers are *distinct*.

What caught it was noticing an `L` row in the README's clause-family table that
described layering, next to a licence clause claiming the same letter. A person
reading prose, again — the same instrument that found D-84's deletions and
D-86's unrecorded icons. Three findings in one session, none of them by a check.

Renamed to **LC1**, and the layering entry restored from `HEAD~1`. The
collision cost nothing permanent, because the same session caught it. It was
two commits from being pushed. A layering clause silently missing its census
entry stays wrong for months.

**The pattern is now three deep and worth naming.** D-52 and D-54 collided
with existing decision numbers on the way in. D-80 was written when D-80
existed. Now two clauses. Each is an identifier assigned by hand into a
namespace nothing enforces uniqueness over. Each was caught by a human
noticing, or not caught at all. `ame` issue #1 proposed the decision-side
check; the clause side is the same defect and would be the same check.
Recorded here so the third instance is not filed as bad luck.


## D-88 A hydration failure reports where React resumed, not where the HTML broke

2026-08-23. A console error named app/layout.tsx:246 -- the pre-paint inline
script in <head> -- and said scripts inside React components never execute on
the client. Both statements were true and neither was the bug. The actual
defect was four sections down the page. The case-study carousel wrapped each
card in an <a>, and one card's artwork is live component specimens. Thirteen
buttons and three anchors ended up inside an anchor.

The chain runs one way only. <a> has a transparent content model but forbids
interactive descendants. A parser will not nest anchors: it closes the outer
and promotes the inner. So the DOM the browser built was not the tree React
had serialised, and hydration failed. React did what it does on failure. It
discarded the server tree and re-rendered the whole document on the client.
Client rendering is the only path where React creates a <script> element
itself, and creating one is what it warns about. The warning fires in the
<head> because that is where the first script is, not because anything in the
head is wrong.

So the rule: when React reports a client-render-only symptom, look first for a
hydration failure, and then for invalid HTML nesting as its cause. Fixing the
reported location would have fixed a symptom four sections away from the
defect. Both plausible fixes were wrong. next/script with beforeInteractive
renders a <script> element too, so it warns identically. In App Router it also
defers the body into self.__next_s for the Next runtime to replay. That is
strictly later than parse, and it would have broken the one guarantee that
script exists to give. Reading the framework's source settled that in a
minute; reasoning about the docs would not have.

The fix is the stretched-link pattern: the anchor moves onto the caption, which holds no
interactive content, and an ::after grows it to the card. The card-sized target survives,
and so does the accessible name, because heading and description are both inside the
anchor. The tile is inert -- without it the overlay would leave the specimens dead to the
mouse and still reachable by tab, which is worse than either state alone.

What made this findable was reading the console on a route basis rather than
trusting the stack. / was clean and /portfolio was not. Each document load
resets React's once-per-session warning flag, so that difference was signal
rather than noise. It said the cause is route-specific, which a <head> shared
by every route cannot be. The stack trace pointed at the shared file; the
route difference pointed at the route.

## D-89 The numbers table stops printing the date it was generated

2026-08-27. Prompted by a real CI failure, and fixes a different bug found
underneath it.

`numbers parity` went red on the sync branch. The cause was exactly what the
clause is for: D-88 was added, the decision count moved 12 to 13, and the
committed table still said 12. The check caught a stale published figure, which
is the entire reason it exists. Regenerating was the right fix and the whole fix
for that failure.

Underneath it was a second defect that had not fired yet and was certain to.
The block printed `new Date()` into its own text, and `--check` regenerates
and compares. So a README generated on one day and pushed on the next
disagreed with a fresh run, with every figure correct. CI would have gone red
on the calendar rather than on the tree.

That is worse than a missing check. CLAUDE.md already says a gate that reads
`FAIL` for a whole session becomes background noise, and that the first thing
the noise hides is the next real failure. A check with a scheduled false
positive manufactures exactly that noise. It would have arrived looking
identical to the true failure it had just produced. The next person would have
learned that `numbers parity` is the flaky one.

The date is gone rather than special-cased. Nothing is lost by removing it: a
date says when somebody last looked, while `pnpm numbers:check` runs on every
push and says the figures match *this commit*. The second claim is strictly
stronger and cannot go stale, so printing the weaker one beside it only created
a way to be wrong. The generator is now idempotent — byte-identical output on
repeated runs — which is what a parity check requires and what it never had.

Worth naming: the false positive was invisible while it agreed with the true
one. It was found only because the real failure was investigated rather than
patched, and the first hypothesis for the red build was the date. Being wrong
about the cause is what surfaced it.

## D-90 The asset budget had four classes and the largest file in the tree was in none of them

2026-08-27. Found by reading a Lighthouse run that was mostly good news.

The reduction orders worked. `/portfolio` went from 112,577,308 B to
14,749,964 B, and the sixteen-second blank screen went with them: first paint
moved from 15,970 ms to 225 ms. What did not improve was LCP, at 38.9 s. The
element it resolves against is `video/sheet-loop.mp4`: 5,942,668 B, 20.03 s of
H.264 at 2.37 Mbps. That is about 40% of everything the page weighs.

The obvious question was why a file that big had never appeared in a K1
report. The answer is that it had never been weighed. `classOf` maps an
extension to one of four classes: svg, font, image, model. `.mp4` is in none
of them. It returned null, and the loop said `if (!cls) continue`. Not a
generous ceiling. No ceiling. Meanwhile the clause directly above read
**"Every file under `public/` sits within a byte ceiling for its class"**, and
every run went green.

The classes were not drawn carelessly. They were drawn in August 2026 around
the regression that existed then: a 25 MB SVG and an 82 MB GLB.
`budgets_because` still argues each ceiling against files that were in the
tree at the time. Video was simply not in view. That is the failure mode worth
naming: the check was correct about everything it had been pointed at, and
silent about the category nobody had thought of. A budget with an open world
does not fail when something new arrives — it just stops covering it, and says
nothing.

So two changes rather than one. A `video` class at 2 MB. It is the only
ceiling here set by a consequence rather than by what is already in the tree,
because the tree holds exactly one video and it is over. 2 MB over 20.03 s is
~837 Kbps, affordable for footage the sheets luma-key before showing. It is
not looser because the shared blob has no byte ranges. Every sheet waits for
the whole file, and each megabyte costs about 5.4 s of LCP on the profile
Lighthouse throttles to. And then the part that matters more: the world is
closed. `asset_budget.unweighed` lists the extensions deliberately not weighed
(`.html`, a document), and anything classed by neither fails and asks to be
classified. Validated by planting a `.bin` under `public/`, watching K1 turn
the gate red, and deleting it.

The ceiling is not met today and the waiver says so plainly, including what it
does **not** close. Byte weight and LCP are different problems here. Even at 2
MB the un-streamable blob is still ~11 s of that page's LCP. Getting the film
off the critical path is a separate change with its own choices. A poster the
sheets paint first, or giving back the shared blob to take back range
requests. A waiver that quietly implied it had booked that would be worse than
no waiver. The encode itself was deferred for a dull reason, no ffmpeg in this
environment, and the trigger says exactly that rather than inventing a
milestone.

One thing fell out of the audit. `waived_because` said seven waived assets while
the run reported nine, because two object-form image waivers had landed without
anyone returning to the prose. The same count in two places, drifting — which is
the README-figures lesson again, in the file that exists to state the rules.
