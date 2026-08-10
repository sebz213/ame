import type { FlowchartData } from './flowchart-sheet'

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
        lines: ['+ Frequent micro-feedback', '+ Lower engineering risk', '+ Aligned with Japanese loyalty data'],
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
}
