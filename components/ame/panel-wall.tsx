'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

/*
  PanelWall — an isometric wall of portrait app screens that drifts vertically,
  six columns receding on the diagonal. Ported to the ame system: the frame,
  tiles, and mock content take the ame tokens (surface, hairline, radius, brand)
  rather than the original's hardcoded greys, so it sits inside the docs like the
  term-sheet card.

  Content is data. Each column item is one of:
    - { src } an image (a real product screen served from /public), or
    - { node } a live React node, or
    - { mock } an ame-styled placeholder screen (the design-system default, so the
      catalog shows the motion and layout without shipping a real screenshot).

  Motion respects prefers-reduced-motion: it settles to a static offset instead of
  drifting.
*/

export type PanelItem = { src?: string; node?: ReactNode; mock?: number; aspect?: string }
export type PanelColumn = { speed: number; offset: number; items: PanelItem[] }

// Five ame mock screens, staggered across six columns so no two neighbours show
// the same screen at the same height.
const MOCKS: PanelItem[] = [0, 1, 2, 3, 4].map((n) => ({ mock: n, aspect: '375/813' }))

// The stagger: six columns of three, ordered so no two neighbours show the same
// screen at the same height. Same layout whether the tiles are mocks or images.
//
// The outer two were added to the original four, one on each side. The wall grows
// to fit them — see the geometry in PanelWall — so a tile is the same size it has
// always been; the added columns are extra wall, not a re-slicing of the old one.
//
// Every column carries its own speed so no two ever drift in lockstep, and the
// two new ones are seeded between the existing values rather than outside them —
// the wall reads as one field with no column running visibly fast or slow.
function stagger(items: PanelItem[]): PanelColumn[] {
  const at = (i: number) => items[i % items.length]
  return [
    { speed: 88, offset: 0.05, items: [at(3), at(1), at(2)] },
    { speed: 70, offset: 0.35, items: [at(0), at(3), at(1)] },
    { speed: 95, offset: 0.6, items: [at(2), at(0), at(4)] },
    { speed: 80, offset: 0.15, items: [at(4), at(1), at(3)] },
    { speed: 110, offset: 0.5, items: [at(1), at(2), at(0)] },
    { speed: 102, offset: 0.8, items: [at(4), at(0), at(3)] },
  ]
}

const defaultColumns = stagger(MOCKS)

// ---- Ame mock screen ----------------------------------------------------
// A stylised app screen in ame tokens: a notch, a header, a hero block, copy
// rows, and a primary action. Even variants lean on the brand accent.

