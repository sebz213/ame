/*
  Page translation through the browser's own Translator API.

  WHY NOT A WIDGET. The usual answer to "add languages" is a third-party overlay
  that reflows the page, hijacks focus, and announces itself to a screen reader as
  a menu nobody asked for. Those overlays are the accessibility anti-pattern this
  deliberately avoids: nothing here is injected into the layout, no element is
  added to the tab order, and the only DOM this touches is the text it replaces.

  WHY NOT A CLOUD ROUND TRIP. The translation runs on-device. No text leaves the
  browser, there is no key to leak, no request to rate-limit, and it works offline
  once the language pack is present. A server round trip to translate a nav label
  would be the wrong shape for the job.

  IT IS EXPERIMENTAL, SO EVERY ENTRY POINT IS GUARDED. `Translator` exists in
  almost no browser today. `support()` is the only thing that touches the global,
  every call site awaits it first, and a browser without the API gets the honest
  answer — the label still changes what the document DECLARES, and the caller is
  told the words did not change. Nothing throws, and nothing pretends.
*/

type Availability = 'unavailable' | 'downloadable' | 'downloading' | 'available'
type TranslatorInstance = { translate: (input: string) => Promise<string>; destroy?: () => void }
type TranslatorApi = {
  availability: (opts: { sourceLanguage: string; targetLanguage: string }) => Promise<Availability>
  create: (opts: {
    sourceLanguage: string
    targetLanguage: string
    monitor?: (m: EventTarget) => void
  }) => Promise<TranslatorInstance>
}

/** The API, or null. The single place this module reads the global. */
function api(): TranslatorApi | null {
  if (typeof self === 'undefined') return null
  const t = (self as unknown as { Translator?: TranslatorApi }).Translator
  return t && typeof t.availability === 'function' ? t : null
}

export const SOURCE_LANGUAGE = 'en'

/** Whether this browser can translate to `target` at all, without downloading anything to find out. */
export async function support(target: string): Promise<Availability> {
  const t = api()
  if (!t || target === SOURCE_LANGUAGE) return t ? 'available' : 'unavailable'
  try {
    return await t.availability({ sourceLanguage: SOURCE_LANGUAGE, targetLanguage: target })
  } catch {
    return 'unavailable'
  }
}

/*
  What may be translated.

  Excluded: anything the author marked, code and preformatted text (a translated
  identifier is a wrong identifier), and the language control itself — its label
  is the name of a language, not prose, and translating it would leave the user
  unable to find their way back.
*/
const SKIP = 'script, style, code, pre, kbd, samp, [translate="no"], [data-no-translate]'
const MIN_LENGTH = 2

/*
  RESTORING IS NOT A SECOND TRANSLATION, SO IT DOES NOT USE THE SAME FILTER.

  translatableNodes answers "what is worth translating", and MIN_LENGTH is part
  of that answer: a one-character node is punctuation or a separator far more
  often than it is a word. The restore pass asks a different question — "what
  did this module change" — and running it through the same filter loses every
  node whose TRANSLATION came back shorter than the floor.

  That is not hypothetical and it is not rare in the languages this offers.
  Japanese renders many English words as a single character, so the header nav's
  last label translated to one glyph, fell under MIN_LENGTH, and was invisible
  to the restore walk. It stayed Japanese while the rest of the page came back to
  English — leaving the reader looking at the one thing that says the switch does
  not fully work.

  So the restore walk is keyed on `originals` rather than on shape. If this
  module wrote the node, this module can put it back, whatever length the
  translation happened to be. SKIP is not consulted either: a node with a
  recorded original was translated, and it is owed a restore regardless of what
  its ancestors say now.
*/
function restorableNodes(root: HTMLElement): Text[] {
  const out: Text[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      originals.has(node as Text) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
  })
  for (let n = walker.nextNode(); n; n = walker.nextNode()) out.push(n as Text)
  return out
}

function translatableNodes(root: HTMLElement): Text[] {
  const out: Text[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      /*
        A node this module has already translated stays eligible, whatever it
        currently reads. MIN_LENGTH and SKIP are judgements about the AUTHORED
        text, and once a node holds a translation its current value is no longer
        that text — a Japanese single-glyph label would fail the length floor and
        be stranded on the next switch exactly as it was on the restore. The
        recorded original is the standing proof it qualified once.
      */
      if (originals.has(node as Text)) return NodeFilter.FILTER_ACCEPT
      const value = node.nodeValue
      if (!value || value.trim().length < MIN_LENGTH) return NodeFilter.FILTER_REJECT
      const parent = node.parentElement
      if (!parent || parent.closest(SKIP)) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    },
  })
  for (let n = walker.nextNode(); n; n = walker.nextNode()) out.push(n as Text)
  return out
}

/*
  The originals, so English is a restore rather than a second translation.
  Keyed by node: a WeakMap lets a node that leaves the document be collected
  without this holding it alive.
*/
const originals = new WeakMap<Text, string>()

