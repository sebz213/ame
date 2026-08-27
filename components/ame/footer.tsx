import type { ReactNode } from 'react'

/*
  ame · site footer — shared, tone-aware chrome.

  Apple global-footer IA: an optional brand block, a directory of grouped links, an
  optional contact line, and an end row (copyright, legal links, and a right slot).
  `tone` picks the top-bar colour pair — the light strip (--component-topbar-*) or
  the ink strip (--component-topbar-*-on-dark) — so the light portfolio and the ink
  marketing site are one footer on two grounds.

  Portable: a server component that imports only React types and reads ame tokens.
  Every value that differs between sites — columns, contact, copyright, logo, legal —
  arrives as a prop, so it imports nothing app-specific.
*/

export type AmeFooterLink = { label: string; href: string; external?: boolean }
export type AmeFooterColumn = { title: string; links: AmeFooterLink[] }

type Tone = 'light' | 'dark'

// Links shift to the accent/hover colour on hover; the var is set per-tone below.
const HOVER = 'transition-colors duration-200 hover:[color:var(--ame-ftr-fg-hover)]'

export function AmeFooter({
  tone = 'light',
  logo,
  intro,
  notes,
  columns,
  gridCols = 4,
  contentColumns = false,
  contact,
  copyright,
  legalLinks,
  endSlot,
  className,
  ruleClassName,
}: {
  tone?: Tone
  /** Optional brand mark above the directory (the marketing site uses it). */
  logo?: ReactNode
  /** Optional tagline under the logo. */
  intro?: ReactNode
  /**
   * Material that belongs to the PAGE rather than to the footer's directory —
   * footnotes, disclosures, method notes — rendered above the top rule.
   *
   * Above it, not below, because the rule is what separates the footer's own
   * content from the page. Anything that a paragraph upstairs points at is still
   * that paragraph's, so it sits on the page's side of the line and the directory
   * below stays the footer's.
   */
  notes?: ReactNode
  /** Directory columns. Omit for a footer with no sitemap. */
  columns?: AmeFooterColumn[]
  gridCols?: 2 | 3 | 4 | 5
  /**
   * Size each column to its own content and set them from the left.
   *
   * The default gives every column an equal share of the measure, which reads as a grid at
   * four columns and as a grid with a piece missing at three: the eye finds the empty
   * quarter before it finds the links. Content-sized columns have no quarter to leave
   * empty, so three of them read as three columns rather than as four minus one.
   */
  contentColumns?: boolean
  /** The contact line content (the site supplies its own prose + links). */
  contact?: ReactNode
  copyright: ReactNode
  legalLinks?: AmeFooterLink[]
  /** Right-aligned in the end row, e.g. a locale link. */
  endSlot?: ReactNode
  className?: string
  /**
   * A class for the two dividers, so a host that already declares a hairline can hand its
   * own down instead of the footer inventing a second one that only looks the same. Left
   * off, the footer draws a rule mixed from its own foreground.
   */
  ruleClassName?: string
}) {
  const dark = tone === 'dark'
  const toneVars = {
    ['--ame-ftr-bg' as string]: dark ? 'var(--ame-component-topbar-bg-on-dark)' : 'var(--ame-component-topbar-bg)',
    ['--ame-ftr-fg' as string]: dark ? 'var(--ame-component-topbar-fg-on-dark)' : 'var(--ame-component-topbar-fg)',
    ['--ame-ftr-fg-hover' as string]: dark
      ? 'var(--ame-component-topbar-fg-hover-on-dark)'
      : 'var(--ame-component-topbar-fg-hover)',
    /*
      The rules, mixed from the footer's own foreground rather than stated per tone. One
      declaration covers light and dark because the foreground already re-points, and it
      keeps the component from asking its host for a hairline it can derive.
    */
    ['--ame-ftr-rule' as string]: 'color-mix(in oklab, var(--ame-ftr-fg) 18%, transparent)',
  }
  /*
    THE RULES SIT AT THE CONTENT WIDTH, NOT THE VIEWPORT'S.

    The top rule was a border on <footer>, so it ran the full width of the window while
    every section above it stops at max-w-5xl and insets by the page gutter. Two different
    measures reading as one edge: the divider announced a boundary the content never had.

    It is inside the centred container now, below the gutter padding, which is the same
    box the sections' own `border-y` rules span. A second rule sits above the copyright
    row, closing the directory the way the first one opens it.
  */
  const rule = ruleClassName ? (
    <div aria-hidden="true" className={ruleClassName} />
  ) : (
    <div aria-hidden="true" style={{ borderTop: '1px solid var(--ame-ftr-rule)' }} />
  )

  /*
    Equal shares, or content-sized and distributed.

    EQUAL gives each column a fraction of the measure. It is right at four and wrong below
    it, because the missing share stays where it was.

    CONTENT sizes each column to its longest link and starts the set at the left edge. It
    spanned the measure with `justify-between` until the directory came down to three
    columns: spreading three sets of short links across the full width puts a third of the
    page between "Explore" and "Work", and the row stops reading as a group. Left-aligned,
    the gap is a fixed distance between neighbours and the leftover measure stays where
    leftover measure belongs, at the end.
  */
  const EQUAL = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4', 5: 'sm:grid-cols-5' } as const
  const CONTENT = {
    2: 'sm:grid-cols-[repeat(2,max-content)] sm:justify-start',
    3: 'sm:grid-cols-[repeat(3,max-content)] sm:justify-start',
    4: 'sm:grid-cols-[repeat(4,max-content)] sm:justify-start',
    5: 'sm:grid-cols-[repeat(5,max-content)] sm:justify-start',
  } as const
  const colsClass = (contentColumns ? CONTENT : EQUAL)[gridCols]

  return (
    <footer
      aria-label="Site footer"
      className={`mt-auto${className ? ` ${className}` : ''}`}
      style={{
        backgroundColor: 'var(--ame-ftr-bg)',
        color: 'var(--ame-ftr-fg)',
        fontSize: 'var(--ame-type-meta-size)',
        letterSpacing: 'var(--ame-type-body-tracking)',
        lineHeight: 'var(--ame-type-dense-leading)',
        ...toneVars,
      }}
    >
      <div className="mx-auto w-full max-w-5xl px-[var(--ame-space-gutter)]">
        {/*
          The page's notes, above the rule. Padded below by section-gap so they
          clear it by the same distance every other block in here is separated by,
          and by nothing above: whatever precedes the footer owns that space.
        */}
        {notes && <div className="pb-[var(--ame-space-section-gap)]">{notes}</div>}
        {rule}
        {/*
          The mark sits evenly between the rule and the directory.

          The top padding was section-gap while the mark's own gap below it was smaller, so
          the rule stood further from the mark than the mark stood from Explore — a row
          pushed toward the directory rather than centred between the two. With a logo
          present the top takes the same gap the logo hands down, and the two spaces match.

          Without one there is nothing to balance, so the block keeps section-gap: the
          directory's own distance from the rule is a different measurement from a mark's.
        */}
        <div
          className="pb-[var(--ame-space-section-gap)]"
          style={{
            paddingTop: logo
              ? 'var(--ame-component-footer-logo-gap)'
              : 'var(--ame-space-section-gap)',
          }}
        >
        {(logo || intro) && (
          /*
            The mark's row. It takes the footer-logo gap rather than section-gap: 3.5rem
            separates blocks of content, and a mark with the directory under it is one
            block. The mark sits over the first column's left edge because both start at
            the container's edge; the inset that used to align them is gone with the
            justify-between it existed to compensate for.
          */
          <div
            className="flex flex-col"
            style={{
              gap: 'var(--ame-space-grid-gap)',
              marginBottom: 'var(--ame-component-footer-logo-gap)',
            }}
          >
            {logo}
            {intro && (
              <div className="max-w-sm" style={{ lineHeight: 'var(--ame-type-body-leading)' }}>
                {intro}
              </div>
            )}
          </div>
        )}

        {columns && columns.length > 0 && (
          <nav
            aria-label="Directory"
            /*
              The content form takes the wider gap, and it is now the spacing rather than a
              floor: nothing distributes leftover measure any more, so what is declared here
              is what a reader sees between two columns. The gutter that separates
              quarter-width columns is too tight for content-sized ones side by side.
            */
            className={`grid grid-cols-2 gap-y-[var(--ame-space-section-gap)] ${
              contentColumns
                ? 'gap-x-[var(--ame-space-section-gap)]'
                : 'gap-x-[var(--ame-space-gutter)]'
            } ${colsClass}`}
          >
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="font-medium" style={{ color: 'var(--ame-ftr-fg-hover)' }}>
                  {col.title}
                </h3>
                <ul className="mt-[var(--ame-space-stack)] space-y-2.5">
                  {col.links.map((l) => (
                    <li key={`${col.title}-${l.label}`}>
                      <a href={l.href} className={HOVER} {...(l.external ? { target: '_blank', rel: 'noreferrer' } : {})}>
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        )}

        {contact && (
          <p className="mt-[var(--ame-space-section-gap)] max-w-[760px]" style={{ lineHeight: 'var(--ame-type-lead-leading)' }}>
            {contact}
          </p>
        )}

        <div className="mt-[var(--ame-space-section-gap)]">{rule}</div>

        {/*
          The closing row is metadata about the page rather than part of it — a copyright,
          a legal link, a location — so it sits at the secondary weight the rest of the
          site gives supporting text. The links keep their hover, which is what still
          marks them as reachable.
        */}
        <div
          className="mt-[var(--ame-space-stack)] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ color: 'var(--ame-text-secondary)' }}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
            <span>{copyright}</span>
            {legalLinks && legalLinks.length > 0 && (
              <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
                {legalLinks.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className={HOVER} {...(l.external ? { target: '_blank', rel: 'noreferrer' } : {})}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {endSlot}
        </div>
        </div>
      </div>
    </footer>
  )
}
