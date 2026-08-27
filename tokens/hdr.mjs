/*
  Absolute luminance for HDR colours, in cd/m² — the single number CS2 bounds.

  Factored out of check.mjs for the reason contrast.mjs and ratchet.mjs were: it is
  arithmetic with published answers, so it should be reachable as a unit and tested
  against the spec's own worked examples rather than against itself.

  WHY THIS NUMBER AND NOT A RATIO. Every contrast clause in this system measures a
  ratio, because that is what WCAG defines. Nothing in WCAG is defined above HDR
  Reference White — the criteria were calibrated in a regime where the brightest
  white a display could produce WAS reference white, which is exactly what an SDR
  display is (CSS Color HDR 1 § 2.2: SDR has 0 stops of headroom by definition). CSS
  Color HDR 1's whole Accessibility Considerations section asks the USER AGENT for a
  luminance limit and gives authors no criterion at all. So the only defensible
  author-side rule is not a ratio but a ceiling: stay inside the regime the ratios
  were defined for. See contract.md CS2.

  Source: CSS Color HDR Module Level 1, W3C Working Draft 28 July 2026 (§ 5.1, § 8,
  § 11.2) and Rpt BT.2408-9 § 2.1 for the reference white level. It is a Working
  Draft and inappropriate to cite as anything but work in progress; tokens/decisions.md
  carries that caveat where the decision to build on it is recorded.
*/

/**
 * HDR Reference White, also called media white or diffuse white: the colour of a
 * normal white background, or of white text on a dark background. Rpt BT.2408-9
 * § 2.1. This is `Yw` in the spec's sample code, and the constant Absolute D65 XYZ
 * is derived by, so a change here is a change to the meaning of every number below.
 */
export const REFERENCE_WHITE_NITS = 203

/*
  Rec.2020 luminance coefficients (ITU-R BT.2020), which Rec.2100 inherits. They sum
  to exactly 1, which is the property that makes `rec2100-linear 1 1 1` land on
  reference white rather than near it.
*/
const KR = 0.2627
const KG = 0.678
const KB = 0.0593

/* PQ (SMPTE ST 2084) constants, as the spec's § 11.2 sample code states them. */
const M1 = 2610 / 16384
const M2 = (2523 / 4096) * 128
const C1 = 3424 / 4096
const C2 = (2413 / 4096) * 32
const C3 = (2392 / 4096) * 32

/**
 * The PQ EOTF: one non-linear signal value in [0,1] to absolute luminance in cd/m².
 * PQ is an ABSOLUTE encoding — the code value carries a luminance, not a ratio — which
 * is why a PQ colour can be measured against a ceiling with no display in the room.
 */
export function pqToNits(signal) {
  const p = Math.pow(Math.max(signal, 0), 1 / M2)
  const numerator = Math.max(p - C1, 0)
  const denominator = C2 - C3 * p
  return 10000 * Math.pow(numerator / denominator, 1 / M1)
}

/**
 * The PQ OETF: absolute luminance in cd/m² to a non-linear signal value in [0,1].
 *
 * The exact inverse of pqToNits, and it exists because something has to ENCODE. The
 * decoder above is what CS2 audits with; this is what writes an HDR image file, and
 * having both in one place means the round trip is a test rather than a hope.
 */
export function nitsToPq(nits) {
  const y = Math.min(Math.max(nits, 0), 10000) / 10000
  const p = Math.pow(y, M1)
  return Math.pow((C1 + C2 * p) / (1 + C3 * p), M2)
}

/**
 * The luminance of a declared colour value, in cd/m², and whether it can be known at
 * all from the declaration.
 *
 * Three outcomes, and the third is the one that matters:
 *   { measurable: true,  nits }        an HDR colour whose luminance is arithmetic
 *   { measurable: true,  nits: null }  not an HDR-space colour; SDR cannot exceed
 *                                      reference white by definition, so CS2 has
 *                                      nothing to bound
 *   { measurable: false, why }         declared in a space whose luminance is not a
 *                                      function of the declaration
 *
 * rec2100-hlg is the false case, and it is not an oversight being papered over: HLG
 * is a RELATIVE encoding, and the spec lists its white luminance as depending on
 * viewing conditions, with black depending in turn on reference white. There is no
 * number to compare. A clause that quietly scored it as 0 would report health it
 * never established, so CS2 refuses the value instead of guessing at it.
 */
export function hdrLuminance(value) {
  const space = value?.colorSpace
  const c = value?.components ?? []

  if (space === 'rec2100-linear') {
    // Components are relative to HDR Reference White (Y of white = 1), so absolute
    // luminance is the weighted sum scaled by Yw. The spec's § 5.1 example is the
    // test vector: 0.9 1.0 0.8 gives Y = 195.260.
    return { measurable: true, nits: REFERENCE_WHITE_NITS * (KR * c[0] + KG * c[1] + KB * c[2]) }
  }

  if (space === 'rec2100-pq') {
    // Already absolute once each channel is decoded, so no Yw scaling here.
    return { measurable: true, nits: KR * pqToNits(c[0]) + KG * pqToNits(c[1]) + KB * pqToNits(c[2]) }
  }

  if (space === 'rec2100-hlg') {
    return {
      measurable: false,
      why: 'rec2100-hlg is a relative encoding whose white luminance depends on viewing conditions, so no ceiling can be checked from the declared value. Declare the anchor in rec2100-pq or rec2100-linear.',
    }
  }

  return { measurable: true, nits: null }
}

/**
 * CS2's predicate, kept beside the arithmetic so the clause and its samples cannot
 * drift apart: an HDR anchor is admissible when its luminance is knowable and does
 * not exceed HDR Reference White.
 */
export function exceedsReferenceWhite(value, ceiling = REFERENCE_WHITE_NITS) {
  const { measurable, nits, why } = hdrLuminance(value)
  if (!measurable) return { fails: true, nits: null, why }
  if (nits === null) return { fails: false, nits: null }
  return {
    fails: nits > ceiling,
    nits,
    why: nits > ceiling ? `${nits.toFixed(1)} cd/m2 exceeds HDR Reference White (${ceiling} cd/m2)` : undefined,
  }
}
