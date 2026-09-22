# 00｜HyperFrames Worldview：把浏览器看成逐帧摄影棚

## 本轮目标

这一轮不急着学习动效 API，也不追求做出复杂成片。先建立一套以后不会轻易崩掉的世界观：

1. HyperFrames 到底把什么变成了什么；
2. HTML 页面和视频 Composition 的差别；
3. Frame、Time、Clip 与 Track 分别负责什么；
4. 为什么离线渲染不是“把网页录屏”；
5. AI 写完代码后，人应该检查什么。

学完后，你应该能看懂一个最小 HyperFrames 文件，并在运行前预测第 0 秒、第 2 秒、第 4 秒各有什么内容。

---

## 一、先给 HyperFrames 一个准确的定义

HyperFrames 是一个 **HTML-native video framework**：

> 你用 HTML、CSS、媒体资源和可寻址动画描述视频；HyperFrames 把浏览器拨到一个个确定的帧，捕获画面，再编码成 MP4、WebM、MOV、GIF 或 PNG 序列。

先抓住两个关键词。

### 1. HTML-native

作品的基本载体是 HTML：

- DOM 描述画面里有什么；
- CSS 描述它们长什么样、在哪里；
- `data-*` 属性描述它们何时存在；
- 动画时间线描述状态怎样随作品时间变化；
- 图片、视频和音频承担内容。

因此，网页开发者已经熟悉的大量能力可以进入视频制作：排版、SVG、Canvas、WebGL、Three.js、GSAP、Lottie 等。

### 2. Seekable

Seek 的意思不是“从头播放到某处”，而是：

> 直接问系统：“第 90 帧应该长什么样？”系统无需先播放 0—89 帧，也能给出正确答案。

这条能力决定 HyperFrames 能否稳定地拖动时间轴、截取关键帧、并行渲染和自动回归测试。

---

## 二、最有用的类比：可冻结时间的摄影棚

把 HyperFrames 想成一座特殊摄影棚。

| 现实制作 | HyperFrames |
|---|---|
| 摄影棚尺寸 | Composition 的 `data-width` / `data-height` |
| 节目名称 | `data-composition-id` |
| 演员、字幕、布景 | DOM 元素、图片、视频、SVG、Canvas |
| 演员出场表 | Clip 的 `data-start` / `data-duration` |
| 剪辑轨道 | `data-track-index` |
| 动作编排 | GSAP、CSS、WAAPI、Lottie、Three.js 等动画 |
| 场记把时间拨到某处 | Frame Adapter / seek |
| 摄影机拍下一张画面 | 浏览器帧捕获 |
| 后期压片与混音 | FFmpeg 编码、音频混合与封装 |
| 最终成片 | MP4 / WebM / MOV 等 |

普通摄影棚只能顺着时间拍摄。这座摄影棚可以把所有状态直接摆到第 N 帧，再拍一张。

---

## 三、HTML 页面为什么还不等于视频

普通网页通常没有这些硬约束：

| 问题 | 普通网页 | 视频 Composition |
|---|---|---|
| 画布多大 | 随浏览器窗口变化 | 固定宽高 |
| 什么时候开始 | 页面加载后运行 | 明确时间轴起点 |
| 什么时候结束 | 可以一直存在 | 必须有有限终点 |
| 元素何时出现 | 由交互或应用状态决定 | 由 Clip 时间窗决定 |
| 动画时钟 | 常依赖真实时间 | 由 frame / fps 推导 |
| 任意时刻能否直达 | 不一定 | 必须可 seek |
| 相同输入是否相同输出 | 不保证 | 确定性渲染要求保证 |

所以 HyperFrames 不是简单地“把网页录下来”。它给 HTML 增加了一份视频合同：

```text
DOM
  + fixed stage
  + finite timeline
  + timed clips
  + seekable state
  + locked inputs
  = renderable video composition
```

---

