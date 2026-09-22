# HeyGen HyperFrames Worldview Course

费曼式 30 轮代码视频课程。

这套课研究的是 [HeyGen 开源 HyperFrames](https://github.com/heygen-com/hyperframes)：用 HTML、CSS、媒体和可寻址动画描述视频，再由浏览器逐帧求值，通过编码与音频管线生成视频文件。它不是 `hyperframe.ai` 企业视频平台。

## 制作方式

课程按轮次逐步制作：**一次对话只完成一轮详细课程**。每轮完成后提交讲义、代码实验和理解审计；收到“下一轮”后，才继续制作下一轮。

当前进度：**2 / 30**。

## 学习闭环

```text
Meaning / Intent
  ↓
Semantic Prompt
  ↓
AI writes visible code
  ↓
Predict a frame
  ↓
Change one parameter
  ↓
lint / check / snapshot / preview
  ↓
Audit the result
  ↓
Understanding
```

所有课程遵循 [LEARNING_CONSTITUTION.md](LEARNING_CONSTITUTION.md)。踩坑记录见 [Gotchas.md](Gotchas.md)，官方依据与版本边界见 [SOURCES.md](SOURCES.md)。

## 30 轮路线图

| 轮次 | 主题 | 状态 |
|---:|---|---|
| 00 | [HyperFrames Worldview：把浏览器看成逐帧摄影棚](00/readme.md) | ✅ 已完成 |
| 01 | [Composition：给视频建立有限边界](01/readme.md) | ✅ 已完成 |
| 02 | Frame / FPS / Time：把秒换算成可寻址的位置 | ⏭ 下一轮 |
| 03 | Clip：存在于 DOM，不等于此刻可见 | 待制作 |
| 04 | Track / Layer：时间重叠与像素覆盖 | 待制作 |
| 05 | Time Domains：全局、局部与媒体源时间 | 待制作 |
| 06 | Determinism：同一帧必须得到同一画面 | 待制作 |
| 07 | Preview / Scrub / Render：三个入口，一个时间真相 | 待制作 |
| 08 | GSAP Contract：你写运动，HyperFrames 掌握播放头 | 待制作 |
| 09 | Motion Grammar：位移、缩放、透明度与缓动 | 待制作 |
| 10 | Frame Adapters：不同动画运行时共用帧时钟 | 待制作 |
| 11 | Frame Layout：为镜头排版 | 待制作 |
| 12 | Typography in Time：文字既占空间，也占时间 | 待制作 |
| 13 | Images / Video：放入、裁切与构图 | 待制作 |
| 14 | Media Time：Trim / Rate / Loop / Freeze | 待制作 |
| 15 | Sub-composition：把复杂视频拆成场景 | 待制作 |
| 16 | Transitions：转场是共享的一段时间 | 待制作 |
| 17 | SVG / Mask / Blend：矢量与合成 | 待制作 |
| 18 | Variables / Templates：保存生成规则 | 待制作 |
| 19 | Design System for Video：从品牌令牌到镜头规则 | 待制作 |
| 20 | Script / Storyboard / Beats：先决定为什么切镜头 | 待制作 |
| 21 | Voice / Captions：让语言成为时间数据 | 待制作 |
| 22 | Audio Mix：声音的层级与自动化 | 待制作 |
| 23 | Rhythm / Beat Sync：节拍与叙事落点 | 待制作 |
| 24 | Formats / Aspect Ratios：多种交付约束 | 待制作 |
| 25 | CLI Feedback Loop：从意图到证据 | 待制作 |
| 26 | Render Pipeline：浏览器、捕获、编码与混音 | 待制作 |
| 27 | Performance / Assets：让每帧只做必要工作 | 待制作 |
| 28 | AI Production：Agent 实现，人类审片 | 待制作 |
| 29 | HyperFrames Worldview Final：可寻址、可验证、可再生成 | 待制作 |

## 已完成

- [第 00 轮详细课程](00/readme.md)
- [第 00 轮四个练习](00/exercises/)
- [第 01 轮详细课程](01/readme.md)

现阶段先完成详细讲义与必要代码示例。练习和测试题暂停制作，等具备合适资源后再统一补充。

## 环境

- Node.js 22+
- FFmpeg
- 当前 HyperFrames CLI

课程结构自检：

```bash
npm run check:course
```

运行某个参考 Composition 时，进入它的 `solution` 目录，再执行：

```bash
npx hyperframes doctor
npx hyperframes lint
npx hyperframes check
npx hyperframes preview
```
