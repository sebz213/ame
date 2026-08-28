'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { animate } from 'animejs'
import { Icon } from './icons/icon'
import { support, translatePage, type TranslationStatus } from '@/lib/translate'

/*
  ame · top utility bar — a shared, tone-aware chrome component.

  A solid strip above the whole site: the accessibility glyph then the language
  switcher (label + bounce). The switcher cycles the languages, reflects the
  choice on <html lang>, and — where the browser exposes the on-device Translator
  API — translates the page's text in place (lib/translate.ts).

  It used to only DECLARE the language, which was disclosed rather than faked.
  That disclosure is now spent: the words move. Where the API is absent the old
  behaviour is what remains, and the button's accessible name says so instead of
  implying a translation that did not happen.

  TWO GROUNDS, ONE COMPONENT
  ──────────────────────────
  The strip paints a token, not a literal. On a paper page it is
  --ame-component-topbar-bg (#eeeeeb); on an ink ground it is
  --ame-component-topbar-bg-on-dark (#1a1e28), with the label/glyph and their hover in
  the matching pair. `tone` picks the pair, so the light portfolio and the ink
  marketing site are the SAME bar on two grounds rather than two components.

  Its one dependency is animejs — ame's animation library, the same one the
  portfolio uses. The consuming site provides it (Metis installs the same version);
  everything else is React and ame tokens. No app-specific imports, so both sites
  consume this component from one source.
*/

/*
  The languages the switch offers, as label + BCP-47 tag.

  The tag is not decoration and it is not derivable from the label: this used to
  set `lang` to the lowercased label, which made Japanese `lang="jp"` — a country
  code, not a language, and meaningless to a screen reader choosing a voice. The
  language is `ja`. The pair is kept because a label and a tag answer different
  questions, even where the two now happen to agree.
*/
const DEFAULT_LANGS = [
  { label: 'EN', tag: 'en' },
  { label: 'FR', tag: 'fr' },
  { label: 'DE', tag: 'de' },
  { label: 'JA', tag: 'ja' },
] as const

export type AmeLanguage = { label: string; tag: string }

/*
  Language-switch bounce timing, in ms. SWAP_MS is doing two jobs that must not
  drift apart: the duration of the squash AND the delay before the label changes,
  which puts the new language at the bottom of the bounce. LOCK_MS outlasts
  SWAP_MS + SPRING_MS by a margin, so a second click cannot land on the last frame.
*/
const SWAP_MS = 179.4
const SPRING_MS = 772.8
/*
  The exit, which is not the entrance reversed. 420 is what the accessibility surface
  has always used to put itself away; named here so the surfaces that now share its
  entrance share its exit too.
*/
const EXIT_MS = 420
const LOCK_MS = 993.6
// The margin by which LOCK_MS outlasts SWAP_MS + SPRING_MS (993.6 − 179.4 − 772.8).
// When the bounce timings are overridden, the lock scales to keep the same guard.
const LOCK_MARGIN_MS = LOCK_MS - SWAP_MS - SPRING_MS

// The accessibility glyph comes from the ame icon set (UniversalAccess). The
// portfolio's floating pill still binds lib/a11y-glyph, which is a monorepo
// file and does not travel.

type Tone = 'light' | 'dark'

/*
  The two strip controls, exported so a consuming surface can host them somewhere
  else — the portfolio puts them in its header's icon cluster rather than in the
  strip. They are exported FROM this file rather than moved to a new one so the
  pair keeps a single home and the /ame registry keeps a single row.

  Both read --tb-fg / --tb-fg-hover, which AmeTopBar sets. A host outside the
  strip has to define that pair itself (a class on the cluster does it), which is
  also how it re-tones them independently.
*/

/** The accessibility glyph. Opens whatever surface the host passes. */
export function AmeAccessibilityButton({
  onAccessibility,
  className,
}: {
  onAccessibility?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label="Accessibility options"
      aria-haspopup={onAccessibility ? 'dialog' : undefined}
      onClick={onAccessibility}
      className={`inline-flex items-center justify-center rounded-full p-1.5 text-[color:var(--tb-fg)] transition-colors duration-200 hover:text-[color:var(--tb-fg-hover)]${className ? ` ${className}` : ''}`}
    >
      {/*
        The accessibility glyph comes from the ame icon set, not from a path
        this file keeps. 210 glyphs ship in the package and nothing called them:
        the set carried an attribution obligation and a parity check while every
        icon on screen was hand-maintained somewhere else.

        UniversalAccess is the set's own name for this figure. It draws the ring
        the previous hand-rolled path deliberately removed, which is a visible
        change and the reason it is written down here.
      */}
      <Icon name="UniversalAccess" size={14} className="shrink-0" />
    </button>
  )
}

