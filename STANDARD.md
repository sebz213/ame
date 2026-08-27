# Repo standard

The conditions this repository holds itself to. Each clause is checkable: it names the condition, the check that proves it, and the source it leans on. A clause without a check does not bind, and a clause violated knowingly must carry a recorded decision, the same rule `tokens/contract.md` already applies to token values.

Scope markers: *(publication)* binds only if the repo is published; *(deploy)* binds only while the site is deployed. Everything unmarked binds always.

## Sources

**S1** Microdata spec. **S2** Parnas 1972, on decomposing systems into modules. **S3** Marwick et al., research compendia. **S4** Patterns of Folder Use and Project Popularity. **S5** Perez-Riverol 2016, Ten Simple Rules for Git. **S6** What Makes a Popular Academic AI Repository. **S7** Noble 2009, organizing computational projects. **S8** Deissenboeck & Pizka 2006, concise and consistent naming. **S9** Wilson 2017, Good Enough Practices in Scientific Computing. **S10** Feitelson 2021, How Developers Choose Names. **S11** Tsay 2014, social and technical factors in GitHub evaluation. **S12 to S16** Schema.org type pages: SoftwareSourceCode, SoftwareApplication, WebPage, WebPageElement, WebSite.

---

## V. Version control

**V1.** The tree is a git repository with a remote. Every change lands as a commit. (S5 rule 1, S9 rule 5h)

```bash
git log --oneline | head -1 && git remote -v
```

**V2.** A commit is one undoable group of edits, and its message says what changed and why. No half-done or broken code committed to the main branch. (S9 rules 5b, 5d)

**V3.** Generated files are not committed. The one standing exception: `packages/ame-tokens/tokens.css`, the published token home the portfolio and Metis bind, which contract clause B4 holds honest by rebuilding it from source in memory and byte-comparing, so a source edit that was never rebuilt cannot pass. It is committed because a consumer installs the package without building it. There is one emitted home, not a mirrored pair; any new exception needs the same treatment, a machine check and a written decision. (S5 rule 1, S9)

**V4.** No file over 5 MB enters git outside LFS, and nothing approaches GitHub's 100 MB hard limit. Models, video, and raw binaries live in LFS or external storage. (S5 rule 4, S9)

```bash
git ls-files -z | xargs -0 du -b 2>/dev/null | awk '$1 > 5000000' \
  | grep -vFf <(git lfs ls-files -n) && echo FAIL || echo PASS
```

**V5.** No credentials, tokens, or private keys in the tree, ever, including history. `.env*` stays ignored. (S9 rule on security)

**V6.** *(publication)* Releases get a tag in X.Y.Z semver form, so any shipped state can be recovered by name. (S5 rule 8)

**V7.** The concrete release convention, V6's successor and its one operational home. A release is a git tag in `vX.Y.Z` form; the leading `v` marks a release tag apart from a bare version string. A tag is cut on a portfolio-visible release: a deploy that changes what a visitor sees, or a versioned `ame@x.y.z` token bump a consumer would pin. Every tag carries one dated `CHANGELOG.md` entry, reverse-chronological, so a shipped state is recoverable by name and readable by what changed. Written before the first release so the convention is not invented under release pressure; it binds once a tag exists, and until then the check passes vacuously. (S5 rule 8, decision R-18)

```bash
for t in $(git tag -l 'v*'); do grep -q "${t#v}" CHANGELOG.md || { echo FAIL; break; }; done
```

## R. Root paratext

