'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

/*
  PanelWall — an isometric wall of portrait app screens that drifts vertically,
  four columns receding on the diagonal. Ported to the ame system: the frame,
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

// Five ame mock screens, staggered across four columns so no two neighbours show
// the same screen at the same height.
const MOCKS: PanelItem[] = [0, 1, 2, 3, 4].map((n) => ({ mock: n, aspect: '375/813' }))

// The stagger: four columns of three, ordered so no two neighbours show the same
// screen at the same height. Same layout whether the tiles are mocks or images.
function stagger(items: PanelItem[]): PanelColumn[] {
  const at = (i: number) => items[i % items.length]
  return [
    { speed: 70, offset: 0.35, items: [at(0), at(3), at(1)] },
    { speed: 95, offset: 0.6, items: [at(2), at(0), at(4)] },
    { speed: 80, offset: 0.15, items: [at(4), at(1), at(3)] },
    { speed: 110, offset: 0.5, items: [at(1), at(2), at(0)] },
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
        background: 'var(--port-page-bg)',
      }}
    >
      <div style={{ height: 6, width: '34%', margin: '0 auto', borderRadius: 999, background: 'var(--port-hairline)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '6%' }}>
        <div style={{ width: '15%', aspectRatio: '1', borderRadius: 999, background: accent ? 'var(--port-brand)' : 'var(--port-hairline)' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {bar('68%', 'var(--port-text-secondary)')}
          {bar('44%')}
        </div>
      </div>
      <div
        style={{
          width: '100%',
          flex: '0 0 32%',
          borderRadius: 10,
          background: accent ? 'color-mix(in oklab, var(--port-brand) 24%, transparent)' : 'var(--port-hairline)',
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
          background: accent ? 'var(--port-brand)' : 'color-mix(in oklab, var(--port-text-primary) 12%, transparent)',
        }}
      />
    </div>
  )
}

// ---- Tile ---------------------------------------------------------------

function Panel({ item }: { item: PanelItem }) {
  const aspect = item.aspect || '375/813'
  const box: CSSProperties = {
    aspectRatio: aspect.replace('/', ' / '),
    flexShrink: 0,
    width: '100%',
    overflow: 'hidden',
    borderRadius: 12,
    border: '1px solid var(--port-hairline)',
    background: 'var(--port-page-bg)',
  }
  if (item.src) {
    return (
      <div style={box}>
        <img src={item.src} alt="" loading="lazy" decoding="async" draggable={false} style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
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

function DriftColumn({ items, speed = 80, offset = 0, gap = 32, reduceMotion }: PanelColumn & { gap?: number; reduceMotion: boolean }) {
  const style: CSSProperties = reduceMotion
    ? { transform: `translateY(-${offset * 25}%)` }
    : { animation: `panelwall-drift ${speed}s linear infinite`, animationDelay: `-${offset * speed}s` }
  return (
    <div style={{ overflow: 'visible' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap, ...style }}>
        {[0, 1].map((copy) => (
          <div key={copy} style={{ display: 'flex', flexDirection: 'column', gap }} aria-hidden={copy === 1}>
            {items.map((item, i) => (
              <Panel key={`${copy}-${i}`} item={item} />
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
}: {
  /** Four columns of screens. Each item is an image ({src}), a node ({node}), or an ame mock ({mock}). Overrides `screens`. */
  columns?: PanelColumn[]
  /** Image URLs to fill the four staggered columns. Omitted, the ame mock screens are shown (the design-system default). */
  screens?: string[]
  /** Gap between tiles, px. */
  gap?: number
  className?: string
  /** Box height (the width follows the container, the term-sheet card's width). */
  height?: string
  /** Wrap the wall in a link. */
  href?: string
} = {}) {
  const cols = columns ?? (screens ? stagger(screens.map((src) => ({ src, aspect: '375/813' }))) : defaultColumns)
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
      style={{
        height,
        width: '100%',
        overflow: 'hidden',
        borderRadius: 'var(--component-card-radius)',
        border: '1px solid var(--port-hairline)',
        background: 'var(--port-page-bg)',
      }}
    >
      <div style={{ display: 'flex', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <div className="scale-[0.42] sm:scale-[0.6] lg:scale-75" style={{ flexShrink: 0, width: '112rem', height: '112rem' }}>
          <div
            style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              width: '100%',
              height: '100%',
              transformOrigin: 'top left',
              top: '30%',
              right: '54%',
              gap,
              transformStyle: 'preserve-3d',
              transform: 'rotateX(55deg) rotateZ(-45deg)',
            }}
          >
            {cols.map((col, i) => (
              <DriftColumn key={i} items={col.items} speed={col.speed} offset={col.offset} gap={gap} reduceMotion={reduceMotion} />
            ))}
          </div>
        </div>
      </div>
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
