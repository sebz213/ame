'use client'

import type { CSSProperties } from 'react'
import { DynamicIcon, dynamicIconImports } from 'lucide-react/dynamic'

/*
  The shadcn fallback for Icon: a name the ame set does not carry is looked up in
  lucide-react (what shadcn ships) and lazy-loaded per icon, so the whole lucide
  library never enters the bundle. Split into its own client module because the
  lazy loader is client-only; Icon stays server-renderable for the common ame path.
  An unknown name renders nothing rather than throwing.
*/

const LUCIDE_NAMES = new Set(Object.keys(dynamicIconImports))

function toKebab(name: string) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

type LucideName = Parameters<typeof DynamicIcon>[0]['name']

export function IconFallback({
  name,
  size = 20,
  className,
  style,
  label,
}: {
  name: string
  size?: number
  className?: string
  style?: CSSProperties
  label?: string
}) {
  const kebab = toKebab(name)
  if (!LUCIDE_NAMES.has(kebab)) return null
  const a11y = label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true as const }
  return <DynamicIcon name={kebab as LucideName} size={size} className={className} style={style} {...a11y} />
}
