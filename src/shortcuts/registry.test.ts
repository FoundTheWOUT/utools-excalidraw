import { describe, expect, it } from "vitest";
import { isSameHotkey } from "./keys";
import {
  DEFAULT_SHORTCUTS,
  EXCALIDRAW_RESERVED,
  resolveShortcut,
  SHORTCUT_IDS,
} from "./registry";

const keyboardEvent = (
  init: KeyboardEventInit & { repeat?: boolean },
  target?: EventTarget,
) => {
  const { repeat, ...rest } = init;
  const event = new KeyboardEvent("keydown", rest);
  if (repeat !== undefined) {
    Object.defineProperty(event, "repeat", { value: repeat });
  }
  if (target) {
    Object.defineProperty(event, "target", { value: target });
  }
  return event;
};

describe("默认键位表自检", () => {
  it("动作定义完整", () => {
    for (const id of SHORTCUT_IDS) {
      expect(DEFAULT_SHORTCUTS[id].id).toBe(id);
      expect(DEFAULT_SHORTCUTS[id].labelKey).toBeTruthy();
      expect(DEFAULT_SHORTCUTS[id].hotkey.key).toBeTruthy();
    }
  });

  it("快捷键之间互不冲突", () => {
    for (let i = 0; i < SHORTCUT_IDS.length; i += 1) {
      for (let j = i + 1; j < SHORTCUT_IDS.length; j += 1) {
        const a = DEFAULT_SHORTCUTS[SHORTCUT_IDS[i]];
        const b = DEFAULT_SHORTCUTS[SHORTCUT_IDS[j]];
        expect(
          isSameHotkey(a.hotkey, b.hotkey),
          `${a.id} 与 ${b.id} 键位重复`,
        ).toBe(false);
      }
    }
  });

  // 升级 Excalidraw 时更新 EXCALIDRAW_RESERVED 即可，这里是唯一的回归护栏
  it("不与 Excalidraw 内置键位冲突", () => {
    for (const id of SHORTCUT_IDS) {
      const hotkey = DEFAULT_SHORTCUTS[id].hotkey;
      const conflicts = EXCALIDRAW_RESERVED.filter((reserved) =>
        isSameHotkey(reserved, hotkey),
      );
      expect(
        conflicts,
        `${id} 与 Excalidraw 内置键位冲突：${JSON.stringify(conflicts)}`,
      ).toStrictEqual([]);
    }
  });

  it("已占用清单本身有内容且包含已知键位（防止清单被清空）", () => {
    expect(EXCALIDRAW_RESERVED.length).toBeGreaterThan(20);
    expect(
      EXCALIDRAW_RESERVED.some((hotkey) =>
        isSameHotkey(hotkey, { key: "s", mod: true }),
      ),
    ).toBe(true);
    expect(
      EXCALIDRAW_RESERVED.some((hotkey) =>
        isSameHotkey(hotkey, { key: "g", mod: true, shift: true }),
      ),
    ).toBe(true);
  });
});

describe("resolveShortcut", () => {
  it("命中已注册键位", () => {
    expect(
      resolveShortcut(keyboardEvent({ key: "b", ctrlKey: true }), false),
    ).toBe("toggleAside");
    expect(
      resolveShortcut(
        keyboardEvent({ key: "n", ctrlKey: true, altKey: true }),
        false,
      ),
    ).toBe("addScene");
  });

  it("未注册组合返回 null", () => {
    expect(
      resolveShortcut(keyboardEvent({ key: "k", ctrlKey: true }), false),
    ).toBeNull();
    expect(
      resolveShortcut(
        keyboardEvent({ key: "b", ctrlKey: true, shiftKey: true }),
        false,
      ),
    ).toBeNull();
    expect(
      resolveShortcut(keyboardEvent({ key: "b", altKey: true }), false),
    ).toBeNull();
  });

  it("输入框内不命中", () => {
    expect(
      resolveShortcut(
        keyboardEvent(
          { key: "b", ctrlKey: true },
          document.createElement("input"),
        ),
        false,
      ),
    ).toBeNull();
  });

  it("长按不命中", () => {
    expect(
      resolveShortcut(
        keyboardEvent({ key: "b", ctrlKey: true, repeat: true }),
        false,
      ),
    ).toBeNull();
  });

  // 回归：macOS 上 ⌥N 的 event.key 是 "˜"，必须靠 event.code 才能命中
  it("mac 上 Option 改写 event.key 后仍能命中 addScene", () => {
    expect(
      resolveShortcut(
        keyboardEvent({
          key: "˜",
          code: "KeyN",
          metaKey: true,
          altKey: true,
        }),
        true,
      ),
    ).toBe("addScene");
  });
});