## 四、完整管线：从意义到视频文件

先看完整链条，再看局部 API：

```text
Meaning / Facts
  ↓
Brief / Script / Story Beats
  ↓
HTML / CSS / Media / Variables
  ↓
Composition + Clips + Tracks
  ↓
Frame N → Time = N / FPS
  ↓
Seek every visual state to Time
  ↓
Browser paints pixels
  ↓
Capture one frame
  ↓
Repeat for all frames
  ↓
Encode video + mix audio + mux container
  ↓
MP4 / WebM / MOV / GIF / PNG sequence
```

这里有五层责任，必须分清。

### 1. Meaning / Story

回答：这条视频给谁看？要让他理解什么？哪些事实不能错？

### 2. Composition / Timeline

回答：视频多大、多长？有哪些场景和 Clip？它们何时出现？

### 3. Visual Runtime

回答：在某个确定时刻，DOM、CSS、Canvas、WebGL 和动画分别处于什么状态？

### 4. Browser / Frame Capture

回答：这些状态最终画成哪些像素？

### 5. Encoder / Audio Pipeline

回答：怎样把连续帧压成视频流，把旁白、音乐和音效混合，再装入目标文件？

如果黑屏，需要先判断问题属于哪一层。没有故事不是 Renderer 的错，字体换行不是音频混合的错，Composition id 缺失也不是 FFmpeg 的错。

---

## 五、Frame 才是离线渲染的时间地址

假设作品使用 30 fps：

```text
frame 0   → 0 / 30 = 0 秒
frame 30  → 30 / 30 = 1 秒
frame 90  → 90 / 30 = 3 秒
```

10 秒作品共有：

```text
10 × 30 = 300 帧
```

帧编号通常是 0—299。

关键区别是：

```text
网页动画常见思路：
上一刻状态 + 经过的真实时间 → 下一刻状态

可寻址视频思路：
frame + locked inputs → 当前完整状态
```

后一种模式允许 Renderer 先问第 120 帧，再问第 10 帧，答案仍然正确。

### 为什么这会带来确定性

如果画面只依赖：

- frame；
- 固定 fps；
- 固定宽高；
- 固定变量；
- 已冻结的本地素材；
- 显式随机 seed；

那么同一帧就能稳定得到同一像素。

下面这些隐藏输入会破坏确定性：

- `Date.now()`；
- `setTimeout()`、`setInterval()`；
- 用 `requestAnimationFrame()` 累加作品进度；
- 无种子的 `Math.random()`；
- 渲染途中才请求远程数据、字体或媒体；
- 依赖上一帧是否已经执行过的状态。

---

## 六、读懂一个最小 Composition

下面是一段完整的 4 秒作品。它没有动画库、远程素材或音频，只用来观察 Composition 合同。

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <style>
      html, body {
        margin: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      #stage {
        position: relative;
        width: 1920px;
        height: 1080px;
        background: #07111f;
        color: white;
      }

      .title-card {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        font: 800 120px/1.05 Arial, sans-serif;
      }
    </style>
  </head>
  <body>
    <main
      id="stage"
      data-composition-id="minimal-intro"
      data-start="0"
      data-duration="4"
      data-width="1920"
      data-height="1080"
      data-no-timeline
    >
      <section
        class="clip title-card"
        data-start="0"
        data-duration="4"
        data-track-index="0"
      >
        HTML 也能成为视频
      </section>
    </main>
  </body>
