#!/usr/bin/env node
/*
  Extract the published package from this monorepo.

  This used to be surgery. Copy the token layer, run the gate, and cut every
  clause that turned out to have no subject in the copy — one at a time, by
  judgment, with the cut list growing as the contract grew. It was done twice.
  The second pass hit 35 violations and couplings the first had not: the
  resolver check legitimately belongs to the package while the recipe-to-element
  mapping does not, and telling them apart was a decision rather than a lookup.

  It is a selection now. Every clause declares the surface it governs
  (invariants.json > census.clauses[id].scope) and the package declares what it
  is made of (package_manifest.paths). This script copies the manifest and
  nothing else; the gate is then run with `--scope package`, and the clauses
  whose subject stayed behind do not run because they said so, not because
  someone remembered to delete them.

  ONE INSTRUMENT JUDGES THE OUTPUT, and it is not this file: a fresh clone of
  the result must go green on `pnpm gate --scope package`. That is why --verify
  exists and why it runs the gate from the extracted tree rather than this one.

  Run:  node tokens/extract.mjs --out <dir>
        node tokens/extract.mjs --out <dir> --verify
*/
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const REPO = join(ROOT, '..')
const RULES = JSON.parse(readFileSync(join(ROOT, 'invariants.json'), 'utf8'))

const arg = (name) => {
  const i = process.argv.indexOf(name)
  return i === -1 ? null : process.argv[i + 1]
}
const OUT = arg('--out')
if (!OUT) {
  console.error('extract: --out <dir> is required')
  process.exit(2)
}
const VERIFY = process.argv.includes('--verify')

/*
  --against <dir>: the published tree this extraction is about to replace.

  WHY. The manifest is a list of what travels. It is silent about what is
  already there, and a sync overwrites a whole tree, so anything the package
  holds that the manifest forgot to name is deleted without a word. That is not
  hypothetical: the fixtures went that way once (D-82), and docs/ held two
  documents PROVENANCE.md cites as its evidence which the next sync would have
  removed while leaving the citations pointing at them.

  Both were found by a person looking, which is the wrong instrument. A deletion
  is the one edit a manifest cannot express by omission, because omission is
  also how it expresses 'not mine'. So the extraction has to be shown the tree
  it is replacing and made to account for the difference.

  Deleting is allowed — files do leave. It has to be said out loud with
  --allow-delete, which is a sentence in a commit message rather than a silence.
*/
const AGAINST = arg('--against')
const ALLOW_DELETE = process.argv.includes('--allow-delete')
if (AGAINST && !VERIFY) {
  // pnpm-lock.yaml is written by the install inside --verify, so an unverified
  // tree is missing a file the package legitimately ships. Accounting for it
  // then would report a deletion that is only an artefact of stopping early.
  console.error('extract: --against requires --verify; only a verified tree is a complete one')
  process.exit(2)
}

const manifest = RULES.package_manifest?.paths ?? []
if (!manifest.length) {
  console.error('extract: package_manifest.paths is empty; there is nothing to extract')
  process.exit(1)
}

// ── Copy exactly what the manifest names ────────────────────────────────────
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

let copied = 0
const missing = []
for (const p of manifest) {
  const from = join(REPO, p)
  if (!existsSync(from)) { missing.push(p); continue }
  const to = join(OUT, p)
  mkdirSync(dirname(to), { recursive: true })
  cpSync(from, to, {
    recursive: true,
    // runs.log is the monorepo gate's memory. X1 reads a baseline against the
    // last logged run, so carrying it would have the package judged against
    // runs that measured a different tree. The package starts its own log.
    filter: (src) => !src.split(sep).join('/').endsWith('tokens/runs.log'),
  })
  copied++
}
if (missing.length) {
  // A manifest naming something absent would silently shrink the package, which
  // is the class of failure the whole scope design exists to end.
  console.error(`extract: package_manifest names paths that are not in the tree:\n  ${missing.join('\n  ')}`)
  process.exit(1)
}

/*
  Paratext: the README, the contributing guide and the provenance note. They are
  written here under docs/package/ because this repo has a README of its own,
  and published at the package's root. Owned by this repo on purpose — the
  version that lived only in the published one said 264 tokens over a tree
  holding 339, because nothing here could see it to check it.
*/
for (const [from, to] of Object.entries(RULES.package_manifest?.paratext ?? {})) {
  if (from.startsWith('$')) continue // a note in the map, not a path
  const src = join(REPO, from)
  if (!existsSync(src)) {
    console.error(`extract: paratext names ${from}, which is not in the tree`)
    process.exit(1)
  }
  const dest = join(OUT, to)
  mkdirSync(dirname(dest), { recursive: true })
  cpSync(src, dest)
}

