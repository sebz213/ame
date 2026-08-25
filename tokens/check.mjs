#!/usr/bin/env node
/*
  The verifier. Every consistency condition in contract.md is evaluated here and
  nowhere else in this repo: not in build.mjs, not restated in prose, not
  asserted twice. One deliberate exception, so the header does not overclaim:
  packages/ame-tokens/check.mjs re-implements B4, B5, and U1 as the portable
  subset a consumer runs against the installed package, in the consumer's tree.
  Different subject, same clauses; it travels, this file does not (decision D-20).

  Two severities:
    VIOLATION  a stated clause is broken. Exit 1.
    DRIFT      a measured count that must not grow past its baseline in
               outcomes.md. Exit 1 only when it grows.

  Run:  node tokens/check.mjs
*/
import { readdirSync, readFileSync, existsSync, appendFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildTokens, renderCss, deriveBaseNames, cssName, LAYERS, manifest, buildRecipes, ARTIFACTS, RECIPE_EXT, tokenFigures } from 'ame-tokens/build.mjs'
import { contrast } from './contrast.mjs'
import { ratchetExceeded } from './ratchet.mjs'
import { exceedsReferenceWhite } from './hdr.mjs'

const ROOT = dirname(fileURLToPath(import.meta.url))
const REPO = join(ROOT, '..')
const RULES = JSON.parse(readFileSync(join(ROOT, 'invariants.json'), 'utf8'))

/*
  ── Scope ───────────────────────────────────────────────────────────────────
  This contract governs two products: the token package, which is published and
  travels, and this application, which is not. Every clause declares which one
  it is about (invariants.json > census.clauses[id].scope), so extraction is a
  SELECTION rather than a surgery — copy what package_manifest names, run this
  file with --scope package, and the clauses with no subject there simply do not
  run. Nothing is deleted, no overlay drifts, and a clause written tomorrow
  declares its scope the same day it is written.

  Two things follow, and both matter:

  · A portfolio-scoped clause is SKIPPED in package scope, not passed. It is
    counted and reported, so a reader can see what was not asked rather than
    mistaking silence for a green light.

  · A scan root outside the manifest is OUT OF SCOPE, not MISSING. That is the
    distinction X2 exists to keep: a clause pointed at a path that should be
    there and is not must still fail loudly, while a clause pointed at the
    portfolio from inside the package was never going to find it and says so.
*/
const scopeFlag = process.argv.indexOf('--scope')
const SCOPE = scopeFlag !== -1 ? process.argv[scopeFlag + 1] : 'all'
if (!['all', 'package', 'portfolio'].includes(SCOPE)) {
  console.error(`check: --scope takes all, package or portfolio; got "${SCOPE}"`)
  process.exit(2)
}
const PACKAGE_ONLY = SCOPE === 'package'
const skipped = []

/** Does this clause run under the current scope? Named for clauses, not files:
    checkUsesGraph has its own local inScope for extensions, and a shadowed
    global here would have silently answered the wrong question. */
const clauseInScope = (id) => {
  const rec = RULES.census?.clauses?.[id]
  if (!rec) return true
  if (SCOPE === 'all') return true
  const declared = rec.scope ?? 'package'
  if (declared === SCOPE) return true
  if (!skipped.includes(id)) skipped.push(id)
  return false
}

/*
  In package scope, a path outside the manifest is not part of this product.
  Used by X2 and by every clause that walks a directory, so "the portfolio is
  not here" and "something that should be here is missing" stay different
  answers to different questions.
*/
const MANIFEST = RULES.package_manifest?.paths ?? []
const inManifest = (p) => MANIFEST.some((m) => p === m || p.startsWith(m + '/') || m.startsWith(p + '/'))
const scopedRoots = (roots) => {
  if (!PACKAGE_ONLY) return roots
  /*
    A root is kept if the manifest names it, REPLACED if the manifest names
    things beneath it, and dropped otherwise. The middle case is the one that
    matters: a clause scanning `components` in the monorepo must scan
    `components/ame` in the package, not the portfolio components sitting
    beside it. Admitting the parent because a child is listed would have walked
    the whole tree and reported the portfolio's files as the package's.
  */
  const out = []
  for (const r of roots) {
    if (MANIFEST.includes(r)) { out.push(r); continue }
    const under = MANIFEST.filter((m) => m.startsWith(r + '/'))
    if (under.length) out.push(...under)
  }
  return [...new Set(out)]
}

/*
  --fixtures puts examples/violating into the clause scan lists named in
  invariants.json > fixtures.scan_extends. No clause is modified and no verdict
  is inverted here: the same checks run against a tree that now contains files
  written to break them, and tokens/gate-fixtures.mjs inverts the verdict on the
  outside. Keeping the inversion out there means the gate itself has no mode in
  which failing is success.
*/
if (process.argv.includes('--fixtures')) {
  const extend = (path, value) => {
    const segs = path.split('.')
    const leaf = segs.pop()
    const owner = segs.reduce((o, k) => (o === undefined ? o : o[k]), RULES)
    if (!Array.isArray(owner?.[leaf]))
      throw new Error(`fixtures: ${path} is not an array in invariants.json`)
    owner[leaf] = [...owner[leaf], value]
  }
  for (const p of RULES.fixtures.scan_extends) extend(p, RULES.fixtures.violating)
  for (const p of RULES.fixtures.file_extends ?? []) extend(p, RULES.fixtures.violating_css)
}

const violations = []
const drift = {}
const fail = (id, msg) => violations.push(`${id}  ${msg}`)

const { doc, tokens } = buildTokens()
const byPath = new Map(tokens.map((t) => [t.path, t]))

// ── file helpers ────────────────────────────────────────────────────────────
const read = (p) => (existsSync(join(REPO, p)) ? readFileSync(join(REPO, p), 'utf8') : '')

