// Regenerate components/ame/icons/icon-data.ts from the committed icon source
// (components/ame/icons/icon-source.html, the storybook export of the ame line
// icons). Each SVG is normalised to inherit `currentColor` so an icon takes the
// ame text colour at its call site. Run: node scripts/parse-ame-icons.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(root, 'components/ame/icons/icon-source.html')
const OUT = path.join(root, 'components/ame/icons/icon-data.ts')

let html = fs.readFileSync(SRC, 'utf8')
const start = html.indexOf('<div>')
if (start >= 0) html = html.slice(start)

const iconRe = /<svg\b([^>]*)>([\s\S]*?)<\/svg>\s*<div class="storybook-icon__text">([^<]+)<\/div>/g
const icons = {}
const order = []
for (const m of html.matchAll(iconRe)) {
  const attrs = m[1]
  let inner = m[2]
  const name = m[3].trim()
  const vb = attrs.match(/viewBox="([^"]+)"/)
  const viewBox = vb ? vb[1] : '0 0 24 24'
  inner = inner
    .replace(/\s+xmlns="[^"]*"/g, '')
    .replace(/\s+fill="(?:black|#000000|#000)"/gi, '')
    .replace(/\s+fill="(?:white|#ffffff|#fff)"/gi, ' fill="currentColor"')
    .replace(/\s+stroke="(?:white|black|#ffffff|#000000|#fff|#000)"/gi, ' stroke="currentColor"')
    .replace(/\s+enable-background="[^"]*"/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/>\s+</g, '><')
    .trim()
  if (!icons[name]) {
    order.push(name)
    icons[name] = { viewBox, inner }
  }
}

const entries = order
  .map((n) => `  ${JSON.stringify(n)}: { viewBox: ${JSON.stringify(icons[n].viewBox)}, path: ${JSON.stringify(icons[n].inner)} },`)
  .join('\n')

const out = `// GENERATED from components/ame/icons/icon-source.html (the ame icon set, a
// storybook export). Do not edit by hand: the shapes are the brand's own line
// icons. Each entry is a viewBox and the raw inner SVG markup, normalised to
// inherit \`currentColor\` so the icon takes the ame text colour at its call site.
// Regenerate with: node scripts/parse-ame-icons.mjs
//
// ${order.length} icons.

export type AmeIconGlyph = { viewBox: string; path: string }

export const AME_ICON_DATA: Record<string, AmeIconGlyph> = {
${entries}
}

export type AmeIconName = keyof typeof AME_ICON_DATA
export const AME_ICON_NAMES = Object.keys(AME_ICON_DATA) as AmeIconName[]
`

/*
  --check: fail if the committed file disagrees with a fresh generation.

  icon-data.ts is generated, committed, and was the one generated artifact in the
  tree with no byte check (STANDARD V3 requires one, and six others have it). Its
  generator was also invoked by nothing, so a hand edit to 218 glyphs of
  third-party path data was undetectable -- in the file whose provenance the MIT
  notice in THIRD-PARTY-NOTICES depends on being accurate.
*/
if (process.argv.includes('--check')) {
  const committed = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : ''
  if (committed !== out) {
    console.error('icons: committed icon-data.ts disagrees with a fresh parse of icon-source.html.')
    console.error('Run: node scripts/parse-ame-icons.mjs')
    process.exit(1)
  }
  console.log(`icons parity PASS: ${order.length} glyphs match icon-source.html.`)
} else {
  fs.writeFileSync(OUT, out)
  console.log(`wrote ${order.length} icons to ${path.relative(root, OUT)}`)
}