/*
  Whether this browser can translate INTO a given language. Asked per target
  rather than in general, because availability is per language pair — and the
  answer is the only thing that entitles the button to promise a translation.
  null while the question is still open.
*/
function useTranslationSupport(tag: string): boolean | null {
  const [can, setCan] = useState<boolean | null>(null)
  useEffect(() => {
    let live = true
    support(tag).then((a) => {
      if (live) setCan(a !== 'unavailable')
    })
    return () => {
      live = false
    }
  }, [tag])
  return can
}

/*
  What the live region says. A function rather than a ternary chain inside the
  component, because for a reader who cannot see the label change these strings
  ARE the feature, and they should be readable together.
*/
function statusMessage(status: TranslationStatus | null, label: string): string {
  switch (status) {
    case 'downloading':
      return `Preparing ${label} translation.`
    case 'translating':
      return `Translating to ${label}.`
    case 'done':
      return `Page translated to ${label}.`
    case 'restored':
      return 'Page restored to English.'
    case 'unavailable':
      return `${label} translation is not available in this browser. The page is still in English.`
    default:
      return ''
  }
}

/**
 * The language control.
 *
 * Cycles the languages with the squash-and-spring bounce, and — where the
 * browser can — actually translates the page through the on-device Translator
 * API (lib/translate.ts). Where it cannot, it still sets what the document
 * DECLARES and says so, rather than changing a label and leaving the reader to
 * discover that the words did not move.
 *
 * ACCESSIBILITY, deliberately:
 *   · no overlay, no injected widget, nothing added to the tab order
 *   · the accessible name states the current language AND what pressing it will
 *     actually do in this browser, which is not the same sentence everywhere
 *   · a polite live region reports progress, because a language pack can take
 *     seconds to download and silence during that is indistinguishable from a
 *     control that did nothing
 *   · `lang` is set only once the text has changed, so assistive technology is
 *     never told the page is French while it is still English
 *   · the control marks itself `translate="no"`: its label is the name of a
 *     language, and translating it would strand the reader
 */
/**
 * THE PRESS BOUNCE, as a function rather than as a shape three buttons each draw.
 *
 * Squash quickly to a minimum, then spring back past it. Two animations rather than
 * one curve because the halves are doing different jobs: the squash is the
 * acknowledgement and wants to be over before the finger is, and the spring is the
 * flourish and can take its time.
 *
 * The timings are SWAP_MS and SPRING_MS, the same two constants the language switch
 * has always used — a caller that wants the mechanism gets those numbers with it, so
 * a second control cannot end up bouncing at a rate of its own.
 *
 * It scales the BUTTON. On a glass button that re-rasterises the backdrop blur each
 * frame; the alternative is scaling the label inside and leaving the glass still, which
 * is cheaper but reads as the content shifting inside a fixed shape rather than as the
 * control being pressed. The language switch has bounced its whole button since it was
 * written, and matching it is the point.
 *
 * Null-tolerant, so a caller can pass a ref that has not attached yet.
 */
export function ameBouncePress(
  el: HTMLElement | null,
  swapMs: number = SWAP_MS,
  springMs: number = SPRING_MS,
) {
  if (!el) return
  /*
    Held under prefers-reduced-motion, like every other motion in this file. The
    press is a 0.55 scale collapse followed by an elastic overshoot, which is
    exactly the kind of springy size change the preference is asked for; the
    expand, the collapse and the two below already honoured it and this one did
    not, so the setting half-worked -- which is worse than not working, because
    a reader cannot tell which half.
  */
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  animate(el, {
    scale: 0.55,
    duration: swapMs,
    ease: 'inQuad',
    onComplete: () => {
      animate(el, { scale: 1, duration: springMs, ease: 'outElastic(1, 0.5)' })
    },
  })
}

/**
 * THE EXPAND, downward, on the bounce timing.
 *
 * A disclosure opens by getting TALLER, so the motion is height and nothing else. It
 * was a uniform scale for one revision, which grew the panel from its centre in both
 * axes — the content slid in from the left as much as it dropped, and a list that
 * arrives sideways does not read as a section opening.
 *
 * Height from 0 to the content's own scrollHeight, then handed back to auto so the
 * panel can reflow afterwards — a panel left at a pixel height would not follow a
 * font-size change or a rotation. overflow is clipped for the duration and released
 * with it: outElastic overshoots the target by design, and the overshoot is the bounce.
 *
 * SPRING_MS and outElastic are the language switch's, so the interface has one spring
 * rather than a set of similar ones.
 *
 * Held under prefers-reduced-motion: the panel still opens, it simply arrives at its
 * height instead of springing to it.
 */
export function ameExpandDown(el: HTMLElement | null, springMs: number = SPRING_MS) {
  if (!el) return
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const target = el.scrollHeight
  el.style.overflow = 'hidden'
  animate(el, {
    height: [0, target],
    duration: springMs,
    ease: 'outElastic(1, 0.5)',
    onComplete: () => {
      el.style.height = ''
      el.style.overflow = ''
    },
  })
}

