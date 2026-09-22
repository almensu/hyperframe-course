# 01｜Composition：给视频建立有限边界

## 本轮目标

第 00 轮建立了总世界观：HyperFrames 把 HTML、CSS、媒体和可寻址状态逐帧转换成视频。

这一轮只研究一个核心对象：**Composition**。

学完本轮，应建立四个稳定认识：

1. Composition 同时规定身份、画幅、时长和时间作用域；
2. 根 Composition 是完整视频入口，子 Composition 是可独立放置和复用的场景；
3. HTML 负责“何时出现”，脚本负责“出现时怎样运动”；
4. 父级放置子场景，子场景使用自己的局部时间，两者不争夺播放头。

本轮只保留讲解与代码示例，不安排练习或测试题。

---

## 一、Composition 不是普通容器

普通 `<div>` 只回答：

> 页面里有一个区域，它包含哪些 DOM 子节点？

Composition 还要回答：

> 这是哪一段视频？画幅多大？从哪里开始？何时结束？内部时间怎样计算？能否被另一个 Composition 放到更大的时间轴中？

因此可以把 Composition 理解为：

```text
Composition
  = DOM subtree
  + stable identity
  + authored frame size
  + finite time boundary
  + local time scope
  + optional animation timeline
```

这六项放在一起，普通网页片段才变成一个可被 Renderer 理解的视频单元。

### 一个更准确的类比

把一部长片想成一本书：

| 书的结构 | HyperFrames |
|---|---|
| 整本书 | 根 Composition |
| 章节 | 子 Composition |
| 章节标题 | `data-composition-id` |
| 页面尺寸 | `data-width` / `data-height` |
| 章节在全书中的页码 | 父时间轴中的 `data-start` |
| 章节内部第几页 | 子 Composition 的局部时间 |
| 章节长度 | `data-duration` |

章节可以被整体移动到全书后面，但章节内部“第 2 页”的内容不需要重写。子 Composition 的价值也是如此：**父级改变场景放置位置，内部动画仍从自己的局部 0 秒计算。**

---

## 二、Composition 建立四类边界

### 1. Identity boundary：身份边界

```html
data-composition-id="main"
```

这个 ID 不是单纯给 CSS 用的名称，它是 Composition 在 HyperFrames 中的稳定身份。

后面接入 GSAP 时，动画注册键必须对应这个身份：

```js
window.__timelines.main = timeline;
```

可以把它读成：

```text
名为 main 的 Composition
  ↔
名为 main 的可寻址 Timeline
```

如果页面根节点叫 `main`，Timeline 却注册成 `intro`，DOM 仍然存在，但 Runtime 找不到属于 `main` 的动画时钟。

课程中的命名原则是：

- 名称表达场景职责，如 `main`、`product-intro`、`pricing-scene`；
- 同一项目中保持唯一；
- 根 ID、子场景宿主 ID、源文件 ID和 Timeline 注册键保持可追踪关系；
- 不使用 `div1`、`comp2` 之类无法表达含义的名称。

### 2. Spatial boundary：画幅边界

```html
data-width="1920"
data-height="1080"
```

这两个属性声明作品的创作坐标系。

```text
1920 × 1080 → 16:9 横屏
1080 × 1920 → 9:16 竖屏
1080 × 1080 → 1:1 方形
```

元数据声明和 CSS 实际盒子必须表达同一个画幅：

```html
<div
  id="root"
  data-composition-id="main"
  data-width="1920"
  data-height="1080"
>
```

```css
#root {
  position: relative;
  width: 1920px;
  height: 1080px;
  overflow: hidden;
}
```

两者责任不同：

- `data-width` / `data-height` 告诉 HyperFrames 作品尺寸；
- CSS `width` / `height` 告诉浏览器怎样布局和绘制这个盒子。

如果元数据写 1920×1080，CSS 却只建立 960×540 的根盒子，系统看到的是同一作品的两份互相冲突的空间描述。