/*
  A file's CODE, with its commentary removed.

  The binding clauses ask what a surface BINDS. A comment that names a token
  while explaining why the code does not use it is a mention, not a use — the
  distinction STANDARD.md C5 already draws (docs/LEXICON.md). Counting prose as a
  bind is not a harmless over-count: it inflates a ratcheted number, so the next
  person is held to a baseline that includes sentences, and the fix that lowers
  it is deleting an explanation.

  Block comments always; line comments only outside CSS, where `//` is not a
  comment and would eat the rest of a url().
*/
const code = (p) => {
  const src = read(p).replace(/\/\*[\s\S]*?\*\//g, ' ')
  return p.endsWith('.css') ? src : src.replace(/(^|[^:/])\/\/[^\n]*/g, '$1')
}
/*
  Every path any clause asks to scan, and whether it was there (Z3).

  This is recorded in the primitive rather than in the clauses because that is the
  difference between a guard and a habit: a clause that forgets to record its
  denominator is a clause the census cannot hold to account, and "the author
  remembered" is the discipline the gate exists to replace. Sixteen call sites reach
  through walkFiles; instrumenting it covers all of them and every one not written yet.
*/
const scanRoots = new Map()

// The descent. Split from walkFiles so that only a CLAUSE's own request is recorded
// as a denominator — recursing into a subdirectory is not a new scan, and counting
// it as one would fill the record with paths no clause ever named.
function walkDir(rel, out) {
  const abs = join(REPO, rel)
  if (!existsSync(abs)) return out
  // A root may name one file rather than a directory: the package manifest
  // lists lib/a11y-glyph.ts that way, because one file is what travels.
  if (!statSync(abs).isDirectory()) {
    out.push(rel)
    return out
  }
  for (const e of readdirSync(abs, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue
    const child = rel + '/' + e.name
    if (e.isDirectory()) walkDir(child, out)
    else out.push(child)
  }
  return out
}

function walkFiles(rel, out = []) {
  if (!scanRoots.has(rel)) scanRoots.set(rel, existsSync(join(REPO, rel)))
  return walkDir(rel, out)
}
const expand = (pat) =>
  pat.includes('*')
    ? walkFiles(pat.slice(0, pat.lastIndexOf('/'))).filter((f) =>
        new RegExp('^' + pat.replace(/\./g, '\\.').replace(/\*/g, '[^/]*') + '$').test(f),
      )
    : [pat]

// Colour maths for the contrast invariants (C1 to C10) live in contrast.mjs so
// they are unit-testable; `contrast` is imported above.

// ── F. DTOS format conformance ──────────────────────────────────────────────
const NAME_OK = new RegExp(RULES.naming.segment)
;(function checkFormat() {
  for (const t of tokens) {
    if (!RULES.types.includes(t.type)) fail('F2', `${t.path} has $type "${t.type}", not a DTOS type`)
    if (!NAME_OK.test(t.path.split('.').at(-1))) fail('N1', `${t.path} last segment is not ${RULES.naming.segment}`)
    for (const seg of t.path.split('.')) {
      if (seg.startsWith('$') || /[.{}]/.test(seg)) fail('F5', `${t.path} segment "${seg}" is a reserved DTOS name shape`)
    }
    const v = t.value
    const B = RULES.type_bounds
    const ok = {
      color: () =>
        v && B.color_spaces.includes(v.colorSpace) && Array.isArray(v.components),
      dimension: () => v && typeof v.value === 'number' && B.dimension_units.includes(v.unit),
      duration: () => v && typeof v.value === 'number' && B.duration_units.includes(v.unit),
      cubicBezier: () =>
        Array.isArray(v) && v.length === B.cubicBezier_points && v.every((x) => typeof x === 'number'),
      fontFamily: () => typeof v === 'string' || (Array.isArray(v) && v.every((x) => typeof x === 'string')),
      fontWeight: () =>
        (typeof v === 'number' && v >= B.fontWeight_min && v <= B.fontWeight_max) ||
        typeof v === 'string',
      number: () => typeof v === 'number',
      shadow: () =>
        (Array.isArray(v) ? v : [v]).every(
          (s) => s.color && s.offsetX && s.offsetY && s.blur && s.spread,
        ),
    }[t.type]
    if (ok && !ok()) fail('F3', `${t.path} value does not satisfy the DTOS ${t.type} schema`)
  }
  // F1 and F4 are structural: build.mjs throws on a missing $value, an
  // unresolved reference, or a cycle, so reaching this line proves them.
})()

// ── N2. One word per concept: no synonym in a token path or exported symbol ──
;(function checkSynonyms() {
  const s = RULES.synonyms
  // Tokenize an identifier on separators and camelCase boundaries, lowercased.
  const words = (id) =>
    id
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .split(/[-_./ ]+/)
      .filter(Boolean)
      .map((w) => w.toLowerCase())
  const deprecated = new Map(s.pairs.map((p) => [p.deprecated, p.canonical]))
  const scan = (id, kind) => {
    for (const w of words(id)) {
      if (deprecated.has(w) && s.waived[id] !== w)
        fail(
          s.id,
          `${kind} "${id}" says "${w}"; the one word for this concept is "${deprecated.get(w)}". Rename it, or waive the identifier in invariants.json > synonyms.waived.`,
        )
    }
  }
  for (const t of tokens) scan(t.path, 'token path')
  const symFiles = s.symbol_sources
    .flatMap((src) => walkFiles(src))
    .filter((f) => /\.tsx?$/.test(f) && !s.symbol_exclude.some((x) => f.startsWith(x)))
  const symRe = /export\s+(?:default\s+)?(?:async\s+)?(?:function|const|class|type|interface|let)\s+([A-Za-z0-9_]+)/g
  for (const f of symFiles) for (const m of read(f).matchAll(symRe)) scan(m[1], 'exported symbol')
})()

// ── B5. The emitted header carries the manifest version ─────────────────────
;(function checkManifest() {
  const m = RULES.manifest
  const declared = manifest.version
  if (!declared) {
    fail('B5', `${m.file} declares no version`)
    return
  }
  const re = new RegExp(m.pattern)
  for (const f of m.emitted) {
    const first = read(f).split('\n')[0]
    const got = re.exec(first)
    if (!got) fail('B5', `${f} first line does not carry a version header`)
    else if (got[1] !== declared)
      fail('B5', `${f} stamps ame@${got[1]}; ${m.file} declares ${declared}. Rebuild.`)
  }
})()

// ── B4. The committed CSS home matches a fresh build from source ─────────────
// One home now: the package the portfolio and Metis bind. There is no second
// copy to diff against, so instead of comparing two files this rebuilds the CSS
// from source in memory (the same renderCss build.mjs writes) and byte-compares
// the committed file to it. A source edit that was never rebuilt, or a hand-edit
// to the committed file, fails here. The home is data in invariants.json >
// manifest.emitted, the same list B5 reads.
// B6 extends the same treatment to the other three artifacts (the compiled
// recipes, the typed module, its declarations). One loop over what build.mjs
// actually emits, so an artifact added there without being declared here fails
// rather than going unchecked — which is the failure mode a hand-written list of
// files has, and the reason the list is read off ARTIFACTS rather than restated.
;(function checkB4() {
  const [home] = RULES.manifest.emitted
  const declared = new Set(RULES.manifest.emitted)
  const compiled = buildRecipes()
  const seen = new Set()

  for (const [file, render] of Object.entries(ARTIFACTS)) {
    const rel = `${RULES.manifest.package}/${file}`
    const id = rel === home ? 'B4' : 'B6'
    seen.add(rel)
    if (!declared.has(rel)) {
      fail(id, `build.mjs emits ${rel}, which invariants.json > manifest.emitted does not list; an unlisted artifact is one nothing byte-checks or version-stamps.`)
      continue
    }
    const p = join(REPO, rel)
    if (!existsSync(p)) {
      fail(id, `the emitted home ${rel} is missing; run node packages/ame-tokens/build.mjs`)
      continue
    }
    if (render({ tokens, compiled }) !== readFileSync(p, 'utf8'))
      fail(id, `${rel} does not match a fresh build from source; run node packages/ame-tokens/build.mjs to regenerate it.`)
  }
  for (const rel of declared)
    if (!seen.has(rel))
      fail('B6', `invariants.json > manifest.emitted lists ${rel}, which build.mjs no longer emits. Remove the stale entry.`)
})()

// ── L. Layering ─────────────────────────────────────────────────────────────
;(function checkLayering() {
  const layerOfPath = new Map(tokens.map((t) => [t.path, t.layer]))
  const refsOf = (raw, acc = []) => {
    if (typeof raw === 'string') {
      const m = /^\{([^}]+)\}$/.exec(raw.trim())
      if (m) acc.push(m[1])
    } else if (Array.isArray(raw)) raw.forEach((r) => refsOf(r, acc))
    else if (raw && typeof raw === 'object') Object.values(raw).forEach((r) => refsOf(r, acc))
    return acc
  }
  for (const t of tokens) {
    const rule = RULES.layering[t.layer]
    const refs = refsOf(t.raw)
    for (const r of refs) {
      const target = layerOfPath.get(r)
      if (!target) continue
      if (!rule.mayReference.includes(target))
        fail('L' + (LAYERS.indexOf(t.layer) + 1), `${t.path} (${t.layer}) references ${r} (${target})`)
    }
    if (refs.length === 0 && !rule.literalTypes.includes(t.type))
      fail(
        'L' + (LAYERS.indexOf(t.layer) + 1),
        `${t.path} states a ${t.type} literal; the ${t.layer} layer may only state ${rule.literalTypes.join(', ')}`,
      )
  }
})()

// The page ground per theme, derived from contrast.darkGround rather than
// restated: its single key is the light ground and its value the dark one. One
// home, read by the C clauses (which paint a translucent fill onto it before
// measuring) and by CV1 (which resolves such a fill to it). Section H.
const GROUNDS = (() => {
  const dg = RULES.contrast.darkGround ?? {}
  const [light] = Object.keys(dg)
  return { light, dark: dg[light] }
})()

// ── C. Contrast ─────────────────────────────────────────────────────────────
const contrastResults = []
;(function checkContrast() {
  const darkGround = RULES.contrast.darkGround ?? {}
  const validRoles = new Set(RULES.contrast.roles ?? [])
  for (const p of RULES.contrast.pairs) {
    const fg = byPath.get(p.fg)
    const bg = byPath.get(p.bg)
    if (!fg || !bg) {
      fail(p.id, `pair references a token that does not exist (${p.fg} on ${p.bg})`)
      continue
    }
    // Every pair declares a role. Without this, a new row with no role would default to
    // unclassified and skip the dark cross silently, the same hole the reading-twin
    // check closes one level down. An unclassified row fails, so the author has to say
    // which kind it is, and a reading one then has its dark twin enforced.
    if (!validRoles.has(p.role))
      fail(p.id, `${p.id} has no valid role; every contrast pair declares one of ${[...validRoles].join(', ')}`)

    const ratio = contrast(fg.value, bg.value, byPath.get(GROUNDS.light)?.value)
    contrastResults.push({ ...p, ratio })
    if (ratio < p.min)
      fail(p.id, `${p.fg} on ${p.bg} is ${ratio.toFixed(2)}:1, below the required ${p.min}:1`)

    // A reading pair is theme-following and is checked under [data-theme=dark] too: its
    // foreground resolves to the -on-dark token and its ground to the dark form in
    // darkGround. The twin is derived from that suffix and map, so a new reading pair is
    // covered in both themes without a second row. A reading pair that cannot build the
    // twin (a missing or misspelled -on-dark sibling, or a ground with no dark form)
    // fails rather than passing quietly. fixed, chrome, and backdrop rows are not
    // crossed; the role check above keeps a row from being unclassified.
    if (p.role === 'reading') {
      const darkFgPath = `${p.fg}-on-dark`
      const darkBgPath = darkGround[p.bg]
      if (!byPath.has(darkFgPath) || !darkBgPath) {
        fail(p.id, `${p.id} is role:reading but cannot cross to dark: ${p.fg} has no -on-dark sibling, or ${p.bg} has no darkGround entry`)
      } else {
        const dratio = contrast(
          byPath.get(darkFgPath).value,
          byPath.get(darkBgPath).value,
          byPath.get(GROUNDS.dark)?.value,
        )
        contrastResults.push({ id: `${p.id}-dark`, fg: darkFgPath, bg: darkBgPath, min: p.min, ratio: dratio })
        if (dratio < p.min)
          fail(p.id, `${darkFgPath} on ${darkBgPath} (dark) is ${dratio.toFixed(2)}:1, below the required ${p.min}:1`)
      }
    }
  }
})()

// ── CV1. Every rendered pair is a declared pair ──────────────────────────────
// C1-C10 measure the pairs someone declared. This measures the other direction:
// a surface stating a foreground and a background together, from tokens, that no
// C clause covers. The declared set is read off contrastResults, which already
// holds the derived -dark twins, so nothing about the pair list is restated here.
// Order is normalized because the WCAG ratio is symmetric.
;(function checkContrastCoverage() {
  const cv = RULES.contrast_coverage
  const byCss = new Map(tokens.map((t) => [cssName(t.path), t.path]))
  // A var() name is a token, or an alias standing for one token per theme.
  const resolveVar = (name, theme) => {
    const direct = byCss.get(name)
    if (!direct) return null
    /*
      One name per token now, so the theme is read off the same `-on-dark`
      convention the C clauses already derive their dark twins from, rather than
      from an alias map that no longer exists. A surface writes --ame-text-body;
      in the dark scope that name carries the on-dark value, and this is where
      CV1 learns which token holds it.
    */
    if (theme !== 'dark') return direct
    /*
      Grounds first. A dark counterpart is spelled two different ways in this
      system and both have to be read: a foreground takes the `-on-dark` sibling,
      but a GROUND is re-pointed to a different token entirely (page -> ink), and
      that mapping lives in contrast.darkGround. Reading only the suffix pairs a
      white-on-ink foreground with the paper ground and reports a contrast
      failure that nothing renders.
    */
    const ground = (RULES.contrast.darkGround ?? {})[direct]
    if (ground) return ground
    return byPath.has(`${direct}-on-dark`) ? `${direct}-on-dark` : direct
  }
  // The ground a translucent fill is painted onto, per theme. Derived from
  // contrast.darkGround rather than restated: its single key is the light page
  // ground and its value the dark one, so the ground keeps one home (section H).
  const key = (a, b) => [a, b].sort().join('  with  ')
  const declared = new Set(contrastResults.map((r) => key(r.fg, r.bg)))
  const waived = new Set(Object.keys(cv.waived))
  const VAR = /var\((--[a-z0-9_-]+)/

  const found = new Map()
  const consider = (fgRaw, bgRaw, where) => {
    const fv = fgRaw.match(VAR)
    const bv = bgRaw.match(VAR)
    if (!fv || !bv) return
    for (const theme of ['light', 'dark']) {
      const fp = resolveVar(fv[1], theme)
      const rendered = resolveVar(bv[1], theme)
      if (!fp || !rendered) continue
      // A translucent fill is not a colour anyone reads: the browser paints it
      // onto the ground beneath, so the pair that carries the requirement is the
      // foreground against that ground. Resolving it here means the C clause
      // measuring fg-on-ground covers this surface too, instead of demanding a
      // declaration of the pigment, which no ratio check could read honestly.
      const fill = (byPath.get(rendered)?.value?.alpha ?? 1) < 1 && GROUNDS[theme]
      const bp = fill ? GROUNDS[theme] : rendered
      if (!bp || fp === bp) continue
      const k = key(fp, bp)
      if (declared.has(k) || waived.has(k)) continue
      if (!found.has(k)) found.set(k, { fp, bp, where, rendered: fill ? rendered : null })
    }
  }

  const files = scopedRoots(cv.surfaces)
    .flatMap((s) => walkFiles(s))
    .filter((f) => cv.extensions.some((e) => f.endsWith(e)))
  for (const f of files) {
    const src = read(f)
    if (f.endsWith('.css')) {
      // One declaration block at a time: a pair is only visible when a single
      // rule states both halves.
      for (const block of src.split('}')) {
        const fg = block.match(/(?:^|[;{\s])color\s*:\s*([^;]+)/)
        const bg = block.match(/(?:^|[;{\s])background(?:-color)?\s*:\s*([^;]+)/)
        if (fg && bg) consider(fg[1], bg[1], f)
      }
    } else {
      for (const m of src.matchAll(/style=\{\{[\s\S]*?\}\}/g)) {
        const fg = m[0].match(/(?:^|[,{\s])color\s*:\s*([^,}]+)/)
        const bg = m[0].match(/(?:^|[,{\s])background(?:Color)?\s*:\s*([^,}]+)/)
        if (fg && bg) consider(fg[1], bg[1], f)
      }
    }
  }

  for (const [, v] of found)
    fail(
      cv.id,
      `${v.where} renders ${v.fp} on ${v.rendered ?? v.bp}${v.rendered ? ` over ${v.bp}` : ''}, a contrast pair no C clause measures. Add it to invariants.json > contrast.pairs (which puts it under the ratio check), or waive it in contrast_coverage.waived with a reason.`,
    )
})()

// ── P. Parity with hand-written source ──────────────────────────────────────
;(function checkParity() {
  if (!clauseInScope('P1-P3')) return
  for (const e of RULES.parity.entries) {
    const token = byPath.get(e.token)
    if (!token) {
      fail(e.id, `parity entry names a token that does not exist: ${e.token}`)
      continue
    }
    const expected =
      e.as === 'number'
        ? token.value
        : e.as === 'px' && token.value.unit === 'rem'
          ? token.value.value * 16
          : e.as === 'rem' && token.value.unit === 'px'
            ? token.value.value / 16
            : token.value.value
    const files = expand(e.file)
    let found = 0
    for (const f of files) {
      for (const m of read(f).matchAll(new RegExp(e.pattern, 'g'))) {
        found++
        const got = Number(m.slice(1).find((x) => x !== undefined))
        if (Math.abs(got - expected) > 1e-6)
          fail(e.id, `${f}: literal ${got} does not equal ${e.token} (${expected})`)
      }
    }
    if (found === 0)
      fail(e.id, `pattern found no literal in ${e.file}; the parity check cannot detect its quantity`)
  }
})()

// ── KW1. A linked keyword points at evidence that is really there ───────────
// The résumé grid's keywords are claims. A linked one is a claim with an
// address, and this is what stops the address going stale: every declared link
// is resolved against the file it names, and every <Kw> in content must be
// claimed by a keyword so an anchor cannot be orphaned. Data in
// lib/portfolio/keywords.json; nothing here restates a keyword or a phrase.
function checkKeywords() {
  if (!clauseInScope('KW1')) return
  const k = RULES.keywords
  let map
  try {
    map = JSON.parse(read(k.map))
  } catch {
    fail(k.id, `${k.map} is missing or not valid JSON; it is the single home the keyword links read.`)
    return
  }
  const links = (map.columns ?? []).flatMap((c) =>
    (c.items ?? []).flatMap((i) => (i.link ? [{ column: c.label, label: i.label, ...i.link }] : [])),
  )

  /*
    The inner text of <Kw id="…">…</Kw>, counting nested Kw wrappers so a
    keyword inside another keyword's sentence still reads its own span. Returns
    null when the wrapper is absent.
  */
  const kwInner = (src, id) => {
    const open = new RegExp(`<Kw\\s+id=["']${id}["']\\s*>`)
    const at = src.search(open)
    if (at === -1) return null
    let i = at + src.slice(at).match(open)[0].length
    let depth = 1
    const start = i
    while (i < src.length && depth > 0) {
      if (src.startsWith('</Kw>', i)) { depth--; if (!depth) return src.slice(start, i) ; i += 5; continue }
      if (/^<Kw\s/.test(src.slice(i, i + 4))) depth++
      i++
    }
    return null
  }

  const claimed = new Set()
  for (const l of links) {
    const src = read(l.source)
    if (!src) {
      fail(k.id, `keyword "${l.label}" points at ${l.source}, which does not exist.`)
      continue
    }
    if (l.kind === 'kw') {
      const id = l.anchor.replace(/^kw-/, '')
      claimed.add(`${l.source}#${id}`)
      const inner = kwInner(src, id)
      if (inner === null) {
        fail(k.id, `keyword "${l.label}" points at #${l.anchor}, but ${l.source} has no <Kw id="${id}"> wrapper. Add the anchor around the passage, or drop the link.`)
      } else if (!inner.includes(l.evidence)) {
        fail(k.id, `keyword "${l.label}": <Kw id="${id}"> in ${l.source} no longer contains its declared evidence ${JSON.stringify(l.evidence)}. The passage moved or was reworded — re-point the link or update the evidence.`)
      }
    } else if (!src.includes(l.evidence)) {
      fail(k.id, `keyword "${l.label}" points at ${l.source}#${l.anchor}, whose heading ${JSON.stringify(l.evidence)} is not in that file.`)
    }
  }

  // The other direction: an anchor nobody claims is dead weight the next reader
  // has to explain, which is the condition H2 forbids for files.
  for (const root of k.content_roots)
    for (const f of walkFiles(root).filter((f) => f.endsWith('.mdx')))
      for (const m of read(f).matchAll(/<Kw\s+id=["']([a-z0-9-]+)["']/g))
        if (!claimed.has(`${f}#${m[1]}`))
          fail(k.id, `${f} carries <Kw id="${m[1]}">, which no keyword in ${k.map} claims. Claim it or remove the anchor.`)
}
checkKeywords()

// ── D. One home per value ───────────────────────────────────────────────────
;(function checkDuplication() {
  const generated = new Set(tokens.map((t) => t.cssName))
  for (const f of scopedRoots(RULES.duplication.hand_written)) {
    for (const m of read(f).matchAll(/^\s*(--[a-z0-9_-]+)\s*:/gim)) {
      const name = m[1]
      if (generated.has(name) && !RULES.duplication.allowed.includes(name))
        fail('D1', `${f} re-declares ${name}, which the token build already emits`)
    }
  }
})()

// ── D2. A hand-written literal that equals a token's value (drift) ──────────
const restated = []
;(function checkRestated() {
  const r = RULES.restated
  // The ordered numbers in a value, so one recipe is recognised across syntaxes.
  const signature = (s) => (s.match(/-?[0-9]*\.?[0-9]+/g) ?? []).join(',')
  const bySignature = new Map()
  for (const t of tokens) {
    const sig = signature(t.css)
    if (sig.split(',').length >= r.min_numbers) bySignature.set(sig, t.path)
  }
  for (const f of scopedRoots(r.hand_written))
    for (const m of read(f).matchAll(/^\s*[a-z-]+:\s*([^;]+);/gim)) {
      const value = m[1].trim()
      if (value.includes('var(')) continue
      const hit = bySignature.get(signature(value))
      if (hit) restated.push(`${f}: "${value.replace(/\s+/g, ' ').slice(0, 60)}" == ${hit}`)
    }
  drift[r.id] = restated.length
})()

// ── Z5. No ramp goes unwatched ──────────────────────────────────────────────
// Every hole this session found was found by accident until the classifiability
// check induced three at once. This closes the generator rather than another hole:
// a property declared ramped must name the clause that watches it, so the next
// unwatched ramp fails the build at the moment it is declared — the cheapest time,
// by D-51's own law — instead of surfacing whenever someone happens to look.
;(function checkRampCoverage() {
  const c = RULES.coverage
  for (const r of c.ramped) {
    if (r.clause) continue
    if (r.unwatched_because) continue
    fail(
      c.id,
      `coverage.ramped declares ${r.property} (ramp ${r.ramp}) with no clause watching it. Name the clause that counts its literals, or record unwatched_because with a dated reason.`,
    )
  }
})()

// ── S. Scale membership (drift) ─────────────────────────────────────────────
const scaleFindings = []
;(function checkScales() {
  const files = scopedRoots(RULES.scales.sources).flatMap((s) => walkFiles(s)).filter((f) => /\.(tsx?|css)$/.test(f))
  for (const s of RULES.scales.entries) {
    const members = new Set(
      tokens
        .filter((t) => t.path.startsWith(s.group + '.'))
        .map((t) => (s.kind === 'number' ? t.value : convert(t.value, s.unit))),
    )
    const strays = new Map()
    /*
      The matcher, assembled here when the entry carries no `pattern`.

      D3 holds pattern syntax out of rule data: a regex written as text into a data
      file has to survive a serialization boundary, and the escapes are what get eaten.
      S1-S5 predate that rule and are held at their count rather than forgiven, so a
      NEW scale entry may not add a sixth regex to invariants.json — adding one is what
      D3 counts, and it grew the moment S6 first shipped with a `pattern` field. So S6
      states the literal property name and this builds the expression around it, where
      the backslashes exist once and this file's own tests cover them.

      `fractional_only` matches 0.x and .x but not 0 or 1: the identity values are not
      design decisions and no scale owns them.
    */
    /*
      `properties` (plural) for a scale that many utilities write to. Spacing is the
      case: padding, margin and gap are one ramp under a dozen prefixes, and a
      property-agnostic pattern would swallow every other px value on the page —
      text-[14px] and max-w-[760px] included — turning a spacing clause into a census
      of everything. The names are listed as names, not as a regex, so D3 stays
      satisfied and the alternation is built here where the escapes live once.
    */
    const props = s.properties ? `(?:${s.properties.join('|')})` : s.property
    const number = s.fractional_only ? '(0?\\.[0-9]+)' : '([0-9.]+)'
    const expr =
      /*
        \b on both halves. Without it a short property name matches inside a longer
        word: `zoom: 1.25` matched the `m:` alternative of the spacing clause and
        reported 1.25px as an off-scale margin. A census that counts the wrong thing
        is worse than one that counts nothing, because it looks like it is working.
      */
      s.pattern ?? `\\b${props}-\\[${number}${s.unit_suffix ?? ''}\\]|\\b${props}:\\s*${number}`
    for (const f of files)
      for (const m of read(f).matchAll(new RegExp(expr, 'g'))) {
        const got = Number(m.slice(1).find((x) => x !== undefined))
        // `?? ''` because a unitless scale (kind 'number' — z-index, opacity) has no
        // unit to print, and template interpolation renders the absence as the word
        // "undefined". Latent in S5 since it was written and invisible only because
        // S5 has never had a stray to label.
        const label = `${got}${s.unit ?? ''}`
        if (![...members].some((v) => Math.abs(v - got) < 1e-6))
          strays.set(label, (strays.get(label) ?? 0) + 1)
      }
    drift[s.id] = [...strays.values()].reduce((a, b) => a + b, 0)
    if (strays.size) scaleFindings.push({ id: s.id, group: s.group, strays: [...strays.entries()] })
  }
  function convert(v, unit) {
    if (v.unit === unit) return v.value
    if (v.unit === 'rem' && unit === 'px') return v.value * 16
    if (v.unit === 'px' && unit === 'rem') return v.value / 16
    if (v.unit === 's' && unit === 'ms') return v.value * 1000
    return v.value
  }
})()

// ── S12. Easing curves are members of the ease ramp ─────────────────────────
// The one scale the generic machinery cannot check: its members are four-number
// curves, not scalars, so "within epsilon of a member" has to compare the whole
// tuple. Written as its own branch rather than by teaching the numeric path about
// arrays, because the comparison is genuinely a different question.
;(function checkEaseScale() {
  const e = RULES.scales.entries.find((s) => s.id === 'S12')
  if (!e) return
  const norm = (nums) => nums.map((n) => Number(n)).join(',')
  const members = new Set(
    tokens.filter((t) => t.path.startsWith(e.group + '.')).map((t) => norm(t.value)),
  )
  const files = scopedRoots(RULES.scales.sources).flatMap((s) => walkFiles(s)).filter((f) => /\.(tsx?|css)$/.test(f))
  const strays = new Map()
  for (const f of files)
    for (const m of read(f).matchAll(/cubic-bezier\(\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*\)/g)) {
      const got = norm(m.slice(1, 5))
      if (!members.has(got)) strays.set(got, (strays.get(got) ?? 0) + 1)
    }
  drift[e.id] = [...strays.values()].reduce((a, b) => a + b, 0)
  if (strays.size) scaleFindings.push({ id: e.id, group: e.group, strays: [...strays.entries()] })
})()


// ── U1. Surfaces bind semantic and component, never base ────────────────────
const bindingStrays = []
;(function checkBinding() {
  const b = RULES.binding
  // Derived, not restated: the base tier names itself.
  const baseNames = deriveBaseNames(tokens)
  const files = scopedRoots(b.surfaces)
    .flatMap((s) => walkFiles(s))
    .filter((f) => b.extensions.some((e) => f.endsWith(e)) && !b.exclude.includes(f))
  /*
    THE REMEDY, NOT JUST THE VIOLATION.

    This used to report `file: --ame-font-size-13` and stop. That names where and
    what and leaves the reader to work out the rule and then grep the token tree for
    a legal replacement — a lookup wearing a fast feedback loop's clothes, on the one
    error a first-week contributor hits first.

    The checker already holds everything needed to finish the sentence: it has the
    offending base token, and it has every other token with its tier and its resolved
    value. A legal binding is any semantic or component token resolving to the SAME
    value, which is exactly the substitution that changes nothing on screen. So the
    candidates are derived, never listed, and a token added tomorrow becomes a
    suggestion without anyone maintaining a map.

    Where no candidate exists the message says so, because "no semantic token holds
    this value" is itself the answer: the fix is to add the role, not to hunt for one.

    THE INVARIANT THIS MESSAGE DEPENDS ON, stated so an edit cannot break it quietly:
    a candidate is matched on EXACT value equality, never on nearness. That is what
    makes the suggestion always safe to obey — the substitution changes the tier and
    changes nothing on screen, so a developer can apply it without judging whether the
    design moved. Relaxing this to a tolerance would turn a mechanical fix into a
    silent visual edit, and the reader would have no way to tell which kind they were
    being handed. If no exact match exists, say nothing rather than offer a near one.
  */
  const byName = new Map(tokens.map((t) => [t.cssName, t]))
  const legalFor = (baseName) => {
    const want = byName.get(baseName)?.css
    if (want === undefined) return []
    return tokens
      .filter((t) => (t.layer === 'semantic' || t.layer === 'component') && t.css === want)
      .map((t) => t.cssName)
  }

  for (const f of files)
    for (const m of code(f).matchAll(/var\((--[a-z0-9_-]+)/g))
      if (baseNames.has(m[1])) {
        const legal = legalFor(m[1])
        const fix = legal.length
          ? `bind ${legal.join(' or ')} instead — same value, legal tier`
          : `no semantic or component token holds this value yet; add the role rather than binding the primitive`
        bindingStrays.push(`${f}: ${m[1]} — ${fix}`)
      }
  drift[b.id] = bindingStrays.length
})()

// ── U2 to U4. The layered, acyclic uses-graph (Parnas), off the portfolio ────
// surface U1 already guards. Violations, not drift: these are stated edges the
// uses-graph forbids, each with an explicit waiver list where a known edge is
// deferred rather than fixed in this pass.
;(function checkUsesGraph() {
  const g = RULES.uses_graph
  // Every import/re-export source and every dynamic import() target in a file.
  const importsOf = (src) =>
    [
      ...src.matchAll(/from\s*['"]([^'"]+)['"]/g),
      ...src.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g),
    ].map((m) => m[1])

  // U2 — the base-var tripwire, extended past the portfolio surface. The base
  // name set is derived, never restated: the base tier names itself (as in U1).
  const b = g.base_read
  const baseNames = deriveBaseNames(tokens)
  const inScope = (f) =>
    b.extensions.some((e) => f.endsWith(e)) &&
    !b.exclude_prefixes.some((p) => f.startsWith(p))
  const u2files = scopedRoots(b.scan).flatMap((s) => walkFiles(s)).filter(inScope)
  for (const f of u2files) {
    const waived = new Set(b.waived[f] ?? [])
    for (const m of code(f).matchAll(/var\((--[a-z0-9_-]+)/g))
      if (baseNames.has(m[1]) && !waived.has(m[1]))
        fail(
          b.id,
          `${f} reads base token ${m[1]} directly; a surface binds semantic or component, never base. Repoint it or waive it in invariants.json > uses_graph.base_read.waived.`,
        )
  }

  // U3 — no lib -> app import (the uses-graph stays acyclic; lib is below app).
  const u3 = g.lib_no_app
  const toApp = (s) =>
    s === '@/' + u3.forbidden_import ||
    s.startsWith('@/' + u3.forbidden_import + '/') ||
    new RegExp('(^|/)\\.\\./' + u3.forbidden_import + '(/|$)').test(s)
  for (const f of walkFiles(u3.from).filter((f) => /\.(ts|tsx|mjs|js)$/.test(f)))
    for (const s of importsOf(read(f)))
      if (toApp(s))
        fail(u3.id, `${f} imports from ${s}; lib is below app in the uses-graph, so a lib->app import makes it cyclic.`)

  if (clauseInScope('U4')) {
  // U4 — the portfolio surface must not import a lib/*-tokens module (the two
  // token homes stay two concepts, R-25).
  const u4 = g.surface_no_system_tokens
  const pat = new RegExp(u4.forbidden_import_pattern)
  for (const f of u4.surfaces.flatMap((s) => walkFiles(s)).filter((f) => /\.(ts|tsx)$/.test(f)))
    for (const s of importsOf(read(f)))
      if (pat.test(s))
        fail(u4.id, `${f} imports ${s}; the portfolio surface binds the DTOS token pipeline, not the lib/*-tokens /system system (two concepts, R-25).`)
  }
})()

/*
  The resolver, parsed for the client census. It is read here rather than shared
  with the RC clauses below because those bind their own copy in a `const` that
  has not been evaluated yet when this runs — reaching forward for it would be a
  temporal-dead-zone error, which is a strange way to fail a token census.
  RC2 owns whether the document is VALID; this only asks what it consumes, so a
  malformed one yields nothing and lets RC2 do the reporting.
*/
function resolverDoc() {
  try {
    return JSON.parse(read(RULES.recipes.resolver))
  } catch {
    return null
  }
}

/** Every token file a recipe context sources, parsed. Their references are consumptions. */
function recipeContextSources() {
  const r = RULES.recipes
  const out = []
  for (const mod of Object.values(resolverDoc()?.modifiers ?? {}))
    for (const sources of Object.values(mod.contexts ?? {}))
      for (const src of sources) {
        if (typeof src.$ref !== 'string' || src.$ref.startsWith('#')) continue
        try {
          out.push(JSON.parse(read(`${r.package}/${src.$ref}`)))
        } catch {
          // A source that does not resolve is RC2's to report, by name.
        }
      }
  return out
}

/** Every breakpoint token a media axis names. */
function recipeMediaTokens() {
  return Object.values(resolverDoc()?.modifiers ?? {})
    .flatMap((mod) => Object.values(mod.$extensions?.[RECIPE_EXT]?.media ?? {}))
    .filter(Boolean)
}

// ── H. Client census ────────────────────────────────────────────────────────
const clientless = []
;(function checkClients() {
  const src = scopedRoots(RULES.clients.sources)
    .flatMap((s) => walkFiles(s))
    .filter((f) => /\.(tsx?|jsx?|css|mdx?)$/.test(f) && !f.endsWith('portfolio.tokens.css'))
    .map(read)
    .join('\n')
  /*
    TWO BINDING FORMS, both real reads.

    `var(--x)` is the CSS one. `utility-(--x)` is Tailwind v4's shorthand for the
    same thing — `tracking-(--ame-type-body-tracking)` compiles to
    `letter-spacing: var(--ame-type-body-tracking)`, verified in the browser at
    0.595px on 11.9px text, which is 0.05em.

    Matching only the first form made the census wrong in the direction that
    matters: it reported a token as having NO client while thirty-three surfaces
    were binding it, which is the gate calling live code dead. Converting arbitrary
    Tailwind values to token references is the thing that surfaced it — the first
    token whose only clients used the shorthand landed straight in the clientless
    list.

    The alternative binding, `tracking-[var(--x)]`, is visible to the old pattern
    and is exactly the bracket arbitrary value this conversion exists to remove. So
    the form the style rules want and the form the census could see were opposites
    until now.
  */
  /*
    A THIRD FORM, and it arrived the same way the second did. Tailwind requires a type
    hint where a utility is ambiguous — `text-` is colour or font-size — so a size
    binding is written `text-(length:--ame-type-control-size)`. The hint sits between
    the paren and the name, which the previous pattern could not step over, so a token
    bound at thirteen surfaces reported as clientless the moment it shipped.

    Optional `<hint>:` now, because the next ambiguous utility will do this too.
  */
  const usedVars = new Set(
    [...src.matchAll(/(?:var|-)\((?:[a-z]+:)?(--[a-z0-9_-]+)/g)].map((m) => m[1]),
  )

  const referenced = new Set()
  const collect = (raw) => {
    if (typeof raw === 'string') {
      const m = /^\{([^}]+)\}$/.exec(raw.trim())
      if (m) referenced.add(m[1])
    } else if (Array.isArray(raw)) raw.forEach(collect)
    else if (raw && typeof raw === 'object') {
      if (typeof raw.$ref === 'string') referenced.add(raw.$ref.replace(/^#\//, '').split('/$value')[0].split('/').join('.'))
      Object.values(raw).forEach(collect)
    }
  }
  for (const t of tokens) collect(t.raw)

  /*
    Three clients the scan above cannot see, all of them real.

    The compiled recipe stylesheet consumes recipe tokens by name — it is the
    thing that makes them do anything — but it lives in the package, not under a
    surface directory, so nothing walked it. A recipe CONTEXT references tokens
    from a file that is deliberately not merged into the main document (that is
    what makes it a context). And a media axis names a breakpoint token inside
    the resolver's JSON.

    Counting them is what keeps a token used only by a variant from reading as
    clientless — which would be the gate reporting a token as dead at the exact
    moment the variant system started using it.
  */
  for (const f of RULES.clients.generated ?? [])
    for (const m of read(f).matchAll(/var\((--[a-z0-9_-]+)/g)) usedVars.add(m[1])
  for (const source of recipeContextSources()) collect(source)
  for (const path of recipeMediaTokens()) referenced.add(path)


  const invariantOwned = Object.keys(RULES.clients.invariant_clients)
  const parityOwned = new Set(RULES.parity.entries.map((e) => e.token))
  // Read off the RESULTS, not the declared pairs, so the dark twins the contrast
  // check derives count as clients too. Without that, a token whose only consumer
  // is the dark half of a reading pair reads as dead the moment aliases stop
  // naming it.
  const contrastOwned = new Set(contrastResults.flatMap((r) => [r.fg, r.bg]))

  for (const t of tokens) {
    const hasClient =
      usedVars.has(t.cssName) ||
      referenced.has(t.path) ||

      parityOwned.has(t.path) ||
      contrastOwned.has(t.path) ||
      invariantOwned.some((g) => t.path === g || t.path.startsWith(g + '.'))
    if (!hasClient) clientless.push(t.path)
  }
  drift.H1 = clientless.length
})()


/*
  ── RC. Recipes ─────────────────────────────────────────────────────────────

  RC1 the recipe grammar and its structural declarations, RC2 the resolver
  document against the DTCG Resolver 2025.10 module it claims, RC3 the component
  against the generated types.

  These are VIOLATIONS, not drift. A recipe is a contract between a token file, a
  resolver document, a compiled stylesheet and a component: four artifacts that
  are only useful while they agree, and a count that is allowed to grow would be
  a way for them to stop agreeing quietly.
*/
const RECIPES_RULES = RULES.recipes
const recipePkg = (rel) => join(REPO, RECIPES_RULES.package, rel)

/** The resolver document, parsed once. null when it is missing or malformed; RC2 reports that. */
const RESOLVER = (() => {
  try {
    return JSON.parse(read(RECIPES_RULES.resolver))
  } catch {
    return null
  }
})()

/** The recipes the resolver declares: their class, element and slots. */
const RECIPE_DEFS = RESOLVER?.sets?.recipe?.$extensions?.[RECIPE_EXT]?.recipes ?? {}

/** Every modifier carrying recipe metadata, as [name, modifier, metadata]. */
const recipeModifiers = () =>
  Object.entries(RESOLVER?.modifiers ?? {})
    .map(([name, mod]) => [name, mod, mod.$extensions?.[RECIPE_EXT]])
    .filter(([, , meta]) => meta)

/*
  One reference object, judged. Both pointer forms refused below are refused by
  the spec itself, for the same reason in each case: they let one input reach an
  axis it was never given.
*/
function checkResolverRef(src, where) {
  const r = RECIPES_RULES
  if (!src || typeof src.$ref !== 'string') {
    fail(r.resolver_id, `${where} is not a reference object; a resolver source is a $ref.`)
    return null
  }
  const ref = src.$ref
  if (ref.startsWith('#/modifiers/'))
    fail(r.resolver_id, `${where} points at a modifier. The spec forbids it: a single input would apply to axes it was never given.`)
  else if (ref.startsWith('#/resolutionOrder'))
    fail(r.resolver_id, `${where} points into resolutionOrder, which the spec forbids: resolution ordering references much of the document, and duplicating any of it produces chains nobody can predict.`)
  else if (!ref.startsWith('#') && !existsSync(recipePkg(ref)))
    fail(r.resolver_id, `${where} points at ${ref}, which is not in ${r.package}.`)
  return ref
}

/** Every token file each set sources, and the check that the tree holds no others. */
function checkResolverSets() {
  const r = RECIPES_RULES
  const sourced = new Set()
  for (const [name, set] of Object.entries(RESOLVER.sets ?? {}))
    for (const src of set.sources ?? []) {
      const ref = checkResolverRef(src, `set "${name}"`)
      if (ref) sourced.add(ref)
    }
  // A token file the resolver does not source is a file outside the document that
  // describes the system: invisible to it, and to anything reading it.
  for (const dir of Object.values(r.layer_dirs))
    for (const f of readdirSync(recipePkg(dir)).filter((n) => n.endsWith('.json')))
      if (!sourced.has(`${dir}/${f}`))
        fail(r.resolver_id, `${dir}/${f} is a token file no set in ${r.resolver} sources. Add it to the set for its layer, or the resolver does not describe the system it claims to.`)
}

/** Each modifier: enough contexts to be one, a default among them, resolvable sources. */
function checkResolverModifiers() {
  const r = RECIPES_RULES
  for (const [name, mod] of Object.entries(RESOLVER.modifiers ?? {})) {
    const contexts = Object.keys(mod.contexts ?? {})
    if (contexts.length < r.min_contexts)
      fail(r.resolver_id, `modifier "${name}" declares ${contexts.length} context(s); a modifier with fewer than ${r.min_contexts} is a set, which is what the spec says to make it.`)
    if (mod.default !== undefined && !contexts.includes(mod.default))
      fail(r.resolver_id, `modifier "${name}" defaults to "${mod.default}", which is not one of its contexts.`)
    for (const [context, sources] of Object.entries(mod.contexts ?? {}))
      for (const src of sources) checkResolverRef(src, `modifier "${name}" context "${context}"`)
  }
}

/** resolutionOrder names every set and modifier, each exactly once. */
function checkResolutionOrder() {
  const r = RECIPES_RULES
  const counted = new Map()
  for (const item of RESOLVER.resolutionOrder ?? []) {
    const named = /^#\/(sets|modifiers)\/(.+)$/.exec(item.$ref ?? '')
    if (!named) continue
    const key = `${named[1]}/${named[2]}`
    counted.set(key, (counted.get(key) ?? 0) + 1)
    if (!RESOLVER[named[1]]?.[named[2]])
      fail(r.resolver_id, `resolutionOrder names ${key}, which the document does not declare.`)
  }
  for (const [key, n] of counted)
    if (n > 1)
      fail(r.resolver_id, `resolutionOrder names ${key} ${n} times; each set and modifier appears once, and the order is what decides which scope wins.`)
  for (const kind of ['sets', 'modifiers'])
    for (const name of Object.keys(RESOLVER[kind] ?? {}))
      if (!counted.has(`${kind}/${name}`))
        fail(r.resolver_id, `${kind}/${name} is declared but never named in resolutionOrder, so it contributes nothing to any resolution.`)
}

// ── RC2. The resolver document satisfies the module it claims ────────────────
;(function checkResolverDocument() {
  const r = RECIPES_RULES
  if (!RESOLVER) {
    fail(r.resolver_id, `${r.resolver} is missing or not valid JSON; it is the single home of the recipe slots and the variant axes.`)
    return
  }
  if (RESOLVER.version !== r.version)
    fail(r.resolver_id, `${r.resolver} declares version "${RESOLVER.version}"; this build implements ${r.version}.`)
  checkResolverSets()
  checkResolverModifiers()
  checkResolutionOrder()
})()

/** One context's statics: the slots exist, and every var() inside names a token. */
function checkContextStatics(modifier, context, slots, recipe, readsRealTokens) {
  const r = RECIPES_RULES
  for (const [slot, decls] of Object.entries(slots)) {
    if (!RECIPE_DEFS[recipe]?.slots?.[slot])
      fail(r.id, `modifier "${modifier}" styles slot "${slot}", which recipe "${recipe}" does not declare.`)
    for (const [property, value] of Object.entries(decls))
      readsRealTokens(value, `modifier "${modifier}" context "${context}" slot "${slot}" static ${property}`)
  }
}

/** Every recipe token path is recipe.<name>.<slot>.<property>, and both names are declared. */
function checkRecipePaths() {
  const r = RECIPES_RULES
  for (const t of tokens) {
    if (!t.path.startsWith(r.prefix + '.')) continue
    const seg = t.path.split('.')
    if (seg.length !== r.path_depth) {
      fail(r.id, `${t.path} is not recipe.<name>.<slot>.<property>; the compiler reads the slot and the CSS property straight off the path, so a different shape emits a declaration nobody wrote.`)
      continue
    }
    const [, name, slot] = seg
    if (!RECIPE_DEFS[name]) fail(r.id, `${t.path} belongs to recipe "${name}", which ${r.resolver} does not declare.`)
    else if (!RECIPE_DEFS[name].slots?.[slot])
      fail(r.id, `${t.path} names slot "${slot}", which recipe "${name}" does not declare.`)
  }
}

// ── RC1. The recipe grammar, and the structural declarations ─────────────────
;(function checkRecipeGrammar() {
  if (!clauseInScope('RC1')) return
  const r = RECIPES_RULES
  if (!RESOLVER) return
  // Non-vacuous by construction (STANDARD.md C6): with no recipe declared there is
  // nothing for the loops below to catch, and a silent pass would report a health
  // this clause never established.
  if (Object.keys(RECIPE_DEFS).length < r.min_recipes)
    fail(r.id, `${r.resolver} declares no recipe; RC1's other conditions would pass over an empty set and report a health nothing established.`)

  const emitted = new Set(tokens.map((t) => t.cssName))
  const readsRealTokens = (value, where) => {
    for (const m of String(value).matchAll(/var\((--[a-z0-9_-]+)/g))
      if (!emitted.has(m[1]))
        fail(r.id, `${where} reads ${m[1]}, which this build does not emit. A structural declaration has no DTOS type, but it still may not name a value that does not exist.`)
  }

  for (const [name, def] of Object.entries(RECIPE_DEFS)) {
    if (!def.class) fail(r.id, `recipe "${name}" declares no root class.`)
    if (!def.element) fail(r.id, `recipe "${name}" names no element.`)
    else if (!existsSync(join(REPO, def.element)))
      fail(r.id, `recipe "${name}" names element ${def.element}, which is not in the tree.`)
    for (const [slot, spec] of Object.entries(def.slots ?? {}))
      for (const [property, value] of Object.entries(spec.static ?? {}))
        readsRealTokens(value, `recipe "${name}" slot "${slot}" static ${property}`)
  }

  for (const [name, mod, meta] of recipeModifiers()) {
    if (!RECIPE_DEFS[meta.recipe])
      fail(r.id, `modifier "${name}" names recipe "${meta.recipe}", which the recipe set does not declare.`)
    for (const [context, slots] of Object.entries(meta.static ?? {})) {
      if (!(context in (mod.contexts ?? {})))
        fail(r.id, `modifier "${name}" carries statics for context "${context}", which is not one of its contexts.`)
      checkContextStatics(name, context, slots, meta.recipe, readsRealTokens)
    }
    for (const path of Object.values(meta.media ?? {}))
      if (path && !byPath.has(path))
        fail(r.id, `modifier "${name}" names breakpoint token "${path}", which does not exist. A media axis names a token, never a width.`)
  }

  checkRecipePaths()
})()

// ── RC3. The component binds the generated types ─────────────────────────────
;(function checkRecipeTypes() {
  const r = RECIPES_RULES
  if (!RESOLVER) return
  for (const [name, def] of Object.entries(RECIPE_DEFS)) {
    if (!def.element || !existsSync(join(REPO, def.element))) continue
    /*
      Comments stripped first. The clause is about what the code DECLARES, and a
      component explaining its own axes in prose is documenting them, not restating
      them as a type: the mention-versus-use distinction STANDARD.md C5 already
      names (docs/LEXICON.md). Without this the check fires on the comment
      describing the very axis it is enforcing, which is the kind of false positive
      that teaches people to stop reading the gate.
    */
    const src = read(def.element)
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/(^|[^:/])\/\/[^\n]*/g, '$1')
    if (!src.includes(r.typed_module))
      fail(r.typed_id, `${def.element} is dressed by recipe "${name}" but does not import ${r.typed_module}; its classes and its variant type come from there, or they are hand-written strings again.`)
    for (const [modName, mod, meta] of recipeModifiers()) {
      if (meta.recipe !== name || !meta.attribute) continue
      // One context quoted is a default value, which is the component's to state.
      // Two or more is the axis restated as a union, which is the second home.
      const quoted = Object.keys(mod.contexts ?? {}).filter(
        (c) => src.includes(`'${c}'`) || src.includes(`"${c}"`),
      )
      if (quoted.length >= r.min_contexts)
        fail(r.typed_id, `${def.element} spells ${quoted.map((c) => `"${c}"`).join(' and ')} - the contexts of the "${meta.axis}" axis modifier "${modName}" already declares. Take the type from ${r.typed_module} so adding a context widens the prop instead of needing an edit here.`)
    }
  }
})()

/*
  ── H2. Every source file is reachable ──────────────────────────────────────

  STANDARD.md H2: "Every source file is imported, routed, or named in the README
  as a frozen prototype. A file referenced by nothing is deleted." The clause has
  been written since the standard existed and nothing measured it, which is how
  51 files of a copied UI kit accumulated under one directory without a single
  gate run objecting.

  REACHABILITY, NOT MENTIONS. The naive version asks whether a file's path
  appears in any other file. That answer is wrong in the exact case that matters:
  two dead files importing each other mention each other, and a whole disconnected
  island of code vouches for itself forever. This walks OUT from the entry points
  — route files, configs, tests, content — and follows imports transitively, so a
  file counts only if something a user can actually reach leads to it.

  An exemption is data with a reason (R-82), the same shape every other waiver in
  this file takes, and a waiver for a file that no longer exists fails too.
*/
const REACH = RULES.reachability

/** Every module specifier a file imports, statically or dynamically. */
const importSpecs = (src) =>
  [
    ...src.matchAll(/from\s*['"]([^'"]+)['"]/g),
    ...src.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g),
    ...src.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g),
  ].map((m) => m[1])

/**
 * A specifier resolved to a file in this tree, or null for a package import.
 * Extension and /index resolution are done by trying the candidates in order,
 * the same way the bundler does, because the specifier in source rarely names
 * the file on disk exactly.
 */
function resolveModule(from, spec) {
  let base
  if (spec.startsWith('@/')) base = spec.slice(2)
  else if (spec.startsWith('.')) base = join(dirname(from), spec).replace(/\\/g, '/')
  else return null
  const suffixes = ['', ...REACH.resolve_extensions, ...REACH.resolve_extensions.map((e) => '/index' + e)]
  for (const suffix of suffixes) {
    const p = base + suffix
    if (existsSync(join(REPO, p)) && statSync(join(REPO, p)).isFile()) return p
  }
  return null
}

/** The roots of the graph: what the framework, the test runner and the content load. */
function entryFiles() {
  const out = new Set(REACH.entry_files.filter((f) => existsSync(join(REPO, f))))
  for (const dir of REACH.entry_dirs)
    for (const f of walkFiles(dir)) if (REACH.entry_extensions.some((e) => f.endsWith(e))) out.add(f)
  // Next resolves these by filename, so nothing imports them and they are roots.
  for (const f of walkFiles(REACH.route_root)) {
    if (!/\.tsx?$/.test(f)) continue
    if (REACH.route_basenames.includes(f.split('/').pop().replace(/\.tsx?$/, ''))) out.add(f)
  }
  return out
}

;(function checkReachability() {
  const seen = new Set()
  const queue = [...entryFiles()]
  while (queue.length) {
    const f = queue.pop()
    if (seen.has(f)) continue
    seen.add(f)
    for (const spec of importSpecs(read(f))) {
      const target = resolveModule(f, spec)
      if (target && !seen.has(target)) queue.push(target)
    }
  }

  // An exemption naming a path outside the package is the portfolio's, not a
  // stale waiver: in package scope it is filtered rather than reported.
  const exempt = Object.fromEntries(
    Object.entries(REACH.exempt ?? {}).filter(([f]) => !PACKAGE_ONLY || inManifest(f)),
  )
  for (const root of scopedRoots(REACH.roots))
    for (const f of walkFiles(root)) {
      if (!REACH.extensions.some((e) => f.endsWith(e))) continue
      if (seen.has(f) || exempt[f]) continue
      fail(
        REACH.id,
        `${f} is reachable from no entry point: no route, config, test or content file leads to it through an import. Delete it, wire it up, or record it in invariants.json > reachability.exempt with the reason it stays.`,
      )
    }
  for (const f of Object.keys(exempt))
    if (!existsSync(join(REPO, f)))
      fail(REACH.id, `invariants.json > reachability.exempt excuses ${f}, which is no longer in the tree. Delete the exemption with the file.`)
})()

// ── AM. The /ame brand taxonomy and registry ─────────────────────────────────
// AM1 registry coverage, AM2 tier population, AM3 animated->playground. Parallel
// to T1/T2/T3 but for the /ame brand design system (DECISIONS R-55, R-57),
// disjoint from /system (no component documented in both, clause H). The /ame
// registry (content/ame/component-registry.json) is the single home the /ame
// docs and these checks read; the taxonomy's home is content/ame/meta.json.
// Violations, not drift: these are stated clauses, not counts.
;(function checkAmeTaxonomyRegistry() {
  if (!clauseInScope('AM1')) return
  const reg = RULES.ame_registry
  const tax = RULES.ame_taxonomy
  const tierNames = new Set(tax.tiers.map((t) => t.name))

  // AM1 — every .tsx under the scan dirs (minus the excluded set) has exactly
  // one registry row; every row points at a real file and carries exactly one
  // valid tier; no source is claimed twice. A row may point at a file outside
  // the scan dirs (the prototype viewer) as long as it resolves and its tier is
  // valid; such a row is admitted but is not part of the mandatory coverage.
  let rows = []
  try {
    rows = JSON.parse(read(reg.data)).components
  } catch {
    fail('AM1', `${reg.data} is missing or not valid JSON; the /ame registry is the single home the checks read.`)
    return
  }
  const excluded = new Set(Object.keys(reg.excluded))
  const scanned = reg.scan_dirs
    .flatMap((d) => walkFiles(d))
    .filter((f) => f.endsWith('.tsx') && !excluded.has(f))
  const bySource = new Map()
  for (const r of rows) {
    if (!r.source) {
      fail('AM1', `a /ame registry row (name "${r.name ?? '?'}") has no source path`)
      continue
    }
    if (bySource.has(r.source))
      fail('AM1', `${r.source} has more than one /ame registry row; a component has exactly one entry.`)
    bySource.set(r.source, r)
    if (!tierNames.has(r.tier))
      fail('AM1', `${r.source} has tier "${r.tier}", not one of the /ame taxonomy tiers (${[...tierNames].join(', ')}).`)
    if (!existsSync(join(REPO, r.source)))
      fail('AM1', `/ame registry row ${r.source} points at a file that does not exist.`)
    if (excluded.has(r.source))
      fail('AM1', `${r.source} is in the /ame excluded set (a provider or pure-logic sink) yet carries a registry row; remove the row or the exclusion.`)
  }
  for (const f of scanned)
    if (!bySource.has(f))
      fail('AM1', `${f} has no /ame registry row; every component under ${reg.scan_dirs.join(', ')} needs exactly one, or an entry in ame_registry.excluded.`)

  // AM2 — every declared /ame tier is non-empty (at least one page under its
  // separator in meta.json) or carries a recorded deferred_because.
  const meta = JSON.parse(read(tax.meta) || '{}')
  const pages = Array.isArray(meta.pages) ? meta.pages : []
  const perTier = new Map()
  let current = null
  for (const item of pages) {
    const sep = /^---(.+?)---$/.exec(item)
    if (sep) {
      current = sep[1].trim()
      if (!perTier.has(current)) perTier.set(current, 0)
    } else if (current) perTier.set(current, perTier.get(current) + 1)
  }
  for (const t of tax.tiers) {
    const count = perTier.get(t.name) ?? 0
    if (count === 0 && !t.deferred_because)
      fail(
        tax.id,
        `/ame tier "${t.name}" has no page in ${tax.meta} and no deferred_because; a tier is populated or deferred with a reason, never silently absent.`,
      )
  }

  // AM3 — every row that is animated AND documented resolves to a playground
  // reference. This session all animated rows are status 'deferred', so the loop
  // body never runs (vacuous); AM3 binds in Phase 3, when a documented animated
  // component must name a `playground` file that exists.
  for (const r of rows) {
    if (r.animated !== true || r.status !== reg.playground_status) continue
    if (!r.playground || !existsSync(join(REPO, r.playground)))
      fail('AM3', `${r.source} is an animated, documented /ame component but names no playground that resolves; an animated documented component must reference a playground (Phase 3).`)
  }
})()

// ── K1. Per-class asset byte budgets under public/ ──────────────────────────
// A stated ceiling per asset class (VIOLATION, not drift): a file over its
// class budget fails, so the 25 MB-SVG / 82 MB-GLB class of regression cannot
// land silently. Assets that already exceed their ceiling are waived at their
// current byte size and held there by the ratchet (a waiver only moves down, in
// the reduction order that owns it). Classes, budgets, and waivers are data in
// invariants.json > asset_budget; nothing here restates a number.
;(function checkAssetBudget() {
  if (!clauseInScope('K1')) return
  const a = RULES.asset_budget
  const classOf = (f) => {
    const dot = f.lastIndexOf('.')
    const ext = dot === -1 ? '' : f.slice(dot).toLowerCase()
    for (const [cls, exts] of Object.entries(a.extensions)) if (exts.includes(ext)) return cls
    return null
  }
  for (const f of walkFiles(a.root)) {
    const cls = classOf(f)
    if (!cls) continue
    const size = statSync(join(REPO, f)).size
    const waived = a.waived[f]
    if (waived !== undefined) {
      if (size > waived)
        fail(a.id, `${f} is ${size} B, above its waived ceiling of ${waived} B. A waiver only ratchets down; shrink it in its reduction order, never grow it.`)
    } else if (size > a.budgets[cls]) {
      fail(a.id, `${f} is ${size} B, over the ${cls} budget of ${a.budgets[cls]} B. Reduce it, or if it genuinely cannot shrink now, waive it in invariants.json > asset_budget.waived with its size and a reduction order.`)
    }
  }
})()

// ── W1, W2. CI references a script that exists, with a least-privilege token ──
// A path spelled in a CI step binds the tree exactly the way a var() binds a
// token, and it was the one binding here nothing checked: both workflows ran
// `node tokens/build.mjs` long after the script moved, and stayed green because
// an unpushed workflow never runs. This resolves what CI actually spells — script
// paths, and the package.json script names CI prefers to spell instead — against
// the tree now, rather than at first push. Data in invariants.json > workflows.
/*
  U5. Definition scope must cover reference scope.

  A `var(--x)` in a stylesheet that loads on every route, whose `--x` is defined only
  in a stylesheet that loads on some routes, resolves to nothing on the rest. CSS's
  failure mode is silent: no error, no warning, the declaration is simply dropped and
  the page loses whatever the value was carrying. This is the `@property`-ignored
  cousin, and it is invisible until someone visits the wrong page.

  Caught by hand at R-140, reading the import graph, before the first edit of the WS-2
  ratification: `@theme` lives in a globally-loaded sheet, `--ame-unit-1` was emitted into a
  sheet only the portfolio route group loads. This check is that reading, mechanised.

  Only vars this repo DEFINES somewhere are judged. A var defined by Tailwind or
  fumadocs and referenced here is theirs to scope, and flagging it would be noise.
*/
;(function checkCssScope() {
  if (!clauseInScope('U5')) return
  const c = RULES.css_scope
  const files = []
  const walk = (dir) => {
    for (const f of readdirSync(join(REPO, dir), { withFileTypes: true })) {
      const rel = dir + '/' + f.name
      if (f.isDirectory()) { if (f.name !== 'node_modules') walk(rel) }
      else files.push(rel)
    }
  }
  for (const root of scopedRoots(c.roots)) if (existsSync(join(REPO, root))) walk(root)

  // A stylesheet's scope is the scope of the layout that imports it: the root layout
  // loads on every route, a nested one only on its subtree.
  const entries = new Map()
  for (const f of files) {
    if (!c.layout_names.some((n) => f.endsWith('/' + n))) continue
    const src = read(f) || ''
    const scope = f === c.root_layout ? 'global' : 'provincial'
    for (const m of src.matchAll(/import\s+['"](\.[^'"]+\.css)['"]/g)) {
      const rel = join(f, '..', m[1]).replace(/\\/g, '/').replace(REPO.replace(/\\/g, '/') + '/', '')
      entries.set(rel, scope === 'global' ? 'global' : entries.get(rel) || 'provincial')
    }
  }

  // Follow @import so a sheet's scope reaches everything it pulls in.
  const resolveImport = (from, spec) => {
    if (spec.startsWith('.')) return join(from, '..', spec).replace(/\\/g, '/').replace(REPO.replace(/\\/g, '/') + '/', '')
    for (const [prefix, dir] of Object.entries(c.package_aliases))
      if (spec.startsWith(prefix + '/')) return dir + '/' + spec.slice(prefix.length + 1)
    return null // external (tailwindcss, fumadocs) — not ours to scope
  }
  const expand = (start, seen = new Set()) => {
    if (seen.has(start) || !existsSync(join(REPO, start))) return seen
    seen.add(start)
    for (const m of (read(start) || '').matchAll(/@import\s+['"]([^'"]+)['"]/g)) {
      const r = resolveImport(start, m[1])
      if (r) expand(r, seen)
    }
    return seen
  }

  const reach = { global: new Set(), provincial: new Set() }
  for (const [file, scope] of entries) for (const f of expand(file)) reach[scope].add(f)

  const defs = (set) => {
    const out = new Set()
    for (const f of set) for (const m of (read(f) || '').matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g)) out.add(m[1])
    return out
  }
  const defGlobal = defs(reach.global)
  const defProvincial = defs(reach.provincial)
  const exempt = new Set(c.exempt || [])

  for (const f of reach.global)
    for (const m of (read(f) || '').matchAll(/var\((--[a-zA-Z0-9_-]+)/g)) {
      const name = m[1]
      if (defGlobal.has(name) || exempt.has(name)) continue
      if (!defProvincial.has(name)) continue // defined by a dependency, not by us
      fail(c.id, `${f} loads on every route and reads ${name}, which this repo defines only in a stylesheet that does not. On the routes that sheet does not load, ${name} resolves to nothing and the declaration is silently dropped. Load the defining sheet at least as widely as the referencing one, or record ${name} in invariants.json > css_scope.exempt.`)
    }
})()

;(function checkWorkflows() {
  const w = RULES.workflows
  const manifest = JSON.parse(read(w.manifest) || '{}')
  const scripts = manifest.scripts || {}
  const ignore = new Set(w.ignore)
  const builtins = new Set(w.runner_builtins)
  const exists = (p) => existsSync(join(REPO, p))
  const isPath = (s) => w.path_extensions.some((e) => s.endsWith(e))
  // W3's evidence, gathered by the same pass W1 already makes: every script name
  // anything in this repo actually calls.
  const invoked = new Set()

  // Every path-shaped token in a command, and every `<runner> <script>` name.
  const inspect = (cmd, where) => {
    for (const m of cmd.matchAll(/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)+/g)) {
      const p = m[0]
      if (!isPath(p) || ignore.has(p)) continue
      if (!exists(p))
        fail(w.id, `${where} runs "${p}", which is not in the tree. Point it at the script's real home, or record the path in invariants.json > workflows.ignore.`)
    }
    for (const r of w.runners)
      for (const m of cmd.matchAll(new RegExp('\\b' + r.replace(/ /g, '\\s+') + '\\s+([a-z][a-z0-9:._-]*)', 'g'))) {
        if (!(m[1] in scripts) && !builtins.has(m[1]))
          fail(w.id, `${where} runs "${r} ${m[1]}", which is not a script in ${w.manifest}. Add the script, or call the tool directly.`)
        invoked.add(m[1])
      }
  }

  // package.json scripts bind paths too, and CI now defers to them, so a stale
  // path there is the same defect one level down.
  for (const [name, cmd] of Object.entries(scripts)) inspect(cmd, `${w.manifest} script "${name}"`)

  const dir = join(REPO, w.dir)
  if (!existsSync(dir)) {
    fail(w.id, `${w.dir} does not exist; STANDARD.md C4 requires CI to run the build and checks on every push.`)
    return
  }
  for (const f of readdirSync(dir)) {
    if (!w.workflow_extensions.some((e) => f.endsWith(e))) continue
    const rel = w.dir + '/' + f
    const src = read(rel)
    const lines = src.split('\n')

    // `run:` values, single-line and block-scalar. Comments are not executed, so
    // they are not weighed here; only what CI actually runs.
    for (let i = 0; i < lines.length; i++) {
      const one = lines[i].match(/^\s*(?:-\s*)?run:\s*(?![|>])(\S.*)$/)
      if (one) { inspect(one[1].split('#')[0], rel); continue }
      if (!/^\s*(?:-\s*)?run:\s*[|>]/.test(lines[i])) continue
      const indent = lines[i].search(/\S/)
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() === '') continue
        if (lines[j].search(/\S/) <= indent) break
        inspect(lines[j], rel)
      }
    }

    // A `with:` input naming a file (node-version-file, and its siblings for
    // other runtimes) is a path CI spells, so it is verified like any other.
    // These live in `with:` blocks rather than `run:`, and carry no extension,
    // so the run-line scan above cannot see them.
    for (const m of src.matchAll(/^\s*[a-z-]+-file:\s*(\S+)\s*$/gm)) {
      const p = m[1].replace(/^['"]|['"]$/g, '')
      if (!ignore.has(p) && !existsSync(join(REPO, p)))
        fail(w.id, `${rel} points at "${p}", which is not in the tree.`)
    }

    // A runtime version written here is a version with one home per workflow.
    for (const [key, instead] of Object.entries(w.banned_version_keys))
      if (new RegExp('^\\s*' + key + ':', 'm').test(src))
        fail(w.version_key_id, `${rel} spells "${key}:" inline; a runtime version belongs in one home the whole repo reads. Use ${instead}.`)

    if (!new RegExp('permissions:[\\s\\S]*?' + w.required_permission.replace(/:\s*/, ':\\s*')).test(src))
      fail(w.permissions_id, `${rel} declares no least-privilege token; add "permissions:\\n  ${w.required_permission}" so a workflow that only reads the tree cannot write to it.`)
  }

  // W3, the mirror of W1. W1 asks whether a named script exists; W3 asks whether an
  // existing script is named. A script nothing calls is not a check, however correct
  // it is, and it passes silently whenever a person runs it by hand — which is how
  // docgen and typecheck both hid. An exemption is allowed and must say why.
  const exempt = w.uninvoked_exempt || {}
  for (const name of Object.keys(scripts)) {
    if (invoked.has(name)) continue
    const reason = exempt[name]
    if (typeof reason !== 'string' || reason.trim() === '')
      fail(w.uninvoked_id, `${w.manifest} defines "${name}", and nothing in ${w.dir} or ${w.manifest} runs it. A script no one calls is not a check. Wire it into a workflow or another script, or record it in invariants.json > workflows.uninvoked_exempt with the reason it has no caller.`)
  }
  // An exemption for a script that no longer exists is a stale waiver, and the same
  // rot Z1 refuses in the census. It is removed with the script it excused.
  // In package scope the package.json is generated and names fewer scripts, so
  // an exemption for one it does not define is out of scope rather than stale.
  for (const name of Object.keys(exempt))
    if (!(name in scripts) && !PACKAGE_ONLY)
      fail(w.uninvoked_id, `invariants.json > workflows.uninvoked_exempt excuses "${name}", which ${w.manifest} no longer defines. Delete the exemption with the script.`)
})()

// ── VN1, VN2. Code the author did not write is traceable to a source ─────────
// The manifest and the tree hold each other: a vendored file that nobody recorded
// fails, and a recorded path that no longer exists fails. VN2 keeps the root
// itself to one home, since three separate configs exempt it by name and a rename
// that missed one would quietly change what the standard covers.
;(function checkVendored() {
  const v = RULES.vendored
  const manifest = read(v.manifest)
  if (!manifest) {
    fail(v.id, `${v.manifest} is missing; every vendored root needs a manifest naming where its files came from.`)
    return
  }
  const listed = new Set(manifest.match(/[A-Za-z0-9_./-]+\.tsx?/g) ?? [])

  for (const root of scopedRoots(v.roots)) {
    const onDisk = walkFiles(root).filter((f) => v.extensions.some((e) => f.endsWith(e)))
    for (const f of onDisk)
      if (!listed.has(f))
        fail(v.id, `${f} sits under the vendored root ${root} but is not recorded in ${v.manifest}. Record where it came from, or move it out of the vendored root.`)
    for (const p of listed)
      if (p.startsWith(root + '/') && !existsSync(join(REPO, p)))
        fail(v.id, `${v.manifest} lists ${p}, which is not in the tree. Remove the stale entry.`)

    // VN2. The root is exempted by name in several configs; they must agree.
    // Matched as a quoted entry, not a substring: these files discuss the root
    // in prose too, and a comment mentioning it is not an exemption granting it.
    const quoted = new RegExp(`['"\`]${root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(/\\*\\*)?['"\`]`)
    for (const file of v.exempting_files)
      if (!quoted.test(read(file)))
        fail(v.root_id, `${file} no longer names the vendored root ${root} as an entry; its exemption and ${v.manifest} disagree about what is vendored.`)
    for (const keyPath of v.exempting_keys) {
      const list = keyPath.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), RULES)
      if (!Array.isArray(list) || !list.includes(root))
        fail(v.root_id, `invariants.json > ${keyPath} no longer lists the vendored root ${root}; the exemptions and ${v.manifest} disagree about what is vendored.`)
    }
  }
})()

// ── Z1. Bijection census: contract clause -> invariants entry + check ────────
// Every clause declared in contract.md has a machine-readable census record in
// invariants.json > census.clauses naming where it is covered (an invariants
// key and a check.mjs function), or a structural waiver naming the build.mjs
// mechanism that enforces it. This makes the contract->invariants->check
// bijection a gate check rather than a discipline. Data in invariants.json,
// clause in contract.md section Z; nothing here restates a clause list.
;(function checkCensus() {
  const c = RULES.census
  const contract = read(c.contract_file)
  if (!contract) {
    fail(c.id, `${c.contract_file} not found; the census cannot parse the contract clauses it must account for.`)
    return
  }
  // Bold clause markers only: **A1**, **C1–C10**, ... The id is a letter run,
  // digits, optionally a range (en-dash or hyphen) to a second id. Normalize the
  // en-dash contract.md writes ranges with to a plain hyphen for the map key.
  const declared = new Set()
  for (const m of contract.matchAll(/\*\*([A-Z]+[0-9]+(?:[\u2013-][A-Z]*[0-9]+)?)\*\*/g))
    declared.add(m[1].replace(/\u2013/g, '-'))

  const checkerSrc = read(c.checker_file)
  const hasKey = (k) =>
    k.split('.').reduce((o, seg) => (o && typeof o === 'object' ? o[seg] : undefined), RULES) !== undefined
  const hasFn = (name) => new RegExp('function\\s+' + name + '\\b').test(checkerSrc)

  for (const id of [...declared].sort()) {
    const rec = c.clauses[id]
    if (!rec) {
      fail(c.id, `contract clause ${id} has no census record in invariants.json > census.clauses. Give it an invariant+check, or a structural waiver naming what enforces it.`)
      continue
    }
    if (rec.invariant && !hasKey(rec.invariant))
      fail(c.id, `contract clause ${id} maps to invariants key "${rec.invariant}", which does not exist in invariants.json.`)
    if (rec.check && !hasFn(rec.check))
      fail(c.id, `contract clause ${id} maps to check "${rec.check}", which is not a function in ${c.checker_file}.`)
    if (!rec.invariant && !rec.check && !rec.structural)
      fail(c.id, `contract clause ${id} census record is empty; give it an invariant+check pair or a structural waiver reason.`)
  }
  // A record for a clause the contract no longer declares is stale: catch it so
  // the map cannot drift out of step with contract.md in the other direction.
  for (const id of Object.keys(c.clauses))
    if (!declared.has(id))
      fail(c.id, `census.clauses lists ${id}, which ${c.contract_file} no longer declares as a clause. Remove the stale record.`)
})()

// ── Z2. No threshold literal hardcoded in the checker ────────────────────────
// A threshold a clause compares against lives in invariants.json; the checker
// reads it (deliverables.md: the gate imports its thresholds, never restates
// them). This flags a decimal literal or an integer >= min_integer in check.mjs
// code, after stripping comments, strings, and regex literals, unless it is an
// allowlisted constant. Both the bound and the allowlist are data in
// invariants.json > census.threshold_scan, so this scan states no number either.
;(function checkThresholdScan() {
  const t = RULES.census.threshold_scan
  let src = read(RULES.census.checker_file)
  src = src.replace(/\/\*[\s\S]*?\*\//g, ' ')
  src = src.replace(/`(?:\\.|[^`\\])*`/g, ' ')
  src = src.replace(/'(?:\\.|[^'\\])*'/g, ' ')
  src = src.replace(/"(?:\\.|[^"\\])*"/g, ' ')
  src = src.replace(/(^|[=(,:[!&|?{;])\s*\/(?:\\.|\[(?:\\.|[^\]\\])*\]|[^/\\\n])+\/[gimsuy]*/g, '$1 ')
  src = src.replace(/(^|[^:/])\/\/[^\n]*/g, '$1')
  const allow = new Set(Object.keys(t.allow))
  const flagged = new Map()
  for (const m of src.matchAll(/\b\d+\.\d+\b/g)) if (!allow.has(m[0])) flagged.set(m[0], 'decimal')
  for (const m of src.matchAll(/\b\d+\b/g)) {
    if (Number(m[0]) >= t.min_integer && !allow.has(m[0])) flagged.set(m[0], 'integer')
  }
  for (const [num, kind] of flagged)
    fail(t.id, `${RULES.census.checker_file} hardcodes the ${kind} threshold ${num}; a threshold lives in invariants.json, not in the checker. Move it there, or if it is a legitimate constant allowlist it in invariants.json > census.threshold_scan.allow.`)
})()

// ── CS1. Perceptual ramps are declared in OKLCH ──────────────────────────────
// The ramps chosen by eye along a progression state the space that keeps their
// steps even; the fixed anchors stay sRGB because they are exact values, not points
// on a ramp. F3 bounds which spaces the FORMAT allows, which is a different claim.
//
// The firing lists are C6, adopted here rather than required: nothing in this file
// enforces C6 the way packages/woven/check.mjs does for itself, and a clause written
// while documenting that gap should not repeat it. Every sample runs through the
// clause's own predicate on each run, so a predicate that has quietly stopped
// matching is caught by the clause rather than by whoever notices the silence.
;(function checkColorSpace() {
  const r = RULES.color_space
  const onRamp = (path) => r.prefixes.some((p) => path === p || path.startsWith(p + '.'))
  const offends = (path, space) => onRamp(path) && space !== r.space

  for (const s of r.must_catch)
    if (!offends(s.path, s.space))
      fail(r.id, `must-catch sample is no longer flagged (${s.why}): ${s.path} in ${s.space}`)
  for (const s of r.must_never_catch)
    if (offends(s.path, s.space))
      fail(r.id, `must-never-catch sample is now flagged (${s.why}): ${s.path} in ${s.space}`)

  for (const t of tokens) {
    if (t.layer !== 'base' || typeof t.raw !== 'object' || t.raw === null) continue
    const space = t.raw.colorSpace
    if (space && offends(t.path, space))
      fail(r.id, `${t.path} is declared in ${space}; a perceptual ramp states ${r.space}, which is what keeps its steps even.`)
  }
})()

// ── CS2. No HDR rendition renders brighter than HDR Reference White ──────────
// The C clauses measure WCAG ratios, and WCAG was calibrated for a regime whose
// brightest white IS reference white — the definition of SDR. Above it no
// specification gives an author anything to measure against, so the rule is a
// ceiling rather than a ratio: an HDR anchor may reach further out in gamut, and
// may not reach higher in luminance. The arithmetic lives in hdr.mjs, tested there
// against the spec's own worked examples; the number it is compared to lives in
// invariants.json. This branch only walks the tree and reports.
;(function checkHdrCeiling() {
  const r = RULES.hdr_ceiling
  const over = (value) => exceedsReferenceWhite(value, r.ceiling_nits)

  for (const s of r.must_catch)
    if (!over(s.value).fails)
      fail(r.id, `must-catch sample is no longer flagged (${s.why}): ${s.value.colorSpace} ${s.value.components.join(' ')}`)
  for (const s of r.must_never_catch)
    if (over(s.value).fails)
      fail(r.id, `must-never-catch sample is now flagged (${s.why}): ${s.value.colorSpace} ${s.value.components.join(' ')}`)

  for (const t of tokens) {
    if (!t.hdr) continue
    const verdict = over(t.hdr.value)
    if (verdict.fails)
      fail(r.id, `${t.path} declares an HDR anchor that ${verdict.why}. Above reference white there is no accessibility threshold to satisfy, and this colour is type or UI; take the gain in chroma instead.`)
  }
})()

// ── Z3. No clause measures over a denominator that isn't there ───────────────
// A check that scans a path which does not exist finds nothing, reports zero, and
// passes — a health nothing established. RC1 already guards its own empty set by
// hand (`would pass over an empty set and report a health nothing established`),
// which is the right instinct applied in one place: a guard each clause author has
// to remember is discipline, just moved from the rule-follower to the rule-writer.
// This asserts it for every clause at once, on the record walkFiles keeps, so a
// clause written next year inherits it without knowing it exists.
;(function checkDenominator() {
  const d = RULES.census.denominator
  // Keys, not entries: the value is the REASON, which Z4 holds to being present.
  const allow = new Set(Object.keys(d.allow_missing))
  for (const [rel, existed] of scanRoots)
    if (!existed && !allow.has(rel))
      fail(
        d.id,
        `a clause scanned ${rel}, which does not exist; the scan reads zero files and its clause reports zero findings over an empty set. Point it at a real path, drop it from the list, or, if the path is legitimately optional, name it in invariants.json > census.denominator.allow_missing with the reason.`,
      )
})()

// ── Z4. Every allowlisted exception names its reason, and the lists only shrink ─
// An allowlist is where a clause admits it cannot judge something, so it is the one
// place drift hides in plain sight: an entry costs a line and buys silence forever.
// Two conditions, because one without the other is not much.
//
// Reasons, so an entry cannot be anonymous. Z2's allow already carried them by
// convention and nothing read them — Object.keys() took the numbers and dropped the
// prose, so an entry with an empty reason would have passed. Z3's allow_missing was
// worse: it shipped as an ARRAY, with the contract promising a reason the shape had
// nowhere to put.
//
// And a ratchet on the total, because a rule with an allowlist is a rule that erodes
// one justified exception at a time. Counting the entries as drift puts them under
// the same one-way constraint as every other measured number here: the list may be
// emptied, never extended. That is what stops "allowlist it" from being the cheapest
// answer to a failing check.
//
// Found by SHAPE rather than by a registry: any key in the census named `allow` or
// `allow_something` is one of these. A registry would need the author of the next
// allowlist to add it, which is the discipline this clause exists to remove.
;(function checkAllowlists() {
  const found = []
  const walk = (node, path) => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('$')) continue
      if (/^allow(_[a-z_]+)?$/.test(k)) found.push([`${path}.${k}`, v])
      else walk(v, `${path}.${k}`)
    }
  }
  walk(RULES.census, 'census')

  const a = RULES.census.allowlists
  let total = 0
  for (const [where, list] of found) {
    if (!list || typeof list !== 'object' || Array.isArray(list)) {
      fail(a.id, `${where} is not a reason-carrying map; an allowlist is {entry: why}, so an entry cannot be anonymous.`)
      continue
    }
    for (const [entry, reason] of Object.entries(list)) {
      total += 1
      if (typeof reason !== 'string' || !reason.trim())
        fail(a.id, `${where} allows ${entry} with no reason; an exception nobody wrote down is one nobody can retire.`)
    }
  }
  drift[a.id] = total
})()

// ── G1. Placeholders never ship (--shipped mode only) ───────────────────────
const SHIPPED = process.argv.includes('--shipped')
const mode = SHIPPED ? 'shipped' : 'full'
const shippedHits = []
const shippedRoutes = new Set()

/**
 * The route an emitted file belongs to.
 *
 * Next 16 emits one route as several files: `foo.html`, `foo.rsc`, and a
 * `foo.segments/` tree of per-segment payloads. Counting files and calling the
 * total "routes" overstates it by about 3x on any dynamic route — three case
 * studies emit twelve files. G1 fails on either count, so the verdict was never
 * wrong, but the number a reader takes away was.
 */
const routeOf = (f) => {
  let r = f.slice(RULES.shipped.dir.length) // drop `.next/server/app`
  const seg = r.indexOf('.segments/')
  if (seg !== -1) r = r.slice(0, seg)
  return r.replace(/\.(html|rsc)$/, '') || '/'
}
;(function checkShipped() {
  if (!clauseInScope('G1')) return
  if (!SHIPPED) return
  const g = RULES.shipped
  if (!existsSync(join(REPO, g.dir))) {
    fail(g.id, `--shipped was requested but ${g.dir} does not exist. Run next build first.`)
    return
  }
  const re = new RegExp(g.pattern)
  for (const f of walkFiles(g.dir)) {
    if (!g.extensions.some((e) => f.endsWith(e))) continue
    const body = read(f)
    if (re.test(body)) {
      const line = body.split('\n').find((l) => re.test(l)) ?? ''
      shippedHits.push(f)
      shippedRoutes.add(routeOf(f))
      fail(g.id, `${f} ships a placeholder: ${line.trim().slice(0, 120)}`)
    }
  }
})()

// ── D3. Pattern syntax in rule data, ratcheted ──────────────────────────────
// A regex stored as text must cross a boundary to reach the code that runs it,
// and that crossing is where six escapes were eaten in one evening (R-86). These
// sites are held at their count rather than swept: a new typed pattern fails, a
// migration lowers the number for good.
;(function checkPatternEscapes() {
  const BACKSLASH = String.fromCharCode(92)
  const spec = RULES.pattern_escapes
  const collect = (n, out = []) => {
    if (typeof n === 'string') out.push(n)
    else if (Array.isArray(n)) for (const v of n) collect(v, out)
    else if (n && typeof n === 'object')
      for (const [k, v] of Object.entries(n)) {
        out.push(k)
        collect(v, out)
      }
    return out
  }
  let count = 0
  for (const site of spec.sites) {
    const p = join(REPO, site)
    if (!existsSync(p)) {
      fail('D3', `pattern_escapes names ${site}, which does not exist`)
      continue
    }
    count += collect(JSON.parse(readFileSync(p, 'utf8'))).filter((s) => s.includes(BACKSLASH)).length
  }
  drift.D3 = count
})()

// ── The run record, and X1: a baseline never moves up ───────────────────────
/*
  One baseline per product.

  A drift count is a measurement of a tree, and the two trees are different: the
  package has a fraction of this repo's token consumers, so H1 there is properly
  larger and S-counts properly smaller. Judging the package against numbers
  measured here would fail it for being itself, and lowering these to suit it
  would blind the monorepo. So package scope reads its own file, carried by the
  manifest and owned by a person, and X1's rule — a baseline only moves down,
  in the change that earned it — applies to each independently.
*/
const baselinePath =
  PACKAGE_ONLY && existsSync(join(ROOT, 'baseline.package.json'))
    ? join(ROOT, 'baseline.package.json')
    : join(ROOT, 'baseline.json')
const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : {}

const logPath = join(ROOT, 'runs.log')
const priorLines = existsSync(logPath)
  ? readFileSync(logPath, 'utf8').split('\n').filter((l) => l.trim())
  : []

/** Drift counts as written in a log line: "S1=12 S2=34 ...". */
const parseCounts = (line) =>
  Object.fromEntries(
    [...line.matchAll(/([A-Z][0-9]+)=([0-9]+)/g)].map(([, k, v]) => [k, Number(v)]),
  )

// X1 is evaluated against the run that preceded this one, so the line this run
// appends below cannot vouch for itself.
;(function checkRecord() {
  const last = priorLines.at(-1)
  if (!last) return // first run: there is no prior measurement to compare against
  const prev = parseCounts(last)
  for (const [id, value] of Object.entries(baseline)) {
    if (id.startsWith('$')) continue
    if (prev[id] !== undefined && value > prev[id])
      fail(
        'X1',
        `baseline ${id} is ${value}, above the ${prev[id]} the last logged run measured. A baseline only moves down.`,
      )
  }
})()

const grew = ratchetExceeded(drift, baseline).length > 0

const verdict = violations.length || grew ? 'FAIL' : 'PASS'
const counts = Object.entries(drift)
  .map(([k, v]) => `${k}=${v}`)
  .join(' ')
/*
  --no-log suppresses the append. runs.log is the gate's memory, so it records
  gate runs; a read-only instrument measuring the current state (dipstick) would
  otherwise grow the history just by looking at it.
*/
if (!process.argv.includes('--no-log')) {
  const stamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  /*
    THE FIGURES RIDE ALONG, and the reason is a risk the derivation introduced.

    The :root count used to be transcribed into four places. That was annoying and
    change-LOUD: a build change broke a test and forced someone to acknowledge it.
    Deriving the figure made it drift-proof and change-BLIND — delete a token by
    accident and the prose, the flowchart and the export all quietly agree on 317.
    The cross-check compares the export to the committed CSS, which is
    committed-vs-committed; it cannot see intended-vs-actual.

    So the announcement moves to the diff. runs.log is the gate's memory and is
    committed, so a figure that changes shows up as a delta in review next to
    whatever changed it, rather than being absorbed by every surface at once.
  */
  const fig = tokenFigures({ tokens, compiled: buildRecipes() })
  const figures = `ROOT=${fig.rootProps} DARK=${fig.darkRepoints}`
  appendFileSync(logPath, `${stamp}  ame@${manifest.version}  ${mode}  ${verdict}  ${figures}  ${counts}\n`)
}

// ── Report ──────────────────────────────────────────────────────────────────

console.log(`ame@${manifest.version}   mode: ${mode}   tokens: ${tokens.length}\n`)

if (SHIPPED) {
  const routes = [...shippedRoutes].sort()
  const summary = routes.length
    ? `${routes.length} route(s) carry a placeholder, across ${shippedHits.length} emitted file(s)\n` +
      routes.map((r) => `       ${r}`).join('\n')
    : 'no placeholder in the emitted app tree'
  console.log(`SHIPPED\n  ${RULES.shipped.id}: ${summary}\n`)
}

console.log('CONTRAST')
for (const r of contrastResults)
  console.log(
    `  ${r.id} ${r.ratio >= r.min ? 'pass' : 'FAIL'}  ${r.ratio.toFixed(2)}:1  (min ${r.min})  ${r.fg} on ${r.bg}`,
  )

console.log('\nDRIFT (measured; must not exceed baseline)')
for (const [id, count] of Object.entries(drift)) {
  const base = baseline[id]
  const note = base === undefined ? 'no baseline' : count > base ? `GREW from ${base}` : `<= ${base}`
  console.log(`  ${id}: ${count}  ${note}`)
}
for (const f of scaleFindings)
  console.log(`    ${f.id} off-scale in ${f.group}: ${f.strays.map(([v, c]) => `${v} x${c}`).join(', ')}`)
if (bindingStrays.length)
  console.log(`    ${RULES.binding.id} surfaces reading base: ${bindingStrays.join(', ')}`)
for (const r of restated) console.log(`    ${RULES.restated.id} restated: ${r}`)
if (clientless.length) console.log(`    H1 clientless: ${clientless.join(', ')}`)

if (skipped.length)
  console.log(
    `\nSKIPPED (out of scope for --scope ${SCOPE}; not checked, not passed)\n  ${skipped.join(', ')}`,
  )

console.log('\nVIOLATIONS')
if (violations.length === 0) console.log('  none')
else for (const v of violations) console.log('  ' + v)

if (violations.length || grew) process.exit(1)
