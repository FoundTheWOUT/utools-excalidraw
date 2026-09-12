import { describe, expect, it } from "vitest";
import {
  formatHotkey,
  isEditableTarget,
  isSameHotkey,
  matchHotkey,
  shouldIgnoreEvent,
} from "./keys";
import type { Hotkey } from "./keys";

/**
 * jsdom 的 KeyboardEvent 对 repeat / isComposing / target 支持不一，
 * 这里统一用 defineProperty 强制写入，保证判定逻辑被真实覆盖。
 */
const keyboardEvent = (
  init: KeyboardEventInit & { composing?: boolean; repeat?: boolean } = {},
  target?: EventTarget,
) => {
  const { composing, repeat, ...rest } = init;
  const event = new KeyboardEvent("keydown", rest);
  if (composing !== undefined) {
    Object.defineProperty(event, "isComposing", { value: composing });
  }
  if (repeat !== undefined) {
    Object.defineProperty(event, "repeat", { value: repeat });
  }
  if (target) {
    Object.defineProperty(event, "target", { value: target });
  }
  return event;
};

const modB: Hotkey = { key: "b", mod: true };
const modAltN: Hotkey = { key: "n", mod: true, alt: true };

describe("matchHotkey", () => {
  it("windows / linux 用 ctrl 作为主修饰键", () => {
    expect(
      matchHotkey(keyboardEvent({ key: "b", ctrlKey: true }), modB, false),
    ).toBe(true);
    expect(
      matchHotkey(keyboardEvent({ key: "b", metaKey: true }), modB, false),
    ).toBe(false);
  });

  it("mac 用 ⌘ 作为主修饰键", () => {
    expect(
      matchHotkey(keyboardEvent({ key: "b", metaKey: true }), modB, true),
    ).toBe(true);
    expect(
      matchHotkey(keyboardEvent({ key: "b", ctrlKey: true }), modB, true),
    ).toBe(false);
  });

  it("大小写不敏感（CapsLock 大写）", () => {
    expect(
      matchHotkey(keyboardEvent({ key: "B", ctrlKey: true }), modB, false),
    ).toBe(true);
  });

  it("多按修饰键不匹配", () => {
    expect(
      matchHotkey(
        keyboardEvent({ key: "b", ctrlKey: true, altKey: true }),
        modB,
        false,
      ),
    ).toBe(false);
    expect(
      matchHotkey(
        keyboardEvent({ key: "b", ctrlKey: true, shiftKey: true }),
        modB,
        false,
      ),
    ).toBe(false);
    // mac 上同时按下 ctrl 与 ⌘
    expect(
      matchHotkey(
        keyboardEvent({ key: "b", metaKey: true, ctrlKey: true }),
        modB,
        true,
      ),
    ).toBe(false);
  });

  it("mod+alt+n 精确匹配", () => {
    expect(
      matchHotkey(
        keyboardEvent({ key: "n", ctrlKey: true, altKey: true }),
        modAltN,
        false,
      ),
    ).toBe(true);
    expect(
      matchHotkey(keyboardEvent({ key: "n", ctrlKey: true }), modAltN, false),
    ).toBe(false);
    expect(
      matchHotkey(keyboardEvent({ key: "n", altKey: true }), modAltN, false),
    ).toBe(false);
  });

  it("shift 必须精确匹配", () => {
    expect(
      matchHotkey(
        keyboardEvent({ key: "b", ctrlKey: true, shiftKey: true }),
        modB,
        false,
      ),
    ).toBe(false);
    expect(
      matchHotkey(
        keyboardEvent({ key: "b", ctrlKey: true }),
        { key: "b", mod: true, shift: true },
        false,
      ),
    ).toBe(false);
  });

  // 回归：macOS 上按住 Option 会改写 event.key（⌥N 得到 "˜"）
  describe("修饰键改写 event.key 时用 event.code 兜底", () => {
    it("mac 上 ⌘⌥N 仍能命中", () => {
      expect(
        matchHotkey(
          keyboardEvent({
            key: "˜",
            code: "KeyN",
            metaKey: true,
            altKey: true,
          }),
          modAltN,
          true,
        ),
      ).toBe(true);
    });

    it("物理键不同则不命中", () => {
      expect(
        matchHotkey(
          keyboardEvent({
            key: "˜",
            code: "KeyM",
            metaKey: true,
            altKey: true,
          }),
          modAltN,
          true,
        ),
      ).toBe(false);
    });

    it('Shift+1 得到 "!" 时仍能命中 Digit1', () => {
      expect(
        matchHotkey(
          keyboardEvent({
            key: "!",
            code: "Digit1",
            ctrlKey: true,
            shiftKey: true,
          }),
          { key: "1", mod: true, shift: true },
          false,
        ),
      ).toBe(true);
    });

    it("非字母数字键不做 code 兜底", () => {
      expect(
        matchHotkey(
          keyboardEvent({ key: "˜", code: "Slash", ctrlKey: true }),
          { key: "/", mod: true },
          false,
        ),
      ).toBe(false);
    });
  });
});

