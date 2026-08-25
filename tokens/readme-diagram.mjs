#!/usr/bin/env node
/*
  The README's architecture diagram, generated.

  A README on GitHub cannot mount a React component, so this draws the same
  picture the FlowchartSheet draws, from the same two sources it reads:

    · the ISO 5807:1985 symbol geometry implemented in
      components/ame/flowchart-sheet.tsx — process 9.2.1, predefined process
      9.2.2.1, document 9.1.2.4, terminator 9.4, flow line 9.3.1, and the
      dashed feedback line 9.3.2.3
    · the token values themselves, resolved through buildTokens, so the
      diagram's ink, brand, and paper ARE the system's ink, brand, and paper

  That second half is the point. A hand-coloured diagram of a token system is a
  picture that can disagree with its subject; this one cannot, because the day a
  colour changes in base/color.json is the day this file emits a different SVG
  and --check goes red.

  Two files, light and dark, because the system carries both themes and the
  README uses <picture> to pick. The diagram demonstrating dual-theme tokens is
  itself dual-theme, which is cheaper than claiming it.

  Run:  node tokens/readme-diagram.mjs           write
        node tokens/readme-diagram.mjs --check   fail if the committed files differ
*/
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildTokens } from 'ame-tokens/build.mjs'

const ROOT = dirname(fileURLToPath(import.meta.url))
const REPO = join(ROOT, '..')

const { tokens } = buildTokens()
const value = (path) => {
  const t = tokens.find((x) => x.path === path)
  if (!t) throw new Error(`readme-diagram: token ${path} does not exist`)
  return t.css
}

/*
  The two palettes, each read from the tokens rather than typed. These are the
  same roles the component's defaultTheme binds through --port-* aliases; here
  they are resolved, because an SVG in a README has no token scope to inherit.
*/
const THEMES = {
  light: {
    ink: value('text.body'),
    accent: value('text.brand'),
    muted: value('text.secondary'),
    paper: value('background.page'),
  },
  dark: {
    ink: value('text.body-on-dark'),
    accent: value('text.brand'),
    muted: value('text.secondary-on-dark'),
    paper: value('background.ink'),
  },
}

const W = 900
const H = 300
const FONT = 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif'

// ── ISO 5807 symbols, the same geometry flowchart-sheet.tsx draws ───────────
const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const label = (cx, cy, lines, t, { size = 13, weight = 400, fill } = {}) =>
  lines
    .map((ln, i) =>
      `<text x="${cx}" y="${cy + (i - (lines.length - 1) / 2) * (size + 4)}" font-size="${size}" ` +
      `font-family="${FONT}" font-weight="${weight}" text-anchor="middle" dominant-baseline="central" ` +
      `fill="${fill ?? t.ink}">${escape(ln)}</text>`,
    )
    .join('')

/** 9.2.1 process — a rectangle. Named processBox because `process` is Node`s. */
const processBox = (x, y, w, h, lines, t, accent) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${accent ? t.accent : t.muted}" ` +
  `stroke-width="${accent ? 2 : 1}"/>` + label(x + w / 2, y + h / 2, lines, t)

/** 9.2.2.1 predefined process — a process with a bar inside each vertical edge. */
const predefined = (x, y, w, h, lines, t, accent) =>
  processBox(x, y, w, h, lines, t, accent) +
  `<line x1="${x + 7}" y1="${y}" x2="${x + 7}" y2="${y + h}" stroke="${accent ? t.accent : t.muted}" stroke-width="${accent ? 2 : 1}"/>` +
  `<line x1="${x + w - 7}" y1="${y}" x2="${x + w - 7}" y2="${y + h}" stroke="${accent ? t.accent : t.muted}" stroke-width="${accent ? 2 : 1}"/>`

