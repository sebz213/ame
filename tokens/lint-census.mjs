#!/usr/bin/env node
/*
  The lint warning census, ratcheted.

  WHY THIS EXISTS. tokens/lint-baseline.json has held a per-rule warning count
  since R-23 and NOTHING read it. Not check.mjs, not a workflow, not a script —
  the file's own description says the counts "only ever move down", and no
  instrument made that true. A baseline nobody compares against is a note.

  It was also wrong: it recorded 41 warnings measured over a narrower file set
  than the lint command actually covers. eslint was being handed
  packages/ame-tokens and packages/woven with no config block matching them, so
  they linted with zero rules and contributed zero warnings to a census that
  claimed to be the tree's. Widening the config (§7) revealed 73.

  That is a MEASUREMENT CHANGE, not a regression, and the two must not be
  confused: a ratchet that treats a wider lens as decay teaches people to raise
  baselines, which is the one thing it exists to prevent. So the widening is
  recorded once, here and in the baseline's own note, and from now the counts
  only fall.

  Run:  node tokens/lint-census.mjs           write the measured counts
        node tokens/lint-census.mjs --check    fail if any count grew
*/
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const REPO = join(ROOT, '..')
const BASELINE = join(ROOT, 'lint-baseline.json')

/*
  The paths come from package.json's own lint script, not from a second list.
  A census measured over a different set than the command lints is how the
  previous one drifted: two lists, one of them unread.
*/
const pkg = JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8'))
const targets = pkg.scripts.lint.replace(/^eslint\s+/, '').trim().split(/\s+/)

let out = ''
try {
  out = execFileSync('npx', ['eslint', ...targets, '-f', 'json'], {
    cwd: REPO,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    shell: process.platform === 'win32',
  })
} catch (e) {
  // eslint exits non-zero when it finds errors. The report it printed is still
  // the report, and this file counts warnings.
  out = String(e.stdout ?? '')
}

let report
try {
  report = JSON.parse(out)
} catch {
  console.error('lint-census: eslint produced no JSON report; refusing to write a census it did not measure')
  process.exit(2)
}

const counts = {}
let total = 0
for (const file of report)
  for (const m of file.messages) {
    if (m.severity !== 1) continue
    counts[m.ruleId] = (counts[m.ruleId] ?? 0) + 1
    total++
  }
counts.total = total

const prev = JSON.parse(readFileSync(BASELINE, 'utf8'))
const note = prev.$description

if (process.argv.includes('--check')) {
  const grew = Object.entries(counts).filter(([k, v]) => typeof prev[k] === 'number' && v > prev[k])
  if (grew.length) {
    console.error('lint-census FAIL: a warning count grew.')
    for (const [k, v] of grew) console.error(`  ${k}: ${v}, above the ${prev[k]} in tokens/lint-baseline.json`)
    console.error('\nFix the warning, or if the count genuinely earned its rise, say why in the baseline.')
    process.exit(1)
  }
  const fell = Object.entries(counts).filter(([k, v]) => typeof prev[k] === 'number' && v < prev[k])
  console.log(
    `lint-census PASS: ${total} warnings, none above baseline` +
      (fell.length ? `; ${fell.length} rule(s) fell and can be ratcheted` : ''),
  )
} else {
  writeFileSync(BASELINE, JSON.stringify({ $description: note, ...counts }, null, 2) + '\n')
  console.log(`lint-census: wrote ${Object.keys(counts).length - 1} rule(s), ${total} warnings`)
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(42)}${v}`)
}
