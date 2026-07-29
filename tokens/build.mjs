#!/usr/bin/env node
/*
  Token build. Reads the DTOS 2025.10 token files under base/, semantic/, and
  component/, resolves references, and emits CSS custom properties.

  Postcondition (contract.md > Postcondition B2): given files that satisfy the
  preconditions, this writes a stylesheet in which every token appears exactly
  once, resolved to a literal, under .portfolio-root. It throws rather than emit
  a partial file.

  Output:
    build/portfolio.tokens.css              versioned artifact
    ../app/(portfolio)/portfolio.tokens.css consumed by portfolio.css

  This file transforms. It does not judge: every consistency condition is
  checked in check.mjs and nowhere else.
*/
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
export const LAYERS = ['base', 'semantic', 'component']

/** The manifest. Single home of the version every emitted artifact stamps. */
export const manifest = JSON.parse(readFileSync(join(ROOT, 'ame.json'), 'utf8'))
export const header = `/* ${manifest.name}@${manifest.version} · ${manifest.format} · generated, do not edit */`

// ── Load and merge every token file into one document ───────────────────────
export function loadDocument(root = ROOT) {
  const doc = {}
  const layerOf = new Map()
  for (const layer of LAYERS) {
    let files
    try {
      files = readdirSync(join(root, layer)).filter((f) => f.endsWith('.json'))
    } catch {
      continue
    }
    for (const file of files) {
      const json = JSON.parse(readFileSync(join(root, layer, file), 'utf8'))
      mergeInto(doc, json, [], layer, layerOf)
    }
  }
  return { doc, layerOf }
}

const isToken = (v) => v && typeof v === 'object' && !Array.isArray(v) && '$value' in v

function mergeInto(target, src, path, layer, layerOf) {
  for (const [key, val] of Object.entries(src)) {
    const here = [...path, key]
    if (key.startsWith('$')) {
      target[key] = val
      continue
    }
    if (isToken(val)) {
      target[key] = val
      layerOf.set(here.join('.'), layer)
    } else if (val && typeof val === 'object') {
      target[key] ??= {}
      mergeInto(target[key], val, here, layer, layerOf)
    }
  }
}

// ── Enumerate tokens, carrying inherited $type and $extensions ──────────────
export function enumerateTokens(doc) {
  const out = []
  ;(function walk(node, path, type, ext) {
    const here = { type: node.$type ?? type, ext: node.$extensions ?? ext }
    for (const [key, val] of Object.entries(node)) {
      if (key.startsWith('$')) continue
      const p = [...path, key]
      if (isToken(val)) {
        out.push({
          path: p.join('.'),
          token: val,
          type: val.$type ?? here.type,
          ext: val.$extensions ?? here.ext,
        })
      } else if (val && typeof val === 'object') {
        walk(val, p, here.type, here.ext)
      }
    }
  })(doc, [], undefined, undefined)
  return out
}

// ── Reference resolution ────────────────────────────────────────────────────
const CURLY = /^\{([^}]+)\}$/

export function tokenAt(doc, dotted) {
  return dotted.split('.').reduce((o, k) => (o == null ? o : o[k]), doc)
}

function pointerAt(doc, pointer) {
  const parts = pointer.replace(/^#\//, '').split('/')
  return parts.reduce((o, raw) => {
    if (o == null) return o
    const k = raw.replace(/~1/g, '/').replace(/~0/g, '~')
    return Array.isArray(o) ? o[Number(k)] : o[k]
  }, doc)
}

/** Resolve $ref pointers and {curly} token references, transitively. */
export function resolveValue(doc, value, where, seen = new Set()) {
  if (typeof value === 'string') {
    const m = CURLY.exec(value.trim())
    if (!m) return value
    const target = m[1]
    if (seen.has(target)) throw new Error(`Cyclic reference ${target} (from ${where})`)
    const node = tokenAt(doc, target)
    if (!isToken(node)) throw new Error(`Unresolved reference {${target}} in ${where}`)
    return resolveValue(doc, node.$value, target, new Set([...seen, target]))
  }
  if (Array.isArray(value)) return value.map((v) => resolveValue(doc, v, where, seen))
  if (value && typeof value === 'object') {
    if (typeof value.$ref === 'string') {
      const got = pointerAt(doc, value.$ref)
      if (got === undefined) throw new Error(`Unresolved $ref ${value.$ref} in ${where}`)
      return resolveValue(doc, got, where, seen)
    }
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, resolveValue(doc, v, where, seen)]),
    )
  }
  return value
}

/**
 * The type and the CSS extensions of a token: explicit on the token, inherited
 * from its closest typed group, or taken from the token it references. DTOS
 * specifies the first two for $type; the reference-chain rule for $extensions is
 * this build's own, declared in contract.md > Spec gaps.
 */
