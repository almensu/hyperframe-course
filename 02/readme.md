# 02｜Frame / FPS / Time：把秒换算成可寻址的位置

## 本轮目标

第 01 轮给视频建立了有限边界：Composition 有明确画幅、起点和终点。

这一轮只研究边界内部的刻度：**Frame、FPS 与 Time**。

学完本轮，应建立五个稳定认识：

1. `time` 是作品中的秒数，`frame` 是离散采样位置，`fps` 是一秒包含多少个采样位置；
2. HyperFrames 渲染时不是让视频自然播放，而是逐帧 seek 到 `frame / fps`；
3. FPS 决定采样密度，不直接决定故事播放速度；
4. Clip 使用左闭右开的时间窗口 `[start, end)`，相邻片段不会在边界帧同时出现；
5. 所有“第几帧”的判断都必须先固定 FPS，否则帧号没有完整含义。

本轮只保留详细讲解与必要代码示例，不创建练习目录，也不安排测试题。

---

## 一、先把视频想成一本翻页书

假设桌上有一本 5 秒钟的翻页书，每秒翻 30 张：

```text
duration = 5 seconds
fps      = 30 frames / second
frames   = 5 × 30 = 150
```

这本书共有 150 张画面，但编号不是 `1…150`，而是：

```text
0, 1, 2, ..., 149
```

第 0 帧对应作品时间 0 秒。第 30 帧对应 1 秒，第 60 帧对应 2 秒。

关键换算是：

```text
time(frame) = frame / fps
```

在 30 fps 下：

| 帧序号 | 作品时间 | 含义 |
|---:|---:|---|
| 0 | 0.0000s | 第一张画面 |
| 1 | 0.0333s | 第二张画面 |
| 29 | 0.9667s | 第 1 秒内的最后一张画面 |
| 30 | 1.0000s | 第 1 秒边界上的画面 |
| 90 | 3.0000s | 第 3 秒边界上的画面 |
| 149 | 4.9667s | 5 秒视频的最后一张输出画面 |

注意最后一行：5 秒、30 fps 的视频最后输出的是 `frame 149`，不是 `frame 150`。

`frame 150` 的时间是：

```text
150 / 30 = 5 seconds
```

但 5 秒已经是 Composition 的右边界。若再输出 `frame 150`，总数就变成 151 帧，成片也会比设计长度多一帧。

所以，一个时长为 `D`、帧率为 `F` 的整帧 Composition，通常可以读成：

```text
有效时间区间 = [0, D)
总帧数       = D × F
帧序号       = 0 ... D × F - 1
```

左方括号表示包含 0 秒，右圆括号表示不包含终点 `D`。

---

## 二、三个概念各自负责什么

### 1. Time：作品中的连续坐标

HyperFrames 的 HTML 时间属性以秒为主要单位：

```html
<section
  class="clip"
  data-start="2.5"
  data-duration="1.2"
>
  <!-- 从 2.5 秒开始，持续 1.2 秒 -->
</section>
```

这里表达的是创作意图：内容从 2.5 秒开始，到 3.7 秒结束。

Time 适合回答：

- 旁白说到第几秒时标题出现？
- 一个镜头持续多少秒？
- 两个场景何时交接？
- 动画在自己的局部时间中走到哪里？

Time 是连续的。理论上可以写 `2.5`、`2.53`、`2.5317`，但最终视频不会保存无限多个时间点。

### 2. FPS：一秒钟采样多少次

FPS 是 frames per second，即每秒帧数。

同一个 5 秒 Composition：

| FPS | 输出帧数 | 相邻帧时间间隔 |
|---:|---:|---:|
| 24 | 120 | 约 41.67ms |
| 30 | 150 | 约 33.33ms |
| 60 | 300 | 约 16.67ms |

FPS 提高后，时间轴没有自动变长，故事也没有自动变慢。系统只是用更密的刻度询问同一段 5 秒内容。

可以把 FPS 想成尺子的刻度密度：

```text
24 fps：每秒量 24 次
30 fps：每秒量 30 次
60 fps：每秒量 60 次
```

