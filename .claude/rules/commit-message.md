---
description: Commit messages must never contain a Co-Authored-By trailer or any other AI/tool attribution
alwaysApply: true
---

提交 commit 时，**不要**在 commit message 里写 `Co-Authored-By:` 行，也不要写任何 AI/工具署名（例如 `Generated with ...`）。只保留标题和正文。

**Why:** 用户不希望 commit 记录中出现这类署名，提交者身份由本地 git 配置（`user.name` / `user.email`）决定。

**How to apply:** 生成 commit message 时只写 subject + body（正文可用 `-` 列表、`Closes #N` 等）；执行 `git commit` 时不要加会追加署名 trailer 的参数，也不要使用带 `Co-Authored-By` 的提交模板。
