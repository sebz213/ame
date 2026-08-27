import type { FlowchartData } from './flowchart-sheet'
import { ROOT_PROPS, DARK_REPOINTS } from 'ame-tokens/tokens.mjs'

/*
  Worked-example data for FlowchartSheet. Each preset is a real case authored to
  the ISO 5807 grammar: the same structure, different content. A surface renders
  one by name — `<FlowchartSheet preset="tracking-vs-stacking" />` — so the case
  study and the design-system page draw the identical sheet from one definition.

  This is the "swap the data, keep the grammar" idea made literal: the reusable
  part is the component and its rules; a preset is the case poured into them.
*/

export const FLOWCHART_PRESETS: Record<string, FlowchartData> = {
  // Kindle Japan reward-mechanic decision: the tracking-vs-stacking trade-off, with
  // the selected route (tracking) on the accent path.
  'tracking-vs-stacking': {
    eyebrow: 'KINDLE JAPAN · REWARD MECHANIC',
    title: 'Tracking vs. Stacking Trade-Off',
    meta: ['Convention: ISO 5807-1985', 'Sheet 1/1'],
    canvas: { width: 1180, height: 790 },
    nodes: [
      { id: 'start', type: 'terminator', x: 440, y: 20, w: 300, h: 56, label: 'Reward mechanic selection' },
      { id: 'eval', type: 'process', x: 380, y: 116, w: 420, h: 72, label: 'Evaluate reward mechanics for the 2-week launch window' },
      { id: 'decide', type: 'decision', x: 440, y: 228, w: 300, h: 180, label: 'Select reward mechanic' },
      { id: 'stacking', type: 'process', x: 190, y: 430, w: 280, h: 80, label: 'Stacking', sublabel: 'Collection mechanic' },
      { id: 'tracking', type: 'process', x: 710, y: 430, w: 280, h: 80, label: 'Tracking', sublabel: 'Linear progress', accent: true },
      { id: 'reject', type: 'terminator', x: 220, y: 696, w: 220, h: 56, label: 'Reject stacking', muted: true },
      { id: 'select', type: 'terminator', x: 740, y: 696, w: 220, h: 56, label: 'Select tracking ✓', accent: true, bold: true },
    ],
    edges: [
      { from: [590, 76], to: [590, 112] },
      { from: [590, 188], to: [590, 224] },
      { from: [440, 318], via: [[330, 318]], to: [330, 426], label: 'Stacking', labelAt: [344, 292] },
      { from: [740, 318], via: [[850, 318]], to: [850, 426], accent: true, label: 'Tracking', labelAt: [762, 292] },
      { from: [330, 510], to: [330, 692] },
      { from: [850, 510], to: [850, 692], accent: true },
    ],
    annotations: [
      {
        side: 'left',
        bracket: { x: 300, y1: 566, y2: 648 },
        leader: { x1: 300, x2: 326, y: 607 },
        text: { x: 40, y: 566, w: 250 },
        lines: ['+ High visual payoff at end', '− High engineering risk for 2-week window'],
      },
      {
        side: 'right',
        bracket: { x: 880, y1: 558, y2: 664 },
        leader: { x1: 880, x2: 854, y: 611 },
        text: { x: 900, y: 558, w: 250 },
        lines: ['+ Frequent micro-feedback', '+ Lower engineering risk', '+ Aligned with goal-gradient research'],
      },
    ],
    footer: 'Flow: top→bottom, left→right',
  },
  // Kindle Japan purchase processing state: the async lag branches into a silent
  // fail (avoided) and the shipped pending-state bar (selected, on the accent).
  'purchase-processing-state': {
    eyebrow: 'KINDLE JAPAN · PROCESSING STATE',
    title: 'Purchase Processing State Flow',
    meta: ['Convention: ISO 5807-1985', 'Sheet 1/1'],
    canvas: { width: 1180, height: 620 },
    nodes: [
      { id: 'start', type: 'terminator', x: 430, y: 20, w: 320, h: 56, label: 'User completes purchase' },
      { id: 'event', type: 'process', x: 470, y: 116, w: 240, h: 60, label: 'Event sent' },
      { id: 'lag', type: 'decision', x: 420, y: 216, w: 340, h: 180, label: 'Asynchronous lag (up to 1 hr)' },
      { id: 'silent', type: 'process', x: 190, y: 470, w: 280, h: 84, label: 'Stale progress / No signal', sublabel: 'Avoided UX defect', muted: true },
      { id: 'pending', type: 'process', x: 710, y: 470, w: 280, h: 84, label: 'Info tooltip', sublabel: 'Selected UI solution', accent: true },
    ],
    edges: [
      { from: [590, 76], to: [590, 112] },
      { from: [590, 176], to: [590, 212] },
      { from: [420, 306], via: [[330, 306]], to: [330, 466] },
      { from: [760, 306], via: [[850, 306]], to: [850, 466], accent: true },
    ],
    footer: 'Flow: top→bottom, left→right',
  },

  // Kindle Japan enrollment state machine: the full set of states a member can be
  // in, with four of them (unactivated, activating, in-progress, ended) carrying a
  // screen that expands on hover.
  'enrollment-state-machine': {
    eyebrow: 'KINDLE JAPAN · ENROLLMENT STATES',
    title: 'Enrollment State Machine',
    meta: ['Convention: ISO 5807-1985', 'Sheet 1/1'],
    canvas: { width: 1180, height: 1150 },
    nodes: [
      { id: 'entry', type: 'terminator', x: 470, y: 20, w: 240, h: 56, label: 'Entry (visit or URL)' },
      { id: 'in-program', type: 'decision', x: 450, y: 110, w: 280, h: 160, label: 'In program?' },
      { id: 'window-open', type: 'decision', x: 450, y: 306, w: 280, h: 160, label: 'Offer window open?' },
      { id: 'ineligible', type: 'process', x: 90, y: 152, w: 270, h: 76, label: 'Ineligible', sublabel: 'Not-eligible message', muted: true },
      { id: 'storefront', type: 'terminator', x: 115, y: 290, w: 220, h: 56, label: 'Route to Storefront', muted: true },
      { id: 'expired', type: 'process', x: 860, y: 348, w: 270, h: 76, label: 'Eligible, expired', sublabel: 'Terminal — no exit', muted: true },
      { id: 'unactivated', type: 'process', x: 440, y: 506, w: 300, h: 84, label: 'Eligible, unactivated', sublabel: 'Pre-activation visit progress + warning', screen: '/screens/yes.svg' },
      { id: 'activating', type: 'process', x: 440, y: 646, w: 300, h: 84, label: 'Activating', sublabel: 'Celebration — fires exactly once', accent: true, screen: '/screens/activating.svg' },
      { id: 'in-progress', type: 'process', x: 440, y: 786, w: 300, h: 84, label: 'Activated, in progress', sublabel: 'Normal progress display', screen: '/screens/in-progress.svg' },
      { id: 'pending', type: 'process', x: 840, y: 786, w: 300, h: 84, label: 'Progress pending', sublabel: 'Yellow bar replaces progress display' },
      { id: 'ended', type: 'process', x: 440, y: 926, w: 300, h: 84, label: 'Post-activation, ended', sublabel: 'Completed or expired after activation', screen: '/screens/complete.svg' },
      { id: 'window-ends', type: 'terminator', x: 480, y: 1050, w: 220, h: 56, label: 'View window ends', muted: true },
    ],
    edges: [
      { from: [590, 76], to: [590, 106] },
      { from: [450, 190], to: [364, 190], label: 'No', labelAt: [374, 166] },
      { from: [225, 228], to: [225, 286] },
      { from: [590, 270], to: [590, 302], label: 'Yes', labelAt: [602, 274] },
      { from: [730, 386], to: [856, 386], label: 'Closed, never activated', labelAt: [742, 340] },
      { from: [590, 466], to: [590, 502], label: 'Open', labelAt: [602, 470] },
      { from: [590, 590], to: [590, 642], accent: true, label: 'activate', labelAt: [602, 604] },
      { from: [590, 730], to: [590, 782], accent: true },
      { from: [740, 808], to: [836, 808], label: 'sync delay', labelAt: [748, 788] },
      { from: [840, 848], to: [744, 848], label: 'resolved', labelAt: [756, 852] },
      { from: [590, 870], to: [590, 922], label: 'complete / expire', labelAt: [602, 884] },
      { from: [590, 1010], to: [590, 1046] },
    ],
    annotations: [
      {
        side: 'left',
        bracket: { x: 400, y1: 652, y2: 724 },
        leader: { x1: 400, x2: 436, y: 688 },
        text: { x: 40, y: 616, w: 340 },
        lines: ['Confetti + recognition of pre-activation progress fires exactly once, on unactivated → activating. Never replays on refresh, re-render, or return visit. Modeled as a state, not an effect.'],
      },
      {
        side: 'right',
        bracket: { x: 780, y1: 516, y2: 580 },
        leader: { x1: 780, x2: 744, y: 548 },
        text: { x: 800, y: 492, w: 340 },
        lines: ['Shows pre-activation visit progress plus the "progress may not be kept" warning. The warning copy is a legal/CX requirement — do not remove when restyling.'],
      },
      {
        side: 'left',
        bracket: { x: 400, y1: 940, y2: 1000 },
        leader: { x1: 400, x2: 436, y: 970 },
        text: { x: 40, y: 902, w: 340 },
        lines: ['Progress and rewards stay viewable ~30 days after end. The window comes from the rewards-processing SLA, not a product choice — confirm with the rewards team before changing.'],
      },
      { side: 'right', text: { x: 860, y: 452, w: 280 }, lines: ['Terminal. No path from here to activating — do not add one.'] },
      { side: 'left', text: { x: 60, y: 380, w: 300 }, lines: ['Reached via URL by users outside the program. Not an error state.'] },
      { side: 'right', text: { x: 840, y: 896, w: 300 }, lines: ['Substate of active enrollment, modeled flat: the pending indicator replaces, not overlays, normal progress.'] },
    ],
    footer: 'Flow: top→bottom, left→right',
  },

  // The enrollment machine broken into one focused diagram per state screen, for the
  // interactive explorer. All four share the 1180x620 box (and the 300-wide node
  // scale) of the diagrams above, so switching states never resizes the box.
  'enroll-unactivated': {
    eyebrow: '', title: '', meta: [], canvas: { width: 1180, height: 620 },
    nodes: [
      { id: 'entry', type: 'terminator', x: 440, y: 30, w: 300, h: 56, label: 'Entry (visit or URL)' },
      { id: 'inprog', type: 'decision', x: 450, y: 120, w: 280, h: 150, label: 'In program?' },
      { id: 'window', type: 'decision', x: 450, y: 300, w: 280, h: 150, label: 'Offer window open?' },
      { id: 'unact', type: 'process', x: 440, y: 490, w: 300, h: 84, label: 'Eligible, unactivated', sublabel: 'Pre-activation progress + warning', accent: true },
    ],
    edges: [
      { from: [590, 86], to: [590, 116] },
      { from: [590, 270], to: [590, 296], label: 'Yes', labelAt: [602, 274] },
      { from: [590, 450], to: [590, 486], accent: true, label: 'Open', labelAt: [602, 454] },
    ],
    footer: '',
  },
  'enroll-activating': {
    eyebrow: '', title: '', meta: [], canvas: { width: 1180, height: 620 },
    nodes: [
      { id: 'unact', type: 'process', x: 440, y: 170, w: 300, h: 84, label: 'Eligible, unactivated', sublabel: 'Pre-activation progress' },
      { id: 'act', type: 'process', x: 440, y: 390, w: 300, h: 84, label: 'Activating', sublabel: 'Celebration — fires exactly once', accent: true },
    ],
    edges: [{ from: [590, 254], to: [590, 386], accent: true, label: 'activate', labelAt: [602, 312] }],
    annotations: [
      { side: 'right', text: { x: 800, y: 390, w: 320 }, lines: ['Confetti fires exactly once on this transition. Never replays on refresh, re-render, or return visit.'] },
    ],
    footer: '',
  },
  'enroll-in-progress': {
    eyebrow: '', title: '', meta: [], canvas: { width: 1180, height: 620 },
    nodes: [
      { id: 'act', type: 'process', x: 440, y: 120, w: 300, h: 84, label: 'Activating', sublabel: 'Celebration' },
      { id: 'inprog', type: 'process', x: 440, y: 320, w: 300, h: 84, label: 'Activated, in progress', sublabel: 'Normal progress display', accent: true },
      { id: 'pending', type: 'process', x: 760, y: 320, w: 280, h: 84, label: 'Progress pending', sublabel: 'Yellow bar replaces progress' },
    ],
    edges: [
      { from: [590, 204], to: [590, 316], accent: true },
      { from: [740, 348], to: [756, 348], label: 'sync delay', labelAt: [748, 326] },
      { from: [756, 388], to: [740, 388], label: 'resolved', labelAt: [764, 392] },
    ],
    footer: '',
  },
  'enroll-ended': {
    eyebrow: '', title: '', meta: [], canvas: { width: 1180, height: 620 },
    nodes: [
      { id: 'inprog', type: 'process', x: 440, y: 80, w: 300, h: 84, label: 'Activated, in progress', sublabel: 'Normal progress' },
      { id: 'ended', type: 'process', x: 440, y: 300, w: 300, h: 84, label: 'Post-activation, ended', sublabel: 'Completed or expired', accent: true },
      { id: 'window-ends', type: 'terminator', x: 480, y: 500, w: 220, h: 56, label: 'View window ends', muted: true },
    ],
    edges: [
      { from: [590, 164], to: [590, 296], label: 'complete / expire', labelAt: [602, 220] },
      { from: [590, 384], to: [590, 496] },
    ],
    annotations: [
      { side: 'right', text: { x: 800, y: 300, w: 320 }, lines: ['Progress and rewards stay viewable ~30 days after end. The window comes from the rewards SLA, not a product choice.'] },
    ],
    footer: '',
  },

  /*
    The Ame design-system sheets, one per decision in the case study.

    These are drawn from the system's own architecture diagram: its four stages
    (the token layers, the resolver and build engine, the production artifacts, and
    the runtime surfaces) are cut along the seams of the seven decisions, so a
    reader meets each stage beside the claim it supports rather than as one wall of
    boxes.

    The geometry varies by what each stage IS. A cascade is a column, a gate is a
    branch, a build that emits four files is a fan — matching the shape to the
    content is the whole reason the grammar takes data rather than a fixed layout.
  */

  // Decision 1 — stage 1 of the architecture: the four layers as one descent, with
  // the bracket carrying the rule that the descent obeys.
  'ame-single-source': {
    eyebrow: 'AME · THE FOUR TOKEN LAYERS',
    title: 'One Value, One Home',
    meta: ['Convention: ISO 5807-1985', 'Sheet 1/1'],
    canvas: { width: 1180, height: 680 },
    nodes: [
      { id: 'start', type: 'terminator', x: 440, y: 20, w: 300, h: 56, label: 'A raw value is declared once' },
      { id: 'l1', type: 'process', x: 390, y: 110, w: 400, h: 76, label: 'L1 · Primitive', sublabel: 'Single source — color.ink' },
      { id: 'l2', type: 'process', x: 390, y: 222, w: 400, h: 76, label: 'L2 · Semantic', sublabel: 'Intent & purpose — text.body' },
      { id: 'l3', type: 'process', x: 390, y: 334, w: 400, h: 76, label: 'L3 · Component', sublabel: 'Element scope — card.radius' },
      { id: 'l4', type: 'process', x: 390, y: 446, w: 400, h: 76, label: 'L4 · Recipe', sublabel: 'Slot granularity — card.label', accent: true },
      { id: 'end', type: 'terminator', x: 440, y: 558, w: 300, h: 56, label: 'A surface binds a name ✓', accent: true, bold: true },
    ],
    edges: [
      { from: [590, 76], to: [590, 106] },
      { from: [590, 186], to: [590, 218] },
      { from: [590, 298], to: [590, 330] },
      { from: [590, 410], to: [590, 442] },
      { from: [590, 522], to: [590, 554] },
    ],
    annotations: [
      {
        side: 'right',
        bracket: { x: 812, y1: 110, y2: 522 },
        leader: { x1: 812, x2: 794, y: 316 },
        text: { x: 834, y: 232, w: 300 },
        lines: ['Every hop down adds intent and narrows scope.', 'Specificity rises; reuse breadth falls.', 'Nothing references sideways or up.'],
      },
    ],
    footer: 'Flow: top→bottom, left→right',
  },

  // Decision 2 — the U1/U2 gates that sit between the layers and the UI, and the
  // static analysis that runs once a binding is legal.
  'ame-governance-gate': {
    eyebrow: 'AME · U1 / U2 GATES AND AUDITS',
    title: 'What Blocks the UI From L1',
    meta: ['Convention: ISO 5807-1985', 'Sheet 1/1'],
    canvas: { width: 1180, height: 760 },
    nodes: [
      { id: 'start', type: 'terminator', x: 430, y: 20, w: 320, h: 56, label: 'A surface binds a token' },
      { id: 'gate', type: 'decision', x: 420, y: 116, w: 340, h: 170, label: 'Which tier does it reach for?' },
      { id: 'left', type: 'process', x: 190, y: 360, w: 280, h: 84, label: 'L1 base primitive', sublabel: 'U1 / U2 violation', muted: true },
      { id: 'right', type: 'process', x: 710, y: 360, w: 280, h: 84, label: 'L2 – L4', sublabel: 'Binding allowed', accent: true },
      { id: 'fail', type: 'terminator', x: 240, y: 506, w: 180 , h: 56, label: 'Build fails', muted: true },
      // H1, not RC1: H1 is the clientless-token clause, RC1 is checkRecipeGrammar and
      // has nothing to do with dead names. And CV1 is COVERAGE — it asks whether a pair
      // was declared at all — while C1–C15 are the clauses that measure ratios. The
      // decision-5 sheet below states that split correctly; this one used to flatten
      // both back into "contrast", which is the same conflation in a smaller space.
      { id: 'audits', type: 'process', x: 700, y: 496, w: 300, h: 84, label: 'Static analysis', sublabel: 'H1 · CV1 · Z1 / Z2 · B6' },
      { id: 'pass', type: 'terminator', x: 760, y: 640, w: 180, h: 56, label: 'Build passes ✓', accent: true, bold: true },
    ],
    edges: [
      { from: [590, 76], to: [590, 112] },
      { from: [420, 201], via: [[330, 201]], to: [330, 356], label: 'L1', labelAt: [344, 175] },
      { from: [760, 201], via: [[850, 201]], to: [850, 356], accent: true, label: 'L2–L4', labelAt: [762, 175] },
      { from: [330, 444], to: [330, 502] },
      { from: [850, 444], to: [850, 492], accent: true },
      { from: [850, 580], to: [850, 636], accent: true },
    ],
    annotations: [
      {
        side: 'right',
        text: { x: 1010, y: 496, w: 150 },
        lines: ['Tokens no client reads · undeclared pairs · census · byte-checked artifacts.'],
      },
    ],
    footer: 'Flow: top→bottom, left→right',
  },

  // Decision 3 — stage 2 and 3: the zero-dependency engine, and the four artifacts
  // it emits once resolution succeeds.
  'ame-build-pipeline': {
    eyebrow: 'AME · RESOLVER AND BUILD ENGINE',
    title: 'Resolve, Then Serialise',
    meta: ['Convention: ISO 5807-1985', 'Sheet 1/1'],
    canvas: { width: 1180, height: 780 },
    nodes: [
      { id: 'start', type: 'terminator', x: 370, y: 20, w: 440, h: 56, label: 'DTCG 2025.10 JSON + resolver modifiers' },
      { id: 'engine', type: 'process', x: 350, y: 116, w: 480, h: 76, label: 'build.mjs — zero dependencies', sublabel: 'Transitive {token.refs} and $ref' },
      { id: 'gate', type: 'decision', x: 420, y: 232, w: 340, h: 170, label: 'Cycle or dangling reference?' },
      { id: 'left', type: 'process', x: 190, y: 470, w: 280, h: 84, label: 'Throw', sublabel: 'No repair, no guess', muted: true },
      { id: 'right', type: 'process', x: 710, y: 470, w: 280, h: 84, label: 'Serialise by $type', sublabel: '#ffffff · rgb(r g b / a) · oklch() · 0.4', accent: true },
      { id: 'a1', type: 'process', x: 40, y: 630, w: 250, h: 86, label: 'tokens.css', sublabel: `${ROOT_PROPS} :root props + ${DARK_REPOINTS} dark re-points` },
      { id: 'a2', type: 'process', x: 330, y: 630, w: 250, h: 86, label: 'tokens.mjs', sublabel: 'Zero-runtime dictionary' },
      { id: 'a3', type: 'process', x: 620, y: 630, w: 250, h: 86, label: 'tokens.d.ts', sublabel: 'Strict TypeScript definitions' },
      // recipes.css, not the dither noise. B6 measures parity over four emitted
      // files — tokens.css, recipes.css, tokens.mjs, tokens.d.ts — and this row is
      // that manifest. The grain's SVG data URI is a derived PROPERTY inside
      // tokens.css, so standing it beside the artifacts made a value look like a
      // fourth file and left the real fourth one off the diagram.
      { id: 'a4', type: 'process', x: 910, y: 630, w: 250, h: 86, label: 'recipes.css', sublabel: 'Compiled recipe slots and axes' },
    ],
    edges: [
      { from: [590, 76], to: [590, 112] },
      { from: [590, 192], to: [590, 228] },
      { from: [420, 317], via: [[330, 317]], to: [330, 466], label: 'Yes', labelAt: [344, 291] },
      { from: [760, 317], via: [[850, 317]], to: [850, 466], accent: true, label: 'No', labelAt: [762, 291] },
      { from: [850, 554], via: [[850, 596], [165, 596]], to: [165, 626], accent: true },
      { from: [850, 554], via: [[850, 596], [455, 596]], to: [455, 626], accent: true },
      { from: [850, 554], via: [[850, 596], [745, 596]], to: [745, 626], accent: true },
      { from: [850, 554], via: [[850, 596], [1035, 596]], to: [1035, 626], accent: true },
    ],
    footer: 'Flow: top→bottom, left→right',
  },

  // Decision 4 — the serialisation branch: which colour space a value takes, and
  // the names the dark scope re-points.
  'ame-color-system': {
    eyebrow: 'AME · COLOUR SPACE BY INTENT',
    title: 'Two Spaces, One Vocabulary',
    meta: ['Convention: ISO 5807-1985', 'Sheet 1/1'],
    canvas: { width: 1180, height: 740 },
    nodes: [
      { id: 'start', type: 'terminator', x: 430, y: 20, w: 320, h: 56, label: 'A colour token' },
      { id: 'gate', type: 'decision', x: 420, y: 116, w: 340, h: 170, label: 'Perceptual decision, or fixed anchor?' },
      { id: 'left', type: 'process', x: 190, y: 360, w: 280, h: 84, label: 'sRGB / hex', sublabel: '#ffffff · rgb(r g b / a)' },
      { id: 'right', type: 'process', x: 710, y: 360, w: 280, h: 84, label: 'OKLCH', sublabel: 'Brand · danger · neutral ramps', accent: true },
      { id: 'merge', type: 'process', x: 390, y: 510, w: 400, h: 76, label: `${ROOT_PROPS} :root custom properties` },
      // The count comes from the build like the one above it. It was spelled
      // "six" here, which is the same stale-transcription risk the digits carry
      // and harder to grep for.
      { id: 'end', type: 'terminator', x: 390, y: 626, w: 400, h: 56, label: `Dark scope re-points ${DARK_REPOINTS} names ✓`, accent: true, bold: true },
    ],
    edges: [
      { from: [590, 76], to: [590, 112] },
      { from: [420, 201], via: [[330, 201]], to: [330, 356], label: 'Fixed anchor', labelAt: [268, 175] },
      { from: [760, 201], via: [[850, 201]], to: [850, 356], accent: true, label: 'Perceptual', labelAt: [762, 175] },
      { from: [330, 444], via: [[330, 480], [590, 480]], to: [590, 506] },
      { from: [850, 444], via: [[850, 480], [590, 480]], to: [590, 506], accent: true },
      { from: [590, 586], to: [590, 622], accent: true },
    ],
    annotations: [
      {
        side: 'right',
        text: { x: 830, y: 520, w: 300 },
        lines: ['No parallel -dark tree. One name, re-pointed under [data-theme="dark"].'],
      },
    ],
    footer: 'Flow: top→bottom, left→right',
  },

  // Decision 5 — the accessibility engine, with CV1 as the clause that can fail a
  // build and the other three surfaces named beside it.
  'ame-contrast-clause': {
    eyebrow: 'AME · ACCESSIBILITY ENGINE',
    title: 'A Pair Is Measured, Not Asserted',
    meta: ['Convention: ISO 5807-1985', 'Sheet 1/1'],
    canvas: { width: 1180, height: 766 },
    nodes: [
      // Two clauses doing opposite jobs, drawn as two nodes. CV1 belongs upstream, as
      // the gate on reaching the audit at all: a pair can pass by never being tested,
      // and CV1 exists to catch exactly that, while C1-C15 ask whether a pair under
      // measurement meets its tier.
      //
      // These two nodes said "a colour pair is RENDERED" and "was it declared?" until
      // reading checkContrastCoverage showed CV1 never sees a rendered anything: it
      // matches a CSS block or a style object that STATES a foreground and a
      // background together. The prose was corrected (D-56) and this lagged it, which
      // left the skimmer — who reads the diagram and not the paragraph — holding the
      // retracted claim. The sublabel now names the miss case rather than implying
      // there isn't one.
      { id: 'start', type: 'terminator', x: 430, y: 20, w: 320, h: 56, label: 'A surface states a colour pair' },
      { id: 'cv', type: 'process', x: 400, y: 116, w: 380, h: 64, label: 'CV1 — is it one a C clause measures?', sublabel: 'An inherited ground is a real pair CV1 cannot see' },
      { id: 'step', type: 'process', x: 400, y: 220, w: 380, h: 60, label: 'Composite alpha over its ground' },
      { id: 'gate', type: 'decision', x: 420, y: 320, w: 340, h: 170, label: 'C1–C15 — meets its tier?' },
      { id: 'left', type: 'process', x: 190, y: 540, w: 280, h: 84, label: 'Below the threshold', sublabel: 'Gate fails', muted: true },
      { id: 'right', type: 'process', x: 710, y: 540, w: 280, h: 84, label: '7:1 · 4.5:1 · 3:1', sublabel: 'Reading pairs derive a dark twin', accent: true },
      { id: 'end', type: 'terminator', x: 740, y: 682, w: 220, h: 56, label: 'Clause holds ✓', accent: true, bold: true },
    ],
    edges: [
      { from: [590, 76], to: [590, 112] },
      { from: [590, 180], to: [590, 216] },
      { from: [590, 280], to: [590, 316] },
      { from: [420, 405], via: [[330, 405]], to: [330, 536], label: 'No', labelAt: [344, 379] },
      { from: [760, 405], via: [[850, 405]], to: [850, 536], accent: true, label: 'Yes', labelAt: [762, 379] },
      { from: [850, 624], to: [850, 678], accent: true },
    ],
    annotations: [
      {
        side: 'left',
        text: { x: 40, y: 216, w: 300 },
        lines: ['The rest of the engine: skip link (tabindex="-1"), use-overlay-focus, page zoom for 1.4.10 reflow.'],
      },
    ],
    footer: 'Flow: top→bottom, left→right',
  },

  // Decision 6 — the agent interface: the protocol when present, the route when not.
  'ame-agent-surface': {
    eyebrow: 'AME · AGENT INTERFACE',
    title: 'How a Machine Reads This Site',
    meta: ['Convention: ISO 5807-1985', 'Sheet 1/1'],
    canvas: { width: 1180, height: 700 },
    nodes: [
      { id: 'start', type: 'terminator', x: 430, y: 20, w: 320, h: 56, label: 'An agent or crawler arrives' },
      { id: 'step', type: 'process', x: 400, y: 116, w: 380, h: 60, label: 'Feature-detect the context API' },
      { id: 'gate', type: 'decision', x: 420, y: 216, w: 340, h: 180, label: 'Is WebMCP available?' },
      { id: 'left', type: 'process', x: 190, y: 470, w: 280, h: 84, label: 'GET /llms.txt', sublabel: 'Generated from frontmatter' },
      { id: 'right', type: 'process', x: 710, y: 470, w: 280, h: 84, label: 'navigator.modelContext', sublabel: 'Read-only tools', accent: true },
      { id: 'end', type: 'terminator', x: 700, y: 616, w: 300, h: 56, label: 'Answer without scraping ✓', accent: true, bold: true },
    ],
    edges: [
      { from: [590, 76], to: [590, 112] },
      { from: [590, 176], to: [590, 212] },
      { from: [420, 306], via: [[330, 306]], to: [330, 466], label: 'No', labelAt: [344, 280] },
      { from: [760, 306], via: [[850, 306]], to: [850, 466], accent: true, label: 'Yes', labelAt: [762, 280] },
      { from: [850, 554], to: [850, 612], accent: true },
    ],
    annotations: [
      {
        side: 'left',
        text: { x: 40, y: 470, w: 130 },
        lines: ['robots.txt excludes /prototypes/.'],
      },
    ],
    footer: 'Flow: top→bottom, left→right',
  },

  // Decision 7 — native localization: on-device, honest where absent, and the
  // measurements that have to follow the text.
  'ame-translation-flow': {
    eyebrow: 'AME · NATIVE LOCALIZATION',
    title: 'A Switch Is a State, Not an Event',
    meta: ['Convention: ISO 5807-1985', 'Sheet 1/1'],
    canvas: { width: 1180, height: 830 },
    nodes: [
      { id: 'start', type: 'terminator', x: 430, y: 20, w: 320, h: 56, label: 'A language is chosen' },
      { id: 'step', type: 'process', x: 400, y: 116, w: 380, h: 60, label: 'Ask availability for the pair' },
      { id: 'gate', type: 'decision', x: 420, y: 216, w: 340, h: 180, label: 'Is the Translator API present?' },
      { id: 'left', type: 'process', x: 190, y: 470, w: 280, h: 84, label: 'Declare lang only', sublabel: 'The accessible name says so', muted: true },
      { id: 'right', type: 'process', x: 710, y: 470, w: 280, h: 84, label: 'Translate on device', sublabel: 'lang is set last', accent: true },
      { id: 'sync', type: 'process', x: 700, y: 616, w: 300, h: 76, label: 'Live region · ResizeObserver', sublabel: 'Nav and pill re-measure' },
      { id: 'end', type: 'terminator', x: 700, y: 740, w: 300, h: 56, label: 'Page and its panels agree ✓', accent: true, bold: true },
    ],
    edges: [
      { from: [590, 76], to: [590, 112] },
      { from: [590, 176], to: [590, 212] },
      { from: [420, 306], via: [[330, 306]], to: [330, 466], label: 'No', labelAt: [344, 280] },
      { from: [760, 306], via: [[850, 306]], to: [850, 466], accent: true, label: 'Yes', labelAt: [762, 280] },
      { from: [850, 554], to: [850, 612], accent: true },
      { from: [850, 692], to: [850, 736], accent: true },
    ],
    footer: 'Flow: top→bottom, left→right',
  },
}
