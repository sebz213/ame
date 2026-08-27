/*
  Blank everything in a JavaScript source that is not code, leaving the code.

  Z2 scans check.mjs for hardcoded threshold literals, and to do that it first has
  to remove the places a number is not a threshold: comments, strings, template
  text, regex literals. It used to do that with four independent regex passes, and
  THAT APPROACH HAS A FAILURE MODE THAT HIDES ITSELF.

  Comments were stripped first, with a non-greedy /\*[\s\S]*?\*\/. A `/*` inside a
  string or a regex literal is not a comment, but that pass cannot tell, so it
  opened one there and closed it at the next `*​/` anywhere in the file -- deleting
  every line between from the scan. Measured on 2026-08-27: 25,064 of 109,496 bytes,
  23% of check.mjs, silently unscanned, with K1's own `POINTER_MAX_BYTES = 512`
  inside the hole and the gate green over it. It surfaced only because an unrelated
  comment shifted the pairing and pushed that literal back into view.

  The failure is not that the old passes were wrong about any one construct. It is
  that a construct's meaning depends on what precedes it, and independent passes
  each assume they run on clean input while being the reason the input is not clean.
  One left-to-right walk that always knows which construct it is inside does not
  have that problem, and cannot silently drop a region: every byte is classified
  exactly once, by a state machine that entered that byte's construct legitimately.

  Blanked bytes are replaced with spaces and newlines are preserved, so offsets and
  line numbers in the output match the input and a violation can name a line.

  Exported for tests/tokens.test.ts, the same reason contrast.mjs and ratchet.mjs
  live outside check.mjs: an instrument every other clause is measured by should be
  provable on its own, not only through the thing it measures. R-194.
*/

/*
  A `/` opens a regex literal or divides, and the difference is what came before it.
  After a value -- an identifier, a number, a closing paren or bracket, a string --
  it divides. Everywhere else it opens a regex.

  The keywords are the cases where the preceding token IS an identifier but is not a
  value: `return /re/` and `typeof /re/` are regexes, `x /re/` is two divisions. This
  list is the operator-ish keywords that can be immediately followed by an
  expression.
*/
const VALUE_KEYWORDS = new Set([
  'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw',
  'case', 'do', 'else', 'yield', 'await',
])

/*
  `}` is genuinely ambiguous without a parser: it can close a block (after which `/`
  is a regex) or an object literal (after which `/` divides). Block is overwhelmingly
  more common in this codebase and treating it as a value would re-open the class of
  bug this module exists to close, so `}` is not a value. The cost of guessing wrong
  is that a division is read as a regex start and the rest of the line is blanked;
  the cost of the other guess is that a regex is read as division and its contents
  are scanned as code, which is how numbers inside a pattern become false thresholds.
  Neither is silent -- both surface as a Z2 result someone has to look at.
*/
const VALUE_CHARS = new Set([')', ']'])

const isWordChar = (c) => c !== undefined && /[A-Za-z0-9_$]/.test(c)

/**
 * Return `src` with every comment, string, template-literal text and regex literal
 * replaced by spaces, preserving length and line breaks. Code inside a template's
 * `${...}` is code and is preserved: a threshold restated there is still restated.
 *
 * @param {string} src
 * @returns {string}
 */
export function stripNonCode(src) {
  const out = src.split('')
  const n = src.length
  const blank = (from, to) => {
    for (let k = from; k < to && k < n; k++) if (out[k] !== '\n') out[k] = ' '
  }

  // Frames track template nesting: 'tmpl' is literal text, 'expr' is the code
  // inside a ${...} with its own brace depth. A stack, so `${`a${b}c`}` works.
  const frames = []
  const top = () => frames[frames.length - 1]

  let lastSig = ''
  let lastWord = ''
  let i = 0

  while (i < n) {
    const inTemplateText = top()?.kind === 'tmpl'

    if (inTemplateText) {
      if (src[i] === '\\') {
        blank(i, i + 2)
        i += 2
        continue
      }
      if (src[i] === '`') {
        blank(i, i + 1)
        frames.pop()
        lastSig = '`'
        lastWord = ''
        i += 1
        continue
      }
      if (src[i] === '$' && src[i + 1] === '{') {
        blank(i, i + 2)
        frames.push({ kind: 'expr', braces: 0 })
        i += 2
        continue
      }
      blank(i, i + 1)
      i += 1
      continue
    }

    const c = src[i]
    const d = src[i + 1]

    if (c === '/' && d === '/') {
      let j = i
      while (j < n && src[j] !== '\n') j++
      blank(i, j)
      i = j
      continue
    }

    if (c === '/' && d === '*') {
      let j = i + 2
      while (j < n && !(src[j] === '*' && src[j + 1] === '/')) j++
      j = Math.min(n, j + 2)
      blank(i, j)
      i = j
      continue
    }

    if (c === "'" || c === '"') {
      let j = i + 1
      while (j < n) {
        if (src[j] === '\\') {
          j += 2
          continue
        }
        if (src[j] === c) {
          j++
          break
        }
        // An unterminated string would otherwise swallow the rest of the file --
        // the same unbounded-run failure this module replaces. A newline ends it.
        if (src[j] === '\n') break
        j++
      }
      blank(i, j)
      lastSig = 'x'
      lastWord = ''
      i = j
      continue
    }

    if (c === '`') {
      blank(i, i + 1)
      frames.push({ kind: 'tmpl' })
      i += 1
      continue
    }

    if (c === '/') {
      const divides = VALUE_CHARS.has(lastSig) || (isWordChar(lastSig) && !VALUE_KEYWORDS.has(lastWord))
      if (!divides) {
        let j = i + 1
        let inClass = false
        let closed = false
        while (j < n) {
          const e = src[j]
          if (e === '\\') {
            j += 2
            continue
          }
          if (e === '\n') break
          if (e === '[') inClass = true
          else if (e === ']') inClass = false
          else if (e === '/' && !inClass) {
            j++
            while (j < n && /[gimsuyvd]/.test(src[j])) j++
            closed = true
            break
          }
          j++
        }
        if (closed) {
          blank(i, j)
          lastSig = 'x'
          lastWord = ''
          i = j
          continue
        }
        // Not a regex after all (no closing delimiter on the line). Fall through
        // and treat it as an ordinary code character rather than blanking to EOF.
      }
    }

    if (top()?.kind === 'expr') {
      if (c === '{') top().braces++
      else if (c === '}') {
        if (top().braces === 0) {
          blank(i, i + 1)
          frames.pop()
          i += 1
          continue
        }
        top().braces--
      }
    }

    if (!/\s/.test(c)) {
      lastSig = c
      lastWord = isWordChar(c) ? (isWordChar(src[i - 1]) ? lastWord + c : c) : ''
    }
    i += 1
  }

  return out.join('')
}
