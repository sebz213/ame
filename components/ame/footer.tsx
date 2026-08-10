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
  columns,
  gridCols = 4,
  contact,
  copyright,
  legalLinks,
  endSlot,
  className,
}: {
  tone?: Tone
  /** Optional brand mark above the directory (the marketing site uses it). */
  logo?: ReactNode
  /** Optional tagline under the logo. */
  intro?: ReactNode
  /** Directory columns. Omit for a footer with no sitemap. */
  columns?: AmeFooterColumn[]
  gridCols?: 2 | 3 | 4
  /** The contact line content (the site supplies its own prose + links). */
  contact?: ReactNode
  copyright: ReactNode
  legalLinks?: AmeFooterLink[]
  /** Right-aligned in the end row, e.g. a locale link. */
  endSlot?: ReactNode
  className?: string
}) {
  const dark = tone === 'dark'
  const toneVars = {
    ['--ame-ftr-bg' as string]: dark ? 'var(--component-topbar-bg-on-dark)' : 'var(--component-topbar-bg)',
    ['--ame-ftr-fg' as string]: dark ? 'var(--component-topbar-fg-on-dark)' : 'var(--component-topbar-fg)',
    ['--ame-ftr-fg-hover' as string]: dark
      ? 'var(--component-topbar-fg-hover-on-dark)'
      : 'var(--component-topbar-fg-hover)',
  }
  const colsClass = gridCols === 2 ? 'sm:grid-cols-2' : gridCols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-4'

  return (
    <footer
      aria-label="Site footer"
      className={`mt-auto${className ? ` ${className}` : ''}`}
      style={{
        backgroundColor: 'var(--ame-ftr-bg)',
        color: 'var(--ame-ftr-fg)',
        fontSize: 'var(--type-meta-size)',
        letterSpacing: 'var(--type-body-tracking)',
        lineHeight: 'var(--type-dense-leading)',
        ...toneVars,
      }}
    >
      <div className="mx-auto w-full max-w-5xl px-[var(--space-gutter)] py-[var(--space-section-gap)]">
        {(logo || intro) && (
          <div className="flex flex-col" style={{ gap: 'var(--space-grid-gap)', marginBottom: 'var(--space-section-gap)' }}>
            {logo}
            {intro && (
              <div className="max-w-sm" style={{ lineHeight: 'var(--type-body-leading)' }}>
                {intro}
              </div>
            )}
          </div>
        )}

        {columns && columns.length > 0 && (
          <nav
            aria-label="Directory"
            className={`grid grid-cols-2 gap-x-[var(--space-gutter)] gap-y-[var(--space-section-gap)] ${colsClass}`}
          >
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="font-medium" style={{ color: 'var(--ame-ftr-fg-hover)' }}>
                  {col.title}
                </h3>
                <ul className="mt-[var(--space-stack)] space-y-2.5">
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
          <p className="mt-[var(--space-section-gap)] max-w-[760px]" style={{ lineHeight: 'var(--type-lead-leading)' }}>
            {contact}
          </p>
        )}

        <div className="mt-[var(--space-stack)] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
    </footer>
  )
}