### 3. Temporal boundary：时长边界

```html
data-start="0"
data-duration="8"
```

顶层根 Composition 从 0 秒开始，时长通常显式写出。

一个 8 秒、30 fps 的 Composition 对应：

```text
8 × 30 = 240 frames
frame range = 0…239
```

视频必须存在有限终点。否则 Renderer 不知道还要继续询问多少帧。

### 4. Scope boundary：局部时间作用域

假设父 Composition 在第 10 秒放入一个子场景：

```html
<div
  data-composition-id="pricing"
  data-composition-src="compositions/pricing.html"
  data-start="10"
  data-duration="5"
></div>
```

子场景内部有一个标题从局部第 1 秒开始：

```html
<h1 class="clip" data-start="1" data-duration="3">
  Pricing
</h1>
```

它在总片中的实际出现时刻是：

```text
parent start 10s + child local start 1s = root time 11s
```

子文件只需知道“我内部第 1 秒发生什么”。父文件负责“我把整个场景放到总片第 10 秒”。

---

## 三、顶层 Composition 的当前合同

官方当前 HTML Schema 中，根节点常用属性如下：

| 属性 | 是否需要 | 责任 |
|---|---|---|
| `data-composition-id` | 必须 | Composition 的唯一身份 |
| `data-start="0"` | 顶层根节点使用 | 声明根时间从 0 开始 |
| `data-width` | 必须 | 创作画幅宽度，像素 |
| `data-height` | 必须 | 创作画幅高度，像素 |
| `data-duration` | 通常显式写 | 本次 Render 的总时长，秒 |
| `data-fps` | 可选 | Composition 的 fps 提示；CLI 输出参数仍可覆盖 |
| `data-no-timeline` | 无动画 Timeline 时使用 | 告诉 Runtime 不要等待 Timeline 注册 |

课程默认采用显式、容易审计的写法：

```html
<main
  id="root"
  data-composition-id="main"
  data-start="0"
  data-duration="8"
  data-width="1920"
  data-height="1080"
  data-no-timeline
>
  <!-- timed content -->
</main>
```

这里的 `data-no-timeline` 是布尔属性，不需要写值：

```html
data-no-timeline
```

它只适用于没有注册 GSAP、Lottie 等可寻址 Timeline 的 Composition。以后加入 GSAP Timeline 后，应移除这个属性并注册正确的 Timeline。

---

## 四、Composition 的时长从哪里来

HyperFrames 必须在 Render 前得到一个有限时长。常见来源有两类。

### 方式 A：根节点显式声明

```html
<div
  data-composition-id="main"
  data-duration="8"
  data-width="1920"
  data-height="1080"
>
```

这是最容易阅读和审计的方式。

### 方式 B：由有限内容推导

当根节点省略 `data-duration` 时，Runtime 可以从某些有限信号推导终点，例如：

- 已注册的有限 GSAP Timeline；
- 有限 CSS Animation；
- 有限 WAAPI Animation；
- 已注册的 Lottie Animation；
- 有明确长度的 timed clips，取最晚结束时刻。

例如：

```html
<div data-composition-id="main" data-start="0" data-width="1920" data-height="1080">
  <section id="intro" class="clip" data-start="0" data-duration="3"></section>
  <section id="result" class="clip" data-start="3" data-duration="5"></section>
</div>
```

最晚结束时刻为：

```text
result start 3s + result duration 5s = 8s
```

Runtime 因而可以推导总时长为 8 秒。

### 课程为什么仍优先显式时长

推导没有错，但它会让根边界隐藏在内部内容里。

课程初期优先写：

```html
data-duration="8"
```

这样读代码的人不必遍历所有 Clip，才能知道视频多长。等后续理解自动推导、模板生成和变量系统后，再决定是否省略。

---

## 五、根时长与 Clip 时长不是同一种数据

这是很容易踩坑的地方。

