#!/usr/bin/env node
/*
  The verifier. Every consistency condition in contract.md is evaluated here and
  nowhere else: not in build.mjs, not restated in prose, not asserted twice.

  Two severities:
    VIOLATION  a stated clause is broken. Exit 1.
    DRIFT      a measured count that must not grow past its baseline in
               outcomes.md. Exit 1 only when it grows.

  Run:  node tokens/check.mjs
*/
import { readdirSync, readFileSync, existsSync, appendFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildTokens, ALIASES, aliasPaths, cssName, LAYERS, manifest } from './build.mjs'
import { contrast } from './contrast.mjs'
import { ratchetExceeded } from './ratchet.mjs'

const ROOT = dirname(fileURLToPath(import.meta.url))
const REPO = join(ROOT, '..')
const RULES = JSON.parse(readFileSync(join(ROOT, 'invariants.json'), 'utf8'))

const violations = []
const drift = {}
const fail = (id, msg) => violations.push(`${id}  ${msg}`)

const { doc, tokens } = buildTokens(ROOT)
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
  const declared = JSON.parse(read(join('tokens', m.file)) || '{}').version
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

// ── C. Contrast ─────────────────────────────────────────────────────────────
const contrastResults = []
;(function checkContrast() {
  for (const p of RULES.contrast.pairs) {
    const fg = byPath.get(p.fg)
    const bg = byPath.get(p.bg)
    if (!fg || !bg) {
      fail(p.id, `pair references a token that does not exist (${p.fg} on ${p.bg})`)
      continue
    }
    const ratio = contrast(fg.value, bg.value)
    contrastResults.push({ ...p, ratio })
    if (ratio < p.min)
      fail(p.id, `${p.fg} on ${p.bg} is ${ratio.toFixed(2)}:1, below the required ${p.min}:1`)
  }
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
  const baseNames = new Set(tokens.filter((t) => t.layer === 'base').map((t) => t.cssName))
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
  const baseNames = new Set(tokens.filter((t) => t.layer === 'base').map((t) => t.cssName))
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

// ── T. Docs taxonomy and the component registry ──────────────────────────────
// T1 registry coverage, T2 tier population, T3 documented pages resolve. The
// registry (components/docs/component-registry.json) is the single home docs
// and checks read; the taxonomy's home is content/docs/meta.json. WO-10.6 (a),
// (b), (d); the docgen-sync check (c) is deferred with the docgen itself
// (WO-10.4). Violations, not drift: these are stated clauses, not counts.
;(function checkTaxonomyRegistry() {
  const reg = RULES.registry
  const tierNames = new Set(RULES.taxonomy.tiers.map((t) => t.name))

  // T1 — every components/ui/*.tsx file has exactly one registry row, that row
  // points at a real file, and its tier is one of the taxonomy tiers.
  let rows = []
  try {
    rows = JSON.parse(read(reg.data)).components
  } catch {
    fail('T1', `${reg.data} is missing or not valid JSON; the registry is the single home the checks read.`)
    return
  }
  const uiFiles = walkFiles(reg.source_dir).filter((f) => f.endsWith('.tsx'))
  const uiSet = new Set(uiFiles)
  const bySource = new Map()
  for (const r of rows) {
    if (!r.source) {
      fail('T1', `a registry row (name "${r.name ?? '?'}") has no source path`)
      continue
    }
    if (bySource.has(r.source))
      fail('T1', `${r.source} has more than one registry row; a component has exactly one entry.`)
    bySource.set(r.source, r)
    if (!tierNames.has(r.tier))
      fail('T1', `${r.source} has tier "${r.tier}", not one of the taxonomy tiers (${[...tierNames].join(', ')}).`)
    if (!uiSet.has(r.source))
      fail('T1', `registry row ${r.source} points at a file that is not a component under ${reg.source_dir}.`)
  }
  for (const f of uiFiles)
    if (!bySource.has(f))
      fail('T1', `${f} has no registry row; every exported component under ${reg.source_dir} needs exactly one.`)

  // T2 — every declared tier is non-empty (at least one page under its
  // separator in meta.json) or carries a recorded deferral (deferred_because).
  const meta = JSON.parse(read(RULES.taxonomy.meta) || '{}')
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
  for (const t of RULES.taxonomy.tiers) {
    const count = perTier.get(t.name) ?? 0
    if (count === 0 && !t.deferred_because)
      fail(
        RULES.taxonomy.id,
        `tier "${t.name}" has no page in ${RULES.taxonomy.meta} and no deferred_because; a tier is populated or deferred with a reason, never silently absent.`,
      )
  }

  // T3 — every row at status "documented" names a docPage that resolves to a
  // real MDX file under the docs directory.
  for (const r of rows) {
    if (r.status !== 'documented') continue
    if (!r.docPage) {
      fail('T3', `${r.source} is documented but names no docPage.`)
      continue
    }
    const mdx = join(reg.docs_dir, r.docPage + '.mdx')
    if (!existsSync(join(REPO, mdx)))
      fail('T3', `${r.source} is documented but ${mdx.replace(/\\/g, '/')} does not exist.`)
  }
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
