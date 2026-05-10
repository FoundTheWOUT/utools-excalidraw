---
description: Co-Authored-By line in commit messages should use the current powering model name
alwaysApply: false
---

Commit message 中的 Co-Authored-By 应使用当前运行的模型名称，而非固定的 "Claude Opus" 等名称。

**Why:** 用户希望 commit 记录准确反映实际使用的模型。

**How to apply:** 在生成 commit message 时，将 Co-Authored-By 中的模型名替换为当前会话的模型标识（从环境信息中获取）。