### 根 `data-duration`

根时长是 Render 的边界。编译器会在 Composition 脚本运行前读取它。

因此下面的代码不能改变当前 Render 的总长度：

```js
const root = document.querySelector('[data-composition-id="main"]');
root.setAttribute("data-duration", "12");
```

如果源码最初写的是 8 秒，本次 Render 仍按照编译阶段读到的 8 秒规划。

### Clip `data-duration`

Clip 时长描述内部元素的时间窗口。Runtime 可以从 live DOM 读取它，所以脚本和变量系统能够驱动内部 Clip 的长度。

可以把二者理解成：

```text
root duration = 工厂这批任务要生产多少帧
clip duration = 某个元素在这批帧中占用哪段时间
```

工厂已经开始排产后，再让页面脚本临时修改总任务数量，并不能重写已经建立的 Render Plan。

如果需要不同总时长，正确做法是：

1. 在生成 HTML 源码时直接写入新的根 `data-duration`；或
2. 有意识地省略根时长，让 Runtime 从有限 Clip / Timeline 推导；
3. 再执行 lint、check 和 render，让系统重新建立计划。

---

## 六、静态 Composition 与 `data-no-timeline`

第 00 轮的示例没有 GSAP，只用静态 Clip 描述内容。这样的 Composition 应明确声明：

```html
data-no-timeline
```

完整示例：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <style>
      html,
      body {
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: hidden;
      }

      #root {
        position: relative;
        width: 1920px;
        height: 1080px;
        overflow: hidden;
        color: white;
        background: #08111f;
      }

      .clip {
        position: absolute;
        inset: 0;
      }

      .title-card {
        display: grid;
        place-items: center;
        font: 800 112px/1 Arial, sans-serif;
      }
    </style>
  </head>
  <body>
    <main
      id="root"
      data-composition-id="main"
      data-start="0"
      data-duration="5"
      data-width="1920"
      data-height="1080"
      data-no-timeline
    >
      <section
        id="title-card"
        class="clip title-card"
        data-start="0"
        data-duration="5"
        data-track-index="0"
      >
        Composition 建立边界
      </section>
    </main>
  </body>
</html>
```

Runtime 看到 `data-no-timeline` 后，不会等待 `window.__timelines.main` 出现。它仍然可以根据 Composition 和 Clip 时间属性捕获正确画面。

---

## 七、`class="clip"` 的准确位置

官方当前实现中，Runtime 主要依据 `data-start` 等时间属性识别 timed element；`class="clip"` 是官方示例、布局和工具共同采用的约定。

课程仍统一写：

```html
<section
  id="headline"
  class="clip"
  data-start="0"
  data-duration="3"
  data-track-index="1"
>
  Launch day
</section>
```

原因有三个：

1. `.clip` 可以统一提供 `position:absolute; inset:0` 等全画幅布局；
2. Studio、Catalog 与示例代码更容易保持共同结构；
3. 人类看到 `class="clip"` 就知道这是时间轴对象。

但不要形成错误世界观：

```text
class="clip" 主要是布局与工具约定
data-start / data-duration 才描述时间
data-track-index 只描述 Studio 中的轨道行
```

---

## 八、根 Composition 与子 Composition

当视频只有一个简单镜头，可以把内容都写在 `index.html`。

```text
project/
└── index.html
```

当作品出现多个具有独立职责的场景时，可以拆成：

```text
project/
├── index.html
├── compositions/
│   ├── intro.html
│   ├── feature.html
│   └── outro.html
└── assets/
    ├── logo.svg
    └── product.png
