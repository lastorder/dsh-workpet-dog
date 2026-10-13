import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  ACTIVITIES, createDocument, loadPlugin, normalizeSvgIds, registerSkin,
  renderFigure, renderFigures,
} from './helpers.mjs'

function setup(t, options) {
  const runtime = registerSkin(options)
  t.after(runtime.unload)
  assert.equal(runtime.skins.length, 1)
  return { ...runtime, skin: runtime.skins[0] }
}

function assertSvg(markup, label) {
  assert.match(markup, /^<svg\b/, label)
  assert.match(markup, /<\/svg>$/, label)
  const root = markup.slice(0, markup.indexOf('>') + 1)
  const classes = /\bclass="([^"]*)"/.exec(root)?.[1].split(/\s+/) ?? []
  assert.ok(classes.includes('wpd'), `${label}: root class is wpd`)
  assert.match(root, /\bviewBox="0 0 100 80"/, label)
  assert.match(root, /\bwidth="100%"/, label)
  assert.match(root, /\bheight="100%"/, label)
  assert.match(root, /\baria-hidden="true"/, label)
  assert.match(markup, /<(?:path|circle|ellipse|polygon|rect)\b/, `${label}: visible geometry`)
  assert.doesNotMatch(markup, /NaN|undefined|Infinity/, `${label}: finite SVG coordinates`)
  assert.doesNotMatch(markup, /<(?:script|foreignObject|image)\b/i, `${label}: self-contained SVG`)
  for (const [, names] of markup.matchAll(/\bclass="([^"]*)"/g)) {
    for (const name of names.split(/\s+/).filter(Boolean)) {
      assert.ok(name === 'wpd' || name.startsWith('wpd-'), `${label}: namespaced class ${name}`)
    }
  }
  assertLocalReferences(markup, label)
}