function PhoneMock({ variant = 0 }: { variant?: number }) {
  const accent = variant % 2 === 0
  const bar = (w: string, c = 'var(--port-hairline)') => (
    <div style={{ height: 7, width: w, borderRadius: 4, background: c }} />
  )
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '5%',
        padding: '8% 7%',
        boxSizing: 'border-box',
        background: 'var(--ame-background-page)',
      }}
    >
      <div style={{ height: 6, width: '34%', margin: '0 auto', borderRadius: 999, background: 'var(--port-hairline)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '6%' }}>
        <div style={{ width: '15%', aspectRatio: '1', borderRadius: 999, background: accent ? 'var(--ame-text-brand)' : 'var(--port-hairline)' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {bar('68%', 'var(--ame-text-secondary)')}
          {bar('44%')}
        </div>
      </div>
      <div
        style={{
          width: '100%',
          flex: '0 0 32%',
          borderRadius: 10,
          background: accent ? 'color-mix(in oklab, var(--ame-text-brand) 24%, transparent)' : 'var(--port-hairline)',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {['92%', '78%', '84%', '62%'].map((w, i) => (
          <div key={i}>{bar(w)}</div>
        ))}
      </div>
      <div
        style={{
          marginTop: 'auto',
          height: '9%',
          borderRadius: 999,
          background: accent ? 'var(--ame-text-brand)' : 'color-mix(in oklab, var(--ame-text-body) 12%, transparent)',
        }}
      />
    </div>
  )
}

// ---- Tile ---------------------------------------------------------------

/*
  `eager` marks a tile that is in the initial viewport.

  Every tile was hard-coded loading="lazy" with no opt-out, including the ones
  the wall paints first. Lazy-loading the image a page opens on is the named LCP
  anti-pattern: the browser is told to defer exactly the fetch it should start
  soonest, so the largest contentful paint waits on a request that was
  deliberately delayed. The caller decides, because only the caller knows which
  tiles are above the fold.
*/
function Panel({ item, eager = false }: { item: PanelItem; eager?: boolean }) {
  const aspect = item.aspect || '375/813'
  const box: CSSProperties = {
    aspectRatio: aspect.replace('/', ' / '),
    flexShrink: 0,
    width: '100%',
    overflow: 'hidden',
    borderRadius: 12,
    border: '1px solid var(--port-hairline)',
    background: 'var(--ame-background-page)',
  }
  if (item.src) {
    return (
      <div style={box}>
        <img
          src={item.src}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : undefined}
          decoding="async"
          draggable={false} style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
      </div>
    )
  }
  if (item.node) return <div style={box}>{item.node}</div>
  return (
    <div style={box}>
      <PhoneMock variant={item.mock ?? 0} />
    </div>
  )
}

// ---- Drifting column ----------------------------------------------------

function DriftColumn({ items, speed = 80, offset = 0, gap = 32, reduceMotion, eagerFirstTile = true }: PanelColumn & { gap?: number; reduceMotion: boolean; eagerFirstTile?: boolean }) {
  const style: CSSProperties = reduceMotion
    ? { transform: `translateY(-${offset * 25}%)` }
    : { animation: `panelwall-drift ${speed}s linear infinite`, animationDelay: `-${offset * speed}s` }
  return (
    <div style={{ overflow: 'visible' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap, ...style }}>
        {[0, 1].map((copy) => (
          <div key={copy} style={{ display: 'flex', flexDirection: 'column', gap }} aria-hidden={copy === 1}>
            {items.map((item, i) => (
              // Copy 0 is the one on screen at rest; copy 1 is the drift's
              // second lap and is aria-hidden. Only the first tile of the first
              // copy can be the largest contentful paint.
              <Panel key={`${copy}-${i}`} item={item} eager={eagerFirstTile && copy === 0 && i === 0} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- Main component -----------------------------------------------------

export function PanelWall({
  columns,
  screens,
  gap = 32,
  className,
  height = '22rem',
  href,
  frame = true,
  overlay,
  eagerFirstTile = true,
}: {
  /** The columns of screens (six by default). Each item is an image ({src}), a node ({node}), or an ame mock ({mock}). Overrides `screens`. */
  columns?: PanelColumn[]
  /** Image URLs to fill the staggered columns. Omitted, the ame mock screens are shown (the design-system default). */
  screens?: string[]
  /** Gap between tiles, px. */
  gap?: number
  className?: string
  /** Box height (the width follows the container, the term-sheet card's width). */
  height?: string
  /** Wrap the wall in a link. */
  href?: string
  /**
   * Whether the first tile of the first column is fetched eagerly, at high priority.
   *
   * THE DOCBLOCK ON `Panel` SAYS "the caller decides, because only the caller knows
   * which tiles are above the fold" -- and until now the caller could not, because
   * the decision was hardcoded here. This is that prop.
   *
   * It defaults true, which keeps every existing caller exactly as it was: eager is
   * right when the wall opens the page, and lazy-loading the LCP image is the named
   * anti-pattern that comment is about.
   *
   * It is wrong when the wall is below the fold. The portfolio home is that case --
   * its hero occupies the first screen at every breakpoint -- and the cost of getting
   * it wrong there was 438,553 B of SVG fetched at HIGH priority, ahead of the
   * things the first screen actually paints, for a tile nobody had scrolled to
   * (R-200).
   */
  eagerFirstTile?: boolean
  /**
   * Draw the wall's own outer hairline. Off when the wall sits inside a card
   * that already frames it, so the two do not stack into a double edge.
   * The per-tile hairlines are not affected — those belong to the screens.
   */
  frame?: boolean
  /**
   * Content laid over the tiles, INSIDE the wall's own box — so it takes the
   * same radius and the same overflow clip the tiles take, rather than being
   * clipped by whatever the host happens to wrap the wall in. Position it with
   * `absolute`; the wall box is the containing block.
   */
  overlay?: ReactNode
} = {}) {
  const cols = columns ?? (screens ? stagger(screens.map((src) => ({ src, aspect: '375/813' }))) : defaultColumns)

  /*
    The wall grows outward; the tiles do not shrink.

    The isometric geometry below (a 112rem square, top 30%, right 54%) was authored
    around four tracks, so one track is a quarter of the square. Rather than divide
    that fixed square into more, thinner columns — which would have kept the wall
    the same size and made every phone smaller — the grid widens by a full track
    for each column added, and shifts left by half of what it gained so the growth
    is symmetric: columns arrive at both edges instead of piling onto the right.

    At four columns these resolve to 100% and 54%, which is the original geometry
    exactly. Nothing moves until a fifth column exists.
  */
  const TRACK_PCT = 100 / 4
  const wallWidth = `${cols.length * TRACK_PCT}%`
  const wallRight = `${54 + ((cols.length - 4) / 2) * TRACK_PCT}%`
  const [reduceMotion, setReduceMotion] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const wall = (
    <div
      /*
        The radius lives on this class rather than in the style below, because a
        style attribute cannot carry a media query and one caller needs it to: the
        portfolio home runs this wall full-bleed on a phone, where a rounded corner
        is a corner on nothing. Everywhere else the class resolves to the same
        component token this used to state inline, so nothing else moves.
      */
      className="ame-panel-wall"
      style={{
        height,
        width: '100%',
        // The containing block for `overlay`, so an absolute child is clipped by
        // this box's overflow and radius rather than by the host's wrapper.
        position: 'relative',
        // The tiles run an infinite transform animation, which the compositor
        // promotes to its own layer. Anything painted OVER that has to be
        // promoted with it or the two are composited from different frames —
        // which is the tearing an overlay shows while the page scrolls. Isolating
        // here keeps that resolution inside the wall instead of leaving it to the
        // page's blend layers (.portfolio-root::after paints with mix-blend-mode
        // over everything).
        isolation: 'isolate',
        overflow: 'hidden',
        // Omitted rather than set to `none`, so nothing is declared at all when
        // the host card owns the frame.
        ...(frame ? { border: '1px solid var(--port-hairline)' } : null),
        /*
          NO GROUND OF ITS OWN. This box used to paint --ame-background-page, which
          was the same value as whatever it sat on in both callers — so it never
          showed, and it was one more opaque layer between the tiles and anything a
          host might want to put behind them. The tiles bring their own fills; the
          space between them is the host's to decide.

          Left transparent rather than removed from the type: `background` is the
          kind of thing a caller might want back, and the absence is the statement.
        */
      }}
    >
      <div style={{ display: 'flex', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <div className="scale-[0.42] sm:scale-[0.6] lg:scale-75" style={{ flexShrink: 0, width: '112rem', height: '112rem' }}>
          <div
            style={{
              position: 'relative',
              display: 'grid',
              // Counted, not hardcoded: `columns` is a public prop, so the track
              // count has to come from whatever was passed rather than from a
              // literal that silently disagrees with it.
              gridTemplateColumns: `repeat(${cols.length}, 1fr)`,
              width: wallWidth,
              height: '100%',
              transformOrigin: 'top left',
              top: '30%',
              right: wallRight,
              gap,
              transformStyle: 'preserve-3d',
              transform: 'rotateX(55deg) rotateZ(-45deg)',
            }}
          >
            {cols.map((col, i) => (
              <DriftColumn key={i} items={col.items} speed={col.speed} offset={col.offset} gap={gap} reduceMotion={reduceMotion}
              eagerFirstTile={eagerFirstTile} />
            ))}
          </div>
        </div>
      </div>
      {/* After the tiles in source order, so it paints above them without a
          z-index of its own. */}
      {overlay}
    </div>
  )

  return (
    <div className={className}>
      <style>{`@keyframes panelwall-drift { from { transform: translateY(0); } to { transform: translateY(-50%); } }`}</style>
      {href ? (
        <a href={href} style={{ display: 'block' }}>
          {wall}
        </a>
      ) : (
        wall
      )}
    </div>
  )
}