更密的刻度通常能让运动更平滑，但也意味着更多捕获、更多编码工作和通常更大的输出。

### 3. Frame：真正被捕获的离散地址

Frame 不是一段时间，而是一个具体地址。

```text
frame 90 at 30 fps = 3.0s
frame 90 at 60 fps = 1.5s
```

因此，“看第 90 帧”这句话并不完整。还必须说明 FPS。

完整表达应是：

> 在 30 fps 的输出时间基准下，检查第 90 帧。

这也是为什么 FPS 必须在第 0 帧前锁定。若渲染到一半再改变 FPS，后续所有帧号都会突然指向不同的时间。

---

## 三、HyperFrames 不是播放后截图，而是按地址提问

普通播放器的直觉是：

```text
按下播放 → 时间自然流逝 → 浏览器尽力刷新画面
```

HyperFrames 的离线渲染模型是：

```text
请求 frame 0   → seek 到 0 / fps   → 等状态稳定 → capture
请求 frame 1   → seek 到 1 / fps   → 等状态稳定 → capture
请求 frame 2   → seek 到 2 / fps   → 等状态稳定 → capture
...
```

官方确定性规则写成：

```text
time = floor(frame) / fps
```

渲染请求通常本来就是整数帧；`floor` 的意义是保证即使调用侧传入非整数，也只落到一个确定的离散帧地址。

整个过程可以理解为一个纯函数：

```text
pixels = render(composition, variables, assets, fps, frame)
```

同一组输入再次请求相同 frame，应该得到相同像素。

### 为什么慢机器也不应该丢渲染帧

假设某一帧需要 200ms 才能绘制完成，而目标仍是 30 fps。

实时播放可能卡顿，因为它理想上每 33.33ms 就要刷新一次。离线 Render 不需要赶真实时钟：它可以等待第 80 帧完成，再请求第 81 帧。

所以：

- Preview 卡顿，可能只是机器无法实时播放；
- Render 变慢，通常不等于输出丢帧；
- 判断画面正确性，应检查指定帧，而不是只凭播放是否顺滑。

框架内部可以为了预览维护播放时钟，但作品代码不能用 `Date.now()`、`setInterval()` 或 `requestAnimationFrame()` 自己累加进度。离线 Render 需要的是“给我任意帧都能直接算出状态”，而不是“必须从开头等待到这里”。

---

## 四、总帧数怎样从时长得到

当 `duration × fps` 正好是整数时最直观：

```text
8s × 30fps = 240 frames
frame range = 0...239
```

如果乘积不是整数，例如：

```text
duration = 1.01s
fps      = 30
raw      = 30.3 frames
```

视频不能输出 0.3 帧。当前 HyperFrames Producer 会在接近整数边界时吸收浮点误差，否则向上取整：

```text
totalFrames = ceil(duration × fps)
```

所以上例得到 31 帧，帧号 `0…30`。最后一帧的采样时间是 1 秒，编码后总长度覆盖声明的 1.01 秒边界。

为什么不是向下取整为 30？因为向下会让输出在 1 秒处结束，提前截掉 Composition 声明的剩余部分。

课程中的实践规则是：

- 如果交付要求精确到帧，优先让关键时长落在帧网格上；
- 用 `frame / fps` 生成秒值，不要同时手工维护两套数字；
- 业务意图天然以秒表达时，可以保留小数，让渲染器决定覆盖它所需的帧数。

一个简单的帧转秒工具：

```js
const FPS = 30;

function atFrame(frame) {
  return frame / FPS;
}

console.log(atFrame(12));  // 0.4
console.log(atFrame(45));  // 1.5
console.log(atFrame(149)); // 4.966666666666667
```

如果策划表写的是“第 45 帧切镜头”，生成 HTML 时应由 `45 / FPS` 得到 `1.5` 秒，而不是再手抄一个可能不一致的 `1.49`。

---

## 五、时间窗为什么必须是左闭右开

假设两个场景在第 2 秒无缝交接：

