#!/usr/bin/env node
/*
  The package README's numbers, derived.

  WHY THIS EXISTS. The published README said 264 tokens, 394 emitted lines and
  50 dated decisions. The tree it shipped in held 339, 485 and 7. Every figure
  was printed beside the command that disproves it, and a reader — a person or
  an agent — has no reason to doubt a number with its measurement next to it, so
  all four were read straight back out as fact.

  Nothing caught it because the README was the one artefact the machinery did
  not own: it lived in the published repo, the extraction copied around it, and
  a sync that took the token count from 264 to 339 left the sentence saying 264.
  A claim true when written and false when shipped is the exact failure this
  system refuses everywhere else.

  So the numbers are generated between markers and checked in CI, the same
  arrangement the architecture diagram already has. A token added tomorrow
  either updates this block or turns the build red.

  Run:  node tokens/readme-numbers.mjs           write
        node tokens/readme-numbers.mjs --check   fail if the committed block is stale
*/
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const REPO = join(ROOT, '..')
/*
  The same README, in two places by design.

  This repo keeps the package's front door under docs/package/ because it has a
  README of its own; the extraction publishes it at the package root (the
  paratext map in package_manifest). One generator, so the figures cannot be
  generated one way here and another way there — it just has to find the file
  where each tree keeps it.
*/
const README = [join(REPO, 'docs/package/README.md'), join(REPO, 'README.md')].find((p) =>
  existsSync(p),
)
if (!README) {
  console.error('readme-numbers: no docs/package/README.md and no README.md')
  process.exit(2)
}

const START = '<!-- numbers:start -->'
const END = '<!-- numbers:end -->'

/*
  ── Measure ─────────────────────────────────────────────────────────────────
  Every figure comes from the command the table prints beside it, and from
  nothing else. Reading the token count out of build.mjs while telling the
  reader it came from `pnpm gate` would be a second home for the number and
  exactly the kind of gap that produced the stale table this replaces: the
  printed command has to be the one that produced the figure, or the citation
  is decoration.
*/
const css = readFileSync(join(REPO, 'packages/ame-tokens/tokens.css'), 'utf8')
const decisions = readFileSync(join(REPO, 'tokens/decisions.md'), 'utf8')

let gate
try {
  gate = execFileSync(process.execPath, [join(ROOT, 'check.mjs'), '--scope', 'package', '--no-log'], {
    cwd: REPO,
    encoding: 'utf8',
  }).toString()
} catch (e) {
  // The gate exits non-zero on drift growth. The reading it printed is still
  // the reading; only the verdict differs, and this file reports counts.
  gate = `${e.stdout ?? ''}${e.stderr ?? ''}`
}

const tokenCount = Number((gate.match(/tokens:\s*(\d+)/) ?? [, '0'])[1])
if (!tokenCount) {
  console.error('readme-numbers: the gate printed no token count; refusing to write a figure it did not measure')
  process.exit(2)
}
const contrastRows = gate.split('\n').filter((l) => /^ {2}C\d+(-dark)?\s+(pass|FAIL)/.test(l))
const contrastFailing = contrastRows.filter((l) => l.includes('FAIL')).length

const clientless = Number((gate.match(/^ {2}H1: (\d+)/m) ?? [, '0'])[1])

const today = new Date().toISOString().slice(0, 10)

const rows = [
  ['Tokens', String(tokenCount), '`pnpm gate` header'],
  [
    'Contrast pairs',
    `${contrastRows.length}, both themes, ${contrastFailing === 0 ? 'all passing their minimums' : `${contrastFailing} FAILING`}`,
    '`pnpm gate` contrast table',
  ],
  // wc -l counts newlines, so a file ending in one has a trailing empty split
  // that is not a line. The table cites wc -l, so it must equal wc -l.
  [
    'Emitted CSS',
    `${css.split('\n').length - (css.endsWith('\n') ? 1 : 0)} lines`,
    '`wc -l packages/ame-tokens/tokens.css`',
  ],
  ['Decisions', `${(decisions.match(/^## D-/gm) ?? []).length}, dated`, '`grep -c "^## D-" tokens/decisions.md`'],
  [
    'Tokens with no consumer here',
    `${clientless} of ${tokenCount}`,
    '`pnpm gate` H1 line',
  ],
]

const block = [
  START,
  '',
  `Measured on the tree that ships, ${today}, by the commands shown. This table is`,
  'generated from the tree and checked in CI (`pnpm numbers:check`), so a figure',
  'here cannot outlive the thing it counts.',
  '',
  '| | | |',
  '|---|---|---|',
  ...rows.map(([a, b, c]) => `| ${a} | ${b} | ${c} |`),
  '',
  END,
].join('\n')

const current = readFileSync(README, 'utf8')
const a = current.indexOf(START)
const b = current.indexOf(END)
if (a === -1 || b === -1) {
  console.error(`readme-numbers: ${README} has no ${START} / ${END} markers`)
  process.exit(2)
}
const next = current.slice(0, a) + block + current.slice(b + END.length)

if (process.argv.includes('--check')) {
  if (next !== current) {
    console.error('readme-numbers: the committed numbers disagree with the tree.')
    console.error('Run: node tokens/readme-numbers.mjs')
    process.exit(1)
  }
  console.log(`readme-numbers parity PASS: ${rows.length} figures match the tree.`)
} else {
  writeFileSync(README, next)
  console.log(`readme-numbers: wrote ${rows.length} figures to ${README.replace(REPO, ".")}`)
  for (const [a2, b2] of rows) console.log(`  ${a2.padEnd(30)}${b2}`)
}