function inherited(doc, entry, field, index, seen = new Set()) {
  if (entry[field]) return entry[field]
  const v = entry.token.$value
  if (typeof v === 'string') {
    const m = CURLY.exec(v.trim())
    if (m && !seen.has(m[1])) {
      const target = index.get(m[1])
      if (target) return inherited(doc, target, field, index, new Set([...seen, m[1]]))
    }
  }
  return undefined
}

// ── CSS serialization, one function per DTOS type ───────────────────────────
const n = (x) => (Number.isInteger(x) ? String(x) : String(Number(x.toFixed(6))))

function cssColor(v) {
  const a = v.alpha
  if (v.colorSpace === 'srgb') {
    if (v.hex && a === undefined) return v.hex
    const [r, g, b] = v.components.map((c) => Math.round(c * 255))
    return a === undefined ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${n(a)})`
  }
  const c = v.components.map(n).join(' ')
  return a === undefined ? `${v.colorSpace}(${c})` : `${v.colorSpace}(${c} / ${n(a)})`
}

const cssDimension = (v) => `${n(v.value)}${v.unit}`
const cssDuration = (v) => `${n(v.value)}${v.unit}`
const cssBezier = (v) => `cubic-bezier(${v.map(n).join(', ')})`

function cssFontFamily(v, ext) {
  const vars = ext?.['org.metis.css']?.familyVars ?? {}
  const names = Array.isArray(v) ? v : [v]
  return names.map((f) => (vars[f] ? `var(${vars[f]})` : /\s/.test(f) ? `'${f}'` : f)).join(', ')
}

function cssShadow(v) {
  const layers = Array.isArray(v) ? v : [v]
  return layers
    .map((s) =>
      [
        s.inset ? 'inset' : null,
        cssDimension(s.offsetX),
        cssDimension(s.offsetY),
        cssDimension(s.blur),
        cssDimension(s.spread),
        cssColor(s.color),
      ]
        .filter(Boolean)
        .join(' '),
    )
    .join(', ')
}

export function toCss(type, value, ext) {
  switch (type) {
    case 'color':
      return cssColor(value)
    case 'dimension':
      return cssDimension(value)
    case 'duration':
      return cssDuration(value)
    case 'cubicBezier':
      return cssBezier(value)
    case 'fontFamily':
      return cssFontFamily(value, ext)
    case 'fontWeight':
      return String(value)
    case 'shadow':
      return cssShadow(value)
    case 'number':
      return n(value) + (ext?.['org.metis.css']?.unit ?? '')
    default:
      throw new Error(`No CSS serialization for $type "${type}"`)
  }
}

// ── Legacy --port-* aliases ─────────────────────────────────────────────────
// Names the components already read. Each maps to exactly one token, so the
// alias adds a spelling, never a second home for a value.
export const ALIASES = {
  '--font-port-sans': 'font.family.sans',
  '--port-page-bg': 'background.page',
  '--port-text-primary': 'text.body',
  '--port-text-heading': 'text.heading',
  '--port-text-secondary': 'text.secondary',
  '--port-brand': 'text.brand',
  '--port-brand-fg': 'text.on-brand',
  '--port-nav-bg': 'nav.bg',
  '--port-nav-selected': 'nav.selected',
  '--port-glass-tint': 'surface.glass-tint',
  '--port-glass-light': 'surface.glass-light',
  '--port-glass-dark': 'surface.glass-dark',
  '--port-glass-blur': 'component.glass.blur',
  '--port-glass-saturate': 'component.glass.saturate',
  '--port-glass-fg-on-light': 'surface.glass-fg-on-light',
  '--port-glass-fg-on-dark': 'surface.glass-fg-on-dark',
  '--port-glass-fg-muted-on-light': 'surface.glass-fg-muted-on-light',
  '--port-glass-fg-muted-on-dark': 'surface.glass-fg-muted-on-dark',
  '--port-glass-fill-on-light': 'surface.glass-fill-on-light',
  '--port-glass-fill-on-dark': 'surface.glass-fill-on-dark',
  '--port-dither-strength': 'surface.dither-strength',
  '--port-dither-tile': 'surface.dither-tile',
  '--port-panel-w': 'component.ask-ai.width',
  '--port-w450': 'font.weight-synthesis.450',
  '--port-w460': 'font.weight-synthesis.460',
  '--port-w470': 'font.weight-synthesis.470',
  '--port-w480': 'font.weight-synthesis.480',
  '--port-w490': 'font.weight-synthesis.490',
  '--port-header-stroke': 'type.heading-synthesis',
}
// --ease-out-expo, --ease-out-back, --ease-in-back and --ease-spring are not
// aliases: the tokens ease.* already emit exactly those names. Aliasing them
// would name the same value twice.

export const cssName = (path) => '--' + path.split('.').join('-')

/**
 * The one derived property. DTOS has no asset type, so the grain cannot be a
 * token; its PARAMETERS are tokens and this serializes them into the
 * feTurbulence data URI, exactly as cssShadow serializes a shadow composite.
 * Declared in contract.md > Spec gaps so the extra emitted name is not a
 * surprise. Nothing hand-writes this SVG anywhere.
 */
export function ditherNoise(byPath) {
  const frequency = byPath.get('dither.frequency')?.value
  const octaves = byPath.get('dither.octaves')?.value
  if (frequency === undefined || octaves === undefined)
    throw new Error('dither.frequency and dither.octaves are required to derive --dither-noise')
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg">` +
    `<filter id="pd">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${frequency}" numOctaves="${octaves}" stitchTiles="stitch"/>` +
    `<feColorMatrix type="saturate" values="0"/>` +
    `</filter>` +
    `<rect width="100%" height="100%" filter="url(#pd)"/>` +
    `</svg>`
  // Percent-encode the characters a CSS url() cannot carry raw.
  const encoded = svg
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/"/g, "'")
    .replace(/#/g, '%23')
    .replace(/%(?![0-9A-F]{2})/g, '%25')
  return `url("data:image/svg+xml,${encoded}")`
}

/** Every token, resolved and serialized. Shared with check.mjs. */
export function buildTokens(root = ROOT) {
  const { doc, layerOf } = loadDocument(root)
  const entries = enumerateTokens(doc)
  const index = new Map(entries.map((e) => [e.path, e]))
  return {
    doc,
    tokens: entries.map((e) => {
      const type = inherited(doc, e, 'type', index)
      if (!type) throw new Error(`Token ${e.path} has no resolvable $type`)
      const ext = inherited(doc, e, 'ext', index)
      const value = resolveValue(doc, e.token.$value, e.path)
      return {
        path: e.path,
        cssName: cssName(e.path),
        type,
        raw: e.token.$value,
        value,
        css: toCss(type, value, ext),
        layer: layerOf.get(e.path) ?? 'base',
        description: e.token.$description ?? '',
        deprecated: e.token.$deprecated,
      }
    }),
  }
}

// ── Emit ────────────────────────────────────────────────────────────────────
function main() {
  const { doc, tokens } = buildTokens()

  const LABEL = {
    base: 'BASE — primitives, no usage context',
    semantic: 'SEMANTIC — decisions, each a reference to a base primitive',
    component: 'COMPONENT — element-specific, references to semantic',
  }

  let out = `${header}
/*
  GENERATED by tokens/build.mjs. Do not edit by hand.
  Source of truth: tokens/{base,semantic,component}/*.json (DTOS 2025.10)
  Regenerate:  node tokens/build.mjs
  Check:       node tokens/check.mjs

  Every value on this surface is declared exactly once, here. Re-declaring one
  of these names in portfolio.css creates a second home and check.mjs fails.
*/
.portfolio-root {
`

  const byLayer = { base: [], semantic: [], component: [] }
  for (const t of tokens) byLayer[t.layer].push(t)

  for (const layer of LAYERS) {
    out += `\n  /* ──── ${LABEL[layer]} ──── */\n`
    const groups = {}
    for (const t of byLayer[layer]) {
      const g = t.path.split('.')[layer === 'component' ? 1 : 0]
      ;(groups[g] ??= []).push(t)
    }
    for (const [g, group] of Object.entries(groups)) {
      out += `\n  /* ${g} */\n`
      for (const t of group) {
        out += `  ${t.cssName}: ${t.css};`
        out += t.description ? `  /* ${t.description} */\n` : '\n'
      }
    }
  }

  out += `\n  /* ──── DERIVED — serialized from tokens, not a token itself ──── */\n`
  out += `  --port-dither-noise: ${ditherNoise(new Map(tokens.map((t) => [t.path, t])))};`
  out += `  /* feTurbulence built from dither.frequency and dither.octaves. */\n`

  out += `\n  /* ──── ALIASES — the names the components read. One token each. ──── */\n`
  for (const [name, path] of Object.entries(ALIASES)) {
    const t = tokens.find((t) => t.path === path)
    if (!t) throw new Error(`Alias ${name} -> ${path} does not resolve to a token`)
    out += `  ${name}: var(${t.cssName});\n`
  }

  out += `}\n`

  mkdirSync(join(ROOT, 'build'), { recursive: true })
  writeFileSync(join(ROOT, 'build', 'portfolio.tokens.css'), out)
  writeFileSync(join(ROOT, '..', 'app', '(portfolio)', 'portfolio.tokens.css'), out)

  console.log(
    `Built ${tokens.length} tokens + ${Object.keys(ALIASES).length} aliases\n` +
      `  -> tokens/build/portfolio.tokens.css\n` +
      `  -> app/(portfolio)/portfolio.tokens.css`,
  )
  return doc
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main()