```html
<section class="clip" data-start="0" data-duration="2">
  Scene A
</section>

<section class="clip" data-start="2" data-duration="3">
  Scene B
</section>
```

HyperFrames 把 Clip 窗口理解为：

```text
Scene A = [0, 2)
Scene B = [2, 5)
```

在 30 fps 下：

| 场景 | 可见帧 | 采样时间 |
|---|---|---|
| Scene A | 0…59 | 0.0000s…1.9667s |
| Scene B | 60…149 | 2.0000s…4.9667s |

`frame 60` 只属于 Scene B。Scene A 不会在边界继续占一帧，因此两个相邻场景不会因为“都包含 2 秒”而重叠。

这就是左闭右开的价值：

```text
start <= time < end
```

### 终点停住时为什么不会突然空白

Runtime 对预览终点有一个可读性处理：如果最后一个 Clip 延伸到 Composition 末尾，那么播放器停在终点时仍可保留最后画面，避免播放结束后舞台变空。

这不等于多编码一帧。5 秒、30 fps 的正常 Render 仍输出 `frame 0…149`；终点 5 秒是播放器的停靠状态，不是额外的 `frame 150`。

---

## 六、不对齐帧网格的时间会发生什么

假设 Clip 从 1.25 秒开始，FPS 为 30：

```text
1.25 × 30 = 37.5
```

不存在第 37.5 帧。附近只有：

```text
frame 37 = 1.2333s
frame 38 = 1.2667s
```

Clip 的规则是 `time >= start`，所以：

- frame 37 太早，Clip 不可见；
- frame 38 是第一个满足条件的输出帧；
- 视觉上的首次出现时间是约 1.2667 秒。

对开始边界而言：

```text
firstVisibleFrame = ceil(start × fps)
```

对结束边界而言，因为 `time < end`：

```text
lastVisibleFrame = ceil(end × fps) - 1
```

这并不是时间错误，而是连续时间被离散采样后的必然结果。

可以把它想成公交车：你在 1.25 秒到站，但车只在 1.2333 秒和 1.2667 秒到达。你赶不上前一班，只能从后一班开始被看见。

### 什么时候应该主动对齐

以下情况适合用整帧边界：

- 硬切镜头；
- 单帧闪白或定格；
- 与逐帧图像序列对齐；
- 与外部剪辑软件交换精确帧点；
- 自动化视觉回归要固定某一帧。

以下情况通常可以继续用秒：

- 旁白语义点；
- 音乐节拍时间；
- 普通缓动的起止；
- 人类更关心“约 1.2 秒”而非某个帧号的场景。

不要为了“看起来专业”把所有时间都改写成帧号。正确做法是先决定哪一种单位承载真实意图，再从一个真相派生另一种表示。

---

## 七、一个完整的 5 秒帧地图

下面的 Composition 不使用动画 Timeline，只用三个静态 Clip 展示帧窗口，因此根节点声明 `data-no-timeline`：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <style>
      html, body { margin: 0; background: #050816; }

      #root {
        position: relative;
        width: 1920px;
        height: 1080px;
        overflow: hidden;
      }

      .clip {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        color: white;
        font: 700 120px/1 system-ui, sans-serif;
      }

      #opening { background: #172554; }
      #message { background: #4c1d95; }
      #ending  { background: #134e4a; }
    </style>
  </head>
  <body>
    <main
      id="root"
      data-composition-id="main"
      data-start="0"
      data-duration="5"
      data-fps="30"
      data-width="1920"
      data-height="1080"
      data-no-timeline
    >
      <section
        id="opening"
        class="clip"
        data-start="0"
        data-duration="2"
        data-track-index="0"
      >
        OPENING
      </section>

      <section
        id="message"
        class="clip"
        data-start="2"
        data-duration="1.5"
        data-track-index="0"
      >
        MESSAGE
      </section>

      <section
        id="ending"
        class="clip"
        data-start="3.5"
        data-duration="1.5"
        data-track-index="0"
      >
        ENDING
      </section>
    </main>
  </body>