/**
 * AND THE CLOSE, which has to be asked for.
 *
 * <details> hides its content the instant `open` flips, so there is nothing left to
 * animate by the time a toggle handler runs. The caller therefore intercepts the press,
 * runs this, and flips `open` in the callback — the element closes when the motion has
 * finished rather than before it starts.
 *
 * SMOOTH, not springy. outElastic overshoots, which is right for something arriving and
 * wrong for something leaving: a panel that springs shut bounces the content BELOW it,
 * because everything after the accordion moves up as the height falls. inOutQuad eases
 * in and out of the travel and stops.
 *
 * SPRING_MS / 2, kept as the arithmetic. A close reads as sluggish at the full spring
 * duration — the reader has already decided and is waiting on the interface — and the
 * halving keeps the number tied to the same source instead of introducing a third one.
 *
 * Under prefers-reduced-motion it calls back immediately, so the panel closes without
 * the travel and the caller's logic is unchanged.
 */
export function ameCollapseUp(
  el: HTMLElement | null,
  done: () => void,
  ms: number = SPRING_MS / 2,
) {
  if (!el || (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)) {
    done()
    return
  }
  el.style.overflow = 'hidden'
  animate(el, {
    height: [el.scrollHeight, 0],
    duration: ms,
    ease: 'inOutQuad',
    onComplete: () => {
      el.style.height = ''
      el.style.overflow = ''
      done()
    },
  })
}

/**
 * A GLASS SURFACE ARRIVING, and the same one leaving.
 *
 * The accessibility surface has bounced in like this since it was written: from 8px
 * low and a tenth small, springing past its size and settling. The mobile contact and
 * section menus did something adjacent — a back-out cubic-bezier over 300ms — which
 * read as a different interface for no reason anyone had decided. These two functions
 * are that motion, named, and all three surfaces call them.
 *
 * The entrance uses SPRING_MS, the same spring the language switch and the disclosure
 * use; the accessibility surface had 780 hard-coded, which is that number rounded, and
 * unifying on the token is what stops the two drifting apart on the next revision.
 *
 * The exit is FASTER and does not overshoot: inBack pulls slightly under on the way
 * out, which reads as the surface being put away rather than thrown. SPRING_MS is far
 * too long to wait for something the reader has already dismissed.
 *
 * Both clear the transform when they finish, so a settled surface is not left with a
 * matrix that would fight the next layout change.
 */
export function ameSpringOpen(el: HTMLElement | null, springMs: number = SPRING_MS) {
  if (!el) return
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    el.style.opacity = '1'
    el.style.transform = 'none'
    return
  }
  animate(el, {
    opacity: 1,
    translateY: 0,
    scale: 1,
    duration: springMs,
    ease: 'outElastic(1, 0.5)',
    onComplete: () => {
      el.style.transform = 'none'
    },
  })
}

export function ameSpringClose(el: HTMLElement | null, ms: number = EXIT_MS) {
  if (!el) return
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    el.style.opacity = '0'
    el.style.transform = 'translateY(8px) scale(0.9)'
    return
  }
  animate(el, { opacity: 0, translateY: 8, scale: 0.9, duration: ms, ease: 'inBack(2)' })
}

