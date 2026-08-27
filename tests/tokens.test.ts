import { existsSync, readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { FLOWCHART_PRESETS } from '../components/ame/flowchart-presets'
// The token pipeline is untyped ESM JavaScript; TypeScript infers its types
// under allowJs. These are the pure, exported helpers check.mjs also imports.
import { resolveValue, toCss, buildTokens } from 'ame-tokens/build.mjs'
import { contrast } from '../tokens/contrast.mjs'
import { ratchetExceeded } from '../tokens/ratchet.mjs'
import { pqToNits, nitsToPq, hdrLuminance, exceedsReferenceWhite, REFERENCE_WHITE_NITS } from '../tokens/hdr.mjs'
import { ROOT_PROPS, DARK_REPOINTS } from 'ame-tokens/tokens.mjs'

// A tiny fixture document, the same shape build.mjs walks: base primitives and
// a semantic token that references one by name.
const navy = { $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0, 0.5] } }
const doc = {
  color: { navy: { 500: navy } },
  background: {
    // {curly} reference
    primary: { $type: 'color', $value: '{color.navy.500}' },
    // $ref JSON pointer to the same primitive's $value
    mirror: { $type: 'color', $value: { $ref: '#/color/navy/500/$value' } },
    // self-reference, to prove the cycle guard fires
    loop: { $type: 'color', $value: '{background.loop}' },
  },
}

/*
  The two checks below cross-read the Ame case study, and the case study is the
  portfolio's rather than the package's — it does not travel with the extraction
  (package_manifest). Where it is absent the cross-check has no subject, so it
  is SKIPPED and says so, which is the test-level form of the scope a clause
  declares. Silently passing would be the vacuous pass X2 exists to refuse.
*/
const CASE_STUDY = new URL('../content/case-studies/ame-design-system.mdx', import.meta.url)
const CASE_STUDY_PRESENT = existsSync(CASE_STUDY)

describe('reference resolution (build.mjs)', () => {
  it('resolves a {group.token} reference to the primitive value', () => {
    expect(resolveValue(doc, '{color.navy.500}', 'test')).toEqual(navy.$value)
  })

  it('resolves a $ref JSON pointer to the primitive value', () => {
    expect(resolveValue(doc, { $ref: '#/color/navy/500/$value' }, 'test')).toEqual(navy.$value)
  })

  it('leaves a plain literal untouched', () => {
    expect(resolveValue(doc, { colorSpace: 'srgb', components: [1, 1, 1] }, 'test')).toEqual({
      colorSpace: 'srgb',
      components: [1, 1, 1],
    })
  })

  it('throws on a circular reference rather than looping forever', () => {
    expect(() => resolveValue(doc, '{background.loop}', 'test')).toThrow(/Cyclic/)
  })

  it('throws on an unresolved reference', () => {
    expect(() => resolveValue(doc, '{color.does.not.exist}', 'test')).toThrow(/Unresolved/)
  })
})

describe('CSS serialization (build.mjs toCss)', () => {
  it('serializes a dimension with its unit', () => {
    expect(toCss('dimension', { value: 4, unit: 'px' })).toBe('4px')
  })

  it('serializes a duration with its unit', () => {
    expect(toCss('duration', { value: 200, unit: 'ms' })).toBe('200ms')
  })

  it('appends the css extension unit to a number', () => {
    expect(toCss('number', 1.5, { 'org.metis.css': { unit: 'em' } })).toBe('1.5em')
  })
})

describe('the real token tree builds and resolves', () => {
  const { tokens } = buildTokens()
  it('emits tokens whose values carry no unresolved reference', () => {
    expect(tokens.length).toBeGreaterThan(0)
    for (const t of tokens) expect(String(t.css)).not.toContain('{')
  })
})