**R1.** A README sits at the root and states: what this is, the stack by name, how to run it in fenced code blocks, at least 1 image of the thing working, and links to the deeper docs (`tokens/`, `/system`). Lists organize it. The numbers behind each requirement: lists carry the largest popularity effect in S6 (Cliff's delta 0.38), then images (0.36), code blocks (0.35), and repo links (0.31); repos that never name their stack were 23.5% of unpopular repos against 5.2% of popular ones. (S5 Box 3, S6, S9 rule 3a)

**R2.** *(publication)* A LICENSE file at the root covers the code with the full license text, and the README states the separate rights over content, brand assets, and fonts. Licensed font files do not enter a public repo unless their license permits it. (S5 Box 3, S6, S9 rule 3d)

**R3.** `CITATION.cff` sits at the root and states how to cite the portfolio and the Ame token system. Its `version` agrees with `packages/ame-tokens/ame.json`, the version's one home. `repository-code` and `url` are omitted while the repo is private and the site is undeployed, per decision R-3; both are added in the commit that publishes either. (S5 Box 3)

**R4.** Nothing good stays buried. Every substantial internal document is reachable from the README in one hop. (S6, S4)

## C. Checks

**C1.** Every check the repo owns runs automatically. `node tokens/check.mjs` runs as part of build or CI, never only by memory.

```bash
grep -q "tokens/check" package.json && echo PASS || echo FAIL
```

**C2.** Every script in `package.json` succeeds on a clean install. A script that calls a tool the repo does not install is deleted or completed. (S9 rule 2g)

**C3.** Type errors fail the build. `ignoreBuildErrors` and its cousins are banned. (S5 rule 5)

**C4.** CI runs build plus checks on every push to the remote. A push with a broken invariant fails visibly. (S5 rule 5, S11)

**C5.** Placeholder tokens never ship. (Known reach: G1 matches the marker in prose as readily as in copy, so the comment explaining that a value *is* a placeholder is flagged alongside the placeholder. That is the mention-versus-use distinction; see docs/LEXICON.md.) The build fails if `[[` survives into emitted metadata, rendered HTML, or a deployed route. *(deploy)*

```bash
grep -rn "\[\[" .next/server/app --include="*.html" && echo FAIL || echo PASS
```

**C6.** A check that reports *nothing found* proves it can still find something. R-10 proves a gate fires once, at installation; a gate whose silence is load-bearing proves it fires on every run, by asserting a must-catch sample inside the check itself. A vacuous "none" is byte-identical to an earned one, so a matcher that has quietly stopped matching reports health it never established. Where a check carries a must-never-catch list it carries a non-empty must-catch list beside it, and both are asserted on every run rather than in a test that may not be run. (The instance that earned this: `packages/woven/check.mjs`, whose must-catch assertion caught a pattern a JSON rewrite had killed — `` re-read as the backspace escape rather than a word boundary — long after the pattern passed its one-time proof. R-80.)

```bash
node -e 'const r=require("./packages/woven/invariants.json").register; process.exit(Object.keys(r.must_catch||{}).length && Object.keys(r.must_never_catch||{}).length ? 0 : 1)' && echo PASS || echo FAIL
```

**C7.** *(stated non-clause — nothing enforces this one.)* An element's hidden resting state belongs in the markup, not only in an effect. Effects run after the browser paints and the server ships the markup it was given, so a panel whose `opacity: 0` is written in `useEffect` renders visible for at least one frame on every load — and for the whole pre-hydration window, which is as long as the JS takes to arrive.

React cannot warn about this, and that is the part worth understanding rather than remembering. Hydration checking compares the server tree against the client tree; here the two agree exactly. The server rendered a visible panel, the client hydrated a visible panel, and the effect changed it afterwards — a legal state change, not a mismatch. The defect is *which frame the truth arrives in*, and no check that diffs two trees can see a difference in time between them. A correct program with the wrong behaviour.

The distinction the common advice misses: "render the generic state, apply client specifics in an effect" is right for state the server genuinely cannot know — a `localStorage` theme, a viewport measurement — and wrong for state it does know. A tooltip is closed at rest and the server knows it is closed. Deferring that to an effect buys nothing and costs a frame. Three instances were found by hand in one sweep (`contact-menu.tsx`, `expertise-pill.tsx`, and the docs shell's measured offsets); `scroll-reveal.tsx` had the correct shape the entire time, declaring `style={{ opacity: 0 }}` in its own markup, which is the model. State it once as a module-level constant and have the effect re-apply the same object, so the two cannot drift.

The check that would catch a fourth instance is a source scanner: for any element whose file assigns `opacity` or `transform` inside a mount effect, require the same property in its `style` prop or class. G1 sets the precedent for running post-emit if the emitted tree is the better surface. It is not built, and the reasons are worth stating so the decision is re-openable rather than forgotten: it inherits the mention-versus-use problem Z2 has, it cannot see state assembled indirectly, and all three known instances are fixed — so it would ship having never fired. If it is built, it carries a stated reach in U1's shape (*this proves the closed state appears in markup for the forms scanned, not that no element flashes*) and a must-catch sample per C6, because a clause that has never fired on a real case is the `undefined` label bug waiting to happen.

The same hazard has a frame-driven cousin: `requestAnimationFrame` does not fire in a backgrounded tab, so anything whose *only* trigger is a frame may never run at all. `logo-bounce.tsx` carries the comment earned by that one, and a timer beside the frame is the fix. Measured rather than assumed: a sweep of every `requestAnimationFrame` outside the 3D viewer found no other mount-time arm depending on a frame alone — `intro-curtain` calls its lock synchronously first, `scroll-reveal` runs an IntersectionObserver with the frame as a labelled safety net, `site-header` calls `update()` before subscribing, `use-overlay-focus` fires on a user-initiated open. So this is a patch, not a pattern, and "no mount-time arm depends on rAF alone" does not yet earn a clause. It would if a second instance appeared.

## W. Workflows

**W1.** Every file path and script name a CI step spells resolves in the tree. A path inside a workflow binds the repository the way a `var()` binds a token, and it is checked the same way, by machine, at gate time. CI names work by `package.json` script rather than by script path, so a path has one home and moving a script cannot leave CI pointing at a file that no longer exists. Data in `tokens/invariants.json > workflows`; evaluated in `checkWorkflows` in `tokens/check.mjs`. (S2, decision R-69)

**W2.** Every workflow declares a least-privilege token (`permissions: contents: read`), so a job that only reads the tree cannot write to it. Same check. (decision R-69)

**W4.** A runtime version is not written into a workflow. Node's version lives in `.nvmrc`, which CI reads through `node-version-file` and a local `nvm`/`fnm` reads directly, so the runtime a contributor uses and the one CI uses are one string. It was spelled `node-version: 24` in both workflows, which is a version with one home per job; the `packageManager` field in `package.json` had already made this argument for pnpm, in a comment three lines above the duplication. Same check as W1, which also verifies the file the indirection points at exists. (S2, decision R-72)

**W3.** A check that only ever runs on a pushed branch is a check that has never run. C4 binds on push; W1 and W2 are evaluated by the local gate as well, so a CI defect is caught in the change that introduces it rather than at the first push. This clause is why W1 lives in `check.mjs` and not in a workflow. (decision R-69)

**W5.** Every script `package.json` defines is invoked by something, or carries a stated reason why not. W1 asks whether a script a workflow names exists; W5 is its mirror and asks whether a script that exists is named. The gap between them is where a check can be present, correct, and never run: a script in `package.json` is not a check, a script something *runs* is a check, and the difference is invisible because the script passes whenever a person happens to run it by hand. It has now cost twice — CI omitted `docgen:check` that `pnpm build` had always run, and defined `typecheck` while invoking it nowhere, four type errors accumulating behind the second (R-136, R-138). Sibling to W3: that clause refuses a check which never runs because the branch was never pushed, this one refuses a check which never runs because nothing calls it. An exemption is data with a reason, per R-82, and a waiver outliving its script fails the same clause. Data in `tokens/invariants.json > workflows.uninvoked_exempt`; evaluated in `checkWorkflows` in `tokens/check.mjs`. (decision R-139)

## H. One home per concept

The governing sentence is already written in `tokens/contract.md`: a rule written twice can disagree with itself. These clauses extend it from token values to everything.

**H1.** No byte-identical duplicate files. Measured at 0 across every tracked file. Not to be confused with `tokens/contract.md` H1, a different clause in the token namespace counting tokens with no client; the `H1` key in `tokens/baseline.json` is that one, not this one. Two namespaces may reuse a letter, but a reader who forgets which is which will read a token census as a duplicate-file census, so each states the other here. (S9 rule 2c, S2)

```bash
find . -path ./node_modules -prune -o -type f -print0 | xargs -0 md5sum | sort | uniq -Dw32
```

**H2.** Every source file is imported, routed, or named in the README as a frozen prototype. A file referenced by nothing is deleted. Reachability is computed from the entry points OUTWARD — route files, configs, tests, content — following imports transitively, because the cheaper question ("is this path mentioned anywhere?") is answered wrongly by exactly the case that matters: two dead files that import each other mention each other, and a disconnected island of code vouches for itself indefinitely. That is not hypothetical here. This clause was stated when the standard was written and nothing evaluated it, and 53 files of a copied UI kit plus the two hooks only they used accumulated under `components/ui` — reachable from nothing, listed in `VENDORED.md`, and pulling 33 packages into the install graph. An exemption is data with a reason (R-82), and a waiver for a file no longer in the tree fails the same clause. Data in `tokens/invariants.json > reachability`; evaluated in `checkReachability` in `tokens/check.mjs`. (S8 on superfluous identifiers)

**H3.** Every route is linked from somewhere, or it is deleted. A content tree with zero inbound links is a second home waiting to disagree with the first.

**H4.** One implementation per concept. A prototype that graduates into a component takes the prototype with it, or the prototype is labeled frozen and dated.

**H5.** Two decision logs, split by scope. `DECISIONS.md` is authoritative for repo-scope decisions (R-numbers): structure, standard clauses, routes, module interfaces. `tokens/decisions.md` is authoritative for token-scope decisions (D-numbers): the token contract and the build pipeline. A decision is recorded in the one log its scope names; the same decision in both is the duplication this section forbids. `docs/LEXICON.md` names the pair. (S8)

## VN. Vendored code

**VN1.** Code this repository did not write is traceable to a declared source. Every file under a vendored root is listed in [`VENDORED.md`](VENDORED.md) with where it came from and whether it has been modified locally, and every path listed there exists. `checkVendored` in `tokens/check.mjs` holds the two together, so a component cannot be copied in without being recorded. What the check cannot prove is that the files still match upstream: that needs a revision the original import never recorded, and `VENDORED.md` states that gap rather than inventing a version. (S2, S3, decision R-72)

**VN2.** A vendored root has one home. `components/ui` is exempted by name in three places — the eslint `ignores` list, `synonyms.symbol_exclude`, and `uses_graph.base_read.exclude_prefixes` — and a rename that missed one would silently change what the standard covers. Same check. (decision R-72)

**VN3.** An exemption covers only what it names. R-8 exempts `components/ui` on the ground that the names are upstream's call; `VENDORED.md` records 5 files under that root that this repo wrote, for which the ground is false. An exemption wider than its reason is a waiver nobody granted. (S8, decision R-72)

## N. Naming

**N1.** A name states exactly the concept it holds: never a generalization of it, never a sub-part of it. Repo name, `package.json` name, and README title agree. Scaffold names (`my-project`) are defects. (S8 correctness and conciseness rules)

**N2.** A filename describes its contents. When content changes concept, the file is renamed in the same commit. Template names left over from a scaffold are defects. (S8, S9 rule 4f, S10 on the accessibility effect)

**N3.** One word per concept, project-wide. No synonyms: two names for one concept multiply reading effort and decay into homonyms. When a concept is renamed, the rename is global. (S8 bijective-mapping rule)

**N4.** Names are built from concepts: pick the concepts, pick one word per concept, compose in natural-language order. Multi-word names are the norm; 2 to 3 words and 8 to 16 characters is the professional center of gravity. (S10: longer names preferred in 74% of comparisons, names with more concepts in 83%)

**N5.** A name over 30 characters, or containing characters outside letters, digits, and separators, gets flagged and justified or shortened. Files whose names begin with `-` are banned outright. (S10 outlier threshold)

**N6.** Names that can mislead are worse than names that say little. A name promising one behavior while the code does another is a defect of the highest naming severity. (S10, S8)

## M. Modularity

**M1.** A module hides one difficult or changeable decision, and its interface reveals as little of that decision as possible. The test for splitting a file: count the independent reasons it changes. (S2)

**M2.** A source file over 500 lines carries a recorded decision or gets decomposed. Functions stay near one page and take at most 6 parameters. (S9 rule 2b, S2)

```bash
find app components lib hooks -name "*.ts*" | xargs wc -l | awk '$1 > 500 && $2 != "total"'
```

**M3.** Shared logic is extracted, never copy-pasted. Numbered variables and parallel near-copies are the smell. (S9 rule 2c)

**M4.** The repository's interfaces, the binding points where one module reads a name or shape another commits to, are listed with their guarding checks in [`docs/INTERFACE-REGISTER.md`](docs/INTERFACE-REGISTER.md). A change to any binding point there requires a work order and a dated decision. This is Parnas's interface management: an interface is managed when its definition and its verification are both recorded. (S2; decision R-52)

## D. Structured data and page metadata

**D1.** *(deploy)* Every public route emits a real title and description. C5 enforces the placeholder half; this clause requires the values to be true and specific.

**D2.** *(deploy)* The root layout sets `metadataBase`, OpenGraph fields, and an OG image. `robots.ts` and `sitemap.ts` exist under `app/`. (S14, S16)

**D3.** *(deploy)* Every asset path in metadata resolves to a file that exists. A referenced icon that is not on disk fails the check.

**D4.** *(deploy)* Each route type carries JSON-LD matching its Schema.org type: the root gets `WebSite` with a `SearchAction` wired to the search route (S16); the portfolio landing gets `ProfilePage` with a `Person` as `mainEntity` (S14); each case study gets an `ItemPage` whose `mainEntity` is a `CreativeWork`, or `WebApplication` when the subject is an app (S13, decision R-27); the `/system` index gets `CollectionPage`, each component page an `APIReference` naming a `SoftwareSourceCode`, other docs a `TechArticle` (S12); docs pages get `breadcrumb` as `BreadcrumbList` (S14). Proof: Google's Rich Results test parses each type. Microdata attributes (S1) are the permitted alternative where inline markup is preferred.

**D5.** The JSON-LD graph is internally consistent: one `WebSite` node with a stable `@id`, every page node carries `isPartOf` back to it, the `mainEntity`/`mainEntityOfPage` inverse pair agrees where both appear, and no superseded Schema.org property from the blacklist reaches an emitted node. The blacklist and the `proficiencyLevel` vocabulary are data in `tokens/invariants.json > structured_data`; the check is `tests/json-ld.test.tsx`, run by `pnpm test` (decision R-30). This is D4's consistency counterpart: D4 fixes the type per route, D5 fixes the edges between them.

```bash
npx vitest run json-ld
```

## P. Public API surface

**P1.** *(deploy)* Every route that mutates state or serves private data authenticates its caller, or it does not ship. Proof: an unauthenticated request returns 401.

**P2.** *(deploy)* No debug logging in production routes. `console.log` in `app/api/` is a defect.

---

## Amending this standard

A clause changes the way a token changes: by commit, with the reason in the message or in a decisions file. A clause that stops binding is deleted, never left to rot; an implied convention is a missing clause, and a missing clause admits anything.
