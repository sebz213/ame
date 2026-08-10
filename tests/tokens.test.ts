import { describe, it, expect } from 'vitest'
// The token pipeline is untyped ESM JavaScript; TypeScript infers its types
// under allowJs. These are the pure, exported helpers check.mjs also imports.
import { resolveValue, toCss, buildTokens } from 'ame-tokens/build.mjs'
import { contrast } from '../tokens/contrast.mjs'
import { ratchetExceeded } from '../tokens/ratchet.mjs'

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
