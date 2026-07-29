#!/usr/bin/env node
/*
  dipstick — the read-out instrument for Ame.

  READ-ONLY. This program writes exactly one thing: its own export file under
  tokens/dipstick/. It mutates nothing else in the tree, which is what keeps the
  name honest: an instrument you insert, read, and withdraw, leaving the level
  unchanged.

  ONE JUDGE. contract.md places every condition's evaluation in check.mjs and
  nowhere else, so dipstick never re-evaluates an invariant. It executes
  check.mjs as a child process, captures the exit code and the printed drift
  table, and embeds the verdict. A dipstick with its own copy of a rule would be
  a second edition of the rules, which is the drift this system exists to
  prevent.

  NO RESTATED FACTS. Version from ame.json, rules from invariants.json, baselines
  from baseline.json, history from runs.log, counts from the token tree and the
  filesystem, verdicts from the check run. The one list dipstick owns is the
  13-entry measurement map below, because dipstick is that map's single home.

  DETERMINISTIC. Fixed key order, fixed array order, 2-space indent. Two exports
  from an unchanged tree differ in $exported and dateCreated only.

  Run:  pnpm ame dipstick
*/
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const REPO = join(ROOT, '..')

// ── filesystem helpers, all read-only ───────────────────────────────────────
const abs = (p) => join(REPO, p)
const has = (p) => existsSync(abs(p))
const read = (p) => (has(p) ? readFileSync(abs(p), 'utf8') : null)
const readJson = (p) => {
  const s = read(p)
  return s ? JSON.parse(s) : null
}
const bytes = (p) => (has(p) ? statSync(abs(p)).size : null)
const mtime = (p) => (has(p) ? statSync(abs(p)).mtime.toISOString().replace(/\.\d{3}Z$/, 'Z') : null)
const listFiles = (dir, ext) =>
  has(dir) ? readdirSync(abs(dir)).filter((f) => (ext ? f.endsWith(ext) : true)) : []

/** True when a $value reaches another token: `{group.token}` or a `$ref` pointer. */
function isReference(value) {
  if (typeof value === 'string') return /^\{[^}]+\}$/.test(value.trim())
  if (Array.isArray(value)) return value.some(isReference)
  if (value && typeof value === 'object')
    return '$ref' in value || Object.values(value).some(isReference)
  return false
}

/** Every object carrying $value, anywhere under a directory of token files. */
function tokenStats(dir) {
  let tokens = 0
  let groups = 0
  let refs = 0
  let literals = 0
  const shadows = []
  const roles = new Set()
  for (const f of listFiles(dir, '.json')) {
    const walk = (node, path) => {
      for (const [k, v] of Object.entries(node)) {
        if (k.startsWith('$') || !v || typeof v !== 'object') continue
        if ('$value' in v) {
          tokens++
          // A reference is a curly token reference or a JSON-pointer $ref, at any
          // depth. Not "the serialized value contains a brace": every dimension
          // and colour value is a JSON object and would count as one.
          if (isReference(v.$value)) refs++
          else literals++
          if (v.$type === 'shadow' || node.$type === 'shadow') shadows.push([...path, k].join('.'))
        } else {
          groups++
          if (path.length === 0) roles.add(k)
          walk(v, [...path, k])
        }
      }
    }
    walk(JSON.parse(read(`${dir}/${f}`)), [])
  }
  return { files: listFiles(dir, '.json').length, tokens, groups, refs, literals, shadows, roles: [...roles] }
}

// ── the one judge ───────────────────────────────────────────────────────────
const run = spawnSync(process.execPath, [join(ROOT, 'check.mjs'), '--no-log'], { encoding: 'utf8' })
const checkOut = (run.stdout ?? '') + (run.stderr ?? '')
const driftFromCheck = Object.fromEntries(
  [...checkOut.matchAll(/^ {2}([A-Z][0-9]+): ([0-9]+)/gm)].map(([, k, v]) => [k, Number(v)]),
)

// ── facts, each from its single home ────────────────────────────────────────
const manifest = readJson('tokens/ame.json')
const version = manifest?.version ?? 'unversioned'
const emittedA = 'tokens/build/portfolio.tokens.css'
const emittedB = 'app/(portfolio)/portfolio.tokens.css'
const cssA = read(emittedA)
const cssB = read(emittedB)
const runsLog = (read('tokens/runs.log') ?? '').split('\n').filter((l) => l.trim())
const pkg = readJson('package.json')
const viewerContract = read('components/iphone-viewer-contract.ts')
const viewer = read('components/iphone-viewer.tsx')

const base = tokenStats('tokens/base')
const semantic = tokenStats('tokens/semantic')
const component = tokenStats('tokens/component')

const stamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')