</html>
```

它的帧地图是：

| Clip | 秒窗口 | 30 fps 帧窗口 | 帧数 |
|---|---|---|---:|
| `opening` | `[0, 2)` | `0…59` | 60 |
| `message` | `[2, 3.5)` | `60…104` | 45 |
| `ending` | `[3.5, 5)` | `105…149` | 45 |

三个窗口连续、没有空洞、没有重复边界帧，总数为：

```text
60 + 45 + 45 = 150 frames
150 / 30 = 5 seconds
```

这张表比“看起来好像衔接正常”更有证明力，因为它明确列出了每个场景拥有的地址范围。

---

## 八、`data-fps` 与 `--fps` 谁说了算

根节点可以声明创作时采用的帧率：

```html
<main data-fps="30" ...>
```

当前 CLI 的 Render 规则是：

```text
显式 --fps
  优先于 root data-fps
  优先于默认 30 fps
```

例如：

```bash
# 使用根节点 data-fps="30"
npx hyperframes render --output output-30.mp4

# 本次输出覆盖为 60 fps
npx hyperframes render --fps 60 --output output-60.mp4
```

如果动画和 Clip 都以秒为真相，那么两次输出仍然都是 5 秒：

```text
30 fps → 150 frames
60 fps → 300 frames
```

运动持续时间不变，只是 60 fps 版本在相同时间内采样更密。

### 为什么不能随意覆盖 FPS

若项目中存在这些内容，改变 FPS 前要重新审计：

- 以“第 N 帧”为业务参数的生成脚本；
- 与外部帧序列一一对应的素材；
- 按某个源视频帧率制作的遮罩或跟踪数据；
- 已经记录为帧号的人工审片意见；
- 依赖固定帧数而不是秒数的自定义 Adapter。

换句话说：以秒创作的结构通常能自然适配不同 FPS；以帧创作的结构必须明确转换基准。

### 29.97 fps 不要随手写成 29.97

CLI 支持 FFmpeg 有理数写法：

```bash
npx hyperframes render --fps 30000/1001 --output delivery.mp4
```

`30000/1001` 才是广播工作流里常说的 29.97 fps 的精确时间基准。普通网络视频课程可以继续使用 24、30 或 60；只有交付规范要求时再引入分数帧率。

---

## 九、检查指定帧时，不要误解 `snapshot --frames`

当前 CLI 文档中：

```bash
npx hyperframes snapshot . --frames 10
```

这里的 `10` 表示“在全片中均匀抽取 10 张”，不是“捕获 frame 10”。

若要检查特定帧，应先换算成秒，再用 `--at`：

```text
frame 59 / 30fps = 1.9666667s
frame 60 / 30fps = 2s
```

```bash
npx hyperframes snapshot . --at 1.9666667,2 --no-end
```

这组快照适合证明上面的场景边界：

- 1.9666667 秒应看到 `OPENING`；
- 2 秒应看到 `MESSAGE`；
- 两张都不应同时显示两个场景。

任意秒值在进入确定性 seek 时会量化到输出帧网格。若你要表达“准确的第 N 帧”，最稳妥的方式仍然是保存 `frame` 与 `fps`，临时计算 `N / fps`，而不是手工保留一个截断过的小数。

辅助计算可以交给 Node：

```bash
node -e "const fps=30; console.log([59,60,104,105,149].map(n => n/fps).join(','))"
```

输出：

```text
1.9666666666666666,2,3.466666666666667,3.5,4.966666666666667
```

再把结果传给 `snapshot --at` 即可。

---

## 十、时间换算中最常见的错误

### 错误 1：把总帧数当作最后帧序号

```text
错误：5s × 30fps = 150，所以最后一帧是 frame 150
正确：共有 150 帧，最后一帧是 frame 149
```

“数量”和“从 0 开始的索引”相差 1。

### 错误 2：用 `(frame + 1) / fps` 计算帧时间

frame 0 就是 0 秒，不是 `1 / fps`。正确公式是：

```text
time = frame / fps
```

`(frame + 1) / fps` 表达的是这一帧时间槽的右边界，不是该帧的采样地址。

### 错误 3：认为 60 fps 会自动慢动作

只把输出从 30 改到 60，会在同一秒数中捕获更多状态，不会自动把 5 秒拉成 10 秒。

慢动作需要改变“源时间怎样映射到作品时间”，不是简单提高输出 FPS。媒体变速会在后面的 Media Time 轮次专门讨论。

### 错误 4：相邻 Clip 都包含结束点

若脑中把 A 理解成 `[0,2]`，把 B 理解成 `[2,5]`，就会以为 2 秒同时属于两者。Runtime 实际使用 `[start,end)`，2 秒只属于 B。

### 错误 5：用真实 timer 推进作品

```js
// 不要这样建立离线作品状态
let progress = 0;
setInterval(() => {
  progress += 0.01;
}, 10);
```

随机 seek 到第 120 帧时，系统不会替你先运行 400 次 timer。画面必须能从请求的 time/frame 直接恢复。

### 错误 6：看到 Preview 卡，就认为 Render 会丢帧

Preview 受实时性能限制；Render 逐帧等待并捕获。卡顿应促使你检查性能，但不能直接推导为离线结果缺帧。

### 错误 7：把 `snapshot --frames 10` 当作第 10 帧

该参数表示均匀抽取数量。精确边界检查应使用由 `frame / fps` 得到的 `--at` 秒值。

---

## 十一、给 AI 的时间设计提示词应该怎样写

模糊提示：

```text
做一个 5 秒视频，三段内容依次出现。
```

这句话没有告诉 AI 边界、FPS 或验证位置，AI 很容易生成互相重叠或无法审计的时间。

更好的提示：

```text
创建一个 1920×1080、5 秒、30 fps 的 HyperFrames Composition。
时间以秒写入 HTML，但所有硬切边界必须对齐 30 fps 帧网格。

