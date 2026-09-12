/**
 * 快捷键基础判定（纯函数，便于单测）。
 *
 * - 键位表见 ./registry.ts
 * - 事件注册见 ./useShortcuts.ts
 *
 * 为什么不用 Excalidraw 的 `registerAction`：它只在画布容器聚焦时生效，
 * 点一下侧栏按钮后焦点就跑到按钮上，快捷键会失效（详见设计文档）。
 */

export type Hotkey = {
  /** 按键，单个字符，大小写不敏感 */
  key: string;
  /** 主修饰键：macOS 上是 ⌘，其他平台是 Ctrl */
  mod?: boolean;
  alt?: boolean;
  shift?: boolean;
};

const MAC_PLATFORM = /mac|iphone|ipad|ipod/i;

/** 运行平台是否为 macOS（uTools 跨平台，展示与修饰键映射都要用） */
export const isMac = (): boolean =>
  typeof navigator !== "undefined" &&
  (MAC_PLATFORM.test(navigator.platform ?? "") ||
    MAC_PLATFORM.test(navigator.userAgent ?? ""));

/**
 * 是否处于可编辑元素内（输入框 / 文本域 / 下拉框 / contentEditable）。
 * 与 Excalidraw 自身的 `isInputLike` 策略保持一致：编辑状态下不响应快捷键。
 * 这里用鸭子类型判断而非 `instanceof HTMLElement`，以便同一份判定能跨 realm 复用。
 */
export const isEditableTarget = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null;
  if (!el || typeof el !== "object") {
    return false;
  }
  if (el.isContentEditable) {
    return true;
  }
  const tag = el.tagName?.toUpperCase();
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
};

/**
 * 事件级忽略规则（与具体键位无关）：
 * 长按重复、输入法组字中、焦点在可编辑元素内。
 */
export const shouldIgnoreEvent = (event: KeyboardEvent): boolean =>
  event.repeat ||
  event.isComposing ||
  event.keyCode === 229 ||
  isEditableTarget(event.target);

/**
 * 由按键字符推导物理键 `event.code`：`a` → `KeyA`，`1` → `Digit1`。
 *
 * 为什么需要它：**修饰键会改写 `event.key`**。
 * - macOS 上按住 Option，`⌥N` 的 `event.key` 是 `"˜"`（波浪号死键）而不是 `"n"`；
 * - `Shift+1` 的 `event.key` 是 `"!"` 而不是 `"1"`。
 *
 * 只比对 `event.key` 会让所有含 ⌥ / Shift 的组合失效。`event.code` 表示物理按键，
 * 不受修饰键影响，因此作为兜底。（Excalidraw 内置的 Shift+1/2/3 快捷键同样用 `event.code`。）
 */
const codeOfKey = (key: string): string | null => {
  if (/^[a-z]$/i.test(key)) {
    return `Key${key.toUpperCase()}`;
  }
  if (/^[0-9]$/.test(key)) {
    return `Digit${key}`;
  }
  return null;
};

/** 键盘事件是否命中给定键位 */
export const matchHotkey = (
  event: KeyboardEvent,
  hotkey: Hotkey,
  mac: boolean = isMac(),
): boolean => {
  const mod = !!(mac ? event.metaKey : event.ctrlKey);
  const otherMod = !!(mac ? event.ctrlKey : event.metaKey);

  if (!!hotkey.mod !== mod) {
    return false;
  }
  // 非主修饰键按下时不匹配，避免 Ctrl+⌘+B 这类意外组合误触
  if (otherMod) {
    return false;
  }
  if (!!hotkey.alt !== !!event.altKey) {
    return false;
  }
  if (!!hotkey.shift !== !!event.shiftKey) {
    return false;
  }

  if ((event.key ?? "").toLowerCase() === hotkey.key.toLowerCase()) {
    return true;
  }

  // 兜底：修饰键改写了 event.key 时，按物理键比对
  const code = codeOfKey(hotkey.key);
  return code !== null && event.code === code;
};

/** 两个键位是否为同一组合（键位冲突自检用） */
export const isSameHotkey = (a: Hotkey, b: Hotkey): boolean =>
  a.key.toLowerCase() === b.key.toLowerCase() &&
  !!a.mod === !!b.mod &&
  !!a.alt === !!b.alt &&
  !!a.shift === !!b.shift;

/** 生成展示文案：mac 用 ⌘⌥⇧ 符号，其他平台用 Ctrl/Alt/Shift */
export const formatHotkey = (
  hotkey: Hotkey,
  mac: boolean = isMac(),
): string => {
  const parts: string[] = [];
  if (mac) {
    if (hotkey.mod) parts.push("⌘");
    if (hotkey.alt) parts.push("⌥");
    if (hotkey.shift) parts.push("⇧");
    parts.push(hotkey.key.toUpperCase());
    return parts.join("");
  }
  if (hotkey.mod) parts.push("Ctrl");
  if (hotkey.alt) parts.push("Alt");
  if (hotkey.shift) parts.push("Shift");
  parts.push(hotkey.key.toUpperCase());
  return parts.join("+");
};
