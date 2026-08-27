# Security policy

## The threat model, stated honestly

Ame is a build script and a checker. It reads JSON files in this repository,
writes a CSS file, and reads source files to compare literals against token
values. It has:

- no network calls, at build time or any other time
- no runtime — the shipped artefact is a stylesheet, which does not execute
- no user input, no request handling, no authentication, no secrets
- no dependencies in the token build at all (`build.mjs` uses Node's standard
  library and nothing else)

That is not a boast, it is the scope. **The realistic vulnerability surface here
is close to nil**, and saying so plainly is more useful to you than a policy that
implies otherwise. If you are looking for something to find, the honest answer is
that the interesting failures in this project are correctness failures in the
gate — a clause that stops catching what it claims to catch — and those are bugs,
reported as issues, not vulnerabilities.

## There is no bug bounty, and there will not be one

No payment is offered for any report. This is deliberate and worth explaining,
because the reasoning is not stinginess.

A bounty inverts the economics of reporting. Generating a plausible-looking
vulnerability report now takes about a minute; verifying one still takes a human
an hour or two. curl ran a bounty for six years at roughly 15% accuracy, watched
that fall below 5% once report generation became free, and shut the programme
down in January 2026 — not because the reports were unreadable, but because the
volume of *plausible* ones exceeded any ability to triage them. The money was the
incentive, so the money went.

Ame will never be curl and will never see that volume. The policy is here
because the right time to state it is before the first report, not after the
twentieth.

## Reporting

Use GitHub's private flow: **Security** tab → **Advisories** → **Report a
vulnerability**. Do not open a public issue for a security report.

Include what you actually observed: the file, the input, what happened, and what
you expected instead. A report that describes a real thing gets a real answer.

**A report will be closed without detailed analysis if it does not show evidence
of having been run.** No hedge about this: a description of a vulnerability class
that might theoretically apply, without a reproduction against this tree, is not
a report — and the tools that generate those at scale are the reason this
paragraph exists. Running it costs you one command; not running it costs someone
else an afternoon.

AI is fine. AI is genuinely good at this now. **Unverified** is the problem, and
it always was — the tooling only changed how cheap it became.

## Scope

In scope: `tokens/check.mjs`, `packages/ame-tokens/build.mjs`, and the emitted
`tokens.css`.

Out of scope: vulnerabilities in dependencies, which belong with their
maintainers (a heads-up here is still welcome); anything about the portfolio
application, which is a different repository and does not ship in this package.

## Supported versions

There is one branch and it is the one that is maintained. There is no
back-porting, and versions are not separately supported: a fix lands on the
default branch. `pnpm gate` green on a fresh clone is the only supported state.

## Secrets

None are committed, in the tree or its history. If you believe one has leaked,
use the private flow above rather than opening an issue.
