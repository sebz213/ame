'use client'

import { useRef, useState, type ReactNode } from 'react'
import { animate } from 'animejs'
import { A11Y_VIEWBOX, A11Y_PATH } from '@/lib/a11y-glyph'

/*
  ame · top utility bar — a shared, tone-aware chrome component.

  A solid strip above the whole site: the accessibility glyph then the language
  switcher (label + bounce). The switcher cycles the languages and reflects the
  choice on <html lang>. There is no i18n layer behind it yet — that is disclosed
  rather than faked: the button changes the language the document DECLARES, not
  (yet) the words on the page, and a translation layer can hang off the same state.

  TWO GROUNDS, ONE COMPONENT
  ──────────────────────────
  The strip paints a token, not a literal. On a paper page it is
  --component-topbar-bg (#eeeeeb); on an ink ground it is
  --component-topbar-bg-on-dark (#1a1e28), with the label/glyph and their hover in
  the matching pair. `tone` picks the pair, so the light portfolio and the ink
  marketing site are the SAME bar on two grounds rather than two components.

  Its one dependency is animejs — ame's animation library, the same one the
  portfolio uses. The consuming site provides it (Metis installs the same version);
  everything else is React and ame tokens. No app-specific imports, so both sites
  consume this component from one source.
*/

const DEFAULT_LANGS = ['EN', 'FR', 'DE', 'JP'] as const

/*
  Language-switch bounce timing, in ms. SWAP_MS is doing two jobs that must not
  drift apart: the duration of the squash AND the delay before the label changes,
  which puts the new language at the bottom of the bounce. LOCK_MS outlasts
  SWAP_MS + SPRING_MS by a margin, so a second click cannot land on the last frame.
*/
const SWAP_MS = 179.4
const SPRING_MS = 772.8
const LOCK_MS = 993.6
// The margin by which LOCK_MS outlasts SWAP_MS + SPRING_MS (993.6 − 179.4 − 772.8).
// When the bounce timings are overridden, the lock scales to keep the same guard.
const LOCK_MARGIN_MS = LOCK_MS - SWAP_MS - SPRING_MS

// The accessibility glyph (viewBox + path) is shared with the portfolio floating
// pill; it lives in lib/a11y-glyph so the ~600-char path is defined once.

type Tone = 'light' | 'dark'

