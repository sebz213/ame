'use client'

import { useEffect, useRef, useState } from 'react'

/*
  ame · glass pill nav — shared, tone-aware chrome.

  A floating glass bar (.port-glass .port-glass-quiet) with ONE sliding pill that
  travels between items, so the selection reads as a held position rather than a
  class on the active item. The pill offset is MEASURED from the rendered items
  (not computed from a constant width), so labels of any length sit centred.

  Controlled: the parent owns `activeId` (a scroll-spy or plain click state) and
  passes it in; `onNavigate` fires on click. `tone` sets [data-backdrop] so the
  glass runs light or dark. Portable — only React and ame's .port-glass* classes
  + tokens; no app-specific imports, no animation library (the slide is a CSS
  transition). The logo, scroll-spy, smooth-scroll, and any right-side cluster stay
  in each site's own header, which composes this bar.
*/

// The bar's own geometry (portfolio home's): bar pad 0.25rem, item height 1.75rem.
const NAV_PAD = '0.25rem'
const NAV_ITEM_H = '1.75rem'

export type AmeNavItem = { id: string; label: string; href: string }

export function AmeNav({
  items,
  activeId,
  onNavigate,
  tone = 'light',
  ariaLabel = 'Sections',
  className,
}: {
  items: AmeNavItem[]
  /** Controlled selection — the id of the active item. */
  activeId: string
  onNavigate?: (id: string) => void
  tone?: 'light' | 'dark'
  ariaLabel?: string
  className?: string
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLElement>(null)
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null)
  const activeIndex = Math.max(0, items.findIndex((it) => it.id === activeId))

  // Measured after layout and re-measured on resize: labels are text, so a font
  // swap or wrap changes widths after first paint, and a pill positioned from the
  // pre-swap measurement would stay wrong for the session.
  useEffect(() => {
    const measure = () => {
      const list = listRef.current
      const bar = barRef.current
      if (!list || !bar) return
      const item = list.children[activeIndex] as HTMLElement | undefined
      if (!item) return
      // Both rects from the SAME element (the bar) the pill is positioned against,
      // so the bar's own padding doesn't offset the pill.
      const ir = item.getBoundingClientRect()
      const br = bar.getBoundingClientRect()
      setPill({ x: ir.left - br.left, w: ir.width })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [activeIndex, items.length])

  return (
    <nav
      ref={barRef}
      data-backdrop={tone === 'dark' ? 'dark' : undefined}
      className={`port-glass port-glass-quiet relative flex items-center${className ? ` ${className}` : ''}`}
      style={{ borderRadius: 'var(--radius-pill)', padding: NAV_PAD }}
      aria-label={ariaLabel}
    >
      {/* The pill. aria-hidden — it is the visual echo of aria-current below. */}
      {pill && (
        <span
          className="port-glass-pill pointer-events-none absolute"
          aria-hidden
          style={{
            borderRadius: 'var(--radius-pill)',
            translate: `${pill.x}px 0`,
            width: pill.w,
            top: NAV_PAD,
            bottom: NAV_PAD,
            left: 0,
            transition:
              'translate var(--duration-slow) var(--motion-enter-ease), width var(--duration-slow) var(--motion-enter-ease)',
          }}
        />
      )}

      <div ref={listRef} className="relative flex items-center" style={{ gap: NAV_PAD }}>
        {items.map((item, i) => (
          <a
            key={item.id}
            href={item.href}
            onClick={() => onNavigate?.(item.id)}
            aria-current={i === activeIndex ? 'true' : undefined}
            className="relative z-10 flex items-center justify-center no-underline transition-colors"
            style={{
              height: NAV_ITEM_H,
              paddingInline: 'var(--space-grid-gap)',
              borderRadius: 'var(--radius-pill)',
              fontSize: 'var(--font-size-13)',
              letterSpacing: 'var(--type-body-tracking)',
              // The selected label sits on the bright pill, so it stays dark; the
              // others take the muted glass foreground (tone-aware, holds 0.78).
              color: i === activeIndex ? 'var(--color-ink)' : 'var(--port-glass-fg-muted)',
            }}
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  )
}
