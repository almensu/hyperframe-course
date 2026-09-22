# HyperFrames Gotchas

本文件随课程逐轮增长。当前只记录第 00 轮已经遇到的高复发问题。

## 产品名称

`hyperframe.ai` 与 HeyGen `HyperFrames` 是两个产品。本课程只讨论 `heygen-com/hyperframes`。

## Composition root 缺少身份或尺寸

最小根节点应有稳定 `data-composition-id` 与固定 `data-width` / `data-height`，并能推导有限结束时间。

## Timed element 忘记 `class="clip"`

只写 `data-start` 和 `data-duration` 不够。运行时通过 `class="clip"` 识别需按时间窗口管理的元素。

## Track 与 z-index 混用

Track 组织时间轴；DOM stacking context 与 z-index 决定像素覆盖。修改 track-index 不保证画面遮挡改变。

## 重复管理 Clip 可见性

不要一边声明 Clip 时间窗，一边用 timer 或场景末尾 `visibility:hidden` 再实现一套开关。

## 把真实时间当作品时间

不要用 `Date.now()`、timer 或 `requestAnimationFrame()` 累加离线作品进度。画面状态必须能够从 frame/time 直接求出。

## 渲染时读取临时网络

远程字体、图片和接口响应会让同一帧不稳定。交付资源应在第 0 帧前冻结并完成加载。

## 只看顺序预览

顺着播放正确不等于可 seek。应乱序访问多个时间点并重复捕获同一帧。
