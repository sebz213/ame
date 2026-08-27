#!/usr/bin/env node
/*
  Token build. Reads the DTOS 2025.10 token files under base/, semantic/,
  component/ and recipe/, resolves references, and emits CSS custom properties,
  the compiled recipe stylesheet, and the typed module over both.

  Postcondition (contract.md > Postcondition B2): given files that satisfy the
  preconditions, this writes a stylesheet in which every token appears exactly
  once, resolved to a literal, under .portfolio-root. It throws rather than emit
  a partial file.

  Output, all four committed and all four byte-checked against a fresh build
  (contract B4 for the first, B6 for the rest):
    tokens.css    every token, resolved, under .portfolio-root
    recipes.css   the compiled recipes: slots, and one scope per variant context
    tokens.mjs    the typed surface — three string builders, no values
    tokens.d.ts   the names this system publishes, as types

  This file transforms. It does not judge: every consistency condition is
  checked in check.mjs and nowhere else.
*/
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
export const LAYERS = ['base', 'semantic', 'component', 'recipe']

/** The vendor namespaces this build reads its own metadata under, per DTCG $extensions. */
export const RECIPE_EXT = 'org.metis.recipe'
export const THEME_EXT = 'org.metis.theme'
export const HDR_EXT = 'org.metis.hdr'

/*
  The colour spaces CSS spells through the color() function rather than as a
  function of their own. oklch(…) and lab(…) name themselves; the predefined
  spaces are all color(<space> …), and serialising one of those as `rec2100-
  linear(…)` produces a string no engine parses. DTCG names the space either way,
  so the difference lives here and nowhere else.
*/
const COLOR_FN_SPACES = new Set([
  'srgb',
  'srgb-linear',
  'display-p3',
  'a98-rgb',
  'prophoto-rgb',
  'rec2020',
  'rec2100-pq',
  'rec2100-hlg',
  'rec2100-linear',
  'xyz',
  'xyz-d50',
  'xyz-d65',
])

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

/*
  `over` composites a translucent colour onto a ground and emits the opaque
  result. It exists so a dark surface can be ink plus a step of ink's light —
  routed, so it follows ink when ink moves — while still being ONE opaque colour.
  Layering at the call site (background-color + background-image) covers the
  surfaces that paint themselves, but not the ones handed to someone else as a
  single value: a popover fill given to fumadocs, for instance, has nowhere to
  put a second layer and shows the page through it if it is translucent.

  Simple source-over alpha compositing on sRGB components, which is what the
  browser does for a translucent background on an opaque one.
*/
function composite(v) {
  const ground = Array.isArray(v.over) ? v.over : v.over.components
  const a = v.alpha ?? 1
  return {
    colorSpace: v.colorSpace,
    components: v.components.map((c, i) => ground[i] * (1 - a) + c * a),
  }
}

function cssColor(v) {
  if (v.over) {
    if (v.colorSpace !== 'srgb')
      throw new Error(`over: only srgb composites, got ${v.colorSpace}`)
    return cssColor(composite(v))
  }
  const a = v.alpha
  if (v.colorSpace === 'srgb') {
    if (v.hex && a === undefined) return v.hex
    const [r, g, b] = v.components.map((c) => Math.round(c * 255))
    return a === undefined ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${n(a)})`
  }
  const c = v.components.map(n).join(' ')
  const open = COLOR_FN_SPACES.has(v.colorSpace)
    ? `color(${v.colorSpace} ${c}`
    : `${v.colorSpace}(${c}`
  return a === undefined ? `${open})` : `${open} / ${n(a)})`
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

/*
  The one namespace. Every emitted name is `--ame-` plus the token's path, so a
  reader can tell at a glance whether a custom property belongs to this design
  system or to the surface using it: `--ame-*` is the system, anything else is
  local. The prefix folded in the ALIASES map that used to sit here — 31 second
  spellings (`--port-page-bg` for `background.page`) which existed only because
  the names predated the system. A spelling that resolves to one token is that
  token, and it now IS that token; the six that resolved to a DIFFERENT token per
  theme are the theme axis below, which is where a per-theme value belongs.
*/
export const cssName = (path) => '--ame-' + path.split('.').join('-')

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
    throw new Error('dither.frequency and dither.octaves are required to derive the dither noise')
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
      /*
        The HDR anchor, read from the token's OWN $extensions and never inherited.
        $type and $extensions inherit down the tree and along reference chains,
        which is right for a css unit hint and wrong for this: an HDR rendition is
        a fact about one colour, and letting it flow to a sibling or to every
        semantic token that references this one would silently give a dozen names
        an HDR value nobody chose for them.
      */
      const hdrMeta = e.token.$extensions?.[HDR_EXT]
      const hdrValue = hdrMeta ? resolveValue(doc, hdrMeta.$value, `${e.path}#hdr`) : undefined

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
        hdr: hdrMeta ? { stops: hdrMeta.stops, value: hdrValue, css: toCss(type, hdrValue, ext) } : undefined,
      }
    }),
  }
}

