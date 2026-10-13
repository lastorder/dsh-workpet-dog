/**
 * dsh-workpet-dog — a little cloud with paws.
 * Plain JavaScript, loaded as-is by DeepSeek Harness; React belongs to the page.
 * Like dsh-workpet-parrot: artwork → CSS animation → disposable registration.
 * Draw only the pet in a 100 × 80 box. Work Pet owns interaction and effects.
 */
window.__ModuleLoader__.load({
  id: 'dsh-workpet-dog',
  factory: (require) => {
    const React = require('react')

    // 1. ARTWORK ------------------------------------------------------------
    const P = {
      white: '#ffffff', cream: '#faf8f3', shade: '#e7e9e8', fur: '#b5bfc2',
      detail: '#d5dcdb', ink: '#525b60', eye: '#293238', shine: '#65737b',
      pink: '#f3b5bd', blush: '#f6c9ce', tongue: '#e991a4',
      mint: '#8cc7b8', mintDark: '#5d9d90', gold: '#e7be6c',
      tear: '#92c9df', laptop: '#91aab9', laptopDark: '#607d8e', screen: '#e4f3f5',
    }

    // Instance-local IDs are essential when Work Pet renders helper puppies.
    const defs = id => `
      <defs>
        <radialGradient id="fur-${id}" cx="38%" cy="24%" r="80%">
          <stop offset="0" stop-color="${P.white}"/><stop offset=".65" stop-color="${P.cream}"/><stop offset="1" stop-color="${P.shade}"/>
        </radialGradient>
        <radialGradient id="face-${id}" cx="45%" cy="30%" r="75%">
          <stop offset="0" stop-color="${P.white}"/><stop offset=".78" stop-color="${P.cream}"/><stop offset="1" stop-color="#eef0eb"/>
        </radialGradient>
      </defs>`

    const line = (d, color = P.detail, width = .85) =>
      `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`

    const shadow = compact => compact ? '' :
      `<ellipse cx="51" cy="74" rx="27" ry="2.5" fill="${P.ink}" opacity=".10"/>`

    // A plumed spitz tail curls over the back, rather than a long straight tail.
    const tail = (id, motion = 'wpd-wag') => `
      <g transform="translate(65 52)">
        <g class="${motion}" style="transform-origin:0px 6px">
          <path d="M-3 9 C8 14 23 4 22 -8 Q27 -10 22 -14 Q25 -20 18 -20 Q17 -27 12 -22 Q6 -25 4 -19 Q-2 -20 -3 -14 C-5 -6 5 -3 10 -9 C10 -2 3 1 -3 0 Z"
            fill="url(#fur-${id})" stroke="${P.fur}" stroke-width="1.1" stroke-linejoin="round"/>
          ${line('M10 -9 Q13 -14 10 -17 M16 -18 Q20 -10 15 -4')}
        </g>
      </g>`

    const body = id => `
      <path d="M35 43 Q29 48 31 55 L28 57 L31 60 Q28 68 36 70 L39 68 Q48 73 55 69 L59 71 Q69 69 68 61 L71 58 L68 55 Q69 46 61 42 Z"
        fill="url(#fur-${id})" stroke="${P.fur}" stroke-width="1.15" stroke-linejoin="round"/>
      <path d="M40 49 Q49 45 59 49 Q59 60 51 65 L48 62 L44 65 Q38 59 40 49" fill="${P.white}" opacity=".85"/>
      ${line('M33 57 l3 2 M63 56 l-3 3')}`

    /** A short round paw. Pads appear only when its sole faces the viewer. */
    const foot = (id, x, y, pads = false) => `
      <g transform="translate(${x} ${y})">
        <path d="M-4 -6 Q-6 -1 -6 2 Q-6 6 0 6 Q6 6 6 2 Q6 -2 4 -6" fill="url(#fur-${id})" stroke="${P.fur}" stroke-width="1.05" stroke-linecap="round"/>
        ${pads ? `
          <ellipse cy="2" rx="2.6" ry="2" fill="${P.pink}"/>
          <circle cx="-2.8" cy="-1.1" r="1" fill="${P.pink}"/><circle cy="-2" r="1" fill="${P.pink}"/><circle cx="2.8" cy="-1.1" r="1" fill="${P.pink}"/>`
          : line('M-2 3 v2 M2 3 v2', P.detail, .7)}
      </g>`

    const eye = (kind, x, y) => {
      if (kind === 'happy') return line(`M${x - 2.7} ${y + 1} q2.7 -3.7 5.4 0`, P.eye, 1.65)
      if (kind === 'closed') return line(`M${x - 2.7} ${y} q2.7 2.8 5.4 0`, P.eye, 1.5)
      if (kind === 'spiral') return `<g class="wpd-spin" style="transform-origin:${x}px ${y}px">${line(`M${x} ${y} m-.6 -.6 a1 1 0 1 1 -.6 1.5 a2 2 0 1 1 3 -1.8 a3.1 3.1 0 1 1 -4.4 -1.8`, P.eye, 1.1)}</g>`
      const dy = kind === 'up' ? -1 : 0
      const r = kind === 'wide' ? 3.3 : kind === 'focus' ? 2.7 : 3
      return `
        <ellipse cx="${x}" cy="${y + dy}" rx="${r}" ry="${r + .6}" fill="${P.eye}"/>
        <ellipse cx="${x + .3}" cy="${y + dy + 1.7}" rx="1.7" ry=".9" fill="${P.shine}" opacity=".55"/>
        <circle cx="${x - .85}" cy="${y + dy - 1.2}" r="1.1" fill="${P.white}"/>
        <circle cx="${x + 1.2}" cy="${y + dy + 1}" r=".5" fill="${P.white}"/>
        ${kind === 'sad' ? line(`M${x - 3} ${y - 4} l5.4 -1.5`, P.ink, 1) : ''}`
    }

    /** Small triangular ears nest into the ruff; never long rabbit ears. */
    const ear = (id, side, droop) => `
      <g transform="translate(${side * 14} -11) rotate(${side * droop})">
        <g class="wpd-ear" style="animation-delay:${side < 0 ? '-1.4s' : '0s'}">
          <path d="M-7 6 Q-8 -2 -5 -13 Q-3 -15 0 -11 Q7 -5 8 5 Z" fill="url(#fur-${id})" stroke="${P.fur}" stroke-width="1.1" stroke-linejoin="round"/>
          <path d="M-4 1 Q-5 -4 -4 -9 Q0 -8 4 1 Q0 -1 -4 1" fill="${P.pink}" opacity=".72"/>
          ${line('M-4 2 l2 -2 l2 3 l2 -2', P.white, 1.4)}
        </g>
      </g>`

    /** Front-facing fox/teddy face with a soft scalloped double-coat ruff. */
    const head = (id, x = 49, y = 32, face = {}) => {
      const { eyes = 'open', tilt = 0, tongue = false, blush = false, droop = 0, tear = false, motion = '' } = face
      const eyeMotion = ['open', 'up', 'wide'].includes(eyes) ? 'wpd-blink' : eyes === 'look' ? 'wpd-look' : ''
      return `
        <g transform="translate(${x} ${y}) rotate(${tilt})">
          <g class="${motion}">
            ${ear(id, -1, droop)}${ear(id, 1, droop)}
            <path d="M-20 -8 Q-19 -15 -10 -15 L-11 -18 L-6 -17 L-3 -20 L1 -17 L6 -19 L8 -16 Q18 -17 20 -9
              L24 -7 L22 -3 L26 1 L23 4 L26 8 L22 10 Q22 16 16 16 L15 20 L10 19 L7 23 L2 21 L-2 24 L-6 21 L-11 22 L-13 19
              Q-22 20 -22 13 L-26 11 L-24 7 L-27 4 L-23 1 L-25 -3 Z"
              fill="url(#face-${id})" stroke="${P.fur}" stroke-width="1.15" stroke-linejoin="round"/>
            <path d="M-18 3 Q-15 -7 -7 -7 Q-3 -7 0 -3 Q3 -7 8 -7 Q17 -6 19 3 Q14 0 10 5 Q0 9 -10 5 Q-14 1 -18 3" fill="${P.white}" opacity=".9"/>
            ${line('M-22 5 l4 -1 M-21 10 l4 -2 M18 4 l4 1 M17 9 l4 2 M-6 -13 l3 -2 l2 2', P.detail, .75)}
            <ellipse cx="-14" cy="8" rx="4.4" ry="2.3" fill="${P.blush}" opacity="${blush ? '.92' : '.5'}"/>
            <ellipse cx="14" cy="8" rx="4.4" ry="2.3" fill="${P.blush}" opacity="${blush ? '.92' : '.5'}"/>
            <g class="${eyeMotion}" style="transform-origin:0px 2px">${eye(eyes, -8, 2)}${eye(eyes, 8, 2)}</g>
            <ellipse cx="-4.2" cy="10" rx="6.5" ry="4.6" fill="${P.white}"/>
            <ellipse cx="4.2" cy="10" rx="6.5" ry="4.6" fill="${P.white}"/>
            ${tongue ? `<path d="M-4.5 11 Q0 14 4.5 11 Q4 19 0 19 Q-4 19 -4.5 11" fill="${P.ink}"/>
              <path class="wpd-pant" d="M-2.8 14 Q0 13 2.8 14 L2.6 16.8 Q0 20 -2.6 16.8 Z" fill="${P.tongue}"/>${line('M0 14.5 v1.7', '#ce788e', .65)}` : ''}
            <path d="M-3.7 7 Q0 5.6 3.7 7 Q4.4 8.3 1 10.4 Q0 11 -1 10.4 Q-4.4 8.3 -3.7 7" fill="${P.eye}"/>
            <ellipse cx="-1" cy="7.5" rx="1.3" ry=".55" fill="${P.white}" opacity=".65"/>
            ${line('M0 10 v1.7 M0 11.4 Q-2.3 14 -4.7 11.8 M0 11.4 Q2.3 14 4.7 11.8', P.ink, .9)}
            ${tear ? `<path class="wpd-tear" d="M11 7 Q7.5 12 11 12.5 Q14.5 12 11 7" fill="${P.tear}"/>` : ''}
          </g>
        </g>`
    }

    const bandana = () => `
      <path d="M37 49 Q49 54 62 49 L57 56 L50 61 L43 56 Z" fill="${P.mint}" stroke="${P.mintDark}" stroke-width=".85" stroke-linejoin="round"/>
      ${line('M42 53 l7 4 l9 -5', '#c8e5db', .85)}
      <circle cx="50" cy="56.6" r="1.8" fill="${P.gold}" stroke="#c59f59" stroke-width=".6"/>`

    /** Resting on little paws. Variants lift a paw to ask or think. */
    const sitting = (id, compact, face = {}, options = {}) => `
      ${shadow(compact)}
      <g class="${options.motion || ''}" style="transform-origin:49px 70px">
        <g class="${options.slow ? 'wpd-breathe-slow' : 'wpd-breathe'}" style="transform-origin:49px 70px">
          ${tail(id, options.calm ? 'wpd-tail-calm' : options.excited ? 'wpd-wag-fast' : 'wpd-wag')}
          ${body(id)}
          ${foot(id, 41, 65)}${options.wave || options.think ? '' : foot(id, 57, 65)}
          ${bandana()}
          ${head(id, 49, 32, face)}
          ${options.wave ? `<g transform="translate(69 47) rotate(145)"><g class="wpd-wave">${foot(id, 0, 0, true)}</g></g>` : ''}
          ${options.think ? `<g transform="translate(60 54) rotate(30)"><g class="wpd-ponder">${foot(id, 0, 0)}</g></g>` : ''}
        </g>
      </g>`

    /** Tiny paws tap the keyboard; the screen faces the puppy. */
    const typing = (id, compact) => `
      ${shadow(compact)}
      ${tail(id, 'wpd-tail-calm')}${body(id)}${bandana()}
      <g class="wpd-type-bob">${head(id, 47, 31, { eyes: 'focus', tilt: 5 })}</g>
      <path d="M28 68 L75 68 L83 73 Q83 74 80 74 L25 74 Q22 74 23 72 Z" fill="${P.laptopDark}" stroke="${P.ink}" stroke-width=".9" stroke-linejoin="round"/>
      <path d="M31 68 h40 l5 3 H27 Z" fill="#bdd0d7"/>
      <g transform="translate(39 64)"><g class="wpd-tap">${foot(id, 0, 0)}</g></g>
      <g transform="translate(59 64)"><g class="wpd-tap" style="animation-delay:-.16s">${foot(id, 0, 0)}</g></g>
      <path d="M47 54 Q47 52 49 52 H78 Q80 52 79.5 55 L76 70 H44 Z" fill="${P.laptop}" stroke="${P.laptopDark}" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M50 55 H76 L73.5 67 H47.5 Z" fill="${P.screen}"/>
      <g stroke-linecap="round" stroke-width="1.2">
        <path class="wpd-code" d="M52 58 h11" stroke="${P.mintDark}"/>
        <path class="wpd-code" d="M51.5 61 h17" stroke="#90b6d3" style="animation-delay:-.4s"/>
        <path class="wpd-code" d="M51 64 h8" stroke="${P.tongue}" style="animation-delay:-.8s"/>
      </g>`

    /** A bouncy, determined little trot while tools do their work. */
    const running = (id, compact) => `
      ${shadow(compact)}
      ${compact ? '' : `<g class="wpd-speed">${line('M10 51 h9 M7 59 h9 M13 67 h5', P.fur, 1.3)}</g>`}
      <g class="wpd-trot">
        <g transform="translate(-2 0) rotate(7 50 54)">
          ${tail(id, 'wpd-wag-fast')}${body(id)}
          <g transform="translate(38 61)"><g class="wpd-run-leg" style="transform-origin:0px -5px">${foot(id, 0, 3)}</g></g>
          <g transform="translate(57 61)"><g class="wpd-run-leg" style="transform-origin:0px -5px;animation-delay:-.19s">${foot(id, 0, 3)}</g></g>
          ${bandana()}${head(id, 51, 31, { eyes: 'focus', tongue: true, tilt: -5 })}
        </g>
      </g>`

    /** Curled up into a fluffy cloud, cheek resting on the front paws. */
    const sleeping = (id, compact) => `
      ${shadow(compact)}
      <g class="wpd-breathe-slow" style="transform-origin:50px 71px">
        <path d="M29 61 Q26 44 45 41 Q65 34 76 49 L80 50 L78 55 Q85 65 73 70 L68 73 L64 71 Q50 75 39 70 Z" fill="url(#fur-${id})" stroke="${P.fur}" stroke-width="1.1" stroke-linejoin="round"/>
        ${foot(id, 33, 66)}${foot(id, 46, 66)}
        <g transform="translate(2 14) scale(.85)">${head(id, 42, 43, { eyes: 'closed', tilt: -12, droop: 16 })}</g>
        <path d="M61 66 Q80 64 76 50 Q75 43 67 46 L64 43 L61 47 Q52 47 55 55 Q57 60 63 56 Q64 62 56 64" fill="url(#fur-${id})" stroke="${P.fur}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
        ${line('M67 48 q6 2 3 9')}
      </g>`

    /** Held gently by the user: surprised eyes, little pink paw pads. */
    const dangling = id => `
      <g class="wpd-dangle" style="transform-origin:50px 18px">
        ${tail(id, 'wpd-wag-fast')}
        <g transform="translate(0 -3)">${body(id)}${bandana()}</g>
        <g transform="translate(39 67)"><g class="wpd-kick">${foot(id, 0, 0, true)}</g></g>
        <g transform="translate(59 67)"><g class="wpd-kick" style="animation-delay:-.2s">${foot(id, 0, 0, true)}</g></g>
        <g transform="translate(29 48) rotate(35)">${foot(id, 0, 0, true)}</g>
        <g transform="translate(69 48) rotate(-35)">${foot(id, 0, 0, true)}</g>
        ${head(id, 49, 29, { eyes: 'wide', droop: 10, tongue: true })}
      </g>`

    const draw = (scene, id, compact) => {
      switch (scene.activity) {
        case 'absent': return sitting(id, compact, { eyes: 'closed', droop: 8 }, { calm: true, slow: true })
        case 'sleeping': return sleeping(id, compact)
        case 'thinking': return sitting(id, compact, { eyes: 'up', tilt: -12, motion: 'wpd-head-tilt' }, { think: true, calm: true })
        case 'writing': return typing(id, compact)
        case 'tool': return running(id, compact)
        case 'retrying': return sitting(id, compact, { eyes: 'spiral', droop: 12 }, { motion: 'wpd-wobble', calm: true })
        case 'awaiting': return sitting(id, compact, { eyes: 'wide', tilt: -5 }, { wave: true, motion: 'wpd-nudge' })
        case 'delegating': return sitting(id, compact, { eyes: 'look', motion: 'wpd-listen' }, { calm: true })
        case 'done': return sitting(id, compact, { eyes: 'happy', tongue: true, blush: true }, { motion: 'wpd-hop', excited: true })
        case 'error': return sitting(id, compact, { eyes: 'sad', tilt: 7, droop: 24, tear: true }, { motion: 'wpd-shake', calm: true })
        case 'petted': return sitting(id, compact, { eyes: 'happy', tilt: 12, tongue: true, blush: true, droop: 15 }, { motion: 'wpd-snuggle', excited: true })
        case 'dragged': return dangling(id)
        case 'idle':
        default: return sitting(id, compact, { tongue: true })
      }
    }

    function PomeranianFigure({ scene, compact }) {
      const id = 'wpd' + React.useId().replace(/[^a-zA-Z0-9_-]/g, '')
      return React.createElement('svg', {
        className: 'wpd', viewBox: '0 0 100 80', width: '100%', height: '100%',
        'aria-hidden': true, focusable: 'false',
        dangerouslySetInnerHTML: { __html: defs(id) + draw(scene, id, compact === true) },
      })
    }

    // 2. ANIMATION ----------------------------------------------------------
    // Attribute transforms and animated transforms always use separate groups.
    // All rotations use local SVG viewBox units; no global selectors or timers.
    const CSS = `
.wpd{overflow:visible;}
.wpd-blink{animation:wpd-blink 4.6s ease-in-out infinite;}
.wpd-look{animation:wpd-look 4s ease-in-out infinite;}
.wpd-ear{animation:wpd-ear 5.4s ease-in-out infinite;}
.wpd-wag{animation:wpd-wag .85s ease-in-out infinite;}
.wpd-wag-fast{animation:wpd-wag .3s ease-in-out infinite;}
.wpd-tail-calm{animation:wpd-tail-calm 3.4s ease-in-out infinite;}
.wpd-breathe{animation:wpd-breathe 2.8s ease-in-out infinite;}
.wpd-breathe-slow{animation:wpd-breathe 4.5s ease-in-out infinite;}
.wpd-pant{animation:wpd-pant 1.1s ease-in-out infinite;}
.wpd-head-tilt{animation:wpd-head-tilt 3s ease-in-out infinite;}
.wpd-ponder{animation:wpd-ponder 1.5s ease-in-out infinite;}
.wpd-tap{animation:wpd-tap .32s ease-in-out infinite;}
.wpd-type-bob{animation:wpd-type-bob .64s ease-in-out infinite;}
.wpd-code{stroke-dasharray:20;animation:wpd-code 1.8s steps(5) infinite;}
.wpd-trot{animation:wpd-trot .38s ease-in-out infinite;}
.wpd-run-leg{animation:wpd-run-leg .38s ease-in-out infinite;}
.wpd-speed{animation:wpd-speed .6s linear infinite;}
.wpd-spin{animation:wpd-spin 1.5s linear infinite;}
.wpd-wobble{animation:wpd-wobble 1.1s ease-in-out infinite;}
.wpd-wave{animation:wpd-wave .7s ease-in-out infinite;}
.wpd-nudge{animation:wpd-nudge 1.6s ease-in-out infinite;}
.wpd-listen{animation:wpd-listen 4s ease-in-out infinite;}
.wpd-hop{animation:wpd-hop 1.1s ease-in-out infinite;}
.wpd-shake{animation:wpd-shake .5s ease-in-out 3;}
.wpd-tear{animation:wpd-tear 2s ease-in infinite;}
.wpd-snuggle{animation:wpd-snuggle 1.2s ease-in-out infinite;}
.wpd-dangle{animation:wpd-dangle 1.3s ease-in-out infinite;}
.wpd-kick{animation:wpd-kick .4s ease-in-out infinite;}
@keyframes wpd-blink{0%,43%,47%,91%,95%,100%{transform:scaleY(1);}45%,93%{transform:scaleY(.08);}}
@keyframes wpd-look{0%,25%,100%{transform:translateX(0);}35%,50%{transform:translateX(1.5px);}65%,85%{transform:translateX(-1.5px);}}
@keyframes wpd-ear{0%,80%,90%,100%{transform:rotate(0deg);}84%,94%{transform:rotate(-7deg);}}
@keyframes wpd-wag{0%,100%{transform:rotate(-9deg);}50%{transform:rotate(12deg);}}
@keyframes wpd-tail-calm{0%,100%{transform:rotate(-2deg);}50%{transform:rotate(4deg);}}
@keyframes wpd-breathe{0%,100%{transform:scale(1);}50%{transform:scale(1.012,1.025);}}
@keyframes wpd-pant{0%,100%{transform:translateY(0);}50%{transform:translateY(.55px);}}
@keyframes wpd-head-tilt{0%,100%{transform:rotate(0deg);}50%{transform:rotate(6deg);}}
@keyframes wpd-ponder{0%,100%{transform:translateY(0);}50%{transform:translateY(-1.6px);}}
@keyframes wpd-tap{0%,100%{transform:translateY(0);}50%{transform:translateY(-3.5px);}}
@keyframes wpd-type-bob{0%,100%{transform:translateY(0);}50%{transform:translateY(1px);}}
@keyframes wpd-code{from{stroke-dashoffset:20;}to{stroke-dashoffset:0;}}
@keyframes wpd-trot{0%,100%{transform:translateY(0);}50%{transform:translateY(-3px);}}
@keyframes wpd-run-leg{0%,100%{transform:rotate(-23deg);}50%{transform:rotate(24deg);}}
@keyframes wpd-speed{from{transform:translateX(4px);opacity:0;}40%{opacity:.7;}to{transform:translateX(-5px);opacity:0;}}
@keyframes wpd-spin{to{transform:rotate(360deg);}}
@keyframes wpd-wobble{0%,100%{transform:rotate(-3deg);}50%{transform:rotate(3deg);}}
@keyframes wpd-wave{0%,100%{transform:rotate(-14deg);}50%{transform:rotate(14deg);}}
@keyframes wpd-nudge{0%,65%,100%{transform:translateY(0);}30%{transform:translateY(-2px);}}
@keyframes wpd-listen{0%,20%,100%{transform:rotate(0deg);}35%,45%{transform:rotate(7deg);}65%,80%{transform:rotate(-7deg);}}
@keyframes wpd-hop{0%,80%,100%{transform:translateY(0) scale(1);}15%{transform:scale(1.035,.95);}43%{transform:translateY(-6px) scale(.98,1.02);}68%{transform:scale(1.04,.96);}}
@keyframes wpd-shake{0%,100%{transform:translateX(0);}25%{transform:translateX(-1.6px);}75%{transform:translateX(1.6px);}}
@keyframes wpd-tear{0%,20%{transform:translateY(0);opacity:0;}30%{opacity:.8;}100%{transform:translateY(5px);opacity:0;}}
@keyframes wpd-snuggle{0%,100%{transform:rotate(-2deg) scale(1);}50%{transform:rotate(2deg) scale(1.025,.98);}}
@keyframes wpd-dangle{0%,100%{transform:rotate(-5deg);}50%{transform:rotate(5deg);}}
@keyframes wpd-kick{0%,100%{transform:rotate(-12deg);}50%{transform:rotate(12deg);}}
@media (prefers-reduced-motion:reduce){.wpd,.wpd *{animation:none !important;}}
`

    // 3. PLUG-IN ------------------------------------------------------------
    const dictionaries = {
      zh: { title: '白色小博美', description: '一团会摇尾巴的小雪球：蓬松白毛、粉粉耳朵，系着薄荷绿小方巾，陪你工作和打盹。' },
      en: { title: 'Pomeranian', description: 'A fluffy white little cloud with pink ears, a curled tail and a mint bandana, keeping you company through work and naps.' },
    }

    function insertStyles() {
      if (typeof document === 'undefined') return () => {}
      const tag = document.createElement('style')
      tag.dataset.plugin = 'dsh-workpet-dog'
      tag.textContent = CSS
      document.head.appendChild(tag)
      return () => tag.remove()
    }

    return {
      inject: ['workpet', 'locale'],
      apply(ctx) {
        ctx.effect(insertStyles, 'workpet-dog: stylesheet')
        ctx.effect(() => ctx.locale.register('workpetDog', dictionaries), 'workpet-dog: dictionaries')
        const t = ctx.locale.bind('workpetDog')
        ctx.effect(() => ctx.workpet.register({
          id: 'white-pomeranian', order: 20,
          title: () => t('title'), description: () => t('description'), Figure: PomeranianFigure,
        }), 'workpet-dog: skin')
      },
    }
  },
})