时间结构：
- opening: [0, 2)，对应 frame 0–59；
- message: [2, 3.5)，对应 frame 60–104；
- ending: [3.5, 5)，对应 frame 105–149。

根节点声明 data-fps="30" 与 data-no-timeline。
不要使用 Date.now、setInterval、requestAnimationFrame 或自动播放状态推进内容。
请在代码后输出一张“Clip / 秒窗口 / 帧窗口 / 帧数”对照表。
```

好提示词同时锁定四件事：

1. 时间基准；
2. 场景窗口；
3. 边界规则；
4. 可验证证据。

AI 可以代写代码，但不能替你决定“2 秒到底属于前镜头还是后镜头”。这个责任必须由时间合同先说明。

---

## 十二、本轮应形成的世界观

现在可以把 HyperFrames 的时间模型压缩成一条因果链：

```text
Composition 给出有限 duration
        ↓
fps 建立离散采样网格
        ↓
frame 选择网格上的一个地址
        ↓
time = frame / fps
        ↓
Runtime seek 所有可寻址状态
        ↓
浏览器捕获这一帧像素
```

其中：

- 秒是创作语言；
- FPS 是采样规则；
- Frame 是验证地址；
- 左闭右开的窗口消除边界歧义；
- seek 让任意地址可以直接访问；
- 确定性让同一地址可以重复验证。

下一轮会把这套刻度放到 Clip 上，继续研究一个容易混淆的问题：**元素存在于 DOM，为什么此刻仍然可能不可见？**

---

## 本轮结论

Frame、FPS 和 Time 不是三个可以混用的词。

`time` 描述作品中的秒，`fps` 决定每秒建立多少个离散地址，`frame` 指向其中一个确定位置。HyperFrames 在离线 Render 中逐帧 seek，而不是依赖真实时间播放；因此 `frame N` 的状态必须能被直接、重复、乱序地求出。

记住三个最重要的式子：

```text
time = frame / fps
totalFrames ≈ ceil(duration × fps)
clip active when start <= time < end
```

以及一个最常见的边界事实：

```text
5 秒 × 30 fps = 150 帧
帧序号是 0…149，不是 0…150
```

做到这一点，时间轴才从“差不多在这里”变成可寻址、可解释、可验证的数据结构。

