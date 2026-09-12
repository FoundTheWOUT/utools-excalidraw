import { useEffect, useRef } from "react";
import { resolveShortcut } from "./registry";
import type { ShortcutId } from "./registry";

export type ShortcutHandlers = Partial<Record<ShortcutId, () => void>>;

/**
 * 在 window 的**捕获阶段**监听快捷键。
 *
 * Excalidraw 的快捷键分发走冒泡（默认挂在画布容器 div，开启 handleKeyboardGlobally 时
 * 挂 document），因此捕获阶段一定先执行；命中后 preventDefault + stopPropagation
 * 即可完全接管，且不会踩到 Excalidraw "多个 action 同时命中则全部放弃" 的逻辑。
 *
 * handler 通过 ref 每渲染同步，监听器只注册一次，避免反复解绑/绑定。
 */
export function useShortcuts(handlers: ShortcutHandlers) {
  const handlersRef = useRef<ShortcutHandlers>({});

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const id = resolveShortcut(event);
      if (!id) {
        return;
      }
      const handler = handlersRef.current[id];
      if (!handler) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      handler();
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true });
    };
  }, []);
}
