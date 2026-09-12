# 快捷键设计文档（侧边栏开关 / 新增画布）

> 关联 issue：[#35](https://github.com/FoundTheWOUT/utools-excalidraw/issues/35)（【快捷键】侧边栏 打开/关闭）、[#32](https://github.com/FoundTheWOUT/utools-excalidraw/issues/32)（快捷键支持）、[#36](https://github.com/FoundTheWOUT/utools-excalidraw/issues/36)（【快捷键】新增画布）
> 联动 issue：[#34](https://github.com/FoundTheWOUT/utools-excalidraw/issues/34)（新增画布按钮移至侧栏右上角，与 #36 同批 UI 调整）

## Context

项目当前**没有任何自定义快捷键代码**（全仓 grep「快捷键」零命中）。侧栏开/关只能点侧栏右下角的圆形按钮，新增画布只能点侧栏底部的「+」卡片。同时 Excalidraw 自带约 50 个快捷键，在本项目中它占据键盘主导权，因此本节的重点不是"加两个 keydown 判断"，而是**先确定一套不会与 Excalidraw 冲突、不会在输入/文本编辑时误触的快捷键机制**。

### 一期目标

1. 侧边栏开/关快捷键（#35、#32）
2. 新增画布快捷键（#36）
3. 一套可扩展的键位注册机制：后续加键位只改一张表（含冲突单测），不散落 if 判断
4. 复用现有动作实现，**不改变任何现有交互语义**（按钮点起来和现在一样）

### 非目标（一期不做）

| 项                                        | 原因                                                                                                                                                                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 键位可视化自定义（设置页改键）            | 需要按键录入、冲突校验、持久化，工作量独立，放二期                                                                                                                                                                                         |
| uTools 全局快捷键（窗口未聚焦也能触发）   | **已确认不做**（D1）。uTools 未提供插件侧注册 API（`utools-api-types` 无 `registerShortcut`），只能靠 `utools.setFeature` / `dist/plugin.json` 暴露 feature 后**由用户在 uTools 里手工绑定热键**，且要动打包配置。将来若要做，属于独立需求 |
| Excalidraw 原生快捷键面板里显示我们的键位 | 该面板由 Excalidraw 内置 `shortcutMap` 驱动，外部无法注入（见下）                                                                                                                                                                          |

## 调研结论（含代码证据）

### 1. 接管时机：window 捕获阶段可以完全抢先

| 事实                                                                                                                           | 证据                                                          |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Excalidraw 的快捷键分发入口是 `ActionManager.handleKeyDown`，匹配到唯一 action 后执行 `preventDefault()` + `stopPropagation()` | `node_modules/@excalidraw/excalidraw/dist/dev/index.js:21018` |
| 默认（未开 `handleKeyboardGlobally`）它是 `App.onKeyDown` 作为 React prop 挂在**画布容器 div** 上，走**冒泡**                  | 定义 `index.js:38805`，绑定 `index.js:43370`                  |
| 开 `handleKeyboardGlobally` 时挂到 `document`，第三参数 `false` → **仍是冒泡**                                                 | `index.js:43855`                                              |
| Excalidraw 自己在 `isInputLike(event.target)` 时整段跳过（输入框/文本编辑中不响应快捷键）                                      | `index.js:38822`                                              |
| 多个 action 的 keyTest 同时命中时，**全部放弃执行**并 `console.warn("Canceling as multiple actions match this shortcut")`      | `index.js:21027-21033`                                        |

**结论**：在 `window` 上注册 **capture** 监听器，两种情况都稳定先于 Excalidraw 执行；命中我们的键位时 `preventDefault()` + `stopPropagation()` 即可完全接管，也不会踩到 Excalidraw 的"多 action 冲突即静默失效"。

### 2. Excalidraw 0.18 已占用键位（权威清单）

来源：内置 `shortcutMap`（`dist/dev/index.js:13311`，即 Excalidraw 原生快捷键面板的数据源），已剔除本项目关掉的项（如 export）。

| 类别       | 键位                                                                                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 修饰键组合 | `Ctrl/Cmd` + `S` `Shift+S` `O` `Delete` `X` `C` `V` `A` `D` `[` `]` `Shift+[` `Shift+]` `G` `Shift+G` `'` `K` `Shift+L` `0` `-` `+` `F` `/` `Shift+P` `Shift+E`、`Ctrl/Cmd+Alt+C` `Ctrl/Cmd+Alt+V` |
| Alt 组合   | `Alt+Z` `Alt+S` `Alt+R` `Alt+/` `Alt+Shift+D` `Shift+Alt+C`、拖拽复制 `Alt+<drag>`                                                                                                                 |
| Shift 组合 | `Shift+1` `Shift+2` `Shift+3` `Shift+H` `Shift+V`                                                                                                                                                  |
| 单键       | 工具键（`V R D O A L P T 0-9 E H F Q` 等）、`?`、`Delete`、`Esc`                                                                                                                                   |

→ **`Ctrl/Cmd+B`、`Ctrl/Cmd+N`、`Ctrl/Cmd+Alt+N`、`Alt+N` 全部空闲**（全量 keyTest 中字母 `B`/`N` 零命中，只有 `G` 被 group/ungroup 占用）。

### 3. 官方扩展点 `registerAction` 及其局限

`ExcalidrawImperativeAPI.registerAction(action: Action)` 是公开 API（`dist/types/excalidraw/types.d.ts:735`），注册后与内置 action 一起参与同一个 `handleKeyDown` 分发。但实测其约束让它在本次需求上不划算：

| 局限                                                                                        | 影响                                                                                                                                                       |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Action.name` 是**封闭联合类型** `ActionName`（`dist/types/excalidraw/actions/types.d.ts`） | 自定义名字必须类型断言绕过，类型不安全                                                                                                                     |
| 只有**画布容器内**聚焦时才生效                                                              | 侧栏/设置弹窗聚焦时失效。典型反例：点击侧栏"收起"按钮后按钮获得焦点（Chromium 点击 button 会 focus），再按 `Ctrl+B` 无反应 —— 恰好砸中"侧栏开关"这个主场景 |
| 不进原生快捷键面板                                                                          | 面板读内置 `shortcutMap`，外部 action 无条目，`label` 还得自己编                                                                                           |
| 冲突时双方静默失效                                                                          | 只有 `console.warn`，用户无感知                                                                                                                            |

### 4. uTools 侧能力边界

- `utools-api-types` 中**没有** `registerShortcut` 之类 API（只有 `setFeature` / `removeFeature` / `getFeatures`）。
- 因此"全局快捷键"只能：uTools 里给某个 feature 手工绑热键 → 插件通过 `onPluginEnter` 收到 action。当前 `dist/plugin.json` 已声明 3 个 feature（`excalidraw`、`load-excalidraw-file`、`search-scenes`）。

## 方案设计

### 选型：自建 window 捕获监听 + 集中键位表（方案 A）

|                   | 方案 A：window capture 监听 | 方案 B：`excalidrawAPI.registerAction` |
| ----------------- | --------------------------- | -------------------------------------- |
| 侧栏聚焦时可用    | ✅                          | ❌（主场景不可用）                     |
| 类型安全          | ✅ 自定义类型               | ❌ 需断言封闭联合                      |
| 忽略输入/文本编辑 | 自己实现（约 8 行，可单测） | 复用 Excalidraw 内置                   |
| 冲突检测          | 集中键位表 + 单测           | 运行时 console.warn，静默失效          |
| 可单测性          | ✅ 纯函数                   | 需挂载整棵 Excalidraw                  |
| 未来加键位成本    | 改一张表                    | 每个 action 写一个对象                 |

**采用方案 A**；方案 B 作为将来"画布局部快捷键"（如导出当前画布）的备选记录在案。

### 模块划分（新增 `src/shortcuts/`）

```
src/shortcuts/
  keys.ts        # Hotkey 类型、isMac()、matchHotkey()、shouldIgnoreEvent()、格式化为展示文案
  registry.ts    # ShortcutId、DEFAULT_SHORTCUTS 键位表、EXCALIDRAW_RESERVED（已占用清单，供单测）
  useShortcuts.ts# React hook：window capture 监听 + ref 持有最新 handler
  keys.test.ts   # 匹配/忽略规则单测
  registry.test.ts # 键位表自检：两两不冲突、不与 Excalidraw 已占用清单冲突
```

### 键位表（一期）

| 动作 id       | Win/Linux    | macOS | 说明                                                                                          |
| ------------- | ------------ | ----- | --------------------------------------------------------------------------------------------- |
| `toggleAside` | `Ctrl+B`     | `⌘B`  | 与 Excalidraw 零冲突；B 语义直观（Bar/侧栏）                                                  |
| `addScene`    | `Ctrl+Alt+N` | `⌘⌥N` | 刻意**不用** `Ctrl/Cmd+N`：Electron/uTools 主窗口可能截获，且 Chromium 对 `Ctrl+N` 有默认行为 |

处理器实现要点：

- **主修饰键抽象**：mac 用 `metaKey`，其余用 `ctrlKey`；非主修饰键（mac 上的 ctrl / 其余平台的 meta）按下时直接判不匹配，避免误触。
- **键位匹配：`event.key` 优先，`event.code` 兜底**。理由：**修饰键会改写 `event.key`** —— macOS 上 `⌥N` 的 `event.key` 是 `"˜"`（波浪号死键）而不是 `"n"`，`Shift+1` 是 `"!"` 而不是 `"1"`。只比对 `event.key` 会让所有含 `⌥` / `Shift` 的组合失效（这正是首版实现的 bug，见"实施结果"）。`event.code` 表示物理按键、不受修饰键影响，因此对 `a-z` / `0-9` 用 `KeyX` / `DigitX` 兜底；CapsLock 由 `toLowerCase()` 归一。Excalidraw 内置的 `Shift+1/2/3` 同样用 `event.code`。
- **忽略规则**（`shouldIgnoreEvent`）：
  - `event.repeat` → 忽略（长按不连续开关/连建）
  - `event.isComposing || event.keyCode === 229` → 忽略（中文输入法组字中）
  - `target` 是 `input` / `textarea` / `select` / `contentEditable` → 默认忽略（对齐 Excalidraw 的 `isInputLike` 策略，见 D4）
- **接管方式**：命中即 `preventDefault()` + `stopPropagation()`（用 `stopPropagation` 而非 `stopImmediatePropagation`，保留其他 window 监听器可见性），随后执行动作并 `return`。
- **监听生命周期**：`useEffect(..., [])` 内注册/注销一次，handler 通过 `useRef` 每渲染同步，避免反复绑定；StrictMode 双执行由 cleanup 兜住。

### 动作实现：把 `handleAddScene` 提升到 App，按钮与快捷键共用

现状：新增画布逻辑在 `src/components/SceneList.tsx:98` 的 `handleAddScene` 里（本地函数），侧栏「+」按钮直接调用它；如果快捷键再写一份，就会出现两套逻辑漂移。

做法：

1. 在 `App.tsx` 内实现 `addScene()` / `toggleAside()`，通过 `AppContext` 暴露（`AppContext` 已是现成的注入通道）。
2. `SceneList` 的「+」按钮改调 context 上的 `addScene`（行为完全等价：`resetScene()` → `newAScene` → `scenes.set` → `handleSetActiveDraw({ scenesId: [...old, newId] })`）。
3. 侧栏折叠按钮的 `handleAsideControllerClick` 同样改为 context 上的 `toggleAside()`（翻转 `asideClosed`）。
4. `useShortcuts({ toggleAside, addScene })` 在 `App` 里接线。

顺带修掉一个既有小 bug：命名 `画布${scenesId.length}`（`SceneList.tsx:99`）在删除画布后会产生**重名**（例：画布0/1/2 删掉 1 → length 仍为 2 → 新建又叫"画布2"）。改为 `nextSceneName(scenes)`：从 0 起取最小未占用编号，放进 `src/utils/scene.ts` 并单测。

### 交互语义（一期，与现有按钮保持一致）

| 场景                                                       | 行为                                                                                           |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 侧栏展开时按 `Ctrl+B`                                      | 收起（`asideClosed: true`），与点折叠按钮一致                                                  |
| 侧栏收起时按 `Ctrl+B`                                      | 常驻展开（`asideClosed: false`），**不是** hover 那种临时展开（鼠标移开不消失）                |
| `asideCloseAutomatically` 开启时按 `Ctrl+B` 展开，再点画布 | 仍会按现有逻辑自动收起（保持既有语义；若体验不佳，二期加"本次抑制自动关闭"）                   |
| 侧栏收起状态下按 `Ctrl+Alt+N`                              | 新建画布并清空画布，但**不自动展开侧栏**（已确认 D2，避免打断绘画；画布被清空本身已是强反馈）  |
| 按 `Ctrl+Alt+N`（侧栏展开）                                | 清空当前画布并新建，等价于点「+」；`lastActiveDraw` 切到新画布                                 |
| 文本元素编辑中 / 输入法组字中 / 搜索框聚焦时               | 两个快捷键**都不响应**（已确认 D4：一期与 Excalidraw 的 `isInputLike` 策略保持一致，最可预期） |
| 长按                                                       | 不重复触发                                                                                     |
| 新建画布命名                                               | 取最小未占用编号（修掉现有重名 bug，已确认 D5）                                                |

### #34：新增画布按钮移至侧栏右上角（已确认纳入一期）

现状：「+」是场景列表底部的一整张 `aspect-video` 卡片（`SceneList.tsx:132-139`），滚动到底部才能点到。

改为：**侧栏顶部搜索行右侧的方形图标按钮**，与搜索框同一行、`sticky` 区域内常驻可见。

```
┌──────────────────────────────┐
│ [ 搜索画布…        ] [ + ]   │ ← sticky header（SideBar.tsx:44）
├──────────────────────────────┤
│  画布一                      │
│  画布二                      │
└──────────────────────────────┘
```

- `SideBar.tsx` 头部由单行 `Input` 改为 `flex items-center gap-2`，`Input` 加 `flex-1`，右侧放 `PlusIcon` 图标按钮（`title` 显示 `Ctrl+Alt+N`，由 `formatHotkey` 生成）。
- 移除 `SceneList.tsx` 底部的「+」卡片；`SceneList` 不再需要 `handleAddScene`，统一用 context 上的 `addScene`。
- 与右下角悬浮的折叠按钮（`-right-3 bottom-12`）位置不冲突。
- 若你希望底部卡片也保留，改动可逆（一行删除的反向操作）。

### UI 反馈与 i18n

- 侧栏折叠按钮、新增画布按钮加 `title` 提示当前键位（mac 显示 `⌘B`），由 `formatHotkey(hotkey)` 生成。
- `SettingDialog` 增加「快捷键」只读区块，列出两个动作及其键位（复用现有 `setting-item` 样式与 `SwitchBtn` 同款布局），文案走 `src/i18n.ts`（新增 `shortcuts`、`toggleAside`、`addScene` 等 key）。
- 一期不动设置数据结构（不加 `Store["settings"]` 字段）→ **无数据迁移、无兼容风险**。
- 二期自定义键位时才加 `settings.shortcuts: Partial<Record<ShortcutId, Hotkey>>`（`DefaultStore` 给默认值即可，`storeSetItem` 整体持久化，无需迁移脚本）。

## 实施步骤

> 每步可独立提交、独立验证。

**Step 1 — 快捷键基础设施（纯函数，无 UI 影响）**
新增 `src/shortcuts/keys.ts`、`registry.ts`、`useShortcuts.ts` 与两个测试文件。此步不接线，纯函数逻辑用临时 tsc+Node 断言脚本验证（见测试计划里的说明）。

**Step 2 — 动作提升与共用**
`App.tsx` 新增 `toggleAside` / `addScene` 并挂到 `AppContext`；`SideBar.tsx`、`SceneList.tsx` 改调 context；修 `nextSceneName`。
验证：`pnpm dev` 里点按钮，行为与改动前完全一致。

**Step 3 — 接线快捷键**
`App.tsx` 调用 `useShortcuts({ toggleAside, addScene })`。
验证：浏览器 dev + uTools 内实测（见测试计划）。

**Step 4 — #34：「+」按钮移到侧栏右上角**
按上文布局改造 `SideBar.tsx` 头部，移除 `SceneList.tsx` 底部卡片。
验证：侧栏滚动时按钮常驻；点击行为与快捷键完全一致（同一函数）。

**Step 5 — 可发现性与文档**
按钮 `title` 提示、`SettingDialog` 只读快捷键区块、`i18n.ts` 文案。
验证：`pnpm lint && pnpm type-check && pnpm build`（`pnpm test` 见下方说明）。

## 测试计划

> **vitest 现状（已恢复）**：commit `885a16a "Remove vitest"` 曾移除 vitest 依赖与 `setup-test.ts`，
> 但 `package.json` 的 `test`/`coverage` 脚本、`vite.config.ts` 的 `test` 块、`AGENTS.md` 与 2 个既有
> `*.test.ts` 都还留着。本次已把基础设施装回来：
>
> - `setup-test.ts` 从 `885a16a^` 原样还原（`fake-indexeddb` / `Path2D` shim）
> - 新增 devDeps：`vitest@^5.0.0`、`jsdom`、`fake-indexeddb@^5.0.2`、`path2d@^0.2.0`
>   —— **不能沿用当年的 `vitest@^1.5.0`**，它的 vite peer 是 `^5`，与现在的 vite 8 冲突；
>   vitest 5 的 peer 是 `vite ^6.4 || ^7 || ^8`
> - `vite.config.ts` 的 `test` 块补了 `server.deps.inline: ["@excalidraw/excalidraw"]`：
>   Excalidraw 产物里有 `roughjs/bin/rough` 这类省略扩展名的导入，打包器能解析、Node 原生 ESM 不能，
>   而 vitest 默认把 node_modules 的包外部化交给 Node，于是 2 个既有测试文件加载即失败
> - 仍然缺 `@vitest/coverage-v8`，所以 `pnpm coverage` 还跑不了（`pnpm test` 正常）
>
> 结果：`vitest run` **5 个文件 / 39 项全部通过**（1.7s）。

| 层级                         | 内容                                                                                                                                                                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 单元（vitest + jsdom）       | `matchHotkey`：mac/win 两套、多余修饰键不匹配、`shift` 精确匹配、大小写与 CapsLock、`repeat` 拒绝                                                                                                                                  |
| 单元                         | `shouldIgnoreEvent`：`input`/`textarea`/`select`/`contentEditable`/`isComposing`/`keyCode 229`                                                                                                                                     |
| 单元（回归护栏）             | `registry.test.ts` 遍历 `DEFAULT_SHORTCUTS` 两两断言不冲突；再断言与 `EXCALIDRAW_RESERVED`（从 `shortcutMap` 抄录的清单）不冲突。**将来升级 Excalidraw（#31 v0.18.1）时，这是唯一需要更新的地方**                                  |
| 单元                         | `nextSceneName`：重名场景下取最小空号                                                                                                                                                                                              |
| 手工冒烟（必须，无法自动化） | ① 画布聚焦时 `Ctrl+B` 收起/展开；② 侧栏搜索框聚焦时、侧栏按钮聚焦时、Excalidraw 文本编辑中、中文输入法组字中各按一次；③ `Ctrl+Alt+N` 新建后画布清空、侧栏列表新增一项；④ 长按不重复触发；⑤ 与 `Ctrl+G`（分组）等内置快捷键互不影响 |

不引入 `@testing-library/react` 等新依赖：hook 层逻辑薄，核心判定都在纯函数里。

## 风险与兼容性

| 风险                                 | 等级 | 缓解                                                                          |
| ------------------------------------ | ---- | ----------------------------------------------------------------------------- |
| 与 Excalidraw 内置键位撞车           | 中   | 键表 + 回归单测；升级 Excalidraw 时只改 `EXCALIDRAW_RESERVED` 一处            |
| Electron/uTools 截获 `Ctrl+Alt+N`    | 低   | 已避开 `Ctrl+N`；若实测被截获，键表改一行即可（备选 `Alt+N`、`Ctrl+Shift+N`） |
| 输入框内快捷键是否生效的预期分歧     | 低   | 见 D4，规则集中在 `shouldIgnoreEvent` 一处                                    |
| Chromium 108 兼容                    | 低   | 仅用 `keydown` / `metaKey` / `isComposing` 等古老 API，不碰新特性             |
| 侧栏收起状态下新建画布"没反应"的观感 | 低   | 见 D2（画布本身被清空是强反馈）                                               |
| 快捷键与 IME 冲突（中文用户为主）    | 中   | `isComposing` + `keyCode 229` 双保险，且冒烟测试覆盖                          |

## 已确认的决策

| id  | 问题                        | 结论                                                              |
| --- | --------------------------- | ----------------------------------------------------------------- |
| D1  | 作用范围                    | **只做应用内快捷键**（窗口聚焦时生效）。uTools 全局快捷键本期不做 |
| D2  | 侧栏收起时新建画布          | **不自动展开侧栏**，只新建（画布清空本身是强反馈）                |
| D3  | 一期是否含改键              | **只做只读展示**，不加 `settings` 字段，无数据迁移                |
| D4  | 输入/文本编辑中的快捷键     | **统一忽略**，与 Excalidraw 的 `isInputLike` 策略一致             |
| D5  | 命名重名 bug / #34 按钮位移 | **都做**：顺手修 `nextSceneName`；「+」按钮同批移到侧栏右上角     |
| D6  | 键位                        | `Ctrl/Cmd+B`（侧栏）、`Ctrl/Cmd+Alt+N`（新增画布），确认采用      |

## 关键文件

- 新增：`src/shortcuts/keys.ts`、`src/shortcuts/registry.ts`、`src/shortcuts/useShortcuts.ts`、`src/shortcuts/keys.test.ts`、`src/shortcuts/registry.test.ts`、`src/utils/scene.test.ts`
- 修改：`src/App.tsx`（动作提升 + 接线）、`src/components/SideBar.tsx`（头部「+」按钮、折叠按钮改调 `toggleAside`）、`src/components/SceneList.tsx`（移除底部卡片）、`src/utils/scene.ts`（`nextSceneName`）、`src/components/SettingDialog.tsx`（只读快捷键区块）、`src/i18n.ts`
- 参考（本期不改）：`src/event.ts`（现有 EventChanel，未采用）、`dist/plugin.json`（D1 已确认不做全局快捷键）

## 实施结果

Step 1–5 已全部落地：

| 步骤                  | 状态 | 说明                                                                 |
| --------------------- | ---- | -------------------------------------------------------------------- |
| 1 快捷键基础设施      | ✅   | `keys.ts` / `registry.ts` / `useShortcuts.ts` + 2 个测试文件         |
| 2 动作提升 + 命名修复 | ✅   | `AppContext` 新增 `addScene` / `toggleAside`；`nextSceneName` 修重名 |
| 3 接线快捷键          | ✅   | `useShortcuts({ toggleAside, addScene })`                            |
| 4 #34 按钮位移        | ✅   | 「+」移到侧栏顶部搜索行右侧，移除列表底部卡片                        |
| 5 可发现性            | ✅   | 两个按钮 `title` 显示键位；设置页只读「快捷键」区块；i18n 文案       |

验证结果：

| 检查                          | 结果                                                                   |
| ----------------------------- | ---------------------------------------------------------------------- |
| `vitest run`                  | ✅ **5 个文件 / 39 项全部通过**（1.7s，含 2 个既有测试文件）           |
| `vite build`                  | ✅ 成功（仅有既有的 chunk 体积告警）                                   |
| `eslint src/**/*.{js,ts,tsx}` | ✅ 与改动前**完全一致**（4 error / 4 warning，全部是既有问题，无新增） |
| `tsc -p tsconfig.app.json`    | ✅ 与改动前**完全一致**（5 个既有错误，全在未改动的文件里）            |

### 实现后修正：macOS `⌘⌥N` 无效

用户实测反馈"mac 上按 `⌘⌥N` 无反应"，定位为首版 `matchHotkey` 只比对 `event.key` 的缺陷：

- macOS 的 `⌥N` 是**波浪号死键**，`event.key` 是 `"˜"` 而不是 `"n"` → 与 `{ key: "n" }` 比对必然失败；`⌘B` 不含 `⌥`，所以正常 —— 与"只有新增画布失效"的现象完全吻合。
- 影响面不止这一处：任何含 `⌥` 或 `Shift` 的字母/数字组合都会失效（`Shift+1` 的 `event.key` 是 `"!"`）。
- 修法：`event.key` 优先，`KeyX` / `DigitX` 形态的 `event.code` 兜底（见"处理器实现要点"）。
- 回归覆盖：`keys.test.ts` 新增 4 项（`⌘⌥N` 命中、物理键不符不命中、`Shift+1` → `"!"` 命中、非字母数字不做兜底），`registry.test.ts` 新增 1 项端到端解析。

### 追加改动：新建画布后侧栏滚动到新条目

`addScene` 把新画布追加到 `scenesId` 末尾，列表长时新条目在视口外，看起来像"没反应"。原实现只在挂载时滚动一次（`useEffect(..., [])`），改为跟随 `lastActiveDraw` 变化：

- 抽出 `scrollSceneIntoView(sceneId)` 到 `src/utils/scene.ts`（可测的纯副作用函数），`SceneList` 在 `lastActiveDraw` 变化时调用。
- 用 **`block: "nearest"`** 而不是默认的 `"start"`：侧栏顶部搜索栏是 `sticky` 的，`"start"` 会把条目顶到搜索栏底下；`"nearest"` 只在必要时滚动，切换已可见的画布时不会产生位移抖动。
- 顺带修掉 `SceneList` 那条既有的 `react-hooks/exhaustive-deps` 警告（去掉了空依赖数组）→ eslint 从 4 error / 4 warning 降为 **4 error / 3 warning**。
- 覆盖：`scene.test.ts` 新增 2 项（传参为 `{ block: "nearest" }`、id 为空/元素不存在时不报错，jsdom 无 `scrollIntoView` 实现，测试里打桩）。

遗留（需要单独决策 / 手工验证）：

1. **`pnpm coverage` 仍不可用**：缺 `@vitest/coverage-v8`（当年也没装）；`pnpm test` 正常。
2. **uTools 内手工冒烟**（无法自动化）：画布聚焦 / 侧栏搜索框聚焦 / 文本编辑中 / 输入法组字 / 长按这 5 种状态下各按一次 `Ctrl+B` 与 `Ctrl+Alt+N`，并确认与 `Ctrl+G` 等内置快捷键互不影响；另外确认新建画布后侧栏确实滚到了新条目（且没被搜索栏遮住）。
3. **相邻问题（未修，保持行为等价）**：新增画布后 Excalidraw 的 `name` 仍是上一个画布名 —— `handleSetActiveDraw` 只在传入 `payload.scene?.name` 时才 `setName`。要修的话在 `addScene` 里传 `scene: newScene` 即可（一行），但会改变现有按钮行为，故本期未动。
4. **侧栏收起 + 画布为空时新建画布无可见反馈**（D2 的直接后果）：可选加 `excalidrawAPI.setToast({ message: "已新建画布" })`，不违反 D2。
5. **搜索框有内容且不匹配新画布名时**：新条目被过滤掉、不在 DOM 里，因此滚动无从谈起（`scrollSceneIntoView` 静默 no-op）。要让两种入口行为一致地清空搜索，需要把 `sceneSearch` 状态从 `SideBar` 提到 `AppContext`（小重构），尚未实施。
