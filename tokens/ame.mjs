#!/usr/bin/env node
/*
  The ame command. It routes, and routes only: any logic here would be a second
  home for something one of the targets already owns.

    node tokens/ame.mjs build     -> tokens/build.mjs
    node tokens/ame.mjs check     -> tokens/check.mjs   (flags passed through)
    node tokens/ame.mjs dipstick  -> tokens/dipstick.mjs
*/
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const TARGETS = { build: 'build.mjs', check: 'check.mjs', dipstick: 'dipstick.mjs' }

const [sub, ...flags] = process.argv.slice(2)
const target = TARGETS[sub]

if (!target) {
  console.error(`ame: unknown subcommand ${sub ? `"${sub}"` : '(none)'}`)
  console.error(`     valid: ${Object.keys(TARGETS).join(', ')}`)
  process.exit(1)
}

process.exit(spawnSync(process.execPath, [join(ROOT, target), ...flags], { stdio: 'inherit' }).status ?? 1)