/**
 * The base-name set, derived from a built token list. The base tier names
 * itself, so U1/U2 and the shipped consumer check all derive the set here
 * rather than restate a prefix list. A surface binds semantic and component
 * names; reading one of these base primitives directly is the U1 violation.
 */
export const deriveBaseNames = (tokens) =>
  new Set(tokens.filter((t) => t.layer === 'base').map((t) => t.cssName))

/* ══ RECIPES ═════════════════════════════════════════════════════════════════
  A recipe is one component's styling contract: its slots (the parts it dresses)
  and its variant axes (the dimensions those parts change along). The DTCG format
  has no word for either, but the Resolver module (2025.10) has exactly the shape
  a variant axis needs — a MODIFIER whose CONTEXTS are the values the axis takes,
  each context contributing token sources that override the default resolution.
  So the axes are modifiers, the slots are $extensions on the recipe set, and
  resolver.json is the one home for both.

  WHY THIS AND NOT A RECIPE ENGINE. The alternative was a runtime: props in,
  class strings out, styles resolved in the browser. Everything below happens
  here instead, and what ships is CSS. A variant costs a selector, not a
  function call, and nothing about the token layer reaches the client as JS.

  WHY CONTEXTS COMPILE TO SCOPES RATHER THAN PERMUTATIONS. The spec's resolution
  count is the PRODUCT of every axis's contexts: two axes of 2 and 3 make 6
  resolutions, and emitting each as its own rule is the combinatorial explosion
  the resolver's own introduction warns about. Emitting each CONTEXT as a scope
  that re-declares only what it changes is the sum instead of the product, and
  the cascade performs the composition the tool would otherwise have to
  enumerate. The selection rule is the same one the spec states — later in
  resolutionOrder wins — because the scopes are emitted in resolutionOrder.
*/

/** The resolver document: sets, modifiers, and the order they compose in. */
export function loadResolver(root = ROOT) {
  return JSON.parse(readFileSync(join(root, 'resolver.json'), 'utf8'))
}

/**
 * One source from a context's array. Only file references are supported, which
 * is the minimum the spec requires a tool to document rather than the maximum it
 * allows: a same-document `#/sets/…` pointer would resolve here too, but nothing
 * uses one, and admitting a form no source exercises is admitting a code path
 * nothing tests.
 */
function readSource(root, src) {
  if (!src || typeof src.$ref !== 'string')
    throw new Error(`A resolver source must be a reference object with $ref; got ${JSON.stringify(src)}`)
  if (src.$ref.startsWith('#'))
    throw new Error(`Same-document source ${src.$ref} is not supported; point contexts at token files.`)
  return JSON.parse(readFileSync(join(root, src.$ref), 'utf8'))
}

/** A copy of the document with one context's sources merged over it, in order. */
function withSources(doc, sources, root) {
  const merged = structuredClone(doc)
  for (const src of sources) mergeInto(merged, readSource(root, src), [], 'recipe', new Map())
  return merged
}

/** Every token under a prefix, resolved and serialized, from one document. */
function resolveUnder(doc, prefix) {
  const entries = enumerateTokens(doc)
  const index = new Map(entries.map((e) => [e.path, e]))
  const out = new Map()
  for (const e of entries) {
    if (!e.path.startsWith(prefix)) continue
    const type = inherited(doc, e, 'type', index)
    if (!type) throw new Error(`Token ${e.path} has no resolvable $type`)
    out.set(e.path, toCss(type, resolveValue(doc, e.token.$value, e.path), inherited(doc, e, 'ext', index)))
  }
  return out
}

