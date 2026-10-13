# dsh-workpet-dog · 白色小博美

一团会摇尾巴的小雪球，陪你写代码、思考和打盹。

参考 `dsh-workpet-parrot` 的插件结构实现的 DeepSeek Harness **Work Pet** 皮肤：蓬松白毛、尖尖小耳朵、黑葡萄眼、粉色肉垫、背上的毛绒卷尾巴，以及一条薄荷绿小方巾。全部造型和动作重新绘制为 SVG。

## 先看看小狗

在源码目录运行：

```sh
pnpm install
pnpm run preview
```

然后用浏览器打开 [动画预览页](<docs/preview.html>)。页面完全离线，不需要服务器或正在运行的 Harness：

- 13 种状态的动画图鉴，点击卡片切换大图；
- 点击大图摸摸脑袋；
- 暂停动画、切换深浅背景；
- 小伙伴的 `compact` 尺寸预览。

预览直接加载真实的 [客户端插件](<client.js>)，没有另外维护一套绘图代码。生成命令同时更新 [插件图标](<icon.svg>)。预览页只演示外观，不接收真实会话状态，也不模拟 Harness 的拖拽和状态气泡。

## 安装到 DeepSeek Harness

需要在同一个 profile 中先安装并启用 **`dsh-workpet`**。它负责会话状态、悬浮位置、拖拽、点击摸摸、状态气泡、工具徽章、小伙伴和爱心等特效；本插件只注册小博美形象。

在 Harness 会话中请 Agent 通过 `plugin_manager` 安装本目录：

```text
install_bundle /absolute/path/to/dsh-workpet-dog
```

安装或启用会修改整个 profile，需要确认授权。此项目没有自动执行安装，也不会替换现有的小猫或鹦鹉。启用后小博美作为独立宠物出现；停用本 bundle 即可移除。若缺少 `dsh-workpet`，本插件会等待依赖，不会独立显示宠物。

CLI 管理的 profile 也可以使用：

```sh
dsh plugin --profile <profile> add link:/absolute/path/to/dsh-workpet-dog
```

安装后可在 **插件 → Work Pet** 中查看形象卡并触发动作。修改链接安装的源码后刷新 Harness 页面；若仍使用旧内容，重启 Harness。这里没有内置 HMR 或开发服务器，也不需要开启另一个 Web 服务。

## 13 种陪伴状态

| 状态 | 小博美的动作 |
| --- | --- |
| `absent` | 闭眼安静等候，轻轻呼吸 |
| `idle` | 眨眼、吐小舌头、摇卷尾巴 |
| `sleeping` | 蜷成一团，脑袋枕在小爪子上 |
| `thinking` | 歪头看上方，举爪托腮 |
| `writing` | 两只爪爪交替敲小电脑 |
| `tool` | 迈开小短腿，原地小跑 |
| `retrying` | 晕乎乎的圈圈眼，左右晃晃 |
| `awaiting` | 举爪挥挥，等你的回复 |
| `delegating` | 侧耳倾听，左右看看小伙伴 |
| `done` | 笑眯眯地蹦起来，快速摇尾巴 |
| `error` | 耳朵下垂，流一滴小眼泪 |
| `petted` | 闭眼笑、脸颊粉粉、歪头贴贴 |
| `dragged` | 被抱起来轻轻晃动，露出粉色肉垫 |

## 开发

Node.js **22 或以上**；与参考项目一样，**无编译步骤、无 TypeScript、无 JSX、无运行时 npm 依赖**。React 由 Harness 页面提供；开发依赖中的 React 18 仅用于测试和生成预览。

```sh
pnpm install
pnpm run check     # 检查 JS 语法
pnpm test          # React SSR 渲染、资源清理与契约测试
pnpm run verify    # 语法检查 + 测试
pnpm run preview   # 重新生成离线预览和图标
```

### 主要文件

| 文件 | 用途 |
| --- | --- |
| [client.js](<client.js>) | 调色板、身体部件、全部状态、CSS 动画和插件注册 |
| [index.js](<index.js>) | 空的 Host 入口 |
| [cordis.patch.yml](<cordis.patch.yml>) | bundle 的 Loader 注册项 |
| [package.json](<package.json>) | bundle 声明、依赖顺序和开发命令 |
| [中文文案](<locale/zh.json>) / [英文文案](<locale/en.json>) | 插件管理器元信息 |
| [preview.mjs](<scripts/preview.mjs>) | 从真实插件生成离线动画图鉴与静态图标 |

### 绘图约定

- `viewBox="0 0 100 80"`；小狗脚底约在 y = 71，阴影在 y = 74。
- 配色集中在 `P`；主体是白色，用低饱和描边和浅灰阴影保持浅色、深色背景上的辨识度。
- `head` 控制表情、歪头、耳朵、舌头和腮红；`tail`、`body`、`foot`、`bandana` 是可复用部件。
- 每个实例用 `React.useId()` 隔离渐变 ID，避免多只小狗相互引用错误。
- CSS 类与关键帧统一使用 `wpd-` 前缀，不与鹦鹉的 `wpp-` 冲突。
- CSS 动画和 SVG `transform` 放在不同层的 `<g>`，避免动画覆盖静态位移或旋转。
- 尊重 `prefers-reduced-motion`：关闭动画但保留当前状态造型。
- 插件依赖 `workpet` / `locale`，样式、文案和皮肤都由 `ctx.effect` 管理，停用时清理。
- 不重复实现 Work Pet 已提供的状态推导、气泡、徽章、伙伴或特效。

## 致谢与许可

插件结构参考 [dsh-workpet-parrot](https://github.com/lastorder/dsh-workpet-parrot)，遵循 [dsh-workpet](https://github.com/lastorder/dsh-workpet) 的 `WorkpetScene` / `WorkpetSkin` 契约。MIT 许可，保留原参考项目的版权声明，见 [LICENSE](<LICENSE>)。
