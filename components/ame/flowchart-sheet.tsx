import type { CSSProperties, ReactNode } from 'react'
import { FLOWCHART_PRESETS } from './flowchart-presets'

/*
  FlowchartSheet — an ISO 5807 flowchart rendered as a consumable component. The
  diagram is data: pass nodes, edges, and annotations, and it renders the SVG layer,
  the HTML label layer, the header, and the ISO legend. The default data is generic
  placeholder, so the design-system catalog shows the shape without a real decision;
  a real sheet passes its own `data`.

  It consumes the ame palette through the design-system tokens (text, brand, border,
  the portfolio face). The tokens used are the fixed semantic values, so the sheet
  stays the light technical drawing it is drawn to be rather than flipping with the
  docs theme. SVG colours are set through `style` (not the fill/stroke attributes) so
  the token var()s resolve — a var() in an SVG presentation attribute would not.

  Node types: "terminator" | "process" | "decision".
*/

// ---- Types --------------------------------------------------------------

type NodeType = 'terminator' | 'process' | 'decision'

export type FlowNode = {
  id: string
  type: NodeType
  x: number
  y: number
  w: number
  h: number
  label: string
  sublabel?: string
  accent?: boolean
  bold?: boolean
  muted?: boolean
  /** A UI screen this state shows. The node carries a portrait thumbnail that expands to a preview on hover. */
  screen?: string
}

export type FlowEdge = {
  from: [number, number]
  to: [number, number]
  via?: [number, number][]
  accent?: boolean
  label?: string
  labelAt?: [number, number]
}

export type FlowAnnotation = {
  side: 'left' | 'right'
  bracket?: { x: number; y1: number; y2: number }
  leader?: { x1: number; x2: number; y: number }
  text: { x: number; y: number; w: number }
  lines: string[]
}

export type FlowchartData = {
  eyebrow: string
  title: string
  meta: string[]
  canvas: { width: number; height: number }
  nodes: FlowNode[]
  edges: FlowEdge[]
  annotations?: FlowAnnotation[]
  footer: string
}

export type FlowchartTheme = {
  ink: string
  accent: string
  muted: string
  subtle: string
  paper: string
  gridLine: string
  border: string
  page: string
  surface: string
  dot: string
  radius: string
  fontSans: string
  fontMono: string
}

// ---- Theme: the ame palette, through the design-system tokens ------------

const defaultTheme: FlowchartTheme = {
  // The adaptive --port-* aliases, so the sheet tracks the docs theme: the ink is the
  // same colour as the running paragraph text (white on dark, ink on light), and the
  // paper flips with it so the two always contrast.
  ink: 'var(--ame-text-body)',
  accent: 'var(--ame-text-brand)',
  muted: 'var(--ame-text-secondary)',
  subtle: 'var(--ame-text-secondary)',
  paper: 'var(--ame-background-page)',
  gridLine: 'color-mix(in oklab, var(--ame-text-body) 8%, transparent)',
  // The iPhone viewer card's edge: rgba(255,255,255,0.15), here as the adaptive mix.
  border: 'color-mix(in oklab, var(--ame-text-body) 15%, transparent)',
  page: 'color-mix(in oklab, var(--ame-text-body) 4%, transparent)',
  surface: 'var(--ame-background-page)',
  // The iPhone viewer card's dot: rgba(255,255,255,0.36) at 0.61px on a 16px tile,
  // here as the adaptive mix so it tracks the surface.
  dot: 'color-mix(in oklab, var(--ame-text-body) 36%, transparent)',
  radius: 'var(--ame-component-card-radius)',
  fontSans: 'var(--ame-type-font-body)',
  fontMono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
}

// ---- Default data: generic placeholder (shown in the design system) ------