export function AmeLanguageSwitch({
  languages = DEFAULT_LANGS,
  swapMs = SWAP_MS,
  springMs = SPRING_MS,
  lockMs,
  className,
  backdrop,
  buttonRef,
}: {
  languages?: readonly AmeLanguage[]
  swapMs?: number
  springMs?: number
  lockMs?: number
  className?: string
  /*
    The tone of whatever sits behind this control, written to data-backdrop for the
    glass treatments to read. Undefined on the top bar, which is a solid strip and has
    no backdrop to answer to; supplied by the mobile pill, which floats over the page
    beside two other glass buttons that already tone themselves this way.
  */
  backdrop?: 'light' | 'dark'
  /*
    The button itself, for a caller that has to MEASURE it — useBackdropTone reads the
    element's own position to decide the tone above. Handed out rather than re-created,
    because a wrapper node at the same coordinates would be a second element existing
    only to be measured.
  */
  buttonRef?: { current: HTMLButtonElement | null }
}) {
  const [langIndex, setLangIndex] = useState(0)
  const [status, setStatus] = useState<TranslationStatus | null>(null)
  const langBtnRef = useRef<HTMLButtonElement>(null)
  const animating = useRef(false)
  const lock = lockMs ?? swapMs + springMs + LOCK_MARGIN_MS
  const current = languages[langIndex]
  const next = languages[(langIndex + 1) % languages.length]

  const canTranslate = useTranslationSupport(next.tag)

  const cycleLanguage = () => {
    if (animating.current) return
    const el = langBtnRef.current
    const nextIndex = (langIndex + 1) % languages.length
    const target = languages[nextIndex]
    animating.current = true

    // The STATE change is on a timer, never on an animation callback: the label
    // swaps at the bottom of the bounce whether or not anime fires, and the lock
    // always releases. The bounce is purely cosmetic on top of this.
    window.setTimeout(() => {
      setLangIndex(nextIndex)
      void translatePage(target.tag, { onStatus: setStatus })
    }, swapMs)
    window.setTimeout(() => {
      animating.current = false
    }, lock)

    ameBouncePress(el, swapMs, springMs)
  }

  const promise =
    canTranslate === false
      ? 'This browser cannot translate the page, so only the declared language changes.'
      : `Switches the page to ${next.label}.`

  const announcement = statusMessage(status, current.label)

  return (
    <>
      <button
        ref={(node) => {
          langBtnRef.current = node
          if (buttonRef) buttonRef.current = node
        }}
        type="button"
        translate="no"
        data-backdrop={backdrop}
        onClick={cycleLanguage}
        aria-label={`Language: ${current.label}. ${promise}`}
        className={`inline-flex items-center rounded-full px-1.5 py-1 text-[color:var(--tb-fg)] transition-colors duration-200 hover:text-[color:var(--tb-fg-hover)]${className ? ` ${className}` : ''}`}
        style={{ willChange: 'transform' }}
      >
        {/* Fixed floor on the width (the row is justify-end, so a shrinking box
            would drag the icon left on each swap). 18.5px clears EN's rendered
            18.41px, the widest of the four. On the span, not the button. */}
        <span className="inline-block min-w-[var(--ame-component-topbar-lang-min-width)] text-center text-(length:--ame-type-meta-size) tracking-(--ame-type-body-tracking)">
          {current.label}
        </span>
      </button>
      {/*
        The status, for screen readers only. Polite, so it waits for a pause
        rather than interrupting, and it names the language so the announcement
        stands on its own out of context.
      */}
      <span aria-live="polite" className="sr-only" translate="no">
        {announcement}
      </span>
    </>
  )
}

export function AmeTopBar({
  tone = 'light',
  languages = DEFAULT_LANGS,
  className,
  maxWidth = 'max-w-5xl',
  innerClassName,
  leading,
  controls = true,
  onAccessibility,
  swapMs = SWAP_MS,
  springMs = SPRING_MS,
  lockMs,
}: {
  tone?: Tone
  /** The cycle. First entry is the initial <html lang>. */
  languages?: readonly AmeLanguage[]
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
  /**
   * Render the strip's own accessibility and language controls. Off when the
   * consuming site hosts that pair somewhere else — the portfolio puts them in
   * its header band — so the two never both exist.
   */
  controls?: boolean
  /** Opens the consumer's accessibility surface from the strip's a11y glyph. */
  onAccessibility?: () => void
}) {
  const dark = tone === 'dark'

  // The fg/fg-hover pair travels on CSS vars so the buttons' hover works with
  // whichever tone is live — inline style can't express :hover.
  const barVars = {
    ['--tb-fg' as string]: dark ? 'var(--ame-component-topbar-fg-on-dark)' : 'var(--ame-component-topbar-fg)',
    ['--tb-fg-hover' as string]: dark
      ? 'var(--ame-component-topbar-fg-hover-on-dark)'
      : 'var(--ame-component-topbar-fg-hover)',
  }

  return (
    <div
      data-backdrop={dark ? 'dark' : undefined}
      className={`w-full${className ? ` ${className}` : ''}`}
      style={{
        height: 'var(--ame-component-topbar-height)',
        backgroundColor: dark ? 'var(--ame-component-topbar-bg-on-dark)' : 'var(--ame-component-topbar-bg)',
        ...barVars,
      }}
    >
      <div
        className={`mx-auto flex h-full ${maxWidth} items-center justify-end gap-5 px-[var(--ame-space-gutter)]${innerClassName ? ` ${innerClassName}` : ''}`}
      >
        {/* Consumer-supplied control (the portfolio's light/dark toggle), leftmost
            in the right-aligned cluster. */}
        {leading}
        {/*
          The same two controls the header band can host, rendered from the same
          components rather than from a second copy of their markup. The strip
          used to inline both — including its own language cycler, which set
          <html lang> from the lowercased LABEL and so declared Japanese as "jp".
          One home each means that class of bug can only be fixed once.
        */}
        {controls ? (
          <>
            <AmeAccessibilityButton onAccessibility={onAccessibility} />
            <AmeLanguageSwitch languages={languages} swapMs={swapMs} springMs={springMs} lockMs={lockMs} />
          </>
        ) : null}
      </div>
    </div>
  )
}
