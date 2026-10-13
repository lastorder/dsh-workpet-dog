/** Generate an offline preview from the real plugin — no server or build. */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const root = new URL('../', import.meta.url)
const require = createRequire(import.meta.url)
const styles = []
let entry
let skin
const document = {
  createElement: () => ({ dataset: {}, textContent: '', remove() {} }),
  head: { appendChild: tag => styles.push(tag.textContent) },
}
runInNewContext(readFileSync(new URL('client.js', root), 'utf8'), {
  window: { __ModuleLoader__: { load: value => { entry = value } } }, document,
}, { filename: 'client.js' })
const disposers = []
entry.factory(require).apply({
  effect: fn => { disposers.push(fn()) },
  locale: { register: () => () => {}, bind: () => key => key },
  workpet: { register: value => { skin = value; return () => {} } },
})

const poses = [
  ['idle', '乖乖陪你', '眨眨眼，摇摇尾巴'],
  ['thinking', '歪头思考', '这个问题，让我想想'],
  ['writing', '爪爪打字', '正在认真敲小键盘'],
  ['tool', '跑腿中', '小短腿也能跑很快'],
  ['awaiting', '举爪等你', '有件事想问问你'],
  ['delegating', '望望伙伴', '和小伙伴一起努力'],
  ['done', '完成啦', '开心到蹦起来'],
  ['petted', '贴贴时间', '再摸摸我的脑袋嘛'],
  ['sleeping', '一团好梦', '蜷成一朵小白云'],
  ['retrying', '晕乎乎', '没关系，再试一次'],
  ['error', '有点委屈', '擦擦眼泪，继续加油'],
  ['dragged', '被抱起来', '露出粉粉的小肉垫'],
  ['absent', '安静等候', '等你回来一起开工'],
]
let sequence = 0
const render = (activity, compact = false) => renderToStaticMarkup(
  React.createElement(skin.Figure, { scene: { activity, helpers: 0 }, compact }),
  { identifierPrefix: `preview${sequence++}-` },
)
const templates = poses.map(([activity]) => `<template id="pose-${activity}">${render(activity)}</template>`).join('')
const cards = poses.map(([activity, title, subtitle], i) => `
  <button class="pose-card${i === 0 ? ' selected' : ''}" data-activity="${activity}" aria-pressed="${i === 0}" type="button">
    <span class="pose-stage">${render(activity)}</span>
    <span class="pose-title">${title}</span><span class="pose-subtitle">${subtitle}</span>
    <span class="pose-id">${activity}</span>
  </button>`).join('')
