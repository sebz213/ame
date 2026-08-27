/*
  The violating fixture, React half. Two off-scale literals.

  Both compile, both render, neither is on a scale the token layer publishes.
  This is the failure mode a type checker cannot see: 17px is a perfectly valid
  size and a perfectly invalid decision.

  Do not "fix" these. They are the evidence.
*/

/** S4 — 333 is not a member of the duration scale. The nearest role is 350ms. */
const reveal = { duration: 333 }

export function ViolatingPanel({ label }: { label: string }) {
  return (
    <div
      className="example-broken"
      style={{
        color: 'var(--ame-color-ink)',
        // S1 — 17 is not a member of the font.size scale. 16 and 18 both are.
        fontSize: '17px',
        animationDuration: `${reveal.duration}ms`,
      }}
    >
      <span className="example-broken__meta">{label}</span>
    </div>
  )
}
