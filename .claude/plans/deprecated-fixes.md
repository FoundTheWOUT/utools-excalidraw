# Deprecated Usage Fix Plan

Tracking deprecated APIs and dependencies in utools-excalidraw for future cleanup.

## 1. @heroicons/react v1 (Medium)

- **Status**: Pending
- **Package**: `@heroicons/react` ^1.0.6 — v1 deprecated, v2 available
- **Migration**: import paths change from `@heroicons/react/outline` → `@heroicons/react/24/outline`, `@heroicons/react/solid` → `@heroicons/react/24/solid`. Some icons renamed (e.g. `ArrowsExpandIcon` → `ArrowsPointingOutIcon`).
- **Files**:
  - `src/App.tsx` — `FolderIcon, CogIcon, TrashIcon` from `/outline`
  - `src/components/SideBar.tsx` — `ChevronLeftIcon, ChevronRightIcon` from `/solid`
  - `src/components/SceneList.tsx` — `PlusIcon` from `/solid`
  - `src/components/SceneItem.tsx` — `XIcon` from `/solid`, `ArrowsExpandIcon` from `/outline` (renamed in v2)
  - `src/components/SettingDialog.tsx` — `SunIcon, MoonIcon, SparklesIcon` from `/outline`
  - `src/ui/Dialog.tsx` — `XCircleIcon` from `/outline`



## 2. ::-webkit-scrollbar (Low)

- **Status**: Pending
- **Issue**: Non-standard CSS pseudo-element, Chromium/WebKit only
- **Replacement**: Standard `scrollbar-width` + `scrollbar-color` (Firefox + Chromium 121+)
- **Files**:
  - `src/index.css` — lines 57-69
