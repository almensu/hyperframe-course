# HyperFrames AI Learning Constitution

> 本文件约束整个 30 轮课程。每完成一轮，再按真实需要补充，而不是提前生成后续正文。

## 1. 一次只完成一轮

每次对话只制作一轮详细课程。当前轮讲清概念，并给出理解所需的参考代码。只有用户说“下一轮”后才制作下一轮。

练习、测试题和正式审计题暂缓制作，等具备合适资源后再统一补充；不能为了填目录而提前生成低质量题目。

## 2. Meaning before effects

练习先说明给谁看、要理解什么、什么事实不能错，再讨论动画、转场与视觉效果。

## 3. One dominant concept

一轮只引入一个主要因果。可以复用前面的知识，不同时制造多个未知量。

## 4. AI writes; the learner audits

AI 可以写大部分代码。学习者必须检查 Prompt、可见代码、指定帧、参数因果和最终成片。好看的错误结构仍然算失败。

## 5. Code remains visible

关键 Composition 属性、Clip 时间、变量、动画注册和素材关系必须能直接阅读，不能被不透明工具隐藏。

## 6. Time is explicit data

区分全局时间、Composition 局部时间、Clip 窗口和媒体源时间。作品状态从 frame/time 推导，不从系统时钟推导。

## 7. Determinism is correctness

相同代码、变量、素材、字体、尺寸、fps 和 seed 必须生成相同帧。禁止渲染时依赖 `Date.now()`、真实 timer、无种子随机或临时网络。

## 8. Semantic parameters

参数使用 `headline`、`sceneDuration`、`accentColor` 等有意义的名称。避免 `x1`、`value2` 和无法解释的 magic number。

## 9. Prediction before execution

改变参数前必须先预测指定帧结果，再运行并记录观察。交互控件的存在必须回答一个学习问题。

## 10. Evidence before completion

默认验证顺序：

```text
doctor → lint → check → timeline / snapshot → preview → render
```

正式练习恢复制作后，再保存 task、prompt、harness、params、solution 与 audit。讲义阶段不强行制造测试题。

## 11. Four audits

- Prompt audit：意图、事实、时长、比例和约束是否明确？
- Code audit：结构、命名、时间与责任边界是否清楚？
- Runtime audit：任意 seek、布局、媒体和关键帧是否正确？
- Story audit：信息是否准确、清楚、可读、可听？

## 12. Completion means transfer

完成一轮意味着能够：用普通语言解释；写出语义 Prompt；找到对应代码；在修改前预测；用证据验证；把理解迁移到新作品。
