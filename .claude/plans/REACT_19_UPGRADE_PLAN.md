# React 18 → 19 升级计划

## Context

项目 `utools-excalidraw` 是一个 uTools 插件，运行在 Chromium 108 上。当前使用 React 18.2.0，需要升级到 React 19。

## 浏览器兼容性

| 依赖 | 最低 Chrome | Chromium 108 兼容 |
|---|---|---|
| React 19 | Chrome 64+ | ✅ |
| @headlessui/react v2.2+ | Chrome 100+ | ✅ |
| react-beautiful-dnd | Chrome 64+ | ✅ |
| Tailwind CSS v3 | Chrome 64+ | ✅（**不能升级 v4**，需 Chrome 111+） |

## 依赖变更总览

| 依赖 | 当前 | 目标 | 原因 |
|---|---|---|---|
| `react` | ^18.2.0 | ^19.0.0 | 核心升级 |
| `react-dom` | ^18.2.0 | ^19.0.0 | 核心升级 |
| `@types/react` | ^18.2.79 | ^19.0.0 | 类型对齐 |
| `@types/react-dom` | ^18.2.25 | ^19.0.0 | 类型对齐 |
| `react-beautiful-dnd` | ^13.1.1 | 保持不变 | 保留现有依赖 |
| `@headlessui/react` | ^2.1.2 | ^2.2.0 | v2.1.x 仅支持 ^18；v2.2.0+ 支持 ^18 或 ^19 |
| `@excalidraw/excalidraw` | 0.18.0-d9e8a33 | 保持不变 | peer deps 已声明 ^19.0.0 |

## 实施步骤

### Step 1: 升级 @headlessui/react v2.1.x → v2.2.x

**在 React 18 环境下执行，隔离变更**

包操作：
```bash
pnpm add @headlessui/react@^2.2.0
```

文件修改：

**src/components/SettingDialog.tsx**：将废弃的 `Switch.Group`/`Switch.Label` 迁移为 `Field`/`Label`（已导入）

```tsx
// Before (lines 43-51):
<Switch.Group>
  <div className="setting-item">
    <SwitchBtn checked={false} notAllow />
    <Switch.Label className="flex-1 text-gray-500">...</Switch.Label>
  </div>
</Switch.Group>

// After:
<Field>
  <div className="setting-item">
    <SwitchBtn checked={false} notAllow />
    <Label className="flex-1 text-gray-500">...</Label>
  </div>
</Field>
```

lines 56-73 同样处理。`Field` 和 `Label` 已在 line 7-8 导入，无需新增 import。

其他文件无需修改：
- `src/ui/Dialog.tsx` — Dialog, Transition API 稳定
- `src/components/SceneItem.tsx` — Popover API 稳定

验证：`pnpm type-check` + `pnpm dev` 测试设置对话框、回收站、删除弹窗

---

### Step 2: 添加 Vite 构建目标

**vite.config.ts** — 在 build 块中添加 `target: 'chrome108'`

```ts
build: {
  target: 'chrome108',
  outDir: "dist/web",
  rolldownOptions: {
    // ... existing
  },
},
```

验证：`pnpm build` 成功

---

### Step 3: 升级 React 核心包到 v19

包操作：
```bash
pnpm add react@^19.0.0 react-dom@^19.0.0
pnpm add -D @types/react@^19.0.0 @types/react-dom@^19.0.0
```

> **注意**：`react-beautiful-dnd` 的 peer dependency 声明为 `^16.8.5 || ^17.0.0 || ^18.0.0`，不包含 React 19。pnpm 默认会报 peer dependency 警告。可通过 `pnpm.peerDependencyRules.allowedVersions` 或 `.npmrc` 中的 `strict-peer-dependencies=false` 来忽略。

文件修改：

**src/ui/Switch.tsx** (line 8)：
```tsx
// Before:
}: { notAllow?: boolean } & JSX.IntrinsicElements["input"])

// After:
}: { notAllow?: boolean } & React.JSX.IntrinsicElements["input"])
```

**src/ui/Input.tsx** (line 3)：
```tsx
// Before:
const Input = ({ className, ...props }: JSX.IntrinsicElements["input"]) => {

// After:
const Input = ({ className, ...props }: React.JSX.IntrinsicElements["input"]) => {
```

无需修改的文件：
- `src/components/AsyncImg.tsx` — 使用 `React.ImgHTMLAttributes`，通过 React 命名空间访问
- `src/main.tsx` — createRoot, StrictMode 不变
- `src/components/SceneList.tsx` — react-beautiful-dnd 用法不变
- `src/components/SceneItem.tsx` — DraggableProvided 类型不变

验证：`pnpm type-check` + `pnpm build` + `pnpm dev` 全功能冒烟测试 + `pnpm test`

---

### Step 4: 更新文档

**AGENTS.md** (line 37)：`React 18` → `React 19`

---

## 风险评估

| 风险 | 等级 | 缓解措施 |
|---|---|---|
| react-beautiful-dnd peer dependency 不匹配 | 中 | 通过 pnpm peerDependencyRules 忽略警告；运行时验证拖拽功能 |
| @excalidraw/excalidraw 兼容性 | 低 | peer deps 已声明 ^19.0.0 |
| Chromium 108 兼容性 | 低 | build.target: 'chrome108' 确保降级 |
| forwardRef 废弃 | 低 | 仍可工作，不影响功能 |
| Switch.Group API 迁移 | 中 | Field/Label 已导入，改动小 |

## 关键文件

- `package.json`
- `src/components/SettingDialog.tsx`
- `src/ui/Switch.tsx`
- `src/ui/Input.tsx`
- `vite.config.ts`
- `AGENTS.md`