export function AmeTopBar({
  tone = 'light',
  languages = DEFAULT_LANGS,
  className,
  maxWidth = 'max-w-5xl',
  innerClassName,
  leading,
  onAccessibility,
  swapMs = SWAP_MS,
  springMs = SPRING_MS,
  lockMs,
}: {
  tone?: Tone
  /** The cycle. First entry is the initial <html lang>. */
  languages?: readonly string[]
  /** Squash duration of the language bounce, ms. Also the delay before the label
      swaps (the swap lands at the bottom of the bounce). Defaults to the tuned 179.4. */
  swapMs?: number
  /** Spring-back duration of the language bounce, ms. Defaults to the tuned 772.8. */
  springMs?: number
  /** How long a second click is locked out, ms. Defaults to swapMs + springMs plus
      the tuned 41.4 margin, so the guard scales with the bounce timings. */
  lockMs?: number
  /** Extra classes for the outer strip, e.g. a stacking position over a grain layer. */
  className?: string
  /** Max-width class for the inner content row, so the strip can align to the
      consuming site's header shell. Defaults to the content width. */
  maxWidth?: string
  /** Extra classes for the inner content row, e.g. a consuming site's desktop edge
      inset on the right-aligned cluster (md:pr-[…]). */
  innerClassName?: string
  /** Optional control(s) placed at the start of the right-aligned cluster. Rides
      the same --tb-fg tone. */
  leading?: ReactNode
  /** Opens the consumer's accessibility surface from the strip's a11y glyph. */
  onAccessibility?: () => void
}) {
  const [langIndex, setLangIndex] = useState(0)
  const langBtnRef = useRef<HTMLButtonElement>(null)
  const animating = useRef(false)
  const dark = tone === 'dark'

  const lock = lockMs ?? swapMs + springMs + LOCK_MARGIN_MS

  const cycleLanguage = () => {
    if (animating.current) return
    const el = langBtnRef.current
    const next = (langIndex + 1) % languages.length
    animating.current = true

    // The STATE change is on a timer, never on an animation callback: the label
    // swaps at the bottom of the bounce whether or not anime fires, and the lock
    // always releases. The bounce is purely cosmetic on top of this.
    window.setTimeout(() => {
      setLangIndex(next)
      document.documentElement.lang = languages[next].toLowerCase()
    }, swapMs)
    window.setTimeout(() => {
      animating.current = false
    }, lock)

    if (el) {
      // Cosmetic: squash to a minimum (quick), then spring back out.
      animate(el, {
        scale: 0.55,
        duration: swapMs,
        ease: 'inQuad',
        onComplete: () => {
          animate(el, { scale: 1, duration: springMs, ease: 'outElastic(1, 0.5)' })
        },
      })
    }
  }

  // The fg/fg-hover pair travels on CSS vars so the buttons' hover works with
  // whichever tone is live — inline style can't express :hover.
  const barVars = {
    ['--tb-fg' as string]: dark ? 'var(--component-topbar-fg-on-dark)' : 'var(--component-topbar-fg)',
    ['--tb-fg-hover' as string]: dark ? 'var(--component-topbar-fg-hover-on-dark)' : 'var(--component-topbar-fg-hover)',
  }

  return (
    <div
      data-backdrop={dark ? 'dark' : undefined}
      className={`w-full${className ? ` ${className}` : ''}`}
      style={{
        height: 'var(--component-topbar-height)',
        backgroundColor: dark ? 'var(--component-topbar-bg-on-dark)' : 'var(--component-topbar-bg)',
        ...barVars,
      }}
    >
      <div className={`mx-auto flex h-full ${maxWidth} items-center justify-end gap-5 px-[var(--space-gutter)]${innerClassName ? ` ${innerClassName}` : ''}`}>
        {/* Consumer-supplied control (the portfolio's light/dark toggle), leftmost
            in the right-aligned cluster. */}
        {leading}
        {/* Accessibility — icon only for now. p-1.5 keeps the button compact: the
            13.85px glyph plus 6px each side is the tallest control, and the strip
            was sized so nothing inside it has to shrink to fit. */}
        <button
          type="button"
          aria-label="Accessibility options"
          aria-haspopup={onAccessibility ? 'dialog' : undefined}
          onClick={onAccessibility}
          className="inline-flex items-center justify-center rounded-full p-1.5 text-[color:var(--tb-fg)] transition-colors duration-200 hover:text-[color:var(--tb-fg-hover)]"
        >
          <svg viewBox={A11Y_VIEWBOX} className="h-[0.86539rem] w-auto shrink-0" fill="currentColor" aria-hidden="true">
            <path d={A11Y_PATH} />
          </svg>
        </button>

        {/* Language — label only. Cycles on click with the bounce. */}
        <button
          ref={langBtnRef}
          type="button"
          onClick={cycleLanguage}
          aria-label={`Language: ${languages[langIndex]}. Change language. The page text is not yet translated.`}
          className="inline-flex items-center rounded-full px-1.5 py-1 text-[color:var(--tb-fg)] transition-colors duration-200 hover:text-[color:var(--tb-fg-hover)]"
          style={{ willChange: 'transform' }}
        >
          {/* Fixed floor on the width (the row is justify-end, so a shrinking box
              would drag the icon left on each swap). 18.5px clears EN's rendered
              18.41px, the widest of the four. On the span, not the button. */}
          <span className="inline-block min-w-[var(--component-topbar-lang-min-width)] text-center text-[13px] tracking-[0.05em]">
            {languages[langIndex]}
          </span>
        </button>
      </div>
    </div>
  )
}
