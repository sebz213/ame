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
       surface is a raw-value binding; the semantic or theme name (--ame-text-body,
       --ame-text-body) is what a surface is meant to read.

  This is the portable subset. The portfolio's tokens/check.mjs enforces more
  against its own tree (the uses-graph, scale membership, the /ame docs
  registry, asset budgets), which is portfolio-specific and does not travel.
*/
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildTokens, renderCss, manifest, deriveBaseNames } from './build.mjs'

const PKG = dirname(fileURLToPath(import.meta.url)) // this package, wherever installed
const CWD = process.cwd() // the consumer's repo
const fails = []
const fail = (id, msg) => fails.push(`${id}  ${msg}`)

const { tokens } = buildTokens() // reads the package's own shipped source

// ── B4, B5. The installed artifact is a faithful, stamped build of the source ─
const cssPath = join(PKG, 'tokens.css')
if (!existsSync(cssPath)) {
  fail('B4', 'tokens.css is missing from the package')
} else {
  const committed = readFileSync(cssPath, 'utf8')
  if (renderCss(tokens) !== committed)
    fail('B4', 'tokens.css does not match a fresh build of the shipped source; the package is corrupt or stale')
  const stamp = committed.split('\n')[0].match(/^\/\* ame@([0-9]+\.[0-9]+\.[0-9]+) /)
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
for (const f of cssFiles(CWD)) {
  const src = readFileSync(f, 'utf8')
  // A generated ame token file declares base names; it is not a consumer
  // binding them, so skip it (identified by the ame version header).
  if (/^\/\* ame@/.test(src)) continue
  const rel = f.slice(CWD.length + 1)
  for (const m of src.matchAll(/var\((--[a-z0-9_-]+)/g))
    if (base.has(m[1]))
      fail('U1', `${rel} binds base token ${m[1]} directly; bind a semantic or theme name (e.g. --ame-text-body, --ame-text-body), never a base primitive.`)
}

// ── verdict ──────────────────────────────────────────────────────────────────
if (fails.length) {
  console.error(`ame-tokens-check FAIL (${fails.length})\n` + fails.map((f) => '  ' + f).join('\n'))
  process.exit(1)
}
console.log(`ame-tokens-check PASS   ame@${manifest.version}   ${tokens.length} tokens, no raw base binding`)