const defaultData: FlowchartData = {
  eyebrow: 'FLOWCHART — DECISION',
  title: 'Option A vs. Option B',
  meta: ['Convention: ISO 5807-1985', 'Sheet 1/1'],
  canvas: { width: 1180, height: 790 },
  nodes: [
    { id: 'start', type: 'terminator', x: 470, y: 20, w: 240, h: 56, label: 'Start' },
    { id: 'eval', type: 'process', x: 420, y: 116, w: 340, h: 72, label: 'Evaluate the options against the constraint' },
    { id: 'decide', type: 'decision', x: 440, y: 228, w: 300, h: 180, label: 'Select an option' },
    { id: 'a', type: 'process', x: 190, y: 430, w: 280, h: 80, label: 'Option A', sublabel: 'Mechanic A' },
    { id: 'b', type: 'process', x: 710, y: 430, w: 280, h: 80, label: 'Option B', sublabel: 'Mechanic B', accent: true },
    { id: 'reject', type: 'terminator', x: 230, y: 696, w: 200, h: 56, label: 'Reject A', muted: true },
    { id: 'select', type: 'terminator', x: 750, y: 696, w: 200, h: 56, label: 'Select B ✓', accent: true, bold: true },
  ],
  edges: [
    { from: [590, 76], to: [590, 112] },
    { from: [590, 188], to: [590, 224] },
    { from: [440, 318], via: [[330, 318]], to: [330, 426], label: 'Option A', labelAt: [344, 292] },
    { from: [740, 318], via: [[850, 318]], to: [850, 426], accent: true, label: 'Option B', labelAt: [762, 292] },
    { from: [330, 510], to: [330, 692] },
    { from: [850, 510], to: [850, 692], accent: true },
  ],
  annotations: [
    {
      side: 'left',
      bracket: { x: 296, y1: 566, y2: 658 },
      leader: { x1: 296, x2: 326, y: 612 },
      text: { x: 56, y: 566, w: 222 },
      lines: ['+ Benefit of option A', '− Tradeoff of option A'],
    },
    {
      side: 'right',
      bracket: { x: 884, y1: 566, y2: 658 },
      leader: { x1: 884, x2: 854, y: 612 },
      text: { x: 902, y: 560, w: 230 },
      lines: ['+ Benefit of option B', '+ Second benefit', '+ Third benefit'],
    },
  ],
  footer: 'Flow: top→bottom, left→right',
}

// ---- Synthesized bold: the eyebrow's weight ------------------------------
// The Neue Haas cuts have no bold axis, so the docs synthesize weight with a
// stroke on the 400 face (--ame-type-heading-synthesis), painted under the fill — the
// same custom thickness the ame eyebrows and headings use. Diagram bold matches
// it rather than reaching for a heavier numeric weight.
const synthBold: CSSProperties = {
  fontWeight: 400,
  WebkitTextStroke: 'var(--ame-type-heading-synthesis) currentColor',
  paintOrder: 'stroke fill',
}

// ---- SVG shape per node type --------------------------------------------

function NodeShape({ node, theme, fill }: { node: FlowNode; theme: FlowchartTheme; fill: string }) {
  // Non-accent shapes and connectors draw at 1px in the ame secondary text colour,
  // not full-white ink, so the lines read as thin secondary strokes.
  const stroke = node.accent ? theme.accent : theme.muted
  const sw = node.accent ? (node.type === 'terminator' ? 2.5 : 2) : 1
  const shapeStyle: CSSProperties = { fill, stroke, strokeWidth: sw }

  if (node.type === 'terminator') {
    return <rect x={node.x} y={node.y} width={node.w} height={node.h} rx={node.h / 2} style={shapeStyle} />
  }
  if (node.type === 'decision') {
    const cx = node.x + node.w / 2
    const cy = node.y + node.h / 2
    const pts = `${cx},${node.y} ${node.x + node.w},${cy} ${cx},${node.y + node.h} ${node.x},${cy}`
    return <polygon points={pts} style={shapeStyle} />
  }
  return <rect x={node.x} y={node.y} width={node.w} height={node.h} style={shapeStyle} />
}

function Edge({ edge, theme }: { edge: FlowEdge; theme: FlowchartTheme }) {
  const stroke = edge.accent ? theme.accent : theme.muted
  const sw = edge.accent ? 1.5 : 1
  const marker = edge.accent ? 'url(#fc-arr-accent)' : 'url(#fc-arr)'
  if (edge.via && edge.via.length) {
    const pts = [edge.from, ...edge.via, edge.to].map((p) => p.join(',')).join(' ')
    return <polyline points={pts} markerEnd={marker} style={{ fill: 'none', stroke, strokeWidth: sw }} />
  }
  return (
    <line x1={edge.from[0]} y1={edge.from[1]} x2={edge.to[0]} y2={edge.to[1]} markerEnd={marker} style={{ stroke, strokeWidth: sw }} />
  )
}