const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>小雪球 · 白色小博美 Work Pet</title>
<style>
${styles.join('\n')}
:root{color-scheme:light;--bg:#f7f8f5;--surface:#fff;--text:#344c47;--muted:#7d8e88;--border:#e6ece6;--wash:#eef3ec;--accent:#528a76;--soft:#dcebe1;}
:root.dark{color-scheme:dark;--bg:#202a2a;--surface:#2a3636;--text:#e0ede5;--muted:#9fb4ab;--border:#3c4c47;--wash:#303f3b;--accent:#a3d5bb;--soft:#384e43;}
*{box-sizing:border-box;}body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Segoe UI',sans-serif;}
button{font:inherit;color:inherit;cursor:pointer;}button:focus-visible{outline:3px solid var(--accent);outline-offset:4px;}
main{max-width:1140px;margin:auto;padding:32px 38px 28px;}header{display:flex;align-items:center;justify-content:space-between;gap:16px;}
.brand{font-size:13px;letter-spacing:.12em;font-weight:700;display:flex;gap:10px;align-items:center;}.brand-dot{height:10px;width:10px;border-radius:50%;background:#8cc7b8;box-shadow:0 0 0 5px var(--soft);}
.tools{display:flex;gap:8px;}.quiet{border:1px solid var(--border);background:var(--surface);border-radius:20px;padding:8px 13px;font-size:12px;}
.hero{display:grid;grid-template-columns:1.1fr 1fr;align-items:center;min-height:282px;padding:24px 0 14px;gap:24px;}.eyebrow{font-size:11px;letter-spacing:.16em;color:var(--accent);font-weight:650;}
h1{font-size:38px;letter-spacing:-.035em;line-height:1.3;margin:13px 0 14px;font-weight:700;}.intro{font-size:14px;line-height:1.9;color:var(--muted);margin:0;}.chips{display:flex;gap:7px;margin-top:19px;flex-wrap:wrap;}.chip{font-size:10px;color:var(--accent);padding:5px 9px;border:1px solid var(--border);border-radius:20px;}
.hero-art{position:relative;display:flex;justify-content:center;align-items:center;min-height:246px;flex-direction:column;}.halo{position:absolute;width:234px;height:214px;background:var(--soft);border-radius:48% 52% 46% 54%;opacity:.65;top:6px;transform:rotate(-10deg);}
.hero-dog{position:relative;width:252px;height:202px;border:0;background:none;padding:0;}.hero-caption{position:relative;font-size:12px;color:var(--muted);margin-top:12px;}.hero-caption strong{color:var(--accent);font-weight:550;}
.section-head{display:flex;justify-content:space-between;align-items:baseline;margin:18px 0 15px;gap:12px;}.section-head h2{font-size:16px;margin:0;font-weight:600;}.section-head span{font-size:11px;color:var(--muted);}
.grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;}.pose-card{position:relative;display:flex;align-items:center;flex-direction:column;min-width:0;padding:13px 8px 12px;background:var(--surface);border:1px solid var(--border);border-radius:16px;transition:border-color .2s,background .2s;}.pose-card:hover,.pose-card.selected{border-color:var(--accent);background:var(--wash);}.pose-stage{display:block;width:120px;height:96px;margin:3px 0 10px;}.pose-title{font-size:12px;font-weight:600;}.pose-subtitle{font-size:10px;color:var(--muted);margin-top:6px;}.pose-id{font:9px ui-monospace,SFMono-Regular,monospace;color:var(--muted);opacity:.65;margin-top:8px;}
.companions{grid-column:span 2;border:1px dashed var(--border);border-radius:16px;display:flex;align-items:center;justify-content:center;gap:18px;padding:18px;}.mini-dogs{display:flex;align-items:flex-end;}.mini-dogs span{display:block;width:58px;height:47px;}.mini-dogs span+span{width:40px;height:32px;}.companions p{font-size:12px;line-height:1.9;margin:0;}.companions small{font-size:10px;color:var(--muted);}
footer{display:flex;justify-content:space-between;gap:15px;color:var(--muted);font-size:10px;line-height:1.7;margin-top:23px;padding-top:17px;border-top:1px solid var(--border);}
.paused .wpd *{animation-play-state:paused !important;}
@media(max-width:800px){main{padding:24px;}.grid{grid-template-columns:repeat(3,minmax(0,1fr));}.companions{grid-column:span 2;}h1{font-size:30px;}}
@media(max-width:520px){main{padding:20px 16px;}.hero{grid-template-columns:1fr;gap:8px;padding-top:32px;}.hero-art{min-height:230px;}.grid{grid-template-columns:repeat(2,minmax(0,1fr));}.companions{grid-column:span 1;flex-direction:column;gap:8px;text-align:center;padding:10px;}.tools{gap:5px;}.quiet{padding:7px 9px;}.brand{font-size:11px;}.section-head span{max-width:130px;line-height:1.6;text-align:right;}footer{flex-direction:column;gap:5px;}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{transition:none !important;}}
</style></head><body><main>
<header><div class="brand"><span class="brand-dot"></span>WORK PET / POMERANIAN</div><div class="tools"><button type="button" class="quiet" id="pause" aria-pressed="false">暂停动画</button><button type="button" class="quiet" id="theme" aria-pressed="false">深色背景</button></div></header>
<section class="hero"><div><div class="eyebrow">A LITTLE CLOUD, A LITTLE COMPANY.</div><h1>小雪球，<br>来陪你工作。</h1><p class="intro">蓬蓬白毛、软软肉垫，还有一条摇不停的卷尾巴。<br>认真工作的时候，也别忘了摸摸它。</p><div class="chips"><span class="chip">13 种陪伴状态</span><span class="chip">纯 SVG · 无需编译</span><span class="chip">支持减少动态效果</span></div></div><div class="hero-art"><div class="halo"></div><button type="button" class="hero-dog" id="hero-dog" aria-label="摸摸白色小博美">${render('idle')}</button><div class="hero-caption"><strong id="current-pose" aria-live="polite">乖乖陪你</strong> · 点击小狗，摸摸脑袋</div></div></section>
<div class="section-head"><h2>每一种心情，都陪着你</h2><span>点击卡片，查看小博美的动作</span></div>
<section class="grid" aria-label="13 种宠物状态">${cards}<aside class="companions"><div class="mini-dogs"><span>${render('idle', true)}</span><span>${render('done', true)}</span></div><p>小小一只，也很认真。<br><small>compact 小伙伴尺寸预览</small></p></aside></section>
<footer><span>dsh-workpet-dog · 白色小博美<br>参考 dsh-workpet-parrot 的插件结构，重新绘制全部造型与动画。</span><span>这是离线外观预览，不连接会话。<br>实际状态、摸摸、拖拽与特效由 Work Pet 提供。</span></footer>
</main>${templates}<script>
const labels = ${JSON.stringify(Object.fromEntries(poses.map(([key, title]) => [key, title])))};
function select(activity) {
  document.getElementById('hero-dog').replaceChildren(document.getElementById('pose-' + activity).content.cloneNode(true));
  document.getElementById('current-pose').textContent = labels[activity];
  document.querySelectorAll('[data-activity]').forEach(card => {
    const selected = card.dataset.activity === activity;
    card.classList.toggle('selected', selected);
    card.setAttribute('aria-pressed', String(selected));
  });
}
document.querySelectorAll('[data-activity]').forEach(card => card.addEventListener('click', () => select(card.dataset.activity)));
document.getElementById('hero-dog').addEventListener('click', () => select('petted'));
document.getElementById('pause').addEventListener('click', event => {
  const paused = document.body.classList.toggle('paused');
  event.currentTarget.textContent = paused ? '继续动画' : '暂停动画';
  event.currentTarget.setAttribute('aria-pressed', String(paused));
});
document.getElementById('theme').addEventListener('click', event => {
  const dark = document.documentElement.classList.toggle('dark');
  event.currentTarget.textContent = dark ? '浅色背景' : '深色背景';
  event.currentTarget.setAttribute('aria-pressed', String(dark));
});
</script></body></html>`
// SVG template indentation can leave whitespace-only lines in the generated files.
const trimBlankLines = text => text.replace(/^[\t ]+$/gm, '')
mkdirSync(new URL('docs/', root), { recursive: true })
writeFileSync(new URL('docs/preview.html', root), trimBlankLines(html))
// The plugin icon uses the exact same artwork, frozen without animation CSS.
writeFileSync(new URL('icon.svg', root), trimBlankLines(render('idle', true)
  .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
  .replace('aria-hidden="true"', 'role="img" aria-label="白色小博美"')))
for (const dispose of disposers.reverse()) dispose()
console.log(`Preview: ${fileURLToPath(new URL('docs/preview.html', root))}`)
console.log(`Icon: ${fileURLToPath(new URL('icon.svg', root))}`)
