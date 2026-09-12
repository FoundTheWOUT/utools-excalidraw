import { isMac, matchHotkey, shouldIgnoreEvent } from "./keys";
import type { Hotkey } from "./keys";

export type ShortcutId = "toggleAside" | "addScene";

export type ShortcutDef = {
  id: ShortcutId;
  hotkey: Hotkey;
  /** i18n key，用于设置页展示 */
  labelKey: string;
};

/**
 * 一期键位表：新增快捷键只改这里。
 * `registry.test.ts` 会自检两两不冲突、且不与 Excalidraw 内置键位冲突。
 */
export const DEFAULT_SHORTCUTS: Record<ShortcutId, ShortcutDef> = {
  toggleAside: {
    id: "toggleAside",
    hotkey: { key: "b", mod: true },
    labelKey: "shortcuts.toggleAside",
  },
  addScene: {
    id: "addScene",
    // 刻意不用 Ctrl/Cmd+N：Electron/uTools 主窗口可能截获，浏览器也有默认行为
    hotkey: { key: "n", mod: true, alt: true },
    labelKey: "shortcuts.addScene",
  },
};

export const SHORTCUT_IDS = Object.keys(DEFAULT_SHORTCUTS) as ShortcutId[];

/**
 * Excalidraw 0.18 已占用的键位（含 mac / win 两套变体）。
 *
 * 来源：`@excalidraw/excalidraw` 内置的 `shortcutMap`（同时是原生快捷键面板的数据源）
 * 以及各 action 的 `keyTest`。**升级 Excalidraw 时只需要更新这张表。**
 *
 * 注意：单键（工具键）条目对当前这些带修饰键的快捷键不构成实际冲突，
 * 保留在这里是为了把"Excalidraw 占用了什么"完整记录下来。
 */
export const EXCALIDRAW_RESERVED: Hotkey[] = [
  // Ctrl/Cmd 组合
  { key: "s", mod: true }, // 保存
  { key: "s", mod: true, shift: true }, // 另存为
  { key: "o", mod: true }, // 打开
  { key: "delete", mod: true }, // 清空画布
  { key: "e", mod: true, shift: true }, // 导出图片
  { key: "x", mod: true }, // 剪切
  { key: "c", mod: true }, // 复制
  { key: "v", mod: true }, // 粘贴
  { key: "a", mod: true }, // 全选
  { key: "d", mod: true }, // 复制选中元素
  { key: "[", mod: true }, // 下移一层
  { key: "]", mod: true }, // 上移一层
  { key: "[", mod: true, shift: true }, // 置底（win）
  { key: "]", mod: true, shift: true }, // 置顶（win）
  { key: "[", mod: true, alt: true }, // 置底（mac）
  { key: "]", mod: true, alt: true }, // 置顶（mac）
  { key: "g", mod: true }, // 分组
  { key: "g", mod: true, shift: true }, // 取消分组
  { key: "'", mod: true }, // 网格
  { key: "k", mod: true }, // 超链接
  { key: "l", mod: true, shift: true }, // 锁定/解锁
  { key: "0", mod: true }, // 重置缩放
  { key: "-", mod: true }, // 缩小
  { key: "+", mod: true }, // 放大
  { key: "f", mod: true }, // 搜索菜单
  { key: "/", mod: true }, // 命令面板
  { key: "p", mod: true, shift: true }, // 命令面板
  { key: "c", mod: true, alt: true }, // 复制样式
  { key: "v", mod: true, alt: true }, // 粘贴样式
  { key: ",", mod: true, shift: true }, // 缩小字号
  { key: "<", mod: true, shift: true },
  { key: ".", mod: true, shift: true }, // 放大字号
  { key: ">", mod: true, shift: true },
  { key: "arrowup", mod: true, shift: true }, // 顶对齐
  { key: "arrowdown", mod: true, shift: true }, // 底对齐
  { key: "arrowleft", mod: true, shift: true }, // 左对齐
  { key: "arrowright", mod: true, shift: true }, // 右对齐
  // Alt 组合
  { key: "z", alt: true }, // 禅模式
  { key: "s", alt: true }, // 对象吸附
  { key: "r", alt: true }, // 视图模式
  { key: "/", alt: true }, // 统计
  { key: "d", alt: true, shift: true }, // 切换主题
  { key: "c", alt: true, shift: true }, // 复制为 PNG
  // Shift 组合
  { key: "1", shift: true }, // 适应画布
  { key: "2", shift: true }, // 适应选中（视口）
  { key: "3", shift: true }, // 适应选中
  { key: "h", shift: true }, // 水平翻转
  { key: "v", shift: true }, // 垂直翻转
  // 单键：工具键 / 帮助 / 删除
  { key: "v" }, // 选择
  { key: "r" }, // 矩形
  { key: "d" }, // 菱形
  { key: "o" }, // 椭圆
  { key: "a" }, // 箭头
  { key: "l" }, // 直线
  { key: "p" }, // 画笔
  { key: "t" }, // 文本
  { key: "e" }, // 橡皮
  { key: "h" }, // 抓手
  { key: "f" }, // 框架
  { key: "q" }, // 工具锁定
  { key: "0" },
  { key: "1" },
  { key: "2" },
  { key: "3" },
  { key: "4" },
  { key: "5" },
  { key: "6" },
  { key: "7" },
  { key: "8" },
  { key: "9" },
  { key: "?" }, // 快捷键面板
  { key: "delete" },
  { key: "escape" },
];

/** 解析键盘事件命中的快捷键 id；未命中或应忽略时返回 null */
export const resolveShortcut = (
  event: KeyboardEvent,
  mac: boolean = isMac(),
): ShortcutId | null => {
  if (shouldIgnoreEvent(event)) {
    return null;
  }
  for (const id of SHORTCUT_IDS) {
    if (matchHotkey(event, DEFAULT_SHORTCUTS[id].hotkey, mac)) {
      return id;
    }
  }
  return null;
};
