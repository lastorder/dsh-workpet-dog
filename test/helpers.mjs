// Load the plain-JavaScript client through the same factory boundary as DSH.
// React is real, not a createElement/useId stub; this catches invalid hooks and
// ID collisions that a hand-written renderer would miss.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

export const ACTIVITIES = Object.freeze([
  'absent', 'idle', 'sleeping', 'thinking', 'writing', 'tool', 'retrying',
  'awaiting', 'delegating', 'done', 'error', 'petted', 'dragged',
])

export function createDocument() {
  const children = []
  const created = []
  const head = {
    children,
    appendChild(node) {
      assert.equal(node.parentNode, null, 'a style node may only be inserted once')
      children.push(node)
      node.parentNode = head
      return node
    },
    removeChild(node) {
      const index = children.indexOf(node)
      assert.notEqual(index, -1, 'only an attached style node may be removed')
      children.splice(index, 1)
      node.parentNode = null
      node.removals += 1
      return node
    },
  }
  return {
    head,
    created,
    createElement(tagName) {
      assert.equal(tagName.toLowerCase(), 'style', 'the skin only owns a stylesheet')
      const node = {
        tagName: tagName.toUpperCase(),
        dataset: {},
        textContent: '',
        parentNode: null,
        removals: 0,
        setAttribute(name, value) {
          if (name === 'data-plugin') this.dataset.plugin = String(value)
          else this[name] = String(value)
        },
        remove() { this.parentNode?.removeChild(this) },
      }
      created.push(node)
      return node
    },
  }
}

export function loadPlugin({ document } = {}) {
  const entries = []
  const requiredModules = []
  const window = { __ModuleLoader__: { load: entry => entries.push(entry) } }
  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
  // Supplying document lexically avoids mutating globalThis between tests.
  new Function('window', 'document', source)(window, document)
  assert.equal(entries.length, 1, 'the client registers exactly one module')
  const [entry] = entries
  assert.equal(typeof entry.factory, 'function')
  const plugin = entry.factory(name => {
    requiredModules.push(name)
    assert.equal(name, 'react', 'the runtime only consumes the page-provided React')
    return React
  })
  return { entry, plugin, requiredModules }
}

export function registerSkin({ withDocument = true, language = 'en', document = createDocument() } = {}) {
  if (!withDocument) document = undefined
  const loaded = loadPlugin({ document })
  const skins = []
  const dictionaries = new Map()
  const effects = []
  const events = []
  const counts = { skinRegistered: 0, skinRemoved: 0, localeRegistered: 0, localeRemoved: 0 }
  let currentLanguage = language
  let activeEffects = 0
  const ctx = {
    workpet: {
      register(skin) {
        assert.ok(activeEffects > 0, 'skin registration must belong to an effect')
        assert.ok(!skins.some(item => item.id === skin.id), 'skin IDs must be unique')
        skins.push(skin)
        counts.skinRegistered += 1
        events.push('skin:register')
        return () => {
          const index = skins.indexOf(skin)
          assert.notEqual(index, -1, 'skin cleanup runs once')
          skins.splice(index, 1)
          counts.skinRemoved += 1
          events.push('skin:remove')
        }
      },
    },
    locale: {
      register(namespace, dicts) {
        assert.ok(activeEffects > 0, 'dictionary registration must belong to an effect')
        assert.ok(!dictionaries.has(namespace), 'locale namespaces must be unique')
        dictionaries.set(namespace, dicts)
        counts.localeRegistered += 1
        events.push('locale:register')
        return () => {
          assert.ok(dictionaries.delete(namespace), 'dictionary cleanup runs once')
          counts.localeRemoved += 1
          events.push('locale:remove')
        }
      },
      bind(namespace) {
        return key => {
          const dicts = dictionaries.get(namespace)
          assert.ok(dicts, `locale namespace ${namespace} is registered`)
          const value = dicts[currentLanguage]?.[key]
          assert.equal(typeof value, 'string', `translation ${namespace}.${currentLanguage}.${key} exists`)
          return value
        }
      },
    },
    effect(callback, label) {
      activeEffects += 1
      let cleanup
      try { cleanup = callback() } finally { activeEffects -= 1 }
      assert.equal(typeof cleanup, 'function', 'each effect returns its resource disposer')
      const effect = { label, disposed: false, disposeCount: 0 }
      effect.dispose = () => {
        if (effect.disposed) return
        cleanup()
        effect.disposed = true
        effect.disposeCount += 1
      }
      effects.push(effect)
      return effect.dispose
    },
  }
  const unload = () => [...effects].reverse().forEach(effect => effect.dispose())
  try {
    loaded.plugin.apply(ctx)
  } catch (error) {
    unload()
    throw error
  }
  return {
    ...loaded,
    ctx,
    skins,
    dictionaries,
    styles: document?.head.children ?? [],
    effects,
    events,
    counts,
    document,
    setLanguage(value) { currentLanguage = value },
    unload,
  }
}

export function sceneFor(activity, extras = {}) {
  return Object.freeze({
    activity,
    helpers: activity === 'delegating' ? 2 : 0,
    ...(activity === 'tool' ? { tool: Object.freeze({ name: 'bash', category: 'shell' }) } : {}),
    ...(activity === 'awaiting' ? { awaiting: 'approval' } : {}),
    ...extras,
  })
}

export function renderFigure(skin, activity, compact = false, sceneExtras = {}) {
  return renderToStaticMarkup(React.createElement(skin.Figure, {
    scene: sceneFor(activity, sceneExtras), compact,
  }))
}

// Multiple siblings in ONE React render tree: separate render calls can reuse
// useId values legitimately and would not test helper-instance collisions.
export function renderFigures(skin, scenes) {
  return renderToStaticMarkup(React.createElement(React.Fragment, null,
    ...scenes.map(({ activity, compact = false, ...extras }, index) =>
      React.createElement(skin.Figure, { key: index, scene: sceneFor(activity, extras), compact })),
  ))
}

export function normalizeSvgIds(markup) {
  const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(match => match[1])
  const replacements = new Map(ids.map((id, index) => [id, `local-id-${index}`]))
  return markup
    .replace(/\bid="([^"]+)"/g, (match, id) => `id="${replacements.get(id)}"`)
    .replace(/url\(#([^)]+)\)/g, (match, id) => `url(#${replacements.get(id) ?? id})`)
}

// A small balanced-block reader, not a CSS engine. Unlike a flat selector
// regexp it distinguishes nested @media blocks from keyframe percentages.
export function cssRules(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const rules = []
  let index = 0
  while (index < text.length) {
    while (/\s/.test(text[index] ?? '') && index < text.length) index += 1
    if (index >= text.length) break
    const open = text.indexOf('{', index)
    assert.notEqual(open, -1, 'CSS rules have an opening brace')
    const prelude = text.slice(index, open).trim()
    let depth = 1
    let quote = ''
    let cursor = open + 1
    for (; cursor < text.length && depth > 0; cursor += 1) {
      const char = text[cursor]
      if (quote) {
        if (char === '\\') cursor += 1
        else if (char === quote) quote = ''
      } else if (char === '"' || char === "'") quote = char
      else if (char === '{') depth += 1
      else if (char === '}') depth -= 1
    }
    assert.equal(depth, 0, `CSS block closes: ${prelude}`)
    rules.push({ prelude, body: text.slice(open + 1, cursor - 1) })
    index = cursor
  }
  return rules
}
