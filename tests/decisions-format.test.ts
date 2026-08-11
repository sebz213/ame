import { describe, it, expect } from 'vitest'
import { checkDecisionsFormat, entries, type Entry } from '@/scripts/check-decisions-format'

/*
  METHODS-ORDER M1.3, proved in both directions (M2.2). Inputs are constructed
  rather than read from DECISIONS.md, so these cases assert behaviour and cannot
  rot when the file legitimately changes — the same standing-proof property C6
  asks of the checks themselves.
*/
const e = (body: string): Entry[] => [{ id: 'R-000', body }]

describe('the premise-negation entry format', () => {
  it('DECISIONS.md conforms today', () => {
    const v = checkDecisionsFormat()
    expect(v, v.map((x) => `${x.entry}: ${x.message}`).join('\n')).toEqual([])
  })

  // C6: a clean result on the real file must be earned, not vacuous. If no entry
  // uses the format, this check passes over nothing and its silence means nothing.
  it('sees at least one real negation entry, so the clean result is earned', () => {
    const withNegation = entries().filter((x) => /^negated:/m.test(x.body))
    expect(withNegation.map((x) => x.id)).toContain('R-83')
    for (const x of withNegation) {
      expect(x.body, `${x.id} dissolved:`).toMatch(/^dissolved:[ 	]*\S/m)
      expect(x.body, `${x.id} survived:`).toMatch(/^survived:[ 	]*\S/m)
    }
  })

  it('reads real entries without inventing them', () => {
    expect(entries().map((x) => x.id)).toContain('R-77')
  })

  // ── must-catch ────────────────────────────────────────────────────────────
  it('catches a negation with no dissolved: line', () => {
    const v = checkDecisionsFormat(e('negated: that corpora are gathered\nsurvived: the pinned encoder\n'))
    expect(v[0].message).toMatch(/no `dissolved:` line/)
  })

  it('catches an empty dissolved: — a retry wearing the format', () => {
    const v = checkDecisionsFormat(e('negated: a premise\ndissolved:\nsurvived: none tested further\n'))
    expect(v[0].message).toMatch(/dissolved.*retry/)
  })

  it('catches a missing survived: line', () => {
    const v = checkDecisionsFormat(e('negated: a premise\ndissolved: staleness\n'))
    expect(v[0].message).toMatch(/no `survived:` line/)
  })

  it('catches a negated: line with nothing after it', () => {
    const v = checkDecisionsFormat(e('negated:\ndissolved: x\nsurvived: y\n'))
    expect(v.some((x) => /nothing after it/.test(x.message))).toBe(true)
  })

  // ── must-never-catch ──────────────────────────────────────────────────────
  it('permits a well-formed negation', () => {
    expect(
      checkDecisionsFormat(e('negated: that a corpus must be gathered\ndissolved: staleness, re-gathering\nsurvived: the encoder must still be pinned\n')),
    ).toEqual([])
  })

  it('does not read a mention of the label as a format line', () => {
    // Mention versus use (docs/LEXICON.md): an entry describing the format names
    // the label inline. Only a line beginning at column 0 is a format line.
    const prose = 'The format carries three labels, `negated:`, `dissolved:` and\n`survived:`, so the difference is grep-able.\n'
    expect(checkDecisionsFormat(e(prose))).toEqual([])
  })

  it('permits an entry that is not a negation at all', () => {
    expect(checkDecisionsFormat(e('An ordinary decision with prose and no labels.\n'))).toEqual([])
  })
})