describe('contrast math (contrast.mjs)', () => {
  const black = { colorSpace: 'srgb', components: [0, 0, 0] }
  const white = { colorSpace: 'srgb', components: [1, 1, 1] }

  it('measures black on white at the WCAG maximum of 21:1', () => {
    expect(contrast(black, white)).toBeCloseTo(21, 2)
  })

  it('measures identical colours at the minimum of 1:1', () => {
    expect(contrast(white, white)).toBeCloseTo(1, 5)
  })

  it('composites a translucent foreground before measuring', () => {
    const halfBlack = { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.5 }
    const ratio = contrast(halfBlack, white)
    expect(ratio).toBeGreaterThan(1)
    expect(ratio).toBeLessThan(21)
  })

  // A translucent BACKGROUND was the hole: contrast() composited a translucent
  // foreground but read a translucent fill as if it were solid, which flatters a
  // pale wash into whatever its undiluted pigment measures. Both directions are
  // proven, because an instrument change that only ever turns red green is
  // indistinguishable from a loophole (R-10).
  it('composites a translucent background over the ground before measuring', () => {
    const tenthBlack = { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.1 }
    // Uncomposited, a 10% black fill reads as solid black and white on it looks perfect.
    expect(contrast(white, tenthBlack)).toBeCloseTo(21, 0)
    // Over a white ground it is a near-white wash, and white on it is unreadable.
    expect(contrast(white, tenthBlack, white)).toBeLessThan(1.5)
  })

  it('passes a fill that only clears the floor once composited', () => {
    const green800 = { colorSpace: 'srgb', components: [0.086275, 0.396078, 0.203922] }
    const fill = { colorSpace: 'srgb', components: [0.133333, 0.772549, 0.368627], alpha: 0.16 }
    // Read against the undiluted pigment the badge looks like a failure.
    expect(contrast(green800, fill)).toBeLessThan(4.5)
    // Composited over the page it is what a person actually sees, and it passes.
    expect(contrast(green800, fill, white)).toBeGreaterThan(4.5)
  })
})

describe('the drift ratchet (ratchet.mjs)', () => {
  it('reports an id whose count grew past the baseline', () => {
    expect(ratchetExceeded({ S1: 13 }, { S1: 12 })).toEqual(['S1'])
  })

  it('passes a count equal to the baseline', () => {
    expect(ratchetExceeded({ S1: 12 }, { S1: 12 })).toEqual([])
  })

  it('passes a count below the baseline', () => {
    expect(ratchetExceeded({ S1: 11 }, { S1: 12 })).toEqual([])
  })

  it('does not constrain a count that has no baseline entry', () => {
    expect(ratchetExceeded({ NEW: 99 }, { S1: 12 })).toEqual([])
  })
})

/*
  The figures the case study prints, tied to the graph that produces them.

  The Technology Pipeline decision states a :root property count and a dark
  re-point count, and the build-pipeline flowchart repeats them on the tokens.css
  node. Both were prose. Nothing read the emitted CSS, so when the graph grew the
  page went on saying 296 and no check disagreed — it was 315 by the time anyone
  looked. A number a reader cannot verify and a build cannot contradict is
  decoration; asserting it here makes it evidence, and makes the page fail loudly
  rather than drift quietly.

  Stated once, here, and read by both assertions: a figure with two homes is the
  drift this file exists to catch.

  IF THIS LOOKS FUSSY, IT HAS ALREADY EARNED ITS KEEP TWICE IN ONE SITTING. Rewriting
  the Outcomes prose broke it on the wording — "315 unique custom properties ARE
  emitted" no longer contained the phrase — and then broke it again when the reflowed
  paragraph put a line break between "only 6" and "need to change value". Neither
  changed a number, and both would have left a page that still read correctly to a
  human while the assertion silently stopped matching anything. A substring check is
  the crudest possible instrument, and that is the point: it fails on contact rather
  than degrading into agreement with itself. The cost is that editing this prose means
  editing this test, which is the trade being made deliberately.
*/
/*
  NO LONGER TYPED HERE. The figure used to be a constant in this file, restated in
  two flowchart labels and a sentence of prose — one fact in four homes, which is the
  thing the token layer exists to prevent one level down.

  build.mjs now derives both counts from the CSS it emits and exports them; the
  flowchart imports them and the prose renders <TokenFigure />. What is left to assert
  is a genuine cross-check rather than a transcription: does the constant the build
  exported still match a fresh count of the committed CSS?
*/
const STATED_ROOT_PROPS = ROOT_PROPS
const STATED_DARK_REPOINTS = DARK_REPOINTS

