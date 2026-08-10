// ESLint flat config. Restored by WO-6.1 (decision R-23), superseding the
// tokens/decisions.md D-12 deletion, on Pacifico et al.'s finding that the three
// highest-risk code smells (variable re-assignment, complex code, and
// assignment-in-a-conditional) predict faults and belong at ERROR severity.
//
// This config is minimal and targeted, not a full next/react ruleset. It states
// four errors and four warnings, nothing else. Every numeric threshold is read
// from tokens/invariants.json > lint: the checker imports its numbers from the
// contract, it does not restate them (deliverables.md). The `complexity` error
// sits at the current measured maximum, so it is green today and only ratchets
// down as deep functions are split; the max_* warnings are baselined by count in
// tokens/lint-baseline.json.
//
// Scope: app/, components/, lib/, hooks/, and the tokens/*.mjs pipeline scripts.
import { readFileSync } from 'node:fs'
import tseslint from 'typescript-eslint'
import jsxA11y from 'eslint-plugin-jsx-a11y'

const invariants = JSON.parse(
  readFileSync(new URL('./tokens/invariants.json', import.meta.url), 'utf8'),
)
const T = invariants.lint

// The three highest-risk smells as errors, plus complexity at the measured max.
const errorRules = {
  'no-cond-assign': ['error', 'always'],
  'no-param-reassign': 'error',
  'prefer-const': 'error',
  complexity: ['error', T.complexity],
}

// Structural smells as warnings: measured, baselined, driven down over time.
const warnRules = {
  'max-lines-per-function': ['warn', T.max_lines_per_function],
  'max-depth': ['warn', T.max_depth],
  'max-params': ['warn', T.max_params],
}

// STANDARD.md N clauses at identifier scope: types and interfaces PascalCase,
// functions and variables camelCase. React components (PascalCase) and
// module-level constants (UPPER_CASE) are the two admitted extra forms, because
// the repo already uses them and they are not the drift N guards against.
const namingConvention = [
  'warn',
  { selector: 'typeLike', format: ['PascalCase'] },
  { selector: 'interface', format: ['PascalCase'] },
  { selector: 'variable', format: ['camelCase', 'UPPER_CASE', 'PascalCase'], leadingUnderscore: 'allow' },
  { selector: 'function', format: ['camelCase', 'PascalCase'] },
  { selector: 'parameter', format: ['camelCase', 'PascalCase'], leadingUnderscore: 'allow' },
]

// Deliberately NOT js.configs.recommended: that set is ~100 rules (no-undef,
// no-unused-vars, ...) and would make this a broad ruleset. This config states
// only the eight rules the work order names. TypeScript already reports
// undefined and unused identifiers, so the recommended overlap is redundant here.
export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'packages/ame-tokens/tokens.css',
      // Vendored shadcn/ui primitives. Their names and shape are upstream's
      // call, not this repo's, the same exemption R-8 and invariants.json >
      // synonyms.symbol_exclude already grant components/ui (decision R-23).
      'components/ui/**',
    ],
  },
  // TypeScript surface: app, components, lib, hooks. tseslint.configs.base
  // supplies the parser and plugin registration only, no rules of its own.
  {
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}', 'hooks/**/*.{ts,tsx}'],
    extends: [tseslint.configs.base],
    rules: {
      ...errorRules,
      ...warnRules,
      '@typescript-eslint/naming-convention': namingConvention,
    },
  },
  // Accessibility, at ERROR severity (decision R-71). This is the one place the
  // "eight rules, nothing else" rule above is deliberately widened, and the
  // reason is that a11y was a whole CATEGORY the repo enforced nothing in, not a
  // style preference: the gate's only a11y clause was contrast, and contrast is
  // the part that happens to be expressible in token values. jsx-a11y's
  // recommended set is what the accessible-name, role-validity, and
  // keyboard-parity rules look like when someone else has already calibrated
  // them; restating a subset here would be a second home for that judgement.
  //
  // ERROR, not warn. The plugin found exactly 2 problems on arrival: a <video>
  // with no <track> (real, fixed) and CaseStudyHeader's `role="Lead product
  // designer"` prop read as an ARIA role (not real — see below). With both
  // settled the count is 0, so there is nothing to baseline. A rule green on
  // arrival that blocks on regression needs no ratchet; lint-baseline.json is
  // for debts, and this has none. Vendored components/ui is out of scope by the
  // ignores block above (R-8), the same exemption every other rule takes.
  {
    files: ['app/**/*.tsx', 'components/**/*.tsx'],
    extends: [jsxA11y.flatConfigs.recommended],
    rules: {
      // aria-role checks every `role=` prop, including on custom components,
      // where the name is often domain vocabulary rather than ARIA. This repo
      // has one: <CaseStudyHeader role="Lead product designer" />, a job title.
      // ignoreNonDOM scopes the rule to real DOM elements, which is the whole
      // set it can reason about anyway. Renaming the prop was the alternative,
      // and it is the worse one: `role` is the right word for what the case
      // study states (STANDARD.md N1, a name states exactly its concept), and
      // bending domain vocabulary around a linter's namespace is how a name
      // starts lying about its concept.
      'jsx-a11y/aria-role': ['error', { ignoreNonDOM: true }],
    },
  },
  // The token pipeline scripts, plain ESM JavaScript. No TS parser, no
  // naming-convention (that rule is TypeScript-only).
  {
    files: ['tokens/*.mjs'],
    languageOptions: { sourceType: 'module' },
    rules: {
      ...errorRules,
      ...warnRules,
    },
  },
)
