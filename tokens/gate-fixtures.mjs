#!/usr/bin/env node
/*
  The gate, run against the world that should break it.

  check.mjs proves the tree is clean. That is only half an argument: a gate
  nobody has watched fail is indistinguishable from a gate that cannot fail.
  This runs check.mjs with examples/violating in scope and passes only when the
  gate rejected it, naming every clause that was supposed to fire.

  The inversion lives here and nowhere else. check.mjs --fixtures widens a scan
  list and is otherwise the same gate reaching the same verdict; this file is
  what turns "the gate said FAIL" into "the fixture run says PASS". Keeping the
  two apart means the gate has no mode in which failing is success.

  What must fire is data, not prose: invariants.json > fixtures.expect. Adding a
  clause to the fixture's claim is an invariants edit.

  Run:  node tokens/gate-fixtures.mjs      (pnpm gate:fixtures)
  Exit: 0 the gate rejected the fixture, for the stated reasons
        1 the gate passed it, or missed a clause, or fired for the wrong one
*/
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const RULES = JSON.parse(readFileSync(join(ROOT, 'invariants.json'), 'utf8'))
const { violating, expect } = RULES.fixtures

const run = spawnSync(process.execPath, [join(ROOT, 'check.mjs'), '--fixtures', '--no-log'], {
  encoding: 'utf8',
})
const out = (run.stdout ?? '') + (run.stderr ?? '')

const problems = []

// 1. The verdict itself. A zero exit here means the fixture stopped violating,
//    or a clause stopped catching it. Either way the claim is no longer proven.
if (run.status === 0)
  problems.push(
    `the gate PASSED ${violating}. Every mistake in that directory is deliberate; if the gate no longer sees them, the gate regressed. Do not "fix" the fixture.`,
  )

// 2. The stated violations. Matched at the start of a report line so a clause id
//    mentioned inside another clause's remedy text cannot count as a firing.
const violationsBlock = out.slice(out.lastIndexOf('VIOLATIONS'))
for (const id of expect.violations)
  if (!new RegExp('^\\s+' + id + '\\s', 'm').test(violationsBlock))
    problems.push(`${id} did not fire. invariants.json > fixtures.expect.violations says it must.`)

// 3. The stated drift. A counter that did not grow past its baseline means the
//    fixture's off-scale or restated value went unmeasured.
for (const id of expect.drift_grows)
  if (!new RegExp('^\\s+' + id + ':\\s+\\d+\\s+GREW', 'm').test(out))
    problems.push(`${id} did not grow past its baseline. invariants.json > fixtures.expect.drift_grows says it must.`)

// 4. Work order 2.2: the failure must name the raw value it found, not merely
//    report that something is wrong. A reader who cannot see the literal cannot
//    act on the message.
/*
  The line must name the VIOLATING FIXTURE, not merely exist. This tree carries
  restated values of its own, and one of those satisfying this check would prove
  nothing about the fixture — the run would pass while the thing it exists to
  demonstrate went uncaught.
*/
const restatedLine = out
  .split('\n')
  .find((l) => /^\s+D2 restated: /.test(l) && l.includes(violating))
if (!restatedLine) problems.push('D2 reported no restated value, so no raw literal was named.')
else if (!/"[^"]*\d[^"]*"/.test(restatedLine))
  problems.push(`D2 fired without naming the literal it found: ${restatedLine.trim()}`)

// ── Report ──────────────────────────────────────────────────────────────────
if (problems.length) {
  console.log(`gate:fixtures  FAIL  (${violating})\n`)
  for (const p of problems) console.log('  ' + p)
  console.log('\nThe gate run it is judging:\n')
  console.log(out.replace(/^/gm, '  '))
  process.exit(1)
}

console.log(`gate:fixtures  PASS  (${violating})\n`)
console.log('  The gate rejected the disconfirming fixture, for the stated reasons:')
for (const id of expect.violations) console.log(`    ${id}   violation fired`)
for (const id of expect.drift_grows) console.log(`    ${id}   drift grew past baseline`)
console.log(`\n  ${restatedLine.trim()}`)
