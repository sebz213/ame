/*
  Contrast measurement. The colour maths behind invariants C1 to C10, factored
  out of check.mjs so it is reachable as a unit (WO-6.2, decision R-24). check.mjs
  is the only runtime consumer; this file adds no behaviour, it only gives the
  pure functions a testable home. A translucent foreground is composited over its
  background before measuring, the way a browser paints it.
*/
const cube = (x) => x * x * x

export function oklabToLinearSrgb(L, a, b) {
  const l = cube(L + 0.3963377774 * a + 0.2158037573 * b)
  const m = cube(L - 0.1055613458 * a - 0.0638541728 * b)
  const s = cube(L - 0.0894841775 * a - 1.291485548 * b)
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

export const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
export const linearToSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055)

/** Any DTOS colour value to linear-light sRGB, plus its alpha. */
export function toLinear(v) {
  let lin
  if (v.colorSpace === 'srgb') lin = v.components.map(srgbToLinear)
  else if (v.colorSpace === 'oklch') {
    const [L, C, H] = v.components
    const h = (H * Math.PI) / 180
    lin = oklabToLinearSrgb(L, C * Math.cos(h), C * Math.sin(h))
  } else if (v.colorSpace === 'oklab') lin = oklabToLinearSrgb(...v.components)
  else throw new Error(`Contrast: unsupported colour space ${v.colorSpace}`)
  return { lin, alpha: v.alpha ?? 1 }
}

export const luminance = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b

/** WCAG 2.2 relative-luminance ratio between a foreground and a background. */
export function contrast(fgVal, bgVal) {
  const fg = toLinear(fgVal)
  const bg = toLinear(bgVal)
  const over =
    fg.alpha === 1
      ? fg.lin
      : fg.lin.map((c, i) =>
          srgbToLinear(fg.alpha * linearToSrgb(c) + (1 - fg.alpha) * linearToSrgb(bg.lin[i])),
        )
  const [hi, lo] = [luminance(over), luminance(bg.lin)].sort((a, b) => b - a)
  return (hi + 0.05) / (lo + 0.05)
}