describe("shouldIgnoreEvent", () => {
  it("长按 repeat 不重复触发", () => {
    expect(
      shouldIgnoreEvent(
        keyboardEvent({ key: "b", ctrlKey: true, repeat: true }),
      ),
    ).toBe(true);
    expect(shouldIgnoreEvent(keyboardEvent({ key: "b", ctrlKey: true }))).toBe(
      false,
    );
  });

  it("输入法组字中忽略", () => {
    expect(
      shouldIgnoreEvent(keyboardEvent({ key: "b", composing: true })),
    ).toBe(true);
    const legacy = keyboardEvent({ key: "b" });
    Object.defineProperty(legacy, "keyCode", { value: 229 });
    expect(shouldIgnoreEvent(legacy)).toBe(true);
  });

  it("可编辑元素内忽略", () => {
    for (const tag of ["input", "textarea", "select"]) {
      expect(isEditableTarget(document.createElement(tag))).toBe(true);
    }
    const editable = document.createElement("div");
    Object.defineProperty(editable, "isContentEditable", { value: true });
    expect(isEditableTarget(editable)).toBe(true);
  });

  it("普通元素 / 非元素 target 不忽略", () => {
    expect(isEditableTarget(document.createElement("div"))).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
    expect(isEditableTarget(new EventTarget())).toBe(false);
    expect(
      shouldIgnoreEvent(
        keyboardEvent(
          { key: "b", ctrlKey: true },
          document.createElement("div"),
        ),
      ),
    ).toBe(false);
  });

  it("输入框内的事件被忽略", () => {
    expect(
      shouldIgnoreEvent(
        keyboardEvent(
          { key: "b", ctrlKey: true },
          document.createElement("input"),
        ),
      ),
    ).toBe(true);
  });
});

describe("isSameHotkey", () => {
  it("忽略大小写与缺省布尔值", () => {
    expect(isSameHotkey({ key: "b", mod: true }, { key: "B", mod: true })).toBe(
      true,
    );
    expect(isSameHotkey({ key: "b" }, { key: "b", shift: false })).toBe(true);
  });

  it("修饰键不同则不是同一组合", () => {
    expect(isSameHotkey({ key: "b", mod: true }, { key: "b" })).toBe(false);
    expect(
      isSameHotkey({ key: "n", mod: true }, { key: "n", mod: true, alt: true }),
    ).toBe(false);
  });
});

describe("formatHotkey", () => {
  it("mac 使用符号", () => {
    expect(formatHotkey(modB, true)).toBe("⌘B");
    expect(formatHotkey(modAltN, true)).toBe("⌘⌥N");
  });

  it("其他平台使用 Ctrl/Alt 文案", () => {
    expect(formatHotkey(modB, false)).toBe("Ctrl+B");
    expect(formatHotkey(modAltN, false)).toBe("Ctrl+Alt+N");
    expect(formatHotkey({ key: "h", alt: true, shift: true }, false)).toBe(
      "Alt+Shift+H",
    );
  });
});