```

### 根 Composition 的职责

根 `index.html` 更像一张总装配表：

- 定义最终画幅和总时长；
- 把各个场景放到总时间轴；
- 安排全片音乐、旁白等顶层媒体；
- 决定场景先后、空隙与重叠；
- 保持自身尽量薄。

### 子 Composition 的职责

每个子文件负责：

- 一个清楚的场景目标；
- 自己的 DOM、CSS 和局部动画；
- 自己的 Composition 身份；
- 从局部 0 秒开始的内部时间；
- 可以单独理解、预览和复用。

---

## 九、外部子 Composition 怎样挂进父级

父级使用 `data-composition-src`：

```html
<div
  id="intro-host"
  data-composition-id="intro"
  data-composition-src="compositions/intro.html"
  data-start="0"
  data-duration="4"
  data-track-index="1"
></div>
```

这段代码可以读成：

> 从项目根目录加载 `compositions/intro.html`，把名为 intro 的场景放到父时间轴 0—4 秒，并在 Studio 第 1 轨显示这个窗口。

### 路径从项目根目录解析

即使引用代码位于某个子目录，官方 Composition 路径仍以项目根目录为基准：

```html
data-composition-src="compositions/intro.html"
```

不要根据当前文件位置猜成：

```html
data-composition-src="../compositions/intro.html"
```

统一的项目根路径让 Composition 被移动和复用时更稳定。

### 父级窗口决定场景能出现多久

宿主节点的：

```html
data-start="0"
data-duration="4"
```

定义子场景在父时间轴中的可见窗口。

- 子动画比窗口短：窗口剩余时间通常保持子场景最终状态；
- 父窗口比子内容短：场景会在窗口结束时被截断；
- 父窗口整体移动：子场景内部局部关键帧无需重写。

---

## 十、子 Composition 文件为什么使用 `<template>`

外部子 Composition 不是另一张独立网页被 iframe 播放。HyperFrames 会加载文件，从 `<template>` 中取出内容，挂载到父 Composition，并注册它需要的样式与脚本。

一个没有动画 Timeline 的静态子场景可以写成：

```html
<template id="intro-template">
  <style>
    [data-composition-id="intro"] {
      position: absolute;
      inset: 0;
      overflow: hidden;
      color: white;
      background: linear-gradient(135deg, #0a1020, #182d56);
    }

    [data-composition-id="intro"] .title {
      position: absolute;
      left: 160px;
      bottom: 150px;
      margin: 0;
      font: 800 120px/1 Arial, sans-serif;
    }
  </style>

  <section
    data-composition-id="intro"
    data-width="1920"
    data-height="1080"
    data-no-timeline
  >
    <h1 class="title">Composition 建立边界</h1>
  </section>
</template>
```

父级宿主也应明确它无需等待 Timeline：

```html
<div
  id="intro-host"
  data-composition-id="intro"
  data-composition-src="compositions/intro.html"
  data-start="0"
  data-duration="4"
  data-track-index="1"
  data-no-timeline
></div>
```

如果子场景以后加入 GSAP，则移除 `data-no-timeline`，并在模板内部注册：

```js
window.__timelines = window.__timelines || {};

const introTimeline = gsap.timeline({ paused: true });
// author motion here

window.__timelines.intro = introTimeline;
```

---

## 十一、父级与子级各自掌握什么

Composition 嵌套中最重要的责任分配是：

| 责任 | 父级 | 子级 |
|---|---:|---:|
| 子场景在总片何时出现 | ✓ |  |
| 子场景在总片占多长窗口 | ✓ |  |
| 子场景放在哪条父轨道 | ✓ |  |
| 子场景内部布局 |  | ✓ |
| 子场景内部动画 |  | ✓ |
| 子场景局部 0 秒 |  | ✓ |
| 最终输出画幅 | 根父级决定 | 子级按创作尺寸声明 |

尤其不要把子 Timeline 手动加入父 GSAP Timeline：

```js
// 不要这样做
parentTimeline.add(childTimeline, 4);
```

HyperFrames 会分别 seek 根 Timeline 与每个子 Composition Timeline。父级 HTML 的 `data-start` 已经描述了子场景在总片的位置；再手动挂一次，就会形成两套时间控制。

正确关系是：

```text
Root time 4s
  ↓ parent host data-start="4"
Child local time 0s
  ↓ HyperFrames seeks child independently
Child DOM / GSAP state
```

---

## 十二、Monolithic 与 Modular 两种结构

### Monolithic：单文件

```text
index.html
  ├── intro clip
  ├── feature clip
  └── outro clip
```

适合：

- 很短的单镜头作品；
- 用来学习一个概念的最小示例；
- 场景不需要复用；
- 代码仍能一眼读懂。

### Modular：子 Composition

```text
index.html
  ├── compositions/intro.html
  ├── compositions/feature.html
  └── compositions/outro.html
```

适合：

- 多镜头作品；
- 每个场景有独立 DOM、CSS 和动画；
- 场景需要单独预览或复用；
- 多人或多个 Agent 分工制作；
- 根文件需要保持为清楚的总时间表。

### 拆分标准

不要因为“文件超过 200 行”就机械拆分，也不要因为“只有 3 个场景”就强行写在一起。

更好的判断是：

> 这个片段是否拥有独立叙事目标、独立局部时间和独立验证边界？

如果答案是肯定的，它通常值得成为子 Composition。

---

## 十三、一个薄的根 Orchestrator

下面展示一个 8 秒、两个静态子场景的总装配结构。代码只表达 Composition 关系，不引入本轮之外的动画知识。

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <style>
      html,
      body {
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: hidden;
        background: #000;
      }

      #root {
        position: relative;
        width: 1920px;
        height: 1080px;
        overflow: hidden;
      }

      #root > [data-composition-src] {
        position: absolute;
        inset: 0;
      }
    </style>
  </head>
  <body>
    <main
      id="root"
      data-composition-id="main"
      data-start="0"
      data-duration="8"
      data-width="1920"
      data-height="1080"
      data-no-timeline
    >
      <div
        id="intro-host"
        data-composition-id="intro"
        data-composition-src="compositions/intro.html"
        data-start="0"
        data-duration="4"
        data-track-index="1"
        data-no-timeline
      ></div>

      <div
        id="summary-host"
        data-composition-id="summary"
        data-composition-src="compositions/summary.html"
        data-start="4"
        data-duration="4"
        data-track-index="1"
        data-no-timeline
      ></div>
    </main>
  </body>
</html>
```

这个根文件只表达：

```text
main = 8s
intro = 0…4s
summary = 4…8s
```

它没有介入 intro 的标题字号，也没有介入 summary 的内部动画。根文件因此是一张清楚的装配表。

---

## 十四、Composition ID 的最佳实践

嵌套系统中可能同时出现：

- 宿主元素的 HTML `id`；
- 宿主的 `data-composition-id`；
- 子文件根节点的 `data-composition-id`；
- `window.__timelines` 注册键。

官方 Runtime 可以支持某些宿主 ID 与源 Composition ID 不同的高级复用方式，但初学和普通项目不应依赖静默解析。

课程采用更严格的可读约定：

```text
host data-composition-id
  = child root data-composition-id
  = timeline registry key
```

HTML `id` 用来给 DOM 元素一个页面内唯一名字，可以加 `-host` 后缀：

```html
<div
  id="pricing-host"
  data-composition-id="pricing"
  data-composition-src="compositions/pricing.html"
></div>
```

子文件：

```html
<section data-composition-id="pricing"></section>
```

Timeline：

```js
window.__timelines.pricing = pricingTimeline;
```

从父级、子文件到动画注册，都能沿着 `pricing` 追踪。

---

## 十五、不要把时间控制写回脚本

Composition 和 Clip 的时间关系已经写在 HTML：

```html
<section
  id="proof"
  class="clip"
  data-start="4"
  data-duration="3"
  data-track-index="2"
></section>
```

脚本不应该再做：

```js
// 不要重复实现 Clip 调度
if (currentTime >= 4 && currentTime < 7) {
  proof.style.display = "block";
} else {
  proof.style.display = "none";
}
```

HTML 与脚本的责任边界应是：

```text
HTML data attributes
  → what exists, when, for how long, on which timeline slot

Animation script
  → how visual properties change inside that local time
```

一件事只有一个真相来源，任意 seek 才不会遇到互相打架的状态。

---

## 十六、Composition 设计中的常见失败

### 失败 1：只有 CSS 尺寸，没有 Composition 尺寸

浏览器知道盒子多大，HyperFrames 却缺少创作画幅元数据。

### 失败 2：根时长藏在脚本修改里

根时长在脚本运行前已用于建立 Render Plan，后改属性无法重写当前总帧数。

### 失败 3：静态作品没有 Timeline，也没有 `data-no-timeline`

Runtime 可能等待一条永远不会注册的 Timeline，造成超时或静止检查异常。

### 失败 4：子场景使用总片绝对秒数

子场景被移动或复用后，内部关键帧全部需要重写。正确做法是使用局部时间。

### 失败 5：父级和子级同时控制同一 Timeline

父 GSAP Timeline 手动挂子 Timeline，同时 Runtime 又独立 seek 子 Composition，形成双重控制。

### 失败 6：所有内容都堆在根文件

根文件同时承担总时间、场景布局、局部动画、素材逻辑和变量，修改一个镜头容易影响整片。

### 失败 7：每个小元素都拆成 Composition

过度拆分会让结构、加载、路径和 ID 管理成本大于复用价值。Composition 是场景边界，不是替代所有 DOM 元素。

---

## 十七、从单文件升级到多场景的顺序

一个稳妥的演进顺序是：

```text
Step 1
一个 index.html
一个根 Composition
一个静态 Clip

Step 2
多个 Clip
仍在同一根 Composition

Step 3
出现独立场景责任
拆出 compositions/scene.html

Step 4
根 index.html 只保留场景装配、顶层音频和总时长

Step 5
子场景独立拥有局部动画、样式和可复用输入
```

这种演进避免一开始就搭建庞大目录，也避免作品变复杂后继续把一切塞在同一文件。

---

## 十八、本轮形成的架构图

```text
Project
│
├── index.html
│   └── Root Composition: main
│       ├── identity: main
│       ├── frame: 1920 × 1080
│       ├── time: 0…8s
│       ├── host: intro at 0…4s
│       └── host: summary at 4…8s
│
├── compositions/
│   ├── intro.html
│   │   └── Composition: intro
│   │       └── local time: 0…4s
│   └── summary.html
│       └── Composition: summary
│           └── local time: 0…4s
│
└── assets/
    └── frozen local media
```

在这张图里：

- 根 Composition 是最终交付的空间与时间边界；
- 宿主节点把子 Composition 放进根时间轴；
- 子 Composition 不知道自己在总片第几秒；
- Runtime 分别 seek 每个 Composition 的局部状态；
- Browser 把最终组合结果绘制为一帧。

---

## 本轮结论

Composition 的核心价值是把一段 HTML 从“可能无限存在的页面内容”变成“具有明确身份、固定画幅、有限时长和局部时间的视频单元”。

```text
Composition
  ├── Who: data-composition-id
  ├── Where: data-width / data-height
  ├── How long: data-duration or finite inference
  ├── When in parent: host data-start / data-duration
  ├── Local clock: child time starts from 0
  └── Motion clock: registered Timeline or data-no-timeline
```

最重要的责任划分是：

> 父 Composition 负责安排子场景在总片中的位置；子 Composition 负责自己内部从局部 0 秒开始的画面与运动；HyperFrames 负责把所有局部状态求值到同一根时间点。

下一轮进入 **Frame / FPS / Time**：为什么视频时间需要同时用秒和整数帧表达，帧边界如何计算，以及 24、30、60 fps 改变的到底是什么。