/*
  The package's own package.json. Not copied from the monorepo, because the
  monorepo's names the app's dependencies and its scripts run a Next build the
  package has no app for. Built here from what the package actually needs, so
  the two cannot drift: the scripts are the gate and its parts, and the gate
  runs in package scope by default because that is the only scope this tree has.
*/
const mono = JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8'))
const pkg = {
  name: 'ame',
  version: JSON.parse(readFileSync(join(REPO, 'packages/ame-tokens/ame.json'), 'utf8')).version,
  description:
    'A design token system with an enforcement gate: DTCG tokens compiled to CSS custom properties, and a CI check that fails any build where a scanned surface hand-writes a value the tokens already own.',
  license: 'Apache-2.0',
  private: true,
  packageManager: mono.packageManager,
  scripts: {
    ame: 'node tokens/ame.mjs',
    'tokens:build': 'node packages/ame-tokens/build.mjs',
    gate: 'node tokens/check.mjs --scope package',
    'gate:fixtures': 'node tokens/gate-fixtures.mjs',
    diagram: 'node tokens/readme-diagram.mjs',
    'diagram:check': 'node tokens/readme-diagram.mjs --check',
    numbers: 'node tokens/readme-numbers.mjs',
    'numbers:check': 'node tokens/readme-numbers.mjs --check',
    lint: 'eslint components lib tokens/*.mjs packages/ame-tokens/*.mjs',
    typecheck: 'tsc --noEmit',
    test: 'vitest run',
    build: 'pnpm tokens:build && pnpm diagram:check && pnpm numbers:check && pnpm gate && pnpm gate:fixtures',
  },
  dependencies: {
    'ame-tokens': 'workspace:*',
    animejs: mono.dependencies?.animejs ?? '^4.5.0',
    'lucide-react': mono.dependencies?.['lucide-react'] ?? '^0.564.0',
    react: mono.dependencies?.react ?? '19.2.4',
  },
  devDependencies: Object.fromEntries(
    ['@eslint/js', '@types/node', '@types/react', 'eslint', 'eslint-plugin-jsx-a11y', 'typescript', 'typescript-eslint', 'vitest']
      .filter((d) => mono.devDependencies?.[d])
      .map((d) => [d, mono.devDependencies[d]]),
  ),
}
writeFileSync(join(OUT, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')

/*
  Every text file checks out LF. Clause B4 byte-compares the committed
  tokens.css against a fresh build, and the build emits LF; without this a
  Windows clone converts the committed file and B4 fails on a tree nobody
  touched. Found by running the smoke test on a stranger's machine rather than
  by reasoning about it.
*/
writeFileSync(
  join(OUT, '.gitattributes'),
  '# Every text file checks out with LF, on every platform. Clause B4 byte-compares\n' +
    '# a generated file; a CRLF checkout fails it on a tree nobody touched.\n' +
    '* text=auto eol=lf\n',
)

/*
  The package's CI, written rather than copied.

  The monorepo's workflow names scripts the package does not have — a docs
  generator with no docs site, the woven feature, a shipped check over an app
  tree it has none of — and clause W1 would rightly fail on every one. Writing it
  here keeps the steps and the scripts they name in one hand, which is the same
  reason the package.json above is written rather than copied.
*/
mkdirSync(join(OUT, '.github/workflows'), { recursive: true })
writeFileSync(
  join(OUT, '.github/workflows/code.yml'),
  `# The gate, on every push and pull request.
#
# Extracted from the monorepo by tokens/extract.mjs. Every step names a
# package.json script, and clause W1 checks that each one still resolves to a
# file in the tree — so a script renamed upstream turns this red rather than
# failing at first push.
name: code

on:
  push:
  pull_request:

# CI reads the tree and nothing else (clause W2).
permissions:
  contents: read

jobs:
  code:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # No version here: the action reads packageManager from package.json, so
      # the version has one home and CI cannot drift onto a different pnpm.
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --no-frozen-lockfile
      - name: tokens build
        run: pnpm tokens:build
      # The README diagram is generated from the token values: committed so
      # GitHub can render it, checked so it cannot disagree with the tokens.
      - name: diagram parity
        run: pnpm diagram:check
      # Every figure in the README is generated from the tree. This is what
      # stops a published number outliving the thing it counts.
      - name: numbers parity
        run: pnpm numbers:check
      - name: gate
        run: pnpm gate
      # The other half: the same gate against examples/violating, green only
      # when it was rejected. A clause that stops catching turns CI red.
      - name: gate on fixtures
        run: pnpm gate:fixtures
      - name: lint
        run: pnpm lint
      - name: typecheck
        run: pnpm typecheck
      - name: test
        run: pnpm test

  # The sign-off, checked rather than requested.
  #
  # CONTRIBUTING asks every commit to certify the DCO. A requirement nobody
  # verifies is a request, and this repository's whole argument is that the
  # difference matters -- so it runs.
  #
  # Only on pull_request, and only over the commits the PR actually adds:
  # history predates the requirement and rewriting it to comply would be
  # dishonest about when the rule started.
  dco:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: every commit is signed off
        run: |
          base=\${{ github.event.pull_request.base.sha }}
          head=\${{ github.event.pull_request.head.sha }}
          missing=0
          while read -r sha; do
            [ -z "$sha" ] && continue
            if ! git log -1 --format=%B "$sha" | grep -qiE '^Signed-off-by: .+ <.+@.+>'; then
              echo "::error::$sha is not signed off"
              git log -1 --format='  %h %s' "$sha"
              missing=1
            fi
          done < <(git rev-list "$base".."$head")
          if [ "$missing" = 1 ]; then
            echo ""
            echo "Every commit must certify the DCO. Add a sign-off with:"
            echo "  git commit -s          (new commits)"
            echo "  git rebase --signoff $base   (existing ones)"
            echo ""
            echo "The DCO file at the repository root is what you are certifying."
            exit 1
          fi
          echo "All commits signed off."
`,
)

console.log(`extract: ${copied} manifest paths -> ${OUT}`)

if (!AGAINST) {
  /*
    A guard nobody is required to pass is a guard that gets skipped, which is the
    same shape as the failure it was built for one level up. There is no runbook
    for the sync, so the person doing it types the flags they remember, and
    --against is the one they will not.

    It stays optional, because extracting to look at the result is a real use and
    should not need a clone of the published tree. It does not stay quiet.
  */
  console.log('')
  console.log('extract: NOT CHECKED AGAINST THE PUBLISHED TREE.')
  console.log('  A file the manifest forgot to name is deleted by the sync without a word,')
  console.log('  and omission is also how the manifest says "not mine", so the two are')
  console.log('  indistinguishable from in here (D-84). Before pushing a sync, run:')
  console.log('')
  console.log('    git clone --branch main <package remote> /tmp/published')
  console.log(`    node tokens/extract.mjs --out ${OUT} --against /tmp/published --verify`)
  console.log('')
}

if (!VERIFY) {
  console.log('extract: run with --verify to prove the result, or check it out and run `pnpm install && pnpm gate`')
  process.exit(0)
}

// ── The only instrument that judges this ────────────────────────────────────
console.log('extract: verifying — pnpm install, then the gate in package scope')
const run = (cmd, args) => spawnSync(cmd, args, { cwd: OUT, encoding: 'utf8', shell: process.platform === 'win32' })

const install = run('pnpm', ['install', '--no-frozen-lockfile'])
if (install.status !== 0) {
  console.error('extract: install failed in the extracted tree')
  console.error((install.stderr || install.stdout || '').split('\n').slice(-12).join('\n'))
  process.exit(1)
}
const build = run('node', ['packages/ame-tokens/build.mjs'])
if (build.status !== 0) {
  console.error('extract: the token build failed in the extracted tree')
  console.error((build.stderr || build.stdout || '').split('\n').slice(-12).join('\n'))
  process.exit(1)
}
const gate = run('node', ['tokens/check.mjs', '--scope', 'package', '--no-log'])
console.log((gate.stdout || '').split('\n').slice(-24).join('\n'))
if (gate.status !== 0) {
  console.error('\nextract: FAILED — the extracted tree does not pass its own gate.')
  console.error('Every violation above is either a clause that should be scoped portfolio,')
  console.error('or a path the manifest should carry. Both are one-line fixes in invariants.json.')
  process.exit(1)
}
/*
  The other half, run here for the same reason CI runs it: a gate that has never
  been seen to fail is indistinguishable from one that cannot, and the extraction
  is exactly where a clause quietly loses its subject.
*/
const fixtures = run('node', ['tokens/gate-fixtures.mjs'])
console.log((fixtures.stdout || '').trim())
if (fixtures.status !== 0) {
  console.error('\nextract: FAILED — the extracted tree does not reject its own violating fixture.')
  console.error('A clause that stopped catching is the one thing this cannot ship past.')
  process.exit(1)
}

// ── Account for what the published tree holds and this one would not ──────
if (AGAINST) {
  if (!existsSync(AGAINST)) {
    console.error(`extract: --against ${AGAINST} does not exist`)
    process.exit(2)
  }
  // Ask git, not the filesystem: the published tree's own ignores decide what
  // counts as content, so node_modules and build output never enter this.
  const tracked = spawnSync('git', ['ls-files'], { cwd: AGAINST, encoding: 'utf8', shell: process.platform === 'win32' })
  if (tracked.status !== 0) {
    console.error(`extract: --against ${AGAINST} is not a git checkout`)
    process.exit(2)
  }
  const there = tracked.stdout.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const wouldDelete = there.filter((f) => !existsSync(join(OUT, f)))

  if (wouldDelete.length) {
    const verb = ALLOW_DELETE ? 'removes' : 'would remove'
    console.log('')
    console.log(`extract: this sync ${verb} ${wouldDelete.length} file(s) the package currently has:`)
    for (const f of wouldDelete) console.log(`  - ${f}`)
    if (!ALLOW_DELETE) {
      console.error('')
      console.error('Refusing. Each of these is either something that should travel — name it')
      console.error('in package_manifest.paths — or something that should go, which is a')
      console.error('decision and is taken by passing --allow-delete. Silence is not one of')
      console.error('the options.')
      process.exit(1)
    }
  } else {
    console.log(`extract: accounts for all ${there.length} file(s) in the published tree; none dropped.`)
  }
}

console.log('\nextract: PASS — the extracted tree passes `gate --scope package` and rejects its violating fixture, on a clean install.')