/** 9.1.2.4 document — a rectangle whose lower edge is a wave. */
const document_ = (x, y, w, h, lines, t) =>
  `<path d="M ${x},${y} L ${x + w},${y} L ${x + w},${y + h - 8} ` +
  `C ${x + w - w * 0.28},${y + h - 22} ${x + w * 0.3},${y + h + 12} ${x},${y + h - 4} Z" ` +
  `fill="none" stroke="${t.muted}" stroke-width="1"/>` + label(x + w / 2, y + h / 2 - 4, lines, t)

/** 9.3.1 flow line, and 9.3.2.3 its dashed feedback counterpart. */
const flow = (x1, y1, x2, y2, t, { dashed = false, accent = false } = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${accent ? t.accent : t.muted}" ` +
  `stroke-width="${accent ? 1.5 : 1}"${dashed ? ' stroke-dasharray="6 5"' : ''} marker-end="url(#arr${accent ? '-a' : ''})"/>`

const caption = (x, y, text, t) =>
  `<text x="${x}" y="${y}" font-size="11" font-family="${FONT}" text-anchor="middle" fill="${t.muted}">${escape(text)}</text>`

function render(t) {
  const y = 96
  const h = 62
  const boxes = [
    { x: 24, w: 150, lines: ['base', 'literals'] },
    { x: 214, w: 150, lines: ['semantic', 'roles'] },
    { x: 404, w: 150, lines: ['component', 'measures'] },
  ]
  const out = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" ` +
      `aria-label="Ame architecture: three token layers compile to tokens.css, and the gate rejects raw values, layer leaks, and contrast failures.">`,
    `<defs>`,
    `<marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">` +
      `<path d="M0,0 L10,5 L0,10 z" fill="${t.muted}"/></marker>`,
    `<marker id="arr-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">` +
      `<path d="M0,0 L10,5 L0,10 z" fill="${t.accent}"/></marker>`,
    `</defs>`,
    `<rect width="${W}" height="${H}" fill="${t.paper}"/>`,
    `<text x="24" y="34" font-size="14" font-family="${FONT}" fill="${t.ink}">Ame</text>`,
    `<text x="24" y="54" font-size="11" font-family="${FONT}" fill="${t.muted}">Convention: ISO 5807-1985</text>`,
    `<line x1="24" y1="68" x2="${W - 24}" y2="68" stroke="${t.muted}" stroke-width="0.5" opacity="0.4"/>`,
  ]

  for (const b of boxes) out.push(processBox(b.x, y, b.w, h, b.lines, t))
  out.push(flow(174, y + h / 2, 210, y + h / 2, t))
  out.push(flow(364, y + h / 2, 400, y + h / 2, t))

  // The emitted artifact: a document, because it is the readable output.
  out.push(document_(596, y, 170, h, ['tokens.css'], t))
  out.push(flow(554, y + h / 2, 592, y + h / 2, t))

  // The gate: a predefined process, because it is a procedure defined elsewhere
  // — in contract.md, invariants.json, and check.mjs.
  out.push(predefined(404, 214, 362, 54, ['the gate'], t, true))
  out.push(flow(681, 214, 681, y + h + 4, t, { dashed: true, accent: true }))
  out.push(caption(W / 2 - 12, 292, 'rejects raw values, layer leaks, contrast failures', t))

  out.push(`</svg>`)
  return out.join('\n') + '\n'
}

const files = Object.entries(THEMES).map(([name, t]) => [`docs/architecture-${name}.svg`, render(t)])

if (process.argv.includes('--check')) {
  const stale = files.filter(([rel, svg]) => {
    let on = ''
    try {
      on = readFileSync(join(REPO, rel), 'utf8')
    } catch {
      return true
    }
    return on !== svg
  })
  if (stale.length) {
    console.error('readme-diagram: the committed diagram disagrees with a fresh render:')
    for (const [rel] of stale) console.error('  ' + rel)
    console.error('Run: node tokens/readme-diagram.mjs')
    process.exit(1)
  }
  console.log(`readme-diagram parity PASS: ${files.length} file(s) match a fresh render.`)
} else {
  for (const [rel, svg] of files) {
    writeFileSync(join(REPO, rel), svg)
    console.log('  -> ' + rel)
  }
}
