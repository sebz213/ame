import type { FlowchartData } from './flowchart-sheet'

/*
  Worked-example data for FlowchartSheet. Each preset is drawn to the ISO
  5807:1985 grammar the component implements: same structure, different content.
  A surface renders one by name — `<FlowchartSheet preset="hcd-loop" />` — so a
  docs page and a design-system page draw the identical sheet from one definition.

  This is the "swap the data, keep the grammar" idea made literal: the reusable
  part is the component and its rules; a preset is a case poured into them.

  SUBJECT. These three diagram the human-centred design process itself, from
  `Process Standardization/Portfolio Standards/HCD Process Standard.txt` and the
  ISO family it rests on (9241-210 for the activities, 9241-11 for what usability
  means, 25065 for requirements, 25062 for the report, 9241-220 for the audit).
  That is a deliberate choice and not only a neutral one: a design system's
  flowchart component is most honestly demonstrated on a process the system's own
  author is held to, and the content can be checked against a published standard
  rather than taken on trust.

  Client work does not live here. A case study supplies its own data through the
  `data` prop — see `components/portfolio/flowchart-cases.ts` — so the reusable
  component and the confidential particulars stay two concepts with two homes.
*/

export const FLOWCHART_PRESETS: Record<string, FlowchartData> = {
  /*
    The HCD loop. Six stages, two feedback returns, drawn with the symbol doing
    real work in each case: preparation (9.2.2.3) for stage 1, because setting
    the targets is setup for everything after it; manual input (9.1.2.5) for
    stage 2, because the data is supplied by people at the time of study;
    predefined process (9.2.2.1) for stage 5, because an evaluation is itself a
    defined procedure with its own sample and analyst rules — the second preset
    below is that procedure; document (9.1.2.4) for the CIF report, which is the
    loop's memory and the only artefact that survives to the next iteration.
  */
  'hcd-loop': {
    eyebrow: 'HUMAN-CENTRED DESIGN · PROCESS',
    title: 'The HCD Loop',
    meta: ['Convention: ISO 5807-1985', 'Process: ISO 9241-210', 'Sheet 1/1'],
    canvas: { width: 1180, height: 1120 },
    nodes: [
      { id: 'start', type: 'terminator', x: 460, y: 20, w: 260, h: 56, label: 'Project start' },
      {
        id: 's1', type: 'preparation', x: 380, y: 110, w: 420, h: 84,
        label: '1 · Define what "works" means',
        sublabel: 'Effectiveness, efficiency, satisfaction — ISO 9241-11',
      },
      {
        id: 's2', type: 'manual-input', x: 380, y: 238, w: 420, h: 84,
        label: '2 · Study the context of use',
        sublabel: 'Observation, interviews, diary, task analysis',
      },
      {
        id: 's3', type: 'process', x: 380, y: 366, w: 420, h: 84,
        label: '3 · Specify testable requirements',
        sublabel: 'Each with a measure and a pass level — ISO 25065',
      },
      {
        id: 's4', type: 'process', x: 380, y: 494, w: 420, h: 84,
        label: '4 · Prototype at minimum fidelity',
        sublabel: 'The lowest fidelity that answers the current question',
      },
      {
        id: 's5', type: 'predefined', x: 380, y: 622, w: 420, h: 84,
        label: '5 · Evaluate with users', sublabel: 'Sample and analyst rules — sheet 2', accent: true,
      },
      {
        id: 's6', type: 'process', x: 380, y: 750, w: 420, h: 84,
        label: '6 · Audit the loop itself',
        sublabel: 'Process capability — ISO 9241-220',
      },
      {
        id: 'report', type: 'document', x: 420, y: 878, w: 340, h: 84,
        label: 'Evaluation report', sublabel: 'CIF format — ISO 25062',
      },
      { id: 'end', type: 'terminator', x: 460, y: 1010, w: 260, h: 56, label: 'Release' },
    ],
    edges: [
      { from: [590, 76], to: [590, 106] },
      { from: [590, 194], to: [590, 234] },
      { from: [590, 322], to: [590, 362] },
      { from: [590, 450], to: [590, 490] },
      { from: [590, 578], to: [590, 618], accent: true },
      { from: [590, 706], to: [590, 746] },
      { from: [590, 834], to: [590, 874] },
      { from: [590, 962], to: [590, 1006] },
      // 9.3.2.3 — the two returns. Stage 5 rewrites the context model; stage 6
      // rewrites the process that produced all of it.
      {
        from: [800, 664], via: [[900, 664], [900, 280]], to: [804, 280], dashed: true,
        label: 'findings → context', labelAt: [910, 452],
      },
      {
        from: [380, 792], via: [[280, 792], [280, 152]], to: [376, 152], dashed: true,
        label: 'gaps → definition', labelAt: [110, 452],
      },
    ],
    annotations: [
      {
        side: 'right',
        bracket: { x: 830, y1: 110, y2: 194 },
        leader: { x1: 830, x2: 804, y: 152 },
        text: { x: 850, y: 104, w: 300 },
        lines: ['A claim that cannot be tied to effectiveness, efficiency, or satisfaction for a named group is an opinion, not a usability claim.'],
      },
      {
        side: 'left',
        bracket: { x: 350, y1: 366, y2: 450 },
        leader: { x1: 350, x2: 376, y: 408 },
        text: { x: 40, y: 360, w: 290 },
        lines: ['An untestable requirement cannot fail, so stage 5 cannot check it. Rewrite it or drop it — see sheet 3.'],
      },
      {
        side: 'left',
        bracket: { x: 350, y1: 494, y2: 578 },
        leader: { x1: 350, x2: 376, y: 536 },
        text: { x: 40, y: 488, w: 290 },
        lines: ['Fidelity spent before evaluation is unverified investment. Low-fidelity prototypes surface substantially the same problems (Virzi et al., CHI 1996).'],
      },
      {
        side: 'right',
        bracket: { x: 830, y1: 750, y2: 834 },
        leader: { x1: 830, x2: 804, y: 792 },
        text: { x: 850, y: 744, w: 300 },
        lines: ['The stage everyone drops. Self-report about your own process is unreliable data: designers believed they followed these principles while mostly not doing so (Gould & Lewis 1985), and the gap was intact 20 years later (Mao et al. 2005).'],
      },
    ],
    footer: 'Flow: top→bottom · dashed = feedback return (9.3.2.3)',
  },

  /*
    Stage 5 opened up — the predefined process from sheet 1. Two things can go
    wrong in an evaluation and they are independent, so the sheet carries two
    decisions rather than one: how many participants, and how many analysts.
  */
  'evaluation-sample': {
    eyebrow: 'HUMAN-CENTRED DESIGN · EVALUATION',
    title: 'Evaluate With Users',
    meta: ['Convention: ISO 5807-1985', 'Expands: HCD loop stage 5', 'Sheet 2/3'],
    canvas: { width: 1180, height: 880 },
    nodes: [
      { id: 'start', type: 'terminator', x: 440, y: 20, w: 300, h: 56, label: 'Evaluation planned' },
      {
        id: 'stakes', type: 'decision', x: 410, y: 116, w: 360, h: 190,
        label: 'Expensive decision, or claim leaves the team?',
      },
      {
        id: 'five', type: 'process', x: 130, y: 358, w: 300, h: 84,
        label: '5 participants', sublabel: 'Cheap iteration inside the loop',
      },
      {
        id: 'twelve', type: 'process', x: 750, y: 358, w: 300, h: 84,
        label: '10 to 12 participants', sublabel: 'Hwang & Salvendy 10±2; Caine ~12', accent: true,
      },
      {
        id: 'analysts', type: 'process', x: 400, y: 522, w: 380, h: 84,
        label: 'Merge problems across ≥2 analysts',
        sublabel: 'The evaluator is part of the instrument',
      },
      {
        id: 'report', type: 'document', x: 420, y: 662, w: 340, h: 84,
        label: 'Evaluation report', sublabel: 'CIF format — ISO 25062',
      },
      { id: 'end', type: 'terminator', x: 460, y: 794, w: 260, h: 56, label: 'Back to stage 2' },
    ],
    edges: [
      { from: [590, 76], to: [590, 112] },
      { from: [410, 211], via: [[280, 211]], to: [280, 354], label: 'No', labelAt: [292, 186] },
      { from: [770, 211], via: [[900, 211]], to: [900, 354], accent: true, label: 'Yes', labelAt: [782, 186] },
      { from: [280, 442], via: [[280, 564]], to: [396, 564] },
      { from: [900, 442], via: [[900, 564]], to: [784, 564], accent: true },
      { from: [590, 606], to: [590, 658] },
      { from: [590, 746], to: [590, 790] },
    ],
    annotations: [
      {
        side: 'left',
        bracket: { x: 100, y1: 358, y2: 442 },
        leader: { x1: 100, x2: 126, y: 400 },
        text: { x: 40, y: 470, w: 300 },
        lines: ['Nielsen & Landauer modelled 5. Faulkner reran it with 60 users: 5-user samples average 85% of problems and drop to 55% in a bad draw. Five is a cheap sample, not a safe one.'],
      },
      {
        side: 'right',
        bracket: { x: 1080, y1: 522, y2: 606 },
        leader: { x1: 1080, x2: 784, y: 564 },
        text: { x: 840, y: 620, w: 300 },
        lines: ['Hertzum & Jacobsen: different evaluators watching the same sessions report substantially different problems. The user sample is not the only noise source.'],
      },
    ],
    footer: 'Flow: top→bottom, left→right',
  },

  /*
    Stage 3's gate, as its own sheet. The decision is the whole content: a
    requirement either states a measure and a pass level or it does not, and the
    consequence of "does not" is that nothing downstream can check it.
  */
  'requirement-testability': {
    eyebrow: 'HUMAN-CENTRED DESIGN · REQUIREMENTS',
    title: 'Is The Requirement Testable?',
    meta: ['Convention: ISO 5807-1985', 'Expands: HCD loop stage 3', 'Sheet 3/3'],
    canvas: { width: 1180, height: 720 },
    nodes: [
      { id: 'start', type: 'terminator', x: 430, y: 20, w: 320, h: 56, label: 'Draft requirement' },
      {
        id: 'trace', type: 'decision', x: 420, y: 116, w: 340, h: 176,
        label: 'Traces to observed behaviour?',
      },
      {
        id: 'measure', type: 'decision', x: 420, y: 340, w: 340, h: 176,
        label: 'States a measure and a pass level?',
      },
      {
        id: 'drop', type: 'process', x: 110, y: 386, w: 300, h: 84,
        label: 'Rewrite or drop', sublabel: 'It cannot fail, so it cannot be checked', muted: true,
      },
      {
        id: 'admit', type: 'process', x: 770, y: 386, w: 300, h: 84,
        label: 'Admit to the requirement set', sublabel: 'ISO 25065 fixed format', accent: true,
      },
      { id: 'end', type: 'terminator', x: 790, y: 570, w: 260, h: 56, label: 'To stage 4', accent: true },
    ],
    edges: [
      { from: [590, 76], to: [590, 112] },
      { from: [590, 292], to: [590, 336], label: 'Yes', labelAt: [602, 296] },
      { from: [420, 428], to: [414, 428], label: 'No', labelAt: [430, 402] },
      { from: [760, 428], to: [766, 428], accent: true, label: 'Yes', labelAt: [700, 402] },
      { from: [420, 204], via: [[260, 204]], to: [260, 382], label: 'No', labelAt: [300, 178] },
      { from: [920, 470], to: [920, 566], accent: true },
    ],
    annotations: [
      {
        side: 'left',
        bracket: { x: 80, y1: 386, y2: 470 },
        leader: { x1: 80, x2: 106, y: 428 },
        text: { x: 40, y: 500, w: 300 },
        lines: ['Both exits are real outcomes. A requirement that survives because nobody could disprove it is the failure this gate exists to prevent — ISO 13407 was revised because it allowed vague ones.'],
      },
      {
        side: 'right',
        bracket: { x: 1100, y1: 116, y2: 292 },
        leader: { x1: 1100, x2: 764, y: 204 },
        text: { x: 850, y: 120, w: 290 },
        lines: ['Every requirement traces to observed behaviour, not to a stakeholder’s assertion about users. The payoff of user involvement concentrates here (Kujala 2003).'],
      },
    ],
    footer: 'Flow: top→bottom, left→right',
  },
}