// ── the measurement map: 7 constraints, 6 instruments ───────────────────────
const constraints = [
  {
    id: 'c1',
    name: 'Global tokens',
    status: base.tokens > 0 ? 'present' : 'absent',
    home: base.tokens > 0 ? 'tokens/base/' : null,
    evidence: { files: base.files, tokens: base.tokens, groups: base.groups },
  },
  {
    id: 'c2',
    name: 'Semantic tokens',
    status: semantic.tokens > 0 ? 'present' : 'absent',
    home: semantic.tokens > 0 ? 'tokens/semantic/' : null,
    evidence: { tokens: semantic.tokens, references: semantic.refs },
  },
  {
    id: 'c3',
    name: 'Component tokens',
    status: component.tokens > 0 ? 'present' : 'absent',
    home: component.tokens > 0 ? 'tokens/component/' : null,
    evidence: { tokens: component.tokens, literals: component.literals },
  },
  {
    id: 'c4',
    name: 'Named composites',
    status: driftFromCheck.H1 > 0 ? 'partial' : semantic.shadows.length > 0 ? 'present' : 'absent',
    home: 'tokens/semantic/',
    evidence: {
      shadows: semantic.shadows.length,
      roleSets: ['type', 'motion'].filter((r) => semantic.roles.includes(r)),
      clientless: driftFromCheck.H1 ?? null,
    },
  },
  {
    id: 'c5',
    name: 'Component APIs',
    status: has('components/ui') ? 'partial' : 'absent',
    home: has('components/ui') ? 'components/ui/' : null,
    evidence: {
      componentFiles: listFiles('components/ui').length,
      measured: 'file count only; API surface extraction is not implemented',
    },
  },
  {
    id: 'c6',
    name: 'Platform artifacts',
    status: cssA && cssB ? 'present' : 'absent',
    home: cssA ? emittedA : null,
    evidence: {
      buildBytes: bytes(emittedA),
      consumedBytes: bytes(emittedB),
      parity: run.status === 0 && bytes(emittedA) === bytes(emittedB),
      properties: cssA ? (cssA.match(/^\s*--[a-z0-9_-]+:/gim) ?? []).length : 0,
      header: cssA ? cssA.split('\n')[0] : null,
    },
  },
  {
    id: 'c7',
    name: 'Package boundary',
    status: manifest ? 'present' : 'absent',
    home: manifest ? 'tokens/ame.json' : null,
    evidence: manifest
      ? { name: manifest.name, version: manifest.version, format: manifest.format }
      : { measured: 'ame.json is absent; system.version reads unversioned' },
  },
]

