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
  glass runs light or dark. Portable: React, ame's tokens, and the .port-glass*
  classes in components/ame/chrome.css, which ships beside this file. No
  app-specific imports, no animation library (the slide is a CSS transition).

  "Portable" was false until 2026-08-27. Those classes lived only in the
  monorepo's portfolio.css, which does not travel, so the published component
  rendered as an unstyled bar with var(--port-glass-fg-muted) silently dropped.
  Shipping chrome.css is what made the word true. The logo, scroll-spy, smooth-scroll, and any right-side cluster stay
  in each site's own header, which composes this bar.
*/

/*
  The bar's geometry, READ from the tokens rather than restated beside them.

  These were `'0.25rem'` and `'1.75rem'`, byte-equal to component.nav.pad and
  component.nav.item-height. Two homes for one measure, which is the exact
  condition D2 fails a CSS file for — and it was invisible here because the
  restated-value scan matches CSS syntax and these were JS strings.

  The gate was reporting both tokens as CLIENTLESS at the same time: the token
  had no consumer precisely because the component had copied its value instead
  of binding it. The H1 count was measuring the duplication.
*/
const NAV_PAD = 'var(--ame-component-nav-pad)'
const NAV_ITEM_H = 'var(--ame-component-nav-item-height)'

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
  /** Controlled selection: the id of the active item. */
  activeId: string
  onNavigate?: (id: string) => void
  tone?: 'light' | 'dark'
  ariaLabel?: string
  className?: string
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLElement>(null)
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null)
  const [barW, setBarW] = useState<number | null>(null)
  /*
    prefers-reduced-motion, read the same way panel-wall reads it: initial false
    so the server render and the first client render agree, then corrected in an
    effect, and kept live because a person can change the setting while the page
    is open.

    Nothing in this component honoured the preference. The bar's width and the
    pill's slide are the two things here that move, and both moved regardless.
  */
  const [reduceMotion, setReduceMotion] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  const activeIndex = Math.max(0, items.findIndex((it) => it.id === activeId))
  // The labels, as one string. A caller may build the items array inline, so its
  // identity is not a dependency worth having; what the measurement actually
  // depends on is the text being laid out. JSON.stringify rather than a join, so
  // no separator can collide with a label of its own.
  const labels = JSON.stringify(items.map((it) => it.label))

  /*
    MEASURED FROM THE RENDERED ITEMS, AND RE-MEASURED WHENEVER THEY RESIZE.

    This used to depend on [activeIndex, items.length], which is a proxy for "the
    labels changed" that fails on the case that matters: swapping a label SET keeps
    both the index and the count, so the effect did not re-run and the pill kept the
    width of the label it no longer sat under. Translating the page does exactly that.

    A ResizeObserver asks the layout instead of guessing from props, so it also covers
    the case the old comment claimed and did not handle — a font swapping in after
    first paint — and the wrap that a narrow viewport forces.

    The bar's own width is measured too, from the list plus the bar's padding, so it
    can be transitioned. An intrinsic `auto` width cannot be tweened; an explicit
    pixel width equal to the intrinsic one looks identical and can be. It is set only
    after the first measurement, so the bar sizes itself naturally on first paint and
    nothing depends on JavaScript to have run.
  */
  useEffect(() => {
    const list = listRef.current
    const bar = barRef.current
    if (!list || !bar) return

    const measure = () => {
      const item = list.children[activeIndex] as HTMLElement | undefined
      if (!item) return
      // Both rects from the SAME element (the bar) the pill is positioned against,
      // so the bar's own padding doesn't offset the pill.
      const ir = item.getBoundingClientRect()
      const br = bar.getBoundingClientRect()

      /*
        RECTS ARE VISUAL PIXELS; EVERYTHING ELSE HERE IS LAYOUT PIXELS.

        Under a CSS `zoom` anywhere above this component, getBoundingClientRect returns the
        scaled size while getComputedStyle's padding — and the width we are about to write
        back — are unscaled. Measured at zoom 0.67: the list's rect said 102.3 where its
        offsetWidth said 153. Adding unscaled padding to a scaled width produced a bar set
        to 0.67 x list + padding, so the zoom landed on part of the number twice and the nav
        rendered about two thirds of the width it should have.

        offsetWidth is layout, so their ratio is the effective zoom whatever the nesting.
        Dividing by it puts every measurement back in the units the style expects, and the
        whole correction is a no-op at zoom 1.
      */
      const z = br.width / (bar.offsetWidth || 1) || 1
      const x = (ir.left - br.left) / z
      const w = ir.width / z

      const cs = getComputedStyle(bar)
      const padX = parseFloat(cs.paddingLeft || '0') + parseFloat(cs.paddingRight || '0')
      const bw = list.getBoundingClientRect().width / z + padX

      /*
        Bail out when nothing moved. A ResizeObserver fires on every size change, and
        setting the bar's width is itself a size change — so returning a fresh object
        each pass would re-render, re-observe and measure again without end. Sub-pixel
        noise is treated as no change for the same reason.
      */
      const same = (a: number, b: number) => Math.abs(a - b) < 0.5
      setPill((prev) => (prev && same(prev.x, x) && same(prev.w, w) ? prev : { x, w }))
      setBarW((prev) => (prev !== null && same(prev, bw) ? prev : bw))
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(list)
    ro.observe(bar)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [activeIndex, labels])

  return (
    <nav
      ref={barRef}
      data-backdrop={tone === 'dark' ? 'dark' : undefined}
      className={`port-glass port-glass-quiet relative flex items-center${className ? ` ${className}` : ''}`}
      style={{
        borderRadius: 'var(--ame-component-pill-radius)',
        padding: NAV_PAD,
        // Null until measured, so the first paint is the intrinsic width.
        width: barW ?? undefined,
        // No width tween under prefers-reduced-motion: the bar arrives at its
        // measured width instead of sliding to it. Nothing in this file honoured
        // the preference before; the pill's slide below is guarded the same way.
        transition: reduceMotion
          ? undefined
          : `width var(--ame-motion-slide-duration) var(--ame-motion-enter-ease)`,
      }}
      aria-label={ariaLabel}
    >
      {/* The pill. aria-hidden — it is the visual echo of aria-current below. */}
      {pill && (
        <span
          className="port-glass-pill pointer-events-none absolute"
          aria-hidden
          style={{
            borderRadius: 'var(--ame-component-pill-radius)',
            translate: `${pill.x}px 0`,
            width: pill.w,
            top: NAV_PAD,
            bottom: NAV_PAD,
            left: 0,
            transition: reduceMotion
              ? undefined
              : 'translate var(--ame-motion-slide-duration) var(--ame-motion-enter-ease), width var(--ame-motion-slide-duration) var(--ame-motion-enter-ease)',
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
            // shrink-0 because the bar now carries an explicit width: without it a
            // flex item would compress to fit the width that was measured FROM it,
            // and the measurement would chase its own result.
            className="relative z-10 flex shrink-0 items-center justify-center no-underline transition-colors"
            style={{
              height: NAV_ITEM_H,
              paddingInline: 'var(--ame-space-grid-gap)',
              borderRadius: 'var(--ame-component-pill-radius)',
              fontSize: 'var(--ame-type-meta-size)',
              letterSpacing: 'var(--ame-type-body-tracking)',
              // The selected label sits on the bright pill, so it stays dark in
              // both tones (component.nav.pill-fg holds that, and takes no
              // -on-dark counterpart because the pill itself never darkens); the
              // others take the muted glass foreground (tone-aware, holds 0.78).
              color: i === activeIndex ? 'var(--ame-component-nav-pill-fg)' : 'var(--port-glass-fg-muted)',
            }}
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  )
}
