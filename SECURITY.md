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


## There is no bug bounty

## Reporting

Use GitHub's private flow: **Security** tab → **Advisories** → **Report a
vulnerability**. Do not open a public issue for a security report.

AI is fine. 

## Scope

In scope: `tokens/check.mjs`, `packages/ame-tokens/build.mjs`, and the emitted
`tokens.css`.


## Supported versions

There is one branch and it is the one that is maintained. There is no
back-porting, and versions are not separately supported: a fix lands on the
default branch. `pnpm gate` green on a fresh clone is the only supported state.

## Secrets

None are committed, in the tree or its history.
