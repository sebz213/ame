import type { CSSProperties } from 'react'
import { AME_ICON_DATA } from './icon-data'
import { IconFallback } from './icon-fallback'

/*
  Icon — the ame design-system icon primitive. It renders one of the brand's own
  line icons (components/ame/icons/icon-data.ts, the storybook set) by name, at the
  current text colour. A name the ame set does not carry falls through to the
  shadcn icon layer (lucide-react), so a call site always gets a glyph without the
  ame set having to mirror all of lucide.

  The glyph markup is injected raw (dangerouslySetInnerHTML) so the source SVG
  attributes — stroke-width, fill-rule, transform — survive without a JSX rewrite;
  the data is generated from a trusted committed source, never user input. The svg
  paints with fill: currentColor, so an icon inherits the ame ink at its call site.
*/

export type IconProps = {
  /** An ame icon name (icon-data.ts), or any lucide name for the fallback. */
  name: string
  /** Rendered height in px; width follows the glyph's aspect ratio. Default 20. */
  size?: number
  className?: string
  style?: CSSProperties
  /** An accessible label. Omitted, the icon is decorative and hidden from a11y. */
  label?: string
}

export function Icon({ name, size = 20, className, style, label }: IconProps) {
  const glyph = AME_ICON_DATA[name]
  if (!glyph) return <IconFallback name={name} size={size} className={className} style={style} label={label} />

  const parts = glyph.viewBox.split(/\s+/).map(Number)
  const vbW = parts[2]
  const vbH = parts[3]
  const width = vbW && vbH ? Math.round(size * (vbW / vbH) * 100) / 100 : size
  const a11y = label
    ? { role: 'img' as const, 'aria-label': label }
    : { 'aria-hidden': true as const, focusable: 'false' as const }

  return (
    <svg
      viewBox={glyph.viewBox}
      height={size}
      width={width}
      fill="currentColor"
      className={className}
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle', ...style }}
      {...a11y}
      dangerouslySetInnerHTML={{ __html: glyph.path }}
    />
  )
}
