#!/usr/bin/env node
/*
  ame-tokens-check — the token contract a consumer runs in its own build.

  Run from a consumer's repo root (`npx ame-tokens-check`). It reads the token
  source shipped inside this package, so its verdict does not depend on the
  consumer having the source; it depends only on the installed package. Two
  things it proves:

    1. Artifact integrity (B4, B5). The installed tokens.css is a faithful build
       of the shipped source and carries the manifest version. A tampered or
       stale copy fails here, so a consumer binding these names is binding the
       definitions the package actually ships.

    2. Binding discipline (U1). The consumer's own CSS binds semantic and
       component names, never a raw base primitive. `var(--ame-color-ink)` in a
       surface is a raw-value binding; a semantic or theme name is what a surface
       is meant to read, and the failure message names two shipped ones.

  This is the portable subset. The portfolio's tokens/check.mjs enforces more
  against its own tree (the uses-graph, scale membership, the /ame docs
  registry, asset budgets), which is portfolio-specific and does not travel.
*/
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildTokens, buildRecipes, ARTIFACTS, manifest, deriveBaseNames } from './build.mjs'

const PKG = dirname(fileURLToPath(import.meta.url)) // this package, wherever installed
const CWD = process.cwd() // the consumer's repo
const fails = []
const fail = (id, msg) => fails.push(`${id}  ${msg}`)

const { tokens } = buildTokens() // reads the package's own shipped source
const compiled = buildRecipes()

/*
  ── B4, B5. The installed artifacts are faithful, stamped builds of the source ─

  ITERATE THE BUILD'S OWN MAP. This used to call `renderCss(tokens)` directly,
  which is a second implementation of "how an artifact is rendered", and it
  drifted the way a second copy always does: `renderCss` grew a `compiled`
  parameter when theme scopes landed, this call site did not, and the in-memory
  rebuild came out missing the [data-theme="dark"] block that the committed
  tokens.css contains. The byte-compare then failed on every healthy install,
  telling each consumer their package was corrupt.

  The failure was invisible here because nothing ran this file, and invisible to
  a consumer because it looked like a true verdict about their tree rather than
  a false one about ours. D-20 sanctioned this as the one re-implementation in
  the repo; ARTIFACTS is what makes it stop being one.

  It also now checks all four artifacts. Only tokens.css was ever compared, so
  recipes.css, tokens.mjs and tokens.d.ts could ship stale without a word.
*/
for (const [file, render] of Object.entries(ARTIFACTS)) {
  const p = join(PKG, file)
  if (!existsSync(p)) {
    fail('B4', `${file} is missing from the package`)
    continue
  }
  if (readFileSync(p, 'utf8') !== render({ tokens, compiled }))
    fail('B4', `${file} does not match a fresh build of the shipped source; the package is corrupt or stale`)
}

const cssPath = join(PKG, 'tokens.css')
if (existsSync(cssPath)) {
  const stamp = readFileSync(cssPath, 'utf8').split('\n')[0].match(/^\/\* ame@([0-9]+\.[0-9]+\.[0-9]+) /)
  if (!stamp) fail('B5', 'tokens.css carries no version header')
  else if (stamp[1] !== manifest.version)
    fail('B5', `tokens.css stamps ame@${stamp[1]} but the manifest declares ${manifest.version}`)
}

// ── U1. The consumer binds semantic and component names, never a raw base one ─
const base = deriveBaseNames(tokens)
const SKIP = new Set(['node_modules', '.next', '.git', 'dist', 'build', 'out', 'coverage'])
function cssFiles(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name) || (e.name.startsWith('.') && e.isDirectory())) continue
    const p = join(dir, e.name)
    if (e.isDirectory()) cssFiles(p, out)
    else if (e.name.endsWith('.css')) out.push(p)
  }
  return out
}
/*
  The two names the remedy offers, taken from the tokens actually shipped rather
  than typed in. It read "(e.g. --ame-text-body, --ame-text-body)" — one name
  printed twice where two examples were meant, which tells a reader the system
  has one answer when the point is that it has a layer of them.

  Derived for the same reason the README's figures are: an example spelled by
  hand outlives the token it names, and a remedy that points at a renamed token
  is worse than one that points at nothing.
*/
const semantic = tokens.map((t) => t.cssName).filter((n) => !base.has(n))
const pick = (re) => semantic.find((n) => re.test(n))
// One from each family, so the pair reads as a layer rather than a near-repeat.
const examples = [pick(/^--ame-text-/), pick(/^--ame-surface-/)].filter(Boolean)
const remedy = examples.length === 2 ? ` (e.g. ${examples[0]}, ${examples[1]})` : ''

for (const f of cssFiles(CWD)) {
  const src = readFileSync(f, 'utf8')
  // A generated ame token file declares base names; it is not a consumer
  // binding them, so skip it (identified by the ame version header).
  if (/^\/\* ame@/.test(src)) continue
  const rel = f.slice(CWD.length + 1)
  for (const m of src.matchAll(/var\((--[a-z0-9_-]+)/g))
    if (base.has(m[1]))
      fail('U1', `${rel} binds base token ${m[1]} directly; bind a semantic or theme name${remedy}, never a base primitive.`)
}

// ── verdict ──────────────────────────────────────────────────────────────────
if (fails.length) {
  console.error(`ame-tokens-check FAIL (${fails.length})\n` + fails.map((f) => '  ' + f).join('\n'))
  process.exit(1)
}
console.log(`ame-tokens-check PASS   ame@${manifest.version}   ${tokens.length} tokens, no raw base binding`)