/*
  Which language each node currently SHOWS. Two jobs: a re-run skips what is
  already in the target rather than paying to translate it twice, and a sweep can
  tell new content from old without diffing the tree.
*/
const rendered = new WeakMap<Text, string>()

/*
  KEEPING LATE CONTENT IN THE CHOSEN LANGUAGE.

  A pass translates the nodes that exist WHEN IT RUNS. Half this interface does
  not exist then: the accessibility panel, the contact menus, the cookie modal and
  the mobile nav all mount when opened, so a reader who switched language and then
  opened one was handed English inside a page that had agreed to be Japanese.

  So the switch is a state, not an event. While a language is active a
  MutationObserver watches for content arriving and translates it in place. Only
  childList is observed — writing a node's value is a characterData mutation, so
  the sweep cannot retrigger itself.
*/
let activeTarget: string | null = null
let observer: MutationObserver | null = null
let sweepTimer: ReturnType<typeof setTimeout> | null = null

/*
  A panel mounts as a burst of insertions. Waiting lets the burst settle so the
  subtree is translated once, rather than once per node as React commits it.
*/
const SWEEP_DELAY_MS = 150

function stopWatching() {
  observer?.disconnect()
  observer = null
  if (sweepTimer) clearTimeout(sweepTimer)
  sweepTimer = null
}

function scheduleSweep(host: HTMLElement) {
  if (sweepTimer) return
  sweepTimer = setTimeout(() => {
    sweepTimer = null
    void sweep(host)
  }, SWEEP_DELAY_MS)
}

function startWatching(host: HTMLElement) {
  if (observer) return
  observer = new MutationObserver(() => scheduleSweep(host))
  observer.observe(host, { childList: true, subtree: true })
}

async function sweep(host: HTMLElement) {
  const target = activeTarget
  if (!target) return
  const fresh = translatableNodes(host).filter((n) => rendered.get(n) !== target)
  if (fresh.length) await render(fresh, target)
}

/** Translate `nodes` into `target`. The one place a Translator is created and destroyed. */
async function render(nodes: Text[], target: string, onStatus?: (s: TranslationStatus) => void) {
  const t = api()
  if (!t) return false
  let translator: TranslatorInstance
  try {
    translator = await t.create({
      sourceLanguage: SOURCE_LANGUAGE,
      targetLanguage: target,
      // A language pack can be tens of megabytes on first use. The caller is
      // told, so the UI can say "preparing" instead of appearing to hang.
      monitor: (m) => m.addEventListener('downloadprogress', () => onStatus?.('downloading')),
    })
  } catch {
    return false
  }
  onStatus?.('translating')
  for (const node of nodes) {
    const source = originals.get(node) ?? node.nodeValue ?? ''
    if (!originals.has(node)) originals.set(node, source)
    try {
      node.nodeValue = await translator.translate(source)
      rendered.set(node, target)
    } catch {
      // One node failing is not worth abandoning the page for; it keeps its
      // English, which is readable, rather than becoming empty, which is not.
    }
  }
  translator.destroy?.()
  return true
}

export type TranslationStatus = 'translating' | 'downloading' | 'done' | 'unavailable' | 'restored'

/**
 * Translate the page's text into `target`, or restore English.
 *
 * Returns the status it ended in, so a caller can announce something true rather
 * than assuming it worked.
 */
export async function translatePage(
  target: string,
  { root, onStatus }: { root?: HTMLElement | null; onStatus?: (s: TranslationStatus) => void } = {},
): Promise<TranslationStatus> {
  const host = root ?? document.body
  /*
    WHICH ELEMENT GETS THE lang ATTRIBUTE.

    The element whose text changed is the element whose lang should say so. With no
    root that is the document, which is the site case. With a root it is that
    subtree — a demo that translates its own specimen must not tell assistive
    technology the whole page changed language, which is what setting
    documentElement did before this was threaded through.
  */
  const langTarget: HTMLElement = root ?? document.documentElement

  if (target === SOURCE_LANGUAGE) {
    // English is the source, so there is nothing for a watcher to keep in step:
    // content that mounts from here on is already in the language it was authored
    // in. Stopping first also means the restore below cannot wake a sweep.
    stopWatching()
    activeTarget = null
    for (const node of restorableNodes(host)) {
      node.nodeValue = originals.get(node) as string
      rendered.set(node, SOURCE_LANGUAGE)
    }
    langTarget.lang = SOURCE_LANGUAGE
    onStatus?.('restored')
    return 'restored'
  }

  const availability = await support(target)
  if (availability === 'unavailable') {
    onStatus?.('unavailable')
    return 'unavailable'
  }

  onStatus?.(availability === 'available' ? 'translating' : 'downloading')
  const ok = await render(translatableNodes(host), target, onStatus)
  if (!ok) {
    onStatus?.('unavailable')
    return 'unavailable'
  }

  // The switch stays on: this target is now the page's state, and anything that
  // mounts while it holds gets translated as it arrives.
  activeTarget = target
  startWatching(host)

  // Last, so assistive technology is not told the page is French while most of
  // it is still English.
  langTarget.lang = target
  onStatus?.('done')
  return 'done'
}
