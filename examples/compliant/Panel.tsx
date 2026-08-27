/*
  The compliant fixture, React half.

  Two numbers here are literal on purpose: 16 is a member of the font.size scale
  and 200 is a member of the duration scale. The S clauses measure membership,
  not abstinence — a literal that sits on the scale is not drift. A literal that
  does not is, and examples/violating carries that case.
*/

/** The panel's own reveal. 200 is duration.fast; 16 is font.size.16. */
const reveal = { duration: 200 }

export function CompliantPanel({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div
      className="example-panel"
      style={{
        // text.body on background.page — contrast pair C1, already declared.
        color: 'var(--ame-text-body)',
        background: 'var(--ame-background-page)',
        fontSize: '16px',
        animationDuration: `${reveal.duration}ms`,
      }}
    >
      <span className="example-panel__label">{label}</span>
      {children}
    </div>
  )
}