/**
 * Every recipe, compiled: its slots and their declarations in the default
 * resolution, plus one entry per (axis, context) carrying ONLY what that context
 * changes. The diff against the default is the deduplication the resolver exists
 * for — a context that restates a value it did not change would emit a rule that
 * says nothing.
 */
export function buildRecipes(root = ROOT) {
  const resolver = loadResolver(root)
  const set = resolver.sets?.recipe
  const defs = set?.$extensions?.[RECIPE_EXT]?.recipes ?? {}
  const { doc } = loadDocument(root)
  const base = resolveUnder(doc, 'recipe.')
  const sizes = resolveUnder(doc, 'breakpoint.')

  // resolutionOrder decides which scope wins, so the axes are read in it rather
  // than in whatever order the modifiers map happens to enumerate.
  const order = (resolver.resolutionOrder ?? [])
    .map((item) => /^#\/modifiers\/(.+)$/.exec(item.$ref ?? '')?.[1])
    .filter(Boolean)

  const axes = []
  for (const name of order) {
    const mod = resolver.modifiers?.[name]
    const meta = mod?.$extensions?.[RECIPE_EXT]
    if (!meta) continue
    const contexts = []
    for (const [context, sources] of Object.entries(mod.contexts ?? {})) {
      const values = resolveUnder(withSources(doc, sources, root), `recipe.${meta.recipe}.`)
      const changed = new Map()
      for (const [path, css] of values) if (base.get(path) !== css) changed.set(path, css)
      contexts.push({ context, changed, static: meta.static?.[context] ?? {} })
    }
    /*
      A media axis resolves its breakpoints to LITERALS here, because a media
      query cannot read a custom property: `@media (min-width: var(--x))` is not
      a thing CSS does, and it fails silently rather than erroring. The token is
      still the single home — the literal is generated from it on every build —
      but this is the one place a token's value is written out instead of
      referenced, so it is stated rather than left to be discovered.
    */
    const widths = Object.fromEntries(
      Object.entries(meta.media ?? {}).map(([context, path]) => [context, path ? sizes.get(path) : null]),
    )
    axes.push({ name, ...meta, default: mod.default, contexts, widths })
  }
  return { resolver, defs, base, axes, themes: buildThemes(resolver, doc, root) }
}

/**
 * The theme axes: the same modifier machinery, applied to the whole token tree
 * rather than to one recipe's slots.
 *
 * A theme context is diffed against the default resolution exactly as a recipe
 * context is, so it emits only the tokens it actually disagrees with — six, at
 * the time of writing, out of nearly three hundred. That diff is what makes a
 * third theme cheap: a high-contrast context overrides what it changes and
 * inherits the rest, with no suffixed twin tokens and no convention to learn.
 */
function buildThemes(resolver, doc, root) {
  const order = (resolver.resolutionOrder ?? [])
    .map((item) => /^#\/modifiers\/(.+)$/.exec(item.$ref ?? '')?.[1])
    .filter(Boolean)
  const light = resolveUnder(doc, '')
  const themes = []
  for (const name of order) {
    const mod = resolver.modifiers?.[name]
    const meta = mod?.$extensions?.[THEME_EXT]
    if (!meta) continue
    const contexts = []
    for (const [context, sources] of Object.entries(mod.contexts ?? {})) {
      const values = resolveUnder(withSources(doc, sources, root), '')
      /*
        Only the paths the context DECLARES, never every path whose resolved
        value happened to move.

        Diffing all values looks right and is wrong. A token that references a
        re-pointed one resolves differently too, so the diff picks it up and the
        scope re-points it as well — the nav pill's foreground follows text.body
        into white the moment the dark context touches text.body. That is a
        design decision the theme file never made and, here, one the design had
        explicitly refused: the pill keeps its own foreground because its ground
        does not change with the theme.

        A context re-points what it names. Anything that wants to follow the
        theme references a token the theme re-points, and does so by choice.
      */
      const declared = new Set()
      for (const src of sources) for (const e of enumerateTokens(readSource(root, src))) declared.add(e.path)
      const changed = new Map()
      for (const path of declared) {
        const css = values.get(path)
        if (css !== undefined && light.get(path) !== css) changed.set(path, css)
      }
      contexts.push({ context, changed })
    }
    themes.push({ name, ...meta, default: mod.default, contexts })
  }
  return themes
}

/** `recipe.<name>.<slot>.<property>` — the grammar RC1 holds every recipe token to. */
const recipePath = (path) => {
  const [, name, slot, property, ...rest] = path.split('.')
  return rest.length || !property ? null : { name, slot, property }
}

/** One CSS block, or '' when it would be empty. Keeps a scope with nothing to say out of the file. */
function block(selector, declarations, indent = '') {
  const body = declarations.filter(Boolean)
  if (!body.length) return ''
  return `${indent}${selector} {\n${body.map((d) => `${indent}  ${d}\n`).join('')}${indent}}\n`
}

/**
 * The compiled recipes. Pure, like renderCss: check.mjs rebuilds it in memory
 * and byte-compares (B6), so a recipe edited without a rebuild cannot pass.
 */
export function renderRecipesCss(compiled) {
  const { defs, base, axes } = compiled
  let out = `${header}
/*
  GENERATED by packages/ame-tokens/build.mjs. Do not edit by hand.
  Source of truth: packages/ame-tokens/resolver.json + recipe/*.json (DTOS 2025.10)
  Regenerate:  node packages/ame-tokens/build.mjs

  Each recipe emits its slots once, then one scope per variant context holding
  only what that context changes. A context re-declares the recipe token's own
  custom property in a narrower scope; the token's single home under
  .portfolio-root (contract B1) is untouched, and the slot rules read the name,
  never the value, so they need no variant of their own.
*/
`

  for (const [name, def] of Object.entries(defs)) {
    const cls = def.class
    const sel = (slot) => (slot === 'root' ? `.${cls}` : `.${cls}__${slot}`)
    const paths = [...base.keys()].filter((p) => recipePath(p)?.name === name)

    out += `\n/* ──── ${name} — ${Object.keys(def.slots).length} slots, ${axes.filter((a) => a.recipe === name).length} axes ──── */\n`

    for (const [slot, spec] of Object.entries(def.slots)) {
      // Statics first, token-backed properties second, so a property with both
      // takes the token: the design value wins over the structural default.
      const internal = new Set(spec.internal ?? [])
      const decls = [
        ...Object.entries(spec.static ?? {}).map(([k, v]) => `${k}: ${v};`),
        ...paths
          .filter((p) => recipePath(p).slot === slot && !internal.has(recipePath(p).property))
          .map((p) => `${recipePath(p).property}: var(${cssName(p)});`),
      ]
      out += block(sel(slot), decls)
    }

    for (const axis of axes.filter((a) => a.recipe === name)) {
      for (const { context, changed, static: statics } of axis.contexts) {
        const scope = axis.attribute ? `.${cls}[${axis.attribute}="${context}"]` : `.${cls}`
        const width = axis.widths?.[context]
        const query = width ? `@media (min-width: ${width})` : null
        const indent = query ? '  ' : ''
        let body = block(
          scope,
          [...changed].map(([p, css]) => `${cssName(p)}: ${css};`),
          indent,
        )
        for (const [slot, decls] of Object.entries(statics))
          body += block(
            slot === 'root' ? scope : `${scope} ${sel(slot)}`,
            Object.entries(decls).map(([k, v]) => `${k}: ${v};`),
            indent,
          )
        if (!body) continue
        out += `\n/* ${axis.axis} = ${context} */\n`
        out += query ? `${query} {\n${body}}\n` : body
      }
    }
  }
  return out
}

// ── Render ──────────────────────────────────────────────────────────────────
// The CSS string, from the resolved tokens. Pure: no I/O. main() writes it, and
// check.mjs (B4) rebuilds it in memory to byte-compare against the committed
// home, so a source edit that was never rebuilt cannot pass the gate.
export function renderCss(tokens, compiled) {
  const LABEL = {
    base: 'BASE — primitives, no usage context',
    semantic: 'SEMANTIC — decisions, each a reference to a base primitive',
    component: 'COMPONENT — element-specific, references to semantic',
    recipe: 'RECIPE — per-slot values, the default resolution of each recipe',
  }

  let out = `${header}
/*
  GENERATED by packages/ame-tokens/build.mjs. Do not edit by hand.
  Source of truth: packages/ame-tokens/{base,semantic,component}/*.json (DTOS 2025.10)
  Regenerate:  node packages/ame-tokens/build.mjs
  Check:       node tokens/check.mjs

  Every value on this surface is declared exactly once, here. Re-declaring one
  of these names in portfolio.css creates a second home and check.mjs fails.

  :root, not a class. Custom properties inherit downward and nothing inherits
  UPWARD, so a class scope left html, body and every body-level portal outside
  the system — which is why the page ground and the scrollbar were hand-mirrored
  literals held in step by a parity clause. Declared on the document element they
  are simply in scope, everywhere, including surfaces this repo does not own.
*/
:root {
`

  // Derived from LAYERS, so adding a layer needs no second list here to remember.
  const byLayer = Object.fromEntries(LAYERS.map((l) => [l, []]))
  for (const t of tokens) byLayer[t.layer].push(t)

  for (const layer of LAYERS) {
    out += `\n  /* ──── ${LABEL[layer]} ──── */\n`
    const groups = {}
    for (const t of byLayer[layer]) {
      // component and recipe are namespaced by their owner, so the group a
      // reader scans by is the second segment there and the first everywhere else.
      const g = t.path.split('.')[layer === 'component' || layer === 'recipe' ? 1 : 0]
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
  const byPathForNoise = new Map(tokens.map((t) => [t.path, t]))
  out += `  --ame-dither-noise: ${ditherNoise(byPathForNoise)};`
  out += `  /* feTurbulence built from dither.frequency and dither.octaves. */\n`

  out += `}\n`

  /*
    The theme scopes. Each context of a theme modifier emits only the tokens it
    disagrees with, in resolutionOrder, so the last matching scope wins exactly
    as the spec says it should.

    TWO SELECTORS PER CONTEXT, and the second is the point. The attribute sits on
    a wrapper inside the page, so [data-theme=…] covers that subtree — but html
    and body are ABOVE that wrapper and inherit nothing from it. `:root:has(…)`
    reaches back up and hands the document element the same values, which is what
    puts the page ground and the UA scrollbar inside the token system instead of
    beside it as literals someone has to keep in step.

    Generated, so none of this is a hand re-declaration (invariant D1): the value
    still has one home, the token, and a scope only says where it applies.
  */
  for (const theme of compiled?.themes ?? []) {
    for (const { context, changed } of theme.contexts) {
      if (!changed.size) continue
      const attr = `[${theme.attribute}="${context}"]`
      const selector = theme.document ? `${attr}, :root:has(${attr})` : attr
      out += `\n/* ──── THEME ${theme.name} = ${context} — ${changed.size} token(s) re-pointed ──── */\n`
      out += `${selector} {\n`
      for (const [path, css] of changed) out += `  ${cssName(path)}: ${css};\n`
      out += `}\n`
    }
  }

  /*
    HDR renditions (CSS Color HDR 1, § 5).

    A token carrying org.metis.hdr is re-declared here as a colour parameterised by
    the display's HDR headroom: the token's ordinary value at headroom 0, the HDR
    anchor at the declared number of stops, and the user agent interpolating between
    them in Absolute D65 XYZ. The headroom itself is never exposed to us — it is a
    fingerprinting vector, so the spec hands over adaptation without measurement.

    THE @supports GUARD IS NOT OPTIONAL. A custom property accepts almost any token
    sequence at parse time, so an engine that does not know this function still stores
    the declaration happily; the failure surfaces later, at every var() that reads it,
    as an invalid-at-computed-value-time drop. Unguarded, this would not degrade to
    the SDR colour in Firefox and Safari — it would delete the colour. Inside
    @supports the whole block is skipped and the :root value above stands.

    THE FUNCTION NAME IS UNSETTLED IN THE SPEC ITSELF. § 5's heading calls it
    hdr-color(), while the grammar it publishes on the next line and every example in
    the section spell it color-hdr(. The grammar is what an implementation reads, so
    that is what is emitted. The guard is what makes the disagreement survivable: if
    engines land the other spelling, this block simply never applies and nothing
    breaks — which is the only reason it is defensible to emit against a Working
    Draft at all.

    THE SDR VALUE STAYS THE AUDITED ONE. The headroom-0 anchor is the token exactly as
    C1 to C10 already measure it, so the contrast clauses go on auditing the colour an
    SDR display shows, unchanged. What renders above 0 stops is interpolated by the
    user agent, is not exposed, and has no accessibility threshold defined for it by
    any spec — see contract.md CS2 for the reach statement.

    Emitted LAST, after the theme scopes, so the first :root block in this file
    remains the complete declaration set the artifact tests count.
  */
  const hdrTokens = tokens.filter((t) => t.hdr)
  if (hdrTokens.length) {
    out += `\n/* ──── HDR — headroom-parameterised renditions, ${hdrTokens.length} token(s) ──── */\n`
    out += `@supports (color: color-hdr(white 0, white 2)) {\n`
    out += `  :root {\n`
    for (const t of hdrTokens) {
      out += `    ${t.cssName}: color-hdr(${t.css} 0, ${t.hdr.css} ${n(t.hdr.stops)});\n`
    }
    out += `  }\n}\n`
  }

  return out
}

/* ══ THE TYPED SURFACE ════════════════════════════════════════════════════════
  Two more generated artifacts, from the same source as the CSS: a runtime of
  three string builders, and the types over it.

  WHAT THIS FIXES. A `var(--semantic-text-body)` in a component is a string the
  compiler has no opinion about: misspell it and the declaration is dropped
  silently, because an undefined custom property is not an error. The gate caught
  that eventually — U1 and N2 read the same names — but only at gate time, and
  only for the rules it scans. A generated union makes it a type error at the
  keystroke, from the same token tree the CSS is built from, so the two cannot
  disagree about what exists.

  IT STAYS ZERO-RUNTIME. Nothing here carries a token VALUE into JavaScript.
  `token()` wraps a name in `var()`, `recipe()` builds a class and its data
  attributes, `slot()` builds a class. Every value is still resolved by the
  browser from the stylesheet, so the payload of this module is a handful of
  string concatenations and the types vanish at compile time.
*/

/** A TypeScript string-literal union, one member per line, or `never` if empty. */
const union = (values) =>
  values.length ? values.map((v) => `\n  | '${v}'`).join('') : ' never'

export function renderRuntime(compiled) {
  const { defs, axes } = compiled
  const entries = Object.entries(defs).map(([name, def]) => {
    const mine = axes.filter((a) => a.recipe === name)
    const axisEntries = mine
      .map(
        (a) =>
          `      ${JSON.stringify(a.axis)}: {\n` +
          (a.attribute ? `        attribute: ${JSON.stringify(a.attribute)},\n` : '') +
          `        default: ${JSON.stringify(a.default)},\n` +
          `        contexts: [${a.contexts.map((c) => JSON.stringify(c.context)).join(', ')}],\n` +
          `      },`,
      )
      .join('\n')
    return (
      `  ${JSON.stringify(name)}: {\n` +
      `    class: ${JSON.stringify(def.class)},\n` +
      `    element: ${JSON.stringify(def.element)},\n` +
      `    slots: [${Object.keys(def.slots).map((s) => JSON.stringify(s)).join(', ')}],\n` +
      `    axes: {\n${axisEntries}\n    },\n` +
      `  },`
    )
  })

  return `${header}
/*
  GENERATED by packages/ame-tokens/build.mjs. Do not edit by hand.
  Source of truth: packages/ame-tokens/resolver.json + the token JSON (DTOS 2025.10)

  The typed surface of the token system. tokens.css is its CSS home; this is the
  home a component binds by name. Values live in the stylesheet and are never
  carried here, so this stays three string builders and no runtime resolution.
*/

/** Every recipe: its root class, its slots, and its axes with their contexts. */
export const RECIPES = Object.freeze({
${entries.join('\n')}
})

/** A custom property, as a CSS value. The name is checked by the union in tokens.d.ts. */
export const token = (name) => \`var(\${name})\`

/** A slot's class. Root takes the recipe's own class; every other slot is suffixed. */
export const slot = (name, part) =>
  part === 'root' ? RECIPES[name].class : \`\${RECIPES[name].class}__\${part}\`

/**
 * A recipe's root props: its class, plus one data attribute per attribute axis.
 * An axis left unset falls back to its declared default, so the attribute is
 * always present and the DOM says which context is in force rather than leaving
 * it to be inferred from the absence of a selector. A media axis takes no
 * attribute — the viewport selects it, not the markup — so it never appears here.
 */
export function recipe(name, variants = {}) {
  const spec = RECIPES[name]
  const props = { className: spec.class }
  for (const [axis, a] of Object.entries(spec.axes))
    if (a.attribute) props[a.attribute] = variants[axis] ?? a.default
  return props
}
`
}

export function renderTypes(tokens, compiled) {
  const { defs, axes } = compiled
  const recipeNames = Object.keys(defs)
  const variantsOf = (name) =>
    axes
      .filter((a) => a.recipe === name && a.attribute)
      .map((a) => `    ${a.axis}?: ${a.contexts.map((c) => `'${c.context}'`).join(' | ')}`)
      .join('\n')

  return `${header}
/*
  GENERATED by packages/ame-tokens/build.mjs. Do not edit by hand.

  The names this design system publishes, as types. A misspelled token is a
  compile error here rather than a silently dropped declaration in the browser,
  and the union is generated from the token tree the CSS is built from, so the
  two cannot disagree about what exists.
*/

/** Every token's custom property, one per token in the four layers. */
export type AmeTokenName =${union(tokens.map((t) => t.cssName))}

/** The legacy --port-* spellings. Each resolves to one token per theme (contract B3). */


/** Anything \`token()\` will accept: a token's own name, or an alias for one. */
export type AmeVarName = AmeTokenName | AmeAliasName

/** The recipes this system compiles. */
export type AmeRecipeName =${union(recipeNames)}

/** Each recipe's settable axes. A media axis is selected by the viewport, so it is not here. */
export interface AmeRecipeVariants {
${recipeNames.map((n) => `  '${n}': {\n${variantsOf(n) || '    /* no attribute axis */'}\n  }`).join('\n')}
}

/** Each recipe's slots. */
export interface AmeRecipeSlots {
${recipeNames.map((n) => `  '${n}': ${Object.keys(defs[n].slots).map((s) => `'${s}'`).join(' | ')}`).join('\n')}
}

export interface AmeRecipeSpec {
  readonly class: string
  readonly element: string
  readonly slots: readonly string[]
  readonly axes: Readonly<
    Record<string, { readonly attribute?: string; readonly default: string; readonly contexts: readonly string[] }>
  >
}

export declare const RECIPES: Readonly<Record<AmeRecipeName, AmeRecipeSpec>>
export declare function token(name: AmeVarName): string
export declare function slot<K extends AmeRecipeName>(name: K, part: AmeRecipeSlots[K]): string
export declare function recipe<K extends AmeRecipeName>(
  name: K,
  variants?: AmeRecipeVariants[K],
): { className: string } & Record<string, string>
`
}

// ── Emit ────────────────────────────────────────────────────────────────────
// The committed homes. There is no second copy of any of them to drift from:
// the portfolio and Metis bind them through the package boundary, and check.mjs
// (B4, B6) rebuilds each from source to prove the committed bytes still match.
/*
  The figures the documentation states, counted from the CSS this build emits.

  These were transcribed into four places: a test constant, two flowchart node
  labels, and a sentence in the case study. That is the same fact written down four
  times, which is precisely the disease the token layer exists to cure one level
  down — the repo had not applied declare-once to its own documentation. A figure
  with four homes drifts, and it did: the page said 296 for a while after the graph
  had moved, and the assertion added later caught the discrepancy rather than
  preventing it.

  Counted from the rendered CSS rather than from the token list, because the two are
  not the same number: recipes live in their own file, and a derived property is
  emitted that no token declares. What the documentation claims is what `:root`
  contains, so that is what gets counted.
*/
/*
  BOTH LOCATORS ANCHOR AT THE START OF A LINE, AND THE DARK ONE HAD TO LEARN WHY.

  The dark count used to be `css.indexOf('data-theme')` followed by the next
  `{...}` block. `data-theme` occurs in a token DESCRIPTION long before it occurs
  as a selector — "bound by the --port-text-heading alias under [data-theme=dark]"
  sits in a comment around line 196 — so the scan started inside `:root`, matched
  the next brace pair it could find, and counted six recipe properties plus the
  dither noise. Six. The dark scope also held six, so the figure was correct by
  coincidence for as long as those two numbers agreed, and the moment a seventh
  re-point landed the page said 6 while the CSS said 7.

  Nothing caught it, because the test that guards this number located the block
  the same way. Two derivations of one fact sharing a broken locator agree with
  each other perfectly; that is D-54's instrument problem in its purest form, so
  the test now finds the rule by its own means and the two can disagree.

  ^ is what fixes it: a selector starts a line, a mention inside a comment does
  not.
*/
export function tokenFigures({ tokens, compiled }) {
  const css = renderCss(tokens, compiled)
  const propsIn = (block) => (block.match(/^\s*--[a-z0-9-]+:/gm) ?? []).length
  const root = css.match(/^:root\s*\{([\s\S]*?)\n\}/m)
  const dark = css.match(/^\[data-theme="dark"\][^{]*\{([\s\S]*?)\n\}/m)
  /*
    Colour counts from the token tree's own $type and colourSpace, not from the
    emitted syntax. The reference pages used to state these as literals and drifted
    the moment two tokens were added; counting the declared type is the only
    definition that cannot disagree with the format.
  */
  const colors = tokens.filter((t) => t.type === 'color')
  const space = (t) => t.value?.colorSpace ?? (typeof t.value === 'string' ? 'srgb' : 'other')

  return {
    rootProps: root ? propsIn(root[1]) : 0,
    darkRepoints: dark ? propsIn(dark[1]) : 0,
    colorTokens: colors.length,
    colorSrgb: colors.filter((t) => space(t) === 'srgb').length,
    colorOklch: colors.filter((t) => space(t) === 'oklch').length,
  }
}

const renderFigures = (input) => {
  const f = tokenFigures(input)
  return `
/* The counts the docs state, derived here so no surface transcribes them. */
export const ROOT_PROPS = ${f.rootProps}
export const DARK_REPOINTS = ${f.darkRepoints}
export const COLOR_TOKENS = ${f.colorTokens}
export const COLOR_SRGB = ${f.colorSrgb}
export const COLOR_OKLCH = ${f.colorOklch}
`
}

export const ARTIFACTS = {
  'tokens.css': ({ tokens, compiled }) => renderCss(tokens, compiled),
  'recipes.css': ({ compiled }) => renderRecipesCss(compiled),
  'tokens.mjs': (input) => renderRuntime(input.compiled) + renderFigures(input),
  'tokens.d.ts': ({ tokens, compiled }) =>
    renderTypes(tokens, compiled) +
    `
/** Number of custom properties emitted at :root. Derived, never transcribed. */
export declare const ROOT_PROPS: number
/** Number of those the dark scope re-points. Derived, never transcribed. */
export declare const DARK_REPOINTS: number
/** Tokens whose declared $type is color. Derived, never transcribed. */
export declare const COLOR_TOKENS: number
/** Of those, how many are declared in sRGB. Derived, never transcribed. */
export declare const COLOR_SRGB: number
/** Of those, how many are declared in OKLCH. Derived, never transcribed. */
export declare const COLOR_OKLCH: number
`,
}

function main() {
  const { tokens } = buildTokens()
  const compiled = buildRecipes()
  for (const [file, render] of Object.entries(ARTIFACTS))
    writeFileSync(join(ROOT, file), render({ tokens, compiled }))
  console.log(
    `Built ${tokens.length} tokens + ${compiled.themes.reduce((n, t) => n + t.contexts.length, 0)} theme contexts + ` +
      `${Object.keys(compiled.defs).length} recipes (${compiled.axes.length} axes)\n` +
      Object.keys(ARTIFACTS).map((f) => `  -> packages/ame-tokens/${f}`).join('\n'),
  )
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main()
