import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const repo = 'https://github.com/lastorder/dsh-workpet-dog'
const manifest = JSON.parse(read('package.json'))

for (const path of ['README.md', 'README.zh.md']) {
  test(`${path} uses publish-safe absolute links`, () => {
    const text = read(path)
    const links = [...text.matchAll(/\]\((?:<([^>]+)>|([^)]*))\)/g)].map(match => match[1] ?? match[2])
    assert.ok(links.length >= 5, 'installation and development files are linked')
    for (const target of links) {
      assert.match(target, /^(?:https?:\/\/|#|mailto:)/, `npm README link must be absolute: ${target}`)
    }
    for (const [, src] of text.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)) {
      assert.match(src, /^https:\/\//, `image URL must be absolute: ${src}`)
    }
    assert.match(text, /lastorder\/dsh-workpet-dog/)
  })
}

test('npm package metadata points to the public source repository', () => {
  assert.equal(manifest.name, 'dsh-workpet-dog')
  assert.equal(manifest.repository.url, `git+${repo}.git`)
  assert.equal(manifest.homepage, `${repo}#readme`)
  assert.equal(manifest.bugs.url, `${repo}/issues`)
  assert.deepEqual(manifest.dependencies ?? {}, {}, 'no runtime npm dependencies')
})

test('CI verifies all supported Node versions with read-only permissions', () => {
  const ci = read('.github/workflows/ci.yml')
  assert.match(ci, /contents:\s*read/)
  assert.match(ci, /node-version:\s*\['22', '24', '26'\]/)
  assert.match(ci, /pnpm install --frozen-lockfile/)
  assert.match(ci, /pnpm run verify/)
  assert.doesNotMatch(ci, /npm (?:stage )?publish\b/)
})

test('later version tags stage through npm OIDC; no automatic registry publication', () => {
  const release = read('.github/workflows/release.yml')
  assert.match(release, /tags:\s*\n\s*- 'v\*\.\*\.\*'/)
  assert.match(release, /id-token:\s*write/)
  assert.match(release, /TAG_VERSION=.*GITHUB_REF_NAME/)
  assert.match(release, /pnpm run verify/)
  assert.match(release, /npm stage publish/)
  assert.match(release, /prerelease:\s*true/)
  assert.doesNotMatch(release, /^\s*npm publish\b/m)
  assert.match(release, /lastorder\/dsh-workpet-dog/)
  assert.match(release, /softprops\/action-gh-release@[0-9a-f]{40}/)
})