// ---- HTML label layer ---------------------------------------------------

function NodeLabel({ node, theme }: { node: FlowNode; theme: FlowchartTheme }) {
  const color = node.accent && node.bold ? theme.accent : node.muted ? theme.subtle : theme.ink
  // A foreignObject at the node's canvas rect: the HTML label rides inside the SVG,
  // so it scales with the drawing instead of sitting in a separate fixed layer.
  return (
    <foreignObject x={node.x} y={node.y} width={node.w} height={node.h}>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 3,
          padding: '0 20px',
          boxSizing: 'border-box',
          fontFamily: theme.fontSans,
        }}
      >
        <div style={{ fontSize: node.type === 'terminator' ? 14 : 15, color, lineHeight: 1.25, ...synthBold }}>{node.label}</div>
        {node.sublabel && <div style={{ fontSize: 13, color: theme.subtle, lineHeight: 1.25 }}>{node.sublabel}</div>}
      </div>
    </foreignObject>
  )
}

function LegendItem({ children, label, w = 34, h = 18 }: { children: ReactNode; label: string; w?: number; h?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width={w} height={h}>
        {children}
      </svg>
      {label}
    </div>
  )
}

// ---- Vocabulary views: the drawing's parts, one specimen each ------------
// The `view` prop renders one part of the vocabulary on its own — the symbol
// legend, the line treatments, or the arrowheads — so the catalog shows each as
// a labelled specimen instead of only the whole sheet.

type VocabView = 'legend' | 'lines' | 'arrows'
type Specimen = { label: string; node: ReactNode }

function vocabSpecimens(view: VocabView, theme: FlowchartTheme): Specimen[] {
  const ink: CSSProperties = { fill: 'none', stroke: theme.ink, strokeWidth: 1.5 }
  const muted: CSSProperties = { fill: 'none', stroke: theme.muted, strokeWidth: 1.4 }
  const accent: CSSProperties = { fill: 'none', stroke: theme.accent, strokeWidth: 2 }

  if (view === 'legend') {
    return [
      { label: 'Terminator', node: <rect x={4} y={12} width={72} height={24} rx={12} style={ink} /> },
      { label: 'Process', node: <rect x={4} y={12} width={72} height={24} style={ink} /> },
      { label: 'Decision', node: <polygon points="40,8 76,24 40,40 4,24" style={ink} /> },
      {
        label: 'Annotation',
        node: (
          <>
            <polyline points="26,10 14,10 14,38 26,38" style={muted} />
            <line x1={26} y1={24} x2={58} y2={24} strokeDasharray="4 4" style={muted} />
          </>
        ),
      },
    ]
  }
  if (view === 'lines') {
    return [
      { label: 'Flow line', node: <line x1={6} y1={24} x2={74} y2={24} style={ink} /> },
      { label: 'Accent path', node: <polyline points="6,12 40,12 40,36 74,36" style={accent} /> },
      { label: 'Leader', node: <line x1={6} y1={24} x2={74} y2={24} strokeDasharray="4 4" style={muted} /> },
    ]
  }
  return [
    {
      label: 'Flow',
      node: (
        <>
          <defs>
            <marker id="fc-v-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" style={{ fill: theme.ink }} />
            </marker>
          </defs>
          <line x1={6} y1={24} x2={68} y2={24} markerEnd="url(#fc-v-arr)" style={{ stroke: theme.ink, strokeWidth: 1.5 }} />
        </>
      ),
    },
    {
      label: 'Selected route',
      node: (
        <>
          <defs>
            <marker id="fc-v-arr-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" style={{ fill: theme.accent }} />
            </marker>
          </defs>
          <line x1={6} y1={24} x2={68} y2={24} markerEnd="url(#fc-v-arr-accent)" style={{ stroke: theme.accent, strokeWidth: 2 }} />
        </>
      ),
    },
  ]
}