</html>
```

逐行理解它。

### `data-composition-id="minimal-intro"`

这是 Composition 的稳定身份。以后接入 GSAP 时间线时，注册键必须与它一致。

### `data-width="1920" data-height="1080"`

这是视频坐标系的边界。它不是浏览器窗口建议值，而是作品输出尺寸合同。

### `data-start="0" data-duration="4"`

根 Composition 从自己的 0 秒开始，持续 4 秒。有限时长让系统知道要捕获多少帧。

### `class="clip"`

这是 HyperFrames 生态统一使用的布局与工具约定。当前 Runtime 依据 `data-start` 等时间属性管理时间窗口；课程仍要求可见 timed element 使用 `class="clip"`，让布局、Studio 和代码阅读保持一致。

### `data-no-timeline`

本例没有注册 GSAP 等动画 Timeline。这个布尔属性明确告诉 Runtime：不要等待一条不存在的 Timeline；画面时间仅由 Composition 与 Clip 属性描述。

### Clip 的 `data-start` 与 `data-duration`

这个标题从 0 秒出现，持续到 4 秒前。可以写成：

```text
visible when 0 ≤ compositionTime < 4
```

### `data-track-index="0"`

把 Clip 放在第 0 轨，方便时间轴、Studio 和人类理解结构。

注意：**Track 不等于 CSS z-index。**

- Track 回答：它在时间轴哪一层；
- z-index / stacking context 回答：像素最终谁盖住谁。

这两个概念后面会单独展开，本轮先不要混用。

---

## 七、Clip：元素存在，不代表此刻有效

假设有两个标题：

```html
<section class="clip" data-start="0" data-duration="2">
  存在于 HTML
</section>

<section class="clip" data-start="2" data-duration="2">
  此刻才可见
</section>
```

两个 section 从页面加载开始就存在于 DOM 中，但 Runtime 根据 Composition 时间决定哪个 Clip 当前有效。

| 时间 | 第一个 Clip | 第二个 Clip |
|---:|---|---|
| 0.5 秒 | 有效 | 无效 |
| 1.99 秒 | 有效 | 无效 |
| 2.00 秒 | 无效 | 有效 |
| 3.5 秒 | 无效 | 有效 |

因此不要再写一套 `setTimeout`、`display:none` 或场景尾部 `visibility:hidden` 去重复管理时间窗口。一个责任只保留一个真相来源。

---

## 八、Renderer 不是录屏软件

实时录屏通常是：

```text
网页开始播放
  ↓
真实时间流逝
  ↓
录屏软件抓取当下画面
```

HyperFrames 离线渲染更接近：

```text
请求 frame 0
  → 所有状态 seek 到 time 0
  → 浏览器完成布局与绘制
  → 捕获一张图

请求 frame 1
  → 所有状态 seek 到 time 1/fps
  → 捕获一张图

……

所有帧完成
  → 编码视频
  → 混合音频
  → 封装文件
```

这种方法的好处是：

- 机器慢不会让动画自动变慢；
- 某一帧渲染花了更久，不会改变作品时间；
- 可以直接重渲染某一段；
- 可以截取关键帧做回归比较；
- 可以把帧分发到多个 Worker；
- AI 修改代码后，可以用相同时间点验证变化。

---

## 九、这一轮为什么先不用 GSAP

官方把 GSAP 作为主要动画 Runtime，但第 00 轮故意不引入它。

原因不是 GSAP 不重要，而是本轮只验证一个问题：

> HTML 怎样获得固定空间、有限时间和可渲染边界？

如果一开始同时引入 Composition、Clip、GSAP、字体、视频、音乐和转场，黑屏时就很难判断是哪一层出错。

第 00 轮先用静态 Clip 建立高信噪比反馈。后续轮次再逐步加入：

```text
Composition
  → Frame
  → Clip
  → Track
  → Local time
  → Determinism
  → GSAP timeline
  → Media / Audio
  → Render pipeline