describe('the emitted CSS matches the figures the case study prints', () => {
  const css = readFileSync(new URL('../packages/ame-tokens/tokens.css', import.meta.url), 'utf8')
  const propsIn = (block: string) => (block.match(/^\s*--[a-z0-9-]+:/gm) ?? []).length

  it('emits the :root property count the pipeline decision claims', () => {
    const root = css.match(/:root\s*\{([\s\S]*?)\n\}/)
    expect(root).not.toBeNull()
    expect(propsIn(root![1])).toBe(STATED_ROOT_PROPS)
  })

  /*
    LOCATED INDEPENDENTLY OF THE BUILD, ON PURPOSE.

    This used to be `css.indexOf('data-theme')` — the same locator tokenFigures
    used. `data-theme` appears in a token description hundreds of lines before it
    appears as a selector, so both landed inside `:root`, both counted the same six
    recipe properties, and both agreed. The dark scope also held six, so the number
    was right by coincidence and this assertion certified it.

    Two derivations of one fact are only worth having if they can disagree. This one
    now walks the emitted rules and takes the one whose selector IS the dark scope,
    which shares no code and no assumption with the regex in build.mjs. If either
    side drifts, they diverge and this fails.
  */
  it('emits the dark re-point count the pipeline decision claims', () => {
    const rules = css.split('\n}')
    const dark = rules.find((r) => /^\[data-theme="dark"\]/m.test(r.slice(r.lastIndexOf('\n\n') + 1)))
    expect(dark, 'no rule in tokens.css opens with the [data-theme="dark"] selector').toBeDefined()
    expect(propsIn(dark!.slice(dark!.indexOf('{')))).toBe(STATED_DARK_REPOINTS)
  })

  /*
    The bug the assertion above could not see: a mention of the selector inside a
    comment, sitting earlier in the file than the selector itself. Pinning it here
    means the next person to reach for indexOf finds out why that is not enough.
  */
  it('mentions data-theme in a comment before the selector, which is why indexOf is wrong', () => {
    const mention = css.indexOf('data-theme')
    const selector = css.search(/^\[data-theme="dark"\]/m)
    expect(mention).toBeGreaterThan(-1)
    expect(selector).toBeGreaterThan(-1)
    expect(mention).toBeLessThan(selector)
  })

  /*
    Three homes, all asserted. The figure is printed by the pipeline flowchart, by
    the colour-system flowchart, and by the Outcomes prose — which is the one-home
    rule broken in copy rather than in code, and it failed the way D2 says it will:
    all three said 296 while the graph said 315. Restating it is allowed here only
    because every restatement is now checked against the build.
  */
  it('states the same figures in the flowchart the decision renders', () => {
    const node = FLOWCHART_PRESETS['ame-build-pipeline'].nodes.find((n) => n.label === 'tokens.css')
    expect(node?.sublabel).toBe(`${STATED_ROOT_PROPS} :root props + ${STATED_DARK_REPOINTS} dark re-points`)
  })

  it('states the same count in the colour-system flowchart', () => {
    const labels = FLOWCHART_PRESETS['ame-color-system'].nodes.map((n) => n.label)
    expect(labels).toContain(`${STATED_ROOT_PROPS} :root custom properties`)
  })

  it.skipIf(!CASE_STUDY_PRESENT)('states the same count in the Outcomes prose', () => {
    const mdx = readFileSync(CASE_STUDY, 'utf8')
    /*
      The prose no longer states the number, so there is no number here to keep in
      step. What it must not do is go back to stating one: a literal count in this
      sentence would be a fifth home for a fact the build already exports.
    */
    expect(mdx).toContain('<TokenFigure metric="rootProps" />')
    expect(mdx).not.toMatch(/\b\d{3} custom properties at/)
    /*
      The dark re-point figure is no longer asserted HERE, because the Outcomes prose
      no longer states it — and an assertion against prose that does not exist is a
      test that can only ever fail or be deleted. It is not unguarded: the figure
      still has two asserted homes below, the build-pipeline flowchart node and the
      colour decision's sentence, both of which read STATED_DARK_REPOINTS. Coverage
      moved; it did not lapse.
    */
  })

  /*
    The colour decision was the fourth home of the same figure, and it typed the count.
    It no longer does: the sentence renders <TokenFigure metric="darkRepoints" />, the
    same way the pipeline decision renders both of its numbers.

    So this assertion inverts, like the Outcomes one above. There is no number in the
    prose to keep in step; what matters is that a number does not come back. The
    negative is the whole test — a literal count here would be a home the build cannot
    correct, which is how this page came to say 315 while the graph said 319.
  */
  it.skipIf(!CASE_STUDY_PRESENT)('does not restate the re-point count in the colour decision', () => {
    const mdx = readFileSync(CASE_STUDY, 'utf8')
    expect(mdx).toContain('<TokenFigure metric="darkRepoints" />')
    expect(mdx).not.toMatch(/re-points \d+ semantic tokens/)
    expect(mdx).not.toMatch(/\(\d+ props, \d+ dark/)
  })

  /*
    The colour-system flowchart's terminator spelled the same count as the WORD "six",
    which every numeral search in this file missed — including the sweep that caught
    315. It reads DARK_REPOINTS now, and this pins it so the label cannot go back to
    carrying a number of its own in either spelling.
  */
  it('states the same re-point count in the colour-system terminator', () => {
    const labels = FLOWCHART_PRESETS['ame-color-system'].nodes.map((n) => n.label)
    expect(labels).toContain(`Dark scope re-points ${STATED_DARK_REPOINTS} names ✓`)
  })

  /*
    B6 measures artifact parity over four emitted files. The diagram's bottom row is
    that manifest, and it used to show three of them plus the dither noise — a
    derived property inside tokens.css standing where a file should be, which left
    recipes.css off the page entirely.
  */
  it('draws every file B6 measures parity over', () => {
    const labels = FLOWCHART_PRESETS['ame-build-pipeline'].nodes.map((n) => n.label)
    for (const f of ['tokens.css', 'recipes.css', 'tokens.mjs', 'tokens.d.ts']) expect(labels).toContain(f)
  })
})

/*
  HDR luminance (tokens/hdr.mjs), the arithmetic CS2 bounds.

  Checked against the WORKED EXAMPLES CSS Color HDR 1 publishes, not against itself.
  That distinction is the whole value of this block: a luminance function tested on
  numbers it produced would agree with itself at any scale factor, and getting Yw or a
  coefficient wrong would still look green. The spec prints the answers, so these are
  someone else's numbers.
*/
describe('HDR luminance against the spec\'s own worked examples', () => {
  const at = (colorSpace: string, components: number[]) => hdrLuminance({ colorSpace, components })

  it('decodes PQ white to 10,000 cd/m², the spec\'s blinding white', () => {
    expect(pqToNits(1)).toBeCloseTo(10000, 0)
    expect(at('rec2100-pq', [1, 1, 1]).nits!).toBeCloseTo(10000, 0)
  })

  // § 5.1 Example 14: c1 = color(rec2100-linear 0.9 1.0 0.8) gives Y = 195.260.
  it('matches the interpolation example\'s published Y', () => {
    expect(at('rec2100-linear', [0.9, 1.0, 0.8]).nits!).toBeCloseTo(195.26, 2)
  })

  /*
    The coefficients sum to 1, so linear white lands exactly on reference white
    rather than near it. This is the assertion that would catch a mistyped Rec.2020
    coefficient, which the example above would not: a small error there still leaves
    0.9/1.0/0.8 looking plausible.
  */
  it('puts rec2100-linear white exactly on HDR Reference White', () => {
    expect(at('rec2100-linear', [1, 1, 1]).nits!).toBeCloseTo(REFERENCE_WHITE_NITS, 6)
  })

  /*
    The encoder against the decoder. nitsToPq writes the HDR swatch file and pqToNits
    is what CS2 audits with, so if they ever disagree the asset would state one
    luminance and the gate would read another. Round-tripping them is the cheapest way
    to keep an encoder and its auditor honest about the same constants.
  */
  it('round-trips luminance through the PQ encoder and back', () => {
    for (const nits of [0, 1, 100, REFERENCE_WHITE_NITS, 400, 1000, 4000, 10000]) {
      expect(pqToNits(nitsToPq(nits))).toBeCloseTo(nits, 6)
    }
    // And the encoder is bounded: PQ's full scale is 10,000 cd/m², not more.
    expect(nitsToPq(10000)).toBeCloseTo(1, 9)
    expect(nitsToPq(99999)).toBeCloseTo(1, 9)
  })

  it('refuses rec2100-hlg rather than guessing at it', () => {
    const v = at('rec2100-hlg', [0.5, 0.5, 0.5])
    expect(v.measurable).toBe(false)
    expect(v.nits ?? null).toBeNull()
    // And refusing must FAIL the clause, not quietly pass as an unmeasured zero.
    expect(exceedsReferenceWhite({ colorSpace: 'rec2100-hlg', components: [0.5, 0.5, 0.5] }).fails).toBe(true)
  })

  it('has nothing to say about an SDR colour', () => {
    const v = at('oklch', [0.55, 0.15, 256])
    expect(v.measurable).toBe(true)
    expect(v.nits).toBeNull()
    expect(exceedsReferenceWhite({ colorSpace: 'oklch', components: [0.55, 0.15, 256] }).fails).toBe(false)
  })

  // "May not EXCEED" — so equality is admissible and a hair over is not. Both sides,
  // because a bound tested on one side only is indistinguishable from a bound in the
  // wrong place.
  it('admits exactly reference white and refuses one percent over', () => {
    expect(exceedsReferenceWhite({ colorSpace: 'rec2100-linear', components: [1, 1, 1] }).fails).toBe(false)
    expect(exceedsReferenceWhite({ colorSpace: 'rec2100-linear', components: [1.01, 1.01, 1.01] }).fails).toBe(true)
  })
})

/*
  The emitted HDR block, tied to the token that declares it — the B6 shape applied to
  the one part of the colour system no engine here can render yet. Chrome 151 supports
  neither color-hdr() nor rec2100-*, so nothing in a browser would notice if this
  emission were wrong; the artifact is the only place it can be caught.
*/
describe('the HDR rendition is emitted safely', () => {
  const css = readFileSync(new URL('../packages/ame-tokens/tokens.css', import.meta.url), 'utf8')

  it('guards every HDR declaration behind @supports', () => {
    const block = css.match(/@supports \(color: color-hdr\([^)]*\)\) \{([\s\S]*?)\n\}/)
    expect(block, 'the HDR block is missing or no longer guarded').not.toBeNull()
    // Nothing may declare color-hdr() outside the guard: unguarded, an engine that
    // cannot parse it drops the colour entirely rather than falling back.
    const outside = css.replace(block![0], '')
    expect(outside).not.toContain('color-hdr(')
  })

  it('uses the ordinary token as the headroom-0 anchor, so C1-C10 still audit it', () => {
    const { tokens } = buildTokens()
    let seen = 0
    for (const t of tokens) {
      const h = t.hdr
      if (!h) continue
      seen++
      expect(css).toContain(`${t.cssName}: color-hdr(${t.css} 0, ${h.css} ${h.stops})`)
    }
    // The denominator guard Z3 exists for: a loop over an empty set passes silently.
    expect(seen, 'no token declares an HDR anchor, so this proves nothing').toBeGreaterThan(0)
  })

  it('serializes a predefined space through color(), not as a function of its own', () => {
    // rec2100-linear(...) is a string no engine parses; color(rec2100-linear ...) is.
    expect(css).toContain('color(rec2100-linear ')
    expect(css).not.toMatch(/[^(\s]rec2100-linear\(/)
  })
})
