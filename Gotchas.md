# HyperFrames Gotchas

本文件随课程逐轮增长。当前记录第 00—02 轮已经遇到的高复发问题。

## 产品名称

`hyperframe.ai` 与 HeyGen `HyperFrames` 是两个产品。本课程只讨论 `heygen-com/hyperframes`。

## Composition root 缺少身份或尺寸

最小根节点应有稳定 `data-composition-id` 与固定 `data-width` / `data-height`，并能推导有限结束时间。

## Timed element 没有遵守共同 Clip 约定

当前 Runtime 依据 `data-start` 等时间属性管理时间窗口，`class="clip"` 是官方布局与工具约定，不是底层识别时间窗口的唯一条件。课程仍要求可见 timed element 使用 `class="clip"`，让全屏布局、Studio 和人类阅读保持一致。

## 静态 Composition 没有声明 `data-no-timeline`

如果作品只有静态 Clip，没有注册 GSAP 等 Timeline，在根节点声明布尔属性 `data-no-timeline`，告诉渲染器不要等待不存在的时间线。

## 试图在脚本中改变根 `data-duration`

根时长在 Composition 编译阶段读取。脚本后设 `root.setAttribute("data-duration", ...)`，不能改变本次 Render 的总长度。需要不同长度时，应在源码生成阶段写入根属性，或有意识地省略它并让 Runtime 从有限 Clip / Timeline 推导。

## 子 Composition 路径按当前文件猜相对目录

`data-composition-src` 路径从项目根目录解析。即使当前文件在子目录中，也不要写 `../compositions/foo.html` 去猜位置。

## 把子 Timeline 手动加入父 GSAP Timeline

HyperFrames 会独立 seek 每个嵌套 Composition。父级负责放置子场景的时间窗口，不要再把子 Timeline 手动挂进父 Timeline，避免出现两套播放头。

## Track 与 z-index 混用

Track 组织时间轴；DOM stacking context 与 z-index 决定像素覆盖。修改 track-index 不保证画面遮挡改变。

## 重复管理 Clip 可见性

不要一边声明 Clip 时间窗，一边用 timer 或场景末尾 `visibility:hidden` 再实现一套开关。

## 把真实时间当作品时间

不要用 `Date.now()`、timer 或 `requestAnimationFrame()` 累加离线作品进度。画面状态必须能够从 frame/time 直接求出。

## 把总帧数当作最后帧序号

帧索引从 0 开始。5 秒、30 fps 共有 150 帧，帧号是 `0…149`；Composition 的 5 秒终点不是额外的 `frame 150`。

## 把 Clip 终点当作包含边界

Clip 窗口使用左闭右开规则：`start <= time < end`。相邻 Clip 在共同边界不会同时可见；播放器可在 Composition 终点保留最后画面，但 Render 不因此增加终点帧。

## 认为提高 FPS 会自动产生慢动作

FPS 决定一秒采样多少次。把 30 fps 改成 60 fps 通常只会让相同秒数拥有更多帧，不会自动改变故事速度。慢动作需要修改源时间到作品时间的映射。

## 忽略 `--fps` 对 `data-fps` 的覆盖

Render 时显式 `--fps` 优先于根节点 `data-fps`，两者都没有时默认 30 fps。项目若保存了帧号、逐帧素材或跟踪数据，覆盖 FPS 后必须重新换算和审计。

## 误读 `snapshot --frames`

`snapshot --frames 10` 表示在全片均匀抽取 10 张，不是捕获第 10 帧。要检查第 N 帧，先用 `N / fps` 换算为秒，再传给 `snapshot --at`。

## 渲染时读取临时网络

远程字体、图片和接口响应会让同一帧不稳定。交付资源应在第 0 帧前冻结并完成加载。

## 只看顺序预览

顺着播放正确不等于可 seek。应乱序访问多个时间点并重复捕获同一帧。