function assertLocalReferences(markup, label) {
  const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(match => match[1])
  assert.equal(new Set(ids).size, ids.length, `${label}: unique SVG IDs`)
  const references = [...markup.matchAll(/url\(#([^)]+)\)/g)].map(match => match[1])
  assert.ok(references.length > 0, `${label}: gradient references are exercised`)
  for (const reference of references) {
    assert.ok(ids.includes(reference), `${label}: reference #${reference} resolves in its own figure`)
  }
}

test('loads one client module using only page-provided React', () => {
  const document = createDocument()
  const { entry, plugin, requiredModules } = loadPlugin({ document })
  assert.equal(entry.id, 'dsh-workpet-dog')
  assert.deepEqual(plugin.inject, ['workpet', 'locale'])
  assert.equal(typeof plugin.apply, 'function')
  assert.deepEqual([...new Set(requiredModules)], ['react'])
  assert.equal(document.created.length, 0, 'factory evaluation must not acquire DOM resources')
})

test('registers a localized Pomeranian and resolves translations at call time', t => {
  const { skin, dictionaries, setLanguage } = setup(t)
  assert.equal(skin.id, 'white-pomeranian')
  assert.match(skin.id, /^[a-z0-9-]+$/)
  assert.equal(typeof skin.Figure, 'function')
  if (skin.order !== undefined) assert.ok(Number.isFinite(skin.order))
  assert.deepEqual([...dictionaries.keys()], ['workpetDog'])
  const dicts = dictionaries.get('workpetDog')
  assert.deepEqual(Object.keys(dicts).sort(), ['en', 'zh'])
  for (const language of ['en', 'zh']) {
    setLanguage(language)
    assert.equal(skin.title(), dicts[language].title)
    assert.equal(skin.description(), dicts[language].description)
    assert.ok(skin.description().trim().length > 0)
  }
  setLanguage('en')
  assert.equal(skin.title(), 'Pomeranian')
  setLanguage('zh')
  assert.equal(skin.title(), '白色小博美')
})

test('unloading releases skin, dictionaries, and only its own stylesheet', t => {
  const document = createDocument()
  const sentinel = document.createElement('style')
  sentinel.dataset.plugin = 'another-plugin'
  sentinel.textContent = '.unrelated { color: red; }'
  document.head.appendChild(sentinel)
  const runtime = setup(t, { document })
  const ownStyles = runtime.styles.filter(style => style !== sentinel)
  assert.equal(ownStyles.length, 1)
  const [style] = ownStyles
  assert.equal(style.dataset.plugin, 'dsh-workpet-dog')
  assert.match(style.textContent, /\.wpd/)
  assert.ok(runtime.effects.length > 0)
  assert.deepEqual(runtime.counts, {
    skinRegistered: 1, skinRemoved: 0, localeRegistered: 1, localeRemoved: 0,
  })

  runtime.unload()
  assert.equal(runtime.skins.length, 0)
  assert.equal(runtime.dictionaries.size, 0)
  assert.deepEqual(document.head.children, [sentinel])
  assert.equal(style.removals, 1)
  assert.equal(sentinel.removals, 0)
  assert.deepEqual(runtime.counts, {
    skinRegistered: 1, skinRemoved: 1, localeRegistered: 1, localeRemoved: 1,
  })
  assert.ok(runtime.effects.every(effect => effect.disposed && effect.disposeCount === 1))
  runtime.unload() // A second context disposal is harmless.
  assert.equal(style.removals, 1)
})

test('a new activation works after a previous activation is disposed', t => {
  const document = createDocument()
  const first = setup(t, { document })
  first.unload()
  const second = setup(t, { document })
  assert.equal(second.styles.length, 1)
  assert.equal(second.skins[0].id, 'white-pomeranian')
  second.unload()
  assert.equal(document.head.children.length, 0)
  assert.ok(document.created.every(style => style.removals === 1))
})

test('registration and SSR also work without a browser document', t => {
  const { skin, styles, unload } = setup(t, { withDocument: false })
  assert.deepEqual(styles, [])
  assertSvg(renderFigure(skin, 'idle'), 'SSR without document')
  assert.doesNotThrow(unload)
})

for (const activity of ACTIVITIES) {
  for (const compact of [false, true]) {
    test(`renders ${activity} (${compact ? 'compact' : 'full'}) with real React SSR`, t => {
      const { skin } = setup(t)
      assertSvg(renderFigure(skin, activity, compact), `${activity}/${compact}`)
    })
  }
}

test('all 26 sibling figures have disjoint, locally resolving gradient IDs', t => {
  const { skin } = setup(t)
  const scenes = ACTIVITIES.flatMap(activity => [false, true].map(compact => ({ activity, compact })))
  const markup = renderFigures(skin, scenes)
  const figures = markup.match(/<svg\b[^>]*>[\s\S]*?<\/svg>/g) ?? []
  assert.equal(figures.length, 26)
  const allIds = [...markup.matchAll(/\bid="([^"]+)"/g)].map(match => match[1])
  assert.equal(new Set(allIds).size, allIds.length, 'no IDs collide within one render tree')
  for (const [index, figure] of figures.entries()) {
    const gradientIds = [...figure.matchAll(/<(?:linearGradient|radialGradient)\b[^>]*\bid="([^"]+)"/g)]
    assert.ok(gradientIds.length > 0, `figure ${index} defines its gradients`)
    assertLocalReferences(figure, `figure ${index}`)
  }
})

test('unknown activities fall back to idle in both sizes', t => {
  const { skin } = setup(t)
  for (const compact of [false, true]) {
    const idle = normalizeSvgIds(renderFigure(skin, 'idle', compact))
    for (const activity of ['future-activity', '__proto__', 'constructor', undefined]) {
      assert.equal(normalizeSvgIds(renderFigure(skin, activity, compact)), idle, `${activity}/${compact}`)
    }
  }
})

test('tool and awaiting scene details are accepted without mutating the scene', t => {
  const { skin } = setup(t)
  for (const category of ['shell', 'search', 'edit', 'web', 'delegate', 'plan', 'ask', 'other']) {
    const tool = Object.freeze({ name: `${category}-tool`, category })
    assertSvg(renderFigure(skin, 'tool', false, { tool, helpers: 3 }), category)
  }
  for (const awaiting of ['approval', 'question', 'plan-review', 'other']) {
    assertSvg(renderFigure(skin, 'awaiting', true, { awaiting, helpers: 1 }), awaiting)
  }
})
