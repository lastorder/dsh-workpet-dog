import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'
import { test } from 'node:test'
import * as host from '../index.js'
import { registerSkin } from './helpers.mjs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const manifest = JSON.parse(read('package.json'))
const metadata = Object.fromEntries(['en', 'zh'].map(language => [language, JSON.parse(read(`locale/${language}.json`))]))

function leafKeys(value, prefix = '') {
  return Object.entries(value).flatMap(([key, item]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (item && typeof item === 'object' && !Array.isArray(item)) return leafKeys(item, path)
    assert.equal(typeof item, 'string', `translation ${path} is a string`)
    assert.ok(item.trim().length > 0, `translation ${path} is not empty`)
    return [path]
  }).sort()
}

test('package, host entry, and Loader patch agree on the module identity', () => {
  assert.equal(manifest.name, 'dsh-workpet-dog')
  assert.equal(host.name, manifest.name)
  assert.equal(manifest.type, 'module')
  assert.equal(manifest.main, 'index.js')
  assert.equal(manifest.exports['.'], './index.js')
  assert.equal(manifest.exports['./client'], './client.js')
  assert.equal(manifest.icon, './icon.svg')
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
  const patch = read('cordis.patch.yml').replace(/^\s*#.*$/gm, '')
  const ids = [...patch.matchAll(/^\s*-\s+id:\s*([\w-]+)\s*$/gm)].map(match => match[1])
  const names = [...patch.matchAll(/^\s*name:\s*([\w-]+)\s*$/gm)].map(match => match[1])
  assert.deepEqual(ids, [manifest.name])
  assert.deepEqual(names, [manifest.name])
  assert.match(patch, /^- insert:/m)
})

test('host half is intentionally inert and client waits for dsh-workpet', () => {
  const untouchedContext = new Proxy({}, { get() { assert.fail('the host entry must not access services') } })
  assert.equal(host.apply(untouchedContext), undefined)
  assert.equal(manifest.dsh.client.platform, 'web')
  assert.equal(manifest.dsh.client.immediately, true)
  assert.deepEqual(manifest.dsh.client.inject, ['dsh-workpet'])
})

test('package is plain JavaScript with only pinned React development dependencies', () => {
  assert.equal(manifest.engines.node, '>=22')
  assert.deepEqual(manifest.dependencies ?? {}, {})
  assert.deepEqual(manifest.optionalDependencies ?? {}, {})
  assert.deepEqual(manifest.devDependencies, { react: '18.3.1', 'react-dom': '18.3.1' })
  for (const lifecycle of ['install', 'postinstall', 'prepare', 'build']) {
    assert.equal(manifest.scripts[lifecycle], undefined, `no ${lifecycle} runtime/build step`)
  }
  assert.equal(manifest.license, 'MIT')
  assert.match(read('LICENSE'), /^MIT License\b/)
  assert.match(read('LICENSE'), /Permission is hereby granted, free of charge/)
})

test('verification commands run node directly, check preview syntax, and cover the test glob', () => {
  const syntaxChecks = ['client.js', 'index.js', 'scripts/preview.mjs'].map(path => `node --check ${path}`)
  assert.deepEqual(manifest.scripts.check.split(/\s*&&\s*/), syntaxChecks)
  assert.match(manifest.scripts.test, /^node --test ['"]test\/\*\.test\.mjs['"]$/)
  assert.equal(manifest.scripts.verify, `${manifest.scripts.check} && ${manifest.scripts.test}`)
  assert.equal(manifest.scripts.prepublishOnly, manifest.scripts.verify)
  assert.equal(manifest.scripts.preview, 'node scripts/preview.mjs')
  for (const command of Object.values(manifest.scripts)) assert.doesNotMatch(command, /\b(?:pnpm|npm|yarn|npx)\b/)
})

test('publish allowlist includes runtime, both READMEs, locales, icon, and license', () => {
  for (const path of ['index.js', 'client.js', 'cordis.patch.yml', 'icon.svg', 'README.md', 'README.zh.md', 'LICENSE']) {
    assert.ok(manifest.files.includes(path), `${path} is packaged`)
    assert.ok(statSync(new URL(`../${path}`, import.meta.url)).isFile(), `${path} exists`)
  }
  assert.ok(manifest.files.includes('locale/*.json'))
  assert.equal(manifest.exports['./locale/*.json'], './locale/*.json')
  for (const language of ['en', 'zh']) assert.ok(statSync(new URL(`../locale/${language}.json`, import.meta.url)).isFile())
  for (const path of manifest.files) assert.doesNotMatch(path, /^(?:node_modules|test|scripts|docs)(?:\/|$)/)
  assert.match(read('icon.svg'), /<svg\b/)
  for (const path of ['README.md', 'README.zh.md']) {
    const text = read(path)
    assert.match(text, /dsh-workpet-dog/)
    assert.match(text, /dsh-workpet\b/)
  }
})

test('both package locales and live skin dictionaries have matching nonempty keys', t => {
  assert.deepEqual(leafKeys(metadata.en), leafKeys(metadata.zh))
  assert.deepEqual(leafKeys(metadata.en), ['meta.description', 'meta.title'])
  const runtime = registerSkin()
  t.after(runtime.unload)
  const dicts = runtime.dictionaries.get('workpetDog')
  assert.ok(dicts)
  assert.deepEqual(leafKeys(dicts.en), leafKeys(dicts.zh))
  assert.deepEqual(leafKeys(dicts.en), ['description', 'title'])
  for (const language of ['en', 'zh']) {
    assert.ok(metadata[language].meta.title.endsWith(dicts[language].title), `${language}: package and skin names agree`)
    runtime.setLanguage(language)
    assert.equal(runtime.skins[0].title(), dicts[language].title)
    assert.equal(runtime.skins[0].description(), dicts[language].description)
  }
})