function VocabularyPanel({ view, theme }: { view: VocabView; theme: FlowchartTheme }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 20,
        justifyContent: 'center',
        alignItems: 'flex-end',
        fontFamily: theme.fontSans,
        color: theme.ink,
      }}
    >
      {vocabSpecimens(view, theme).map((s) => (
        <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, minWidth: 92 }}>
          <svg viewBox="0 0 80 48" width={80} height={48} style={{ display: 'block', overflow: 'visible' }}>
            {s.node}
          </svg>
          <div style={{ fontFamily: theme.fontMono, fontSize: 11, letterSpacing: '0.06em', color: theme.muted }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}

// ---- Screen node: a state that carries a UI screen -----------------------
// The node keeps its drawn shape; this rides on top with a portrait thumbnail of
// the screen and the state label. On hover the thumbnail expands into a preview
// that floats over the diagram, eased with the ame card-motion tokens.

const SCREEN_ASPECT = 375 / 818

function ScreenNode({ node, theme }: { node: FlowNode; theme: FlowchartTheme }) {
  const labelColor = node.accent ? theme.accent : theme.ink
  const previewH = 440
  const previewW = Math.round(previewH * SCREEN_ASPECT)
  const gap = 12
  const cover: CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }
  // The foreignObject reaches up to hold the preview above the node (Chrome clips
  // foreignObject content to its own box, so the preview must live inside it). The
  // container is inert; only the node hit-area takes pointer events, and :has()
  // reveals the preview when that hit-area is hovered.
  return (
    <foreignObject x={node.x} y={node.y - previewH - gap} width={node.w} height={previewH + gap + node.h} style={{ overflow: 'visible' }}>
      <div className="fc-screen-node" style={{ position: 'relative', width: '100%', height: '100%', fontFamily: theme.fontSans, pointerEvents: 'none' }}>
        <div
          className="fc-screen-preview"
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            width: previewW,
            height: previewH,
            borderRadius: 14,
            overflow: 'hidden',
            border: `1px solid ${theme.border}`,
            boxShadow: 'rgba(0,0,0,0.5) 0 16px 48px',
            background: theme.surface,
          }}
        >
          <img src={node.screen} alt={node.label} loading="lazy" decoding="async" draggable={false} style={cover} />
        </div>
        <div
          className="fc-node-hit"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: node.h,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 14px',
            boxSizing: 'border-box',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ flexShrink: 0, width: 40, height: 68, borderRadius: 5, overflow: 'hidden', border: `1px solid ${theme.muted}`, background: theme.surface }}>
            <img src={node.screen} alt="" loading="lazy" decoding="async" draggable={false} style={cover} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
            <div style={{ fontSize: 14, color: labelColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...synthBold }}>{node.label}</div>
            {node.sublabel && <div style={{ fontSize: 12, lineHeight: 1.35, color: theme.subtle }}>{node.sublabel}</div>}
          </div>
        </div>
      </div>
    </foreignObject>
  )
}

// ---- Main component -----------------------------------------------------

