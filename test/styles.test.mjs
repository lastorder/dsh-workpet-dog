import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ACTIVITIES, cssRules, registerSkin, renderFigure } from './helpers.mjs'

function stylesheet(t) {
  const runtime = registerSkin()
  t.after(runtime.unload)
  const ownStyles = runtime.styles.filter(style => style.dataset.plugin === 'dsh-workpet-dog')
  assert.equal(ownStyles.length, 1)
  return { css: ownStyles[0].textContent, skin: runtime.skins[0] }
}

function qualifiedRules(rules) {
  return rules.flatMap(rule => {
    if (/^@(?:media|supports|layer|container)\b/.test(rule.prelude)) return qualifiedRules(cssRules(rule.body))
    if (rule.prelude.startsWith('@')) return []
    return [rule]
  })
}

test('stylesheet selectors and keyframe names stay in the wpd namespace', t => {
  const { css } = stylesheet(t)
  const rules = cssRules(css)
  const selectors = qualifiedRules(rules).flatMap(rule => rule.prelude.split(',').map(value => value.trim()))
  assert.ok(selectors.includes('.wpd'), 'root rule exists')
  for (const selector of selectors) {
    assert.match(selector, /^\.wpd(?:\b|-)/, `selector is scoped: ${selector}`)
    for (const [, className] of selector.matchAll(/\.([a-zA-Z_][\w-]*)/g)) {
      assert.ok(className === 'wpd' || className.startsWith('wpd-'), `class is namespaced: ${className}`)
    }
  }
  const keyframes = rules.filter(rule => /^@(?:-webkit-)?keyframes\b/.test(rule.prelude))
  assert.ok(keyframes.length > 0, 'the pet has animations')
  for (const rule of keyframes) assert.match(rule.prelude, /^@(?:-webkit-)?keyframes\s+wpd-[\w-]+$/)
  assert.doesNotMatch(css, /@import\b|url\(\s*['"]?https?:/i, 'styles do not load remote resources')
})

test('animation classes used by every pose are defined and target existing keyframes', t => {
  const { css, skin } = stylesheet(t)
  const rules = cssRules(css)
  const selectors = qualifiedRules(rules).map(rule => rule.prelude).join(',')
  const definedClasses = new Set([...selectors.matchAll(/\.([a-zA-Z_][\w-]*)/g)].map(match => match[1]))
  const keyframes = new Set(rules.flatMap(rule => /^@(?:-webkit-)?keyframes\s+([\w-]+)$/.exec(rule.prelude)?.slice(1) ?? []))
  const referencedNames = [...css.matchAll(/\banimation(?:-name)?\s*:\s*([^;}]+)/g)]
    .flatMap(match => [...match[1].matchAll(/\bwpd-[\w-]+\b/g)].map(name => name[0]))
  assert.ok(referencedNames.length > 0)
  for (const name of referencedNames) assert.ok(keyframes.has(name), `keyframes exist: ${name}`)

  // Presentational classes in the artwork have corresponding stylesheet rules;
  // their names, geometry, colors, and animation timing are not hard-coded here.
  for (const activity of ACTIVITIES) {
    for (const compact of [false, true]) {
      const html = renderFigure(skin, activity, compact)
      const classes = [...html.matchAll(/\bclass="([^"]*)"/g)]
        .flatMap(match => match[1].split(/\s+/).filter(Boolean))
      for (const className of classes) {
        assert.ok(definedClasses.has(className), `${activity}/${compact}: stylesheet defines ${className}`)
      }
      for (const [, declaration] of html.matchAll(/\bstyle="([^"]*)"/g)) {
        for (const [, name] of declaration.matchAll(/\banimation(?:-name)?:\s*(wpd-[\w-]+)/g)) {
          assert.ok(keyframes.has(name), `${activity}/${compact}: inline animation ${name} exists`)
        }
      }
    }
  }
})

test('prefers-reduced-motion disables descendant animations without affecting other plugins', t => {
  const { css } = stylesheet(t)
  const reduced = cssRules(css).filter(rule => /^@media\b/.test(rule.prelude) && /prefers-reduced-motion\s*:\s*reduce\b/.test(rule.prelude))
  assert.ok(reduced.length > 0, 'reduced-motion media query exists')
  const overrides = reduced.flatMap(rule => qualifiedRules(cssRules(rule.body)))
    .filter(rule => /\banimation\s*:\s*none\s*!important\s*(?:;|$)/.test(rule.body))
  assert.ok(overrides.some(rule => rule.prelude.split(',').some(selector => /^\s*\.wpd\s+\*\s*$/.test(selector))),
    'all animated SVG descendants are disabled with an important override')
  for (const rule of overrides) {
    for (const selector of rule.prelude.split(',')) assert.match(selector.trim(), /^\.wpd(?:\b|-)/)
  }
})
