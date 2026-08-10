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
import { buildTokens, renderCss, deriveBaseNames, ALIASES, aliasPaths, cssName, LAYERS, manifest } from 'ame-tokens/build.mjs'
import { contrast } from './contrast.mjs'
import { ratchetExceeded } from './ratchet.mjs'

const ROOT = dirname(fileURLToPath(import.meta.url))
const REPO = join(ROOT, '..')
const RULES = JSON.parse(readFileSync(join(ROOT, 'invariants.json'), 'utf8'))

const violations = []
const drift = {}
const fail = (id, msg) => violations.push(`${id}  ${msg}`)

const { doc, tokens } = buildTokens()
const byPath = new Map(tokens.map((t) => [t.path, t]))

// ── file helpers ────────────────────────────────────────────────────────────
const read = (p) => (existsSync(join(REPO, p)) ? readFileSync(join(REPO, p), 'utf8') : '')
function walkFiles(rel, out = []) {
  const abs = join(REPO, rel)
  if (!existsSync(abs)) return out
  for (const e of readdirSync(abs, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue
    const child = rel + '/' + e.name
    if (e.isDirectory()) walkFiles(child, out)
    else out.push(child)
  }
  return out
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
;(function checkB4() {
  const [home] = RULES.manifest.emitted
  const p = join(REPO, home)
  if (!existsSync(p)) {
    fail('B4', `the emitted token CSS home is missing (${home}); run node packages/ame-tokens/build.mjs`)
    return
  }
  if (renderCss(tokens) !== readFileSync(p, 'utf8'))
    fail('B4', `${home} does not match a fresh build from source; run node packages/ame-tokens/build.mjs to regenerate it.`)
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
    if (direct) return direct
    const alias = ALIASES[name]
    if (!alias) return null
    return typeof alias === 'string' ? alias : (alias[theme] ?? null)
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

  const files = cv.surfaces
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

// ── D. One home per value ───────────────────────────────────────────────────
;(function checkDuplication() {
  const generated = new Set([...tokens.map((t) => t.cssName), ...Object.keys(ALIASES)])
  for (const f of RULES.duplication.hand_written) {
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
  for (const f of r.hand_written)
    for (const m of read(f).matchAll(/^\s*[a-z-]+:\s*([^;]+);/gim)) {
      const value = m[1].trim()
      if (value.includes('var(')) continue
      const hit = bySignature.get(signature(value))
      if (hit) restated.push(`${f}: "${value.replace(/\s+/g, ' ').slice(0, 60)}" == ${hit}`)
    }
  drift[r.id] = restated.length
})()

// ── S. Scale membership (drift) ─────────────────────────────────────────────
const scaleFindings = []
;(function checkScales() {
  const files = RULES.scales.sources.flatMap((s) => walkFiles(s)).filter((f) => /\.(tsx?|css)$/.test(f))
  for (const s of RULES.scales.entries) {
    const members = new Set(
      tokens
        .filter((t) => t.path.startsWith(s.group + '.'))
        .map((t) => (s.kind === 'number' ? t.value : convert(t.value, s.unit))),
    )
    const strays = new Map()
    for (const f of files)
      for (const m of read(f).matchAll(new RegExp(s.pattern, 'g'))) {
        const got = Number(m.slice(1).find((x) => x !== undefined))
        if (![...members].some((v) => Math.abs(v - got) < 1e-6))
          strays.set(`${got}${s.unit}`, (strays.get(`${got}${s.unit}`) ?? 0) + 1)
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

// ── U1. Surfaces bind semantic and component, never base ────────────────────
const bindingStrays = []
;(function checkBinding() {
  const b = RULES.binding
  // Derived, not restated: the base tier names itself.
  const baseNames = deriveBaseNames(tokens)
  const files = b.surfaces
    .flatMap((s) => walkFiles(s))
    .filter((f) => b.extensions.some((e) => f.endsWith(e)) && !b.exclude.includes(f))
  for (const f of files)
    for (const m of read(f).matchAll(/var\((--[a-z0-9_-]+)/g))
      if (baseNames.has(m[1])) bindingStrays.push(`${f}: ${m[1]}`)
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
  const u2files = b.scan.flatMap((s) => walkFiles(s)).filter(inScope)
  for (const f of u2files) {
    const waived = new Set(b.waived[f] ?? [])
    for (const m of read(f).matchAll(/var\((--[a-z0-9_-]+)/g))
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

  // U4 — the portfolio surface must not import a lib/*-tokens module (the two
  // token homes stay two concepts, R-25).
  const u4 = g.surface_no_system_tokens
  const pat = new RegExp(u4.forbidden_import_pattern)
  for (const f of u4.surfaces.flatMap((s) => walkFiles(s)).filter((f) => /\.(ts|tsx)$/.test(f)))
    for (const s of importsOf(read(f)))
      if (pat.test(s))
        fail(u4.id, `${f} imports ${s}; the portfolio surface binds the DTOS token pipeline, not the lib/*-tokens /system system (two concepts, R-25).`)
})()

// ── H. Client census ────────────────────────────────────────────────────────
const clientless = []
;(function checkClients() {
  const src = RULES.clients.sources
    .flatMap((s) => walkFiles(s))
    .filter((f) => /\.(tsx?|jsx?|css|mdx?)$/.test(f) && !f.endsWith('portfolio.tokens.css'))
    .map(read)
    .join('\n')
  const usedVars = new Set([...src.matchAll(/var\((--[a-z0-9_-]+)/g)].map((m) => m[1]))

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
  const aliased = new Set(Object.values(ALIASES).flatMap(aliasPaths))
  const invariantOwned = Object.keys(RULES.clients.invariant_clients)
  const parityOwned = new Set(RULES.parity.entries.map((e) => e.token))
  const contrastOwned = new Set(RULES.contrast.pairs.flatMap((p) => [p.fg, p.bg]))

  for (const t of tokens) {
    const hasClient =
      usedVars.has(t.cssName) ||
      referenced.has(t.path) ||
      aliased.has(t.path) ||
      parityOwned.has(t.path) ||
      contrastOwned.has(t.path) ||
      invariantOwned.some((g) => t.path === g || t.path.startsWith(g + '.'))
    if (!hasClient) clientless.push(t.path)
  }
  drift.H1 = clientless.length
})()


// ── AM. The /ame brand taxonomy and registry ─────────────────────────────────
// AM1 registry coverage, AM2 tier population, AM3 animated->playground. Parallel
// to T1/T2/T3 but for the /ame brand design system (DECISIONS R-55, R-57),
// disjoint from /system (no component documented in both, clause H). The /ame
// registry (content/ame/component-registry.json) is the single home the /ame
// docs and these checks read; the taxonomy's home is content/ame/meta.json.
// Violations, not drift: these are stated clauses, not counts.
;(function checkAmeTaxonomyRegistry() {
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
;(function checkWorkflows() {
  const w = RULES.workflows
  const manifest = JSON.parse(read(w.manifest) || '{}')
  const scripts = manifest.scripts || {}
  const ignore = new Set(w.ignore)
  const builtins = new Set(w.runner_builtins)
  const exists = (p) => existsSync(join(REPO, p))
  const isPath = (s) => w.path_extensions.some((e) => s.endsWith(e))

  // Every path-shaped token in a command, and every `<runner> <script>` name.
  const inspect = (cmd, where) => {
    for (const m of cmd.matchAll(/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)+/g)) {
      const p = m[0]
      if (!isPath(p) || ignore.has(p)) continue
      if (!exists(p))
        fail(w.id, `${where} runs "${p}", which is not in the tree. Point it at the script's real home, or record the path in invariants.json > workflows.ignore.`)
    }
    for (const r of w.runners)
      for (const m of cmd.matchAll(new RegExp('\\b' + r.replace(/ /g, '\\s+') + '\\s+([a-z][a-z0-9:._-]*)', 'g')))
        if (!(m[1] in scripts) && !builtins.has(m[1]))
          fail(w.id, `${where} runs "${r} ${m[1]}", which is not a script in ${w.manifest}. Add the script, or call the tool directly.`)
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

  for (const root of v.roots) {
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

// ── The run record, and X1: a baseline never moves up ───────────────────────
const baselinePath = join(ROOT, 'baseline.json')
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
  appendFileSync(logPath, `${stamp}  ame@${manifest.version}  ${mode}  ${verdict}  ${counts}\n`)
}

// ── Report ──────────────────────────────────────────────────────────────────

console.log(`ame@${manifest.version}   mode: ${mode}   tokens: ${tokens.length}   aliases: ${Object.keys(ALIASES).length}\n`)

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

console.log('\nVIOLATIONS')
if (violations.length === 0) console.log('  none')
else for (const v of violations) console.log('  ' + v)

if (violations.length || grew) process.exit(1)