export function FlowchartSheet({
  data,
  preset,
  theme = defaultTheme,
  width = 1180,
  view,
  labels = true,
  header = false,
  legend = true,
  transparent = false,
  expand = true,
  dots: showDots = true,
}: {
  data?: FlowchartData
  /** Name of a worked-example dataset in flowchart-presets. Ignored when `data` is passed. */
  preset?: string
  theme?: FlowchartTheme
  width?: number
  /** Show one part of the drawing's vocabulary on its own — the symbol legend, the line treatments, or the arrowheads — instead of the whole sheet. */
  view?: 'legend' | 'lines' | 'arrows'
  /** The diagram's text — node labels, branch labels, annotation copy. Off leaves the bare shapes. */
  labels?: boolean
  /** The title header block (eyebrow, title, sheet meta). Off by default: a drawn diagram carries no title chrome. */
  header?: boolean
  /** The ISO symbol legend footer. */
  legend?: boolean
  /** The sheet's own dot field. Off where the page already draws one, so the two do
   * not stack into a moire and the sheet's box stops having a visible edge. */
  dots?: boolean
  /** The mobile Expand link out to the full-screen view. Off inside that view itself,
   * which would otherwise offer a link to the page the reader is already on. */
  expand?: boolean
  /** Drop the paper fill, border and shadow: the grid shows on a transparent ground, node fills go clear, and the sheet scales to fit rather than scrolling. */
  transparent?: boolean
} = {}) {
  // A `view` renders that one part of the vocabulary as labelled specimens; with
  // no view the full sheet is drawn.
  if (view) return <VocabularyPanel view={view} theme={theme} />
  const resolvedData = data ?? (preset ? FLOWCHART_PRESETS[preset] ?? defaultData : defaultData)
  const { canvas } = resolvedData
  const nodeFill = transparent ? 'transparent' : theme.surface
  // The viewer card's dot field: a 0.61px dot on a 16px tile, the diagram's background.
  const dots = `radial-gradient(${theme.dot} 0.61px, transparent 0.61px)`
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: theme.fontSans,
        color: theme.ink,
      }}
    >
      {/*
        EXPAND, on a phone only, and only when the sheet knows which preset it is.

        These are drawn at 1180px. In an article column on a 390px screen that is a
        third of the width they were laid out for, and the node labels stop being
        readable before the shapes do — the diagram is still THERE, which is what
        makes it easy to miss that it can no longer be read.

        A preset is what gives the full view a URL, so a sheet passed inline `data`
        gets no button rather than a link to a page that cannot exist. New tab: the
        reader keeps their place in the study, and can leave the diagram open beside
        it.
      */}
      {preset && expand && (
        <a
          href={`/portfolio/diagram/${preset}`}
          target="_blank"
          rel="noopener noreferrer"
          className="port-diagram-expand md:hidden"
        >
          Expand
          <span aria-hidden="true"> ↗</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}
      <style>{`
        .fc-screen-node .fc-screen-preview {
          opacity: 0;
          transform: translateX(-50%) translateY(10px) scale(0.96);
          transform-origin: 50% 100%;
          pointer-events: none;
          transition: opacity var(--ame-motion-card-duration, 220ms) var(--ame-motion-enter-ease, ease),
                      transform var(--ame-motion-card-duration, 220ms) var(--ame-motion-enter-ease, ease);
        }
        .fc-screen-node:has(.fc-node-hit:hover) .fc-screen-preview { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
      `}</style>
      <div
        style={{
          width: '100%',
          maxWidth: width,
          borderRadius: theme.radius,
          border: transparent ? 'none' : `1px solid ${theme.border}`,
          overflow: 'hidden',
          padding: transparent ? 0 : '20px 24px',
          backgroundImage: showDots ? dots : undefined,
          backgroundSize: '16px 16px',
        }}
      >
        {/* Header */}
        {header && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              padding: '4px 12px 20px',
            }}
          >
            <div>
              <div style={{ fontFamily: theme.fontMono, fontSize: 11, letterSpacing: '0.14em', color: theme.muted, marginBottom: 6 }}>
                {resolvedData.eyebrow}
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.01em' }}>{resolvedData.title}</div>
            </div>
            <div style={{ fontFamily: theme.fontMono, fontSize: 11, textAlign: 'right', color: theme.muted, lineHeight: 1.7 }}>
              {resolvedData.meta.map((m, i) => (
                <div key={i}>{m}</div>
              ))}
            </div>
          </div>
        )}

        {/* Diagram: one SVG that scales to the container width. The label layer rides
            inside it as foreignObjects, so the text scales with the shapes and the
            sheet fits its column rather than scrolling. */}
        <svg viewBox={`0 0 ${canvas.width} ${canvas.height}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
          <defs>
            <marker id="fc-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" style={{ fill: theme.muted }} />
            </marker>
            <marker id="fc-arr-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" style={{ fill: theme.accent }} />
            </marker>
          </defs>

          {resolvedData.edges.map((e, i) => (
            <Edge key={i} edge={e} theme={theme} />
          ))}
          {resolvedData.nodes.map((n) => (
            <NodeShape key={n.id} node={n} theme={theme} fill={nodeFill} />
          ))}

          {/* Annotation brackets and leaders */}
          {(resolvedData.annotations || []).map((a, i) => {
            const dir = a.side === 'left' ? -8 : 8
            return (
              <g key={i}>
                {a.leader && (
                  <line
                    x1={a.leader.x1}
                    y1={a.leader.y}
                    x2={a.leader.x2}
                    y2={a.leader.y}
                    strokeDasharray="4 4"
                    style={{ stroke: theme.muted, strokeWidth: 1.2 }}
                  />
                )}
                {a.bracket && (
                  <polyline
                    points={`${a.bracket.x + dir},${a.bracket.y1} ${a.bracket.x},${a.bracket.y1} ${a.bracket.x},${a.bracket.y2} ${a.bracket.x + dir},${a.bracket.y2}`}
                    style={{ fill: 'none', stroke: theme.muted, strokeWidth: 1.5 }}
                  />
                )}
              </g>
            )
          })}

          {labels && (
            <>
              {/* Node labels (screen nodes carry their own, rendered last) */}
              {resolvedData.nodes
                .filter((n) => !n.screen)
                .map((n) => (
                  <NodeLabel key={n.id} node={n} theme={theme} />
                ))}

              {/* Branch labels on edges */}
              {resolvedData.edges
                .filter((e) => e.label && e.labelAt)
                .map((e, i) => (
                  <foreignObject key={i} x={e.labelAt![0]} y={e.labelAt![1]} width={160} height={22} style={{ overflow: 'visible' }}>
                    <div
                      style={{
                        fontFamily: theme.fontSans,
                        fontSize: 13,
                        letterSpacing: '0.02em',
                        color: e.accent ? theme.accent : theme.ink,
                        whiteSpace: 'nowrap',
                        ...(e.accent ? synthBold : { fontWeight: 500 }),
                      }}
                    >
                      {e.label}
                    </div>
                  </foreignObject>
                ))}

              {/* Annotation text blocks */}
              {(resolvedData.annotations || []).map((a, i) => (
                <foreignObject key={i} x={a.text.x} y={a.text.y} width={a.text.w} height={120} style={{ overflow: 'visible' }}>
                  <div
                    style={{
                      fontFamily: theme.fontSans,
                      fontSize: 13,
                      lineHeight: 1.6,
                      letterSpacing: '0.01em',
                      color: theme.subtle,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    {a.lines.map((line, j) => (
                      <div key={j}>{line}</div>
                    ))}
                  </div>
                </foreignObject>
              ))}

              {/* Screen nodes last, so a hover preview floats over the rest */}
              {resolvedData.nodes
                .filter((n) => n.screen)
                .map((n) => (
                  <ScreenNode key={`sc-${n.id}`} node={n} theme={theme} />
                ))}
            </>
          )}
        </svg>
      </div>

      {/* Symbol legend: outside and under the sheet, centred, symbols only. */}
      {legend && <FlowchartLegend theme={theme} />}
    </div>
  )
}

/*
  The ISO symbol key, as its own component because it now has two callers: under
  the sheet in an article, and pinned beside the controls in the full-screen view,
  where it must NOT ride the pan and zoom — a key that scrolls off the moment the
  reader moves the drawing is a key at exactly the wrong moment.

  One definition rather than two that resemble each other. A second copy would
  drift the first time a symbol is added, and the thing it documents is the
  vocabulary the diagrams are drawn in.
*/
export function FlowchartLegend({ theme = defaultTheme }: { theme?: FlowchartTheme } = {}) {
  return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 28,
            flexWrap: 'wrap',
            padding: '10px 0',
            margin: '10px 0',
            fontFamily: theme.fontSans,
            fontSize: 12,
            letterSpacing: '0.02em',
            color: theme.muted,
          }}
        >
          <LegendItem label="Terminator">
            <rect x="1" y="2" width="32" height="14" rx="7" style={{ fill: 'none', stroke: theme.muted, strokeWidth: 1.2 }} />
          </LegendItem>
          <LegendItem label="Process">
            <rect x="1" y="2" width="32" height="14" style={{ fill: 'none', stroke: theme.muted, strokeWidth: 1.2 }} />
          </LegendItem>
          <LegendItem label="Decision" w={34} h={20}>
            <polygon points="17,1 33,10 17,19 1,10" style={{ fill: 'none', stroke: theme.muted, strokeWidth: 1.2 }} />
          </LegendItem>
          <LegendItem label="Annotation" w={18} h={18}>
            <polyline points="12,2 5,2 5,16 12,16" style={{ fill: 'none', stroke: theme.muted, strokeWidth: 1.2 }} />
          </LegendItem>
        </div>
  )
}
