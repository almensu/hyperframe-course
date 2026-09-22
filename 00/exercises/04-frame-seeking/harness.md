# AI Harness

- 状态只能由 Composition 时间窗口决定。
- 不使用 Date.now、timer、requestAnimationFrame 或 Math.random。
- 每段可被直接 seek，不依赖前一段执行。
- 30 fps 只用于换算说明，真实时钟不是输入。