```

---

## 十、AI 应该负责什么，人应该负责什么

在这套课里，AI 可以写大部分 HTML 和 CSS。学习者不需要和 AI 比谁敲样板代码更快。

### AI 负责

- 按语义 Prompt 写参考实现；
- 把明确参数放进 Composition 与 Clip；
- 遵守禁止项；
- 执行 lint、check、snapshot；
- 报告错误和验证结果。

### 学习者负责

- 说清作品意义；
- 在运行前预测指定时间点的画面；
- 检查生成代码有没有保存这个意义；
- 只改一个参数，观察正确的因果；
- 判断画面正确是否来自正确结构；
- 对最终成片签字。

一个好看的画面，如果依赖 `Date.now()`、远程临时字体或错误时间结构，仍然是不合格答案。

---

## 十一、第一次参数实验

不要一次改很多值。每次只改一个参数，先写预测。

| 实验 | 修改前 | 修改后 | 先预测什么 |
|---|---:|---:|---|
| Composition 宽度 | 1920 | 1080 | 坐标系变窄后，固定布局是否被裁切 |
| Composition 高度 | 1080 | 1920 | 横屏结构是否适合竖屏 |
| Clip start | 0 秒 | 2 秒 | 第 1 秒标题是否应该出现 |
| Clip duration | 4 秒 | 1 秒 | 第 1.5 秒标题是否仍有效 |
| track-index | 0 | 2 | 时间轴组织是否改变；像素覆盖是否一定改变 |
| CSS font-size | 120px | 180px | 时间结构是否保持不变 |

实验记录至少写三句话：

```text
我预测……
我观察到……
原因是……
```

---

## 十二、本轮四个练习

### 00-01｜最小 Composition

建立固定尺寸、有限时长与一个静态 Clip。重点区分“普通 DOM”与“可渲染 Composition”。

[进入练习](exercises/01-minimal-composition/)

### 00-02｜存在不等于此刻可见

让两个 Clip 首尾相接，预测边界时刻谁有效。

[进入练习](exercises/02-time-window/)

### 00-03｜时间轨与像素层

让背景、装饰与标题同时有效，区分 track-index 与 z-index。

[进入练习](exercises/03-track-and-layer/)

### 00-04｜逐帧求值，不是实时录屏

乱序检查 4.5、0.5、2.5 秒，验证画面不依赖访问顺序。

[进入练习](exercises/04-frame-seeking/)

每个练习都保存：

```text
task      学习目标
prompt    给 AI 的语义输入
harness   AI 不能越过的边界
params    本轮有意义的变量
solution  可运行参考实现
audit     完成标准
```

---

## 十三、本轮理解审计

先口头回答，再看讲义。

- [ ] 能否用一句话说明 HyperFrames 把什么变成什么？
- [ ] 能否解释为什么离线渲染不是网页录屏？
- [ ] 能否区分 Composition、Clip、Track、Frame 和 Renderer？
- [ ] 能否根据 start 与 duration 推导 Clip 的有效区间？
- [ ] 能否说明 `frame = 90, fps = 30` 为什么对应 3 秒？
- [ ] 能否解释为什么 `Date.now()` 会破坏确定性？
- [ ] 能否区分 track-index 与 z-index？
- [ ] 能否在运行前预测一个指定时间点的画面？
- [ ] 能否指出最小 HTML 中哪些属性属于空间边界，哪些属于时间边界？
- [ ] 能否说明 AI 生成的“正确画面”为何仍需要人审计结构？

如果其中任何一项只能背定义，回到对应练习，改一个参数并重新观察。

---

## 本轮结论

HyperFrames 最重要的第一层认识不是“HTML 能做动效”，而是：

> 它把 HTML/CSS/媒体组成的画面变成一个具有固定空间、有限时间和可寻址状态的视频系统。Renderer 不等待真实时间播放，而是按帧询问浏览器此刻应该画什么。

最终闭环：

```text
Meaning
  ↓
HTML / CSS / Media
  ↓
Composition / Clip / Track
  ↓
Frame → Time → Seekable State
  ↓
Browser Pixels
  ↓
Encode + Audio
  ↓
Video
```

下一轮进入 **Composition**：根 Composition、嵌套 Composition、有限时长、尺寸合同和身份绑定为什么是整个系统的第一道边界。