const shippedLine = [...runsLog].reverse().find((l) => / shipped /.test(l)) ?? null
const requiredNodes = viewerContract
  ? (/REQUIRED_NODES\s*=\s*\[([\s\S]*?)\]/.exec(viewerContract)?.[1].match(/'[^']+'/g) ?? []).length
  : 0

const instruments = [
  {
    id: 'i1',
    name: 'The rules file',
    status: has('CLAUDE.md') ? 'present' : 'absent',
    home: has('CLAUDE.md') ? 'CLAUDE.md' : null,
    evidence: { bytes: bytes('CLAUDE.md'), modified: mtime('CLAUDE.md') },
  },
  {
    id: 'i2',
    name: 'The gate configuration',
    status: !pkg?.scripts?.build ? 'absent' : shippedLine ? 'present' : 'partial',
    home: pkg ? 'package.json' : null,
    evidence: {
      build: pkg?.scripts?.build ?? null,
      chainContainsCheck: (pkg?.scripts?.build ?? '').includes('check.mjs'),
      lastShippedRun: shippedLine,
    },
  },
  {
    id: 'i3',
    name: 'The transform pipeline',
    status: has('tokens/build.mjs') ? 'present' : 'absent',
    home: has('tokens/build.mjs') ? 'tokens/build.mjs' : null,
    evidence: {
      header: cssA ? cssA.split('\n')[0] : null,
      parity: constraints[5].evidence.parity,
    },
  },
  {
    id: 'i4',
    name: 'The release path runbook',
    status: has('RUNBOOK.md') ? 'present' : 'absent',
    home: has('RUNBOOK.md') ? 'RUNBOOK.md' : null,
    evidence: {
      bytes: bytes('RUNBOOK.md'),
      procedures: (read('RUNBOOK.md') ?? '').split('\n').filter((l) => /^## /.test(l)).length,
    },
  },
  {
    id: 'i5',
    name: 'The viewer, plus its input contract',
    status: !viewerContract ? 'absent' : viewer?.includes('iphone-viewer-contract') ? 'present' : 'partial',
    home: viewerContract ? 'components/iphone-viewer-contract.ts' : null,
    evidence: {
      requiredNodes,
      viewerImportsIt: Boolean(viewer?.includes('iphone-viewer-contract')),
    },
  },
  {
    id: 'i6',
    name: 'The run record',
    status: runsLog.length === 0 ? 'absent' : runsLog.length < 2 ? 'partial' : 'present',
    home: runsLog.length ? 'tokens/runs.log' : null,
    evidence: {
      lines: runsLog.length,
      first: runsLog[0]?.split(/\s\s+/)[0] ?? null,
      last: runsLog.at(-1)?.split(/\s\s+/)[0] ?? null,
    },
  },
]

const output = {
  $schema: './dipstick.schema.json',
  $exported: stamp,
  $description:
    'Machine-written state export for Ame: 7 constraint deliverables and 6 instrument deliverables, measured, with the verdict of the one judge (tokens/check.mjs). Nothing here was typed by hand.',
  system: manifest
    ? { name: manifest.name, version: manifest.version, format: manifest.format }
    : { name: 'ame', version: 'unversioned' },
  verdict: {
    command: 'node tokens/check.mjs --no-log',
    exit: run.status ?? 1,
    mode: 'full',
    drift: driftFromCheck,
  },
  constraints,
  instruments,
  jsonld: {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: 'ame',
    version,
    dateCreated: stamp,
    programmingLanguage: 'TypeScript',
    description:
      'Design token system state export: 7 constraint deliverables, 6 instrument deliverables, measured.',
  },
}

// ── self-validation (subset of draft 2020-12) ───────────────────────────────
/*
  Zero dependencies, so this enforces the subset the schema actually uses:
  required, type, enum, minItems/maxItems, and $defs/$ref. Full draft 2020-12
  conformance is available to any external validator; the schema file stays the
  single home of the shape, and this reads it rather than restating it.
*/
const schema = readJson('tokens/dipstick.schema.json')
const errors = []

function validate(node, sch, path) {
  if (sch.$ref) return validate(node, resolveRef(sch.$ref), path)
  if (sch.type) {
    const types = Array.isArray(sch.type) ? sch.type : [sch.type]
    const actual =
      node === null ? 'null' : Array.isArray(node) ? 'array' : Number.isInteger(node) ? 'integer' : typeof node
    const ok = types.some((t) => t === actual || (t === 'number' && actual === 'integer'))
    if (!ok) errors.push(`${path}: expected ${types.join('|')}, got ${actual}`)
  }
  if (sch.enum && !sch.enum.includes(node)) errors.push(`${path}: ${JSON.stringify(node)} not in ${sch.enum.join('|')}`)
  if (sch.pattern && typeof node === 'string' && !new RegExp(sch.pattern).test(node))
    errors.push(`${path}: ${JSON.stringify(node)} does not match ${sch.pattern}`)
  if (Array.isArray(node)) {
    if (sch.minItems !== undefined && node.length < sch.minItems)
      errors.push(`${path}: ${node.length} items, minimum ${sch.minItems}`)
    if (sch.maxItems !== undefined && node.length > sch.maxItems)
      errors.push(`${path}: ${node.length} items, maximum ${sch.maxItems}`)
    if (sch.items) node.forEach((item, i) => validate(item, sch.items, `${path}[${i}]`))
  }
  if (node && typeof node === 'object' && !Array.isArray(node)) {
    for (const key of sch.required ?? [])
      if (!(key in node)) errors.push(`${path}: missing required field "${key}"`)
    if (sch.additionalProperties === false)
      for (const key of Object.keys(node))
        if (!(sch.properties ?? {})[key]) errors.push(`${path}: unexpected field "${key}"`)
    for (const [key, sub] of Object.entries(sch.properties ?? {}))
      if (key in node) validate(node[key], sub, path ? `${path}.${key}` : key)
  }
}
const resolveRef = (ref) =>
  ref
    .replace(/^#\//, '')
    .split('/')
    .reduce((o, k) => o[k], schema)

validate(output, schema, '')

if (errors.length) {
  console.error('dipstick: the assembled export does not satisfy dipstick.schema.json. Nothing written.')
  for (const e of errors) console.error('  ' + e)
  process.exit(1)
}

// ── write, and only this ────────────────────────────────────────────────────
const basic = stamp.replace(/[-:]/g, '')
const dir = join(ROOT, 'dipstick')
mkdirSync(dir, { recursive: true })
const file = join(dir, `dipstick.${basic}.ame@${version}.json`)
writeFileSync(file, JSON.stringify(output, null, 2) + '\n')

console.log(`tokens/dipstick/dipstick.${basic}.ame@${version}.json`)
for (const e of [...constraints, ...instruments])
  console.log(`  ${e.id}  ${e.status.padEnd(7)} ${e.name}${e.home ? '' : '  (no home)'}`)
