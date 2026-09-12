import { describe, expect, it } from "vitest";
import { newAScene, nextSceneName, scrollSceneIntoView } from "./scene";

const scenesOf = (...names: string[]) =>
  new Map(names.map((name, idx) => [`id-${idx}`, newAScene({ name })]));

describe("nextSceneName", () => {
  it("首个新增画布沿用「画布1」，与旧实现一致", () => {
    expect(nextSceneName(scenesOf("画布一"))).toBe("画布1");
  });

  it("编号递增", () => {
    expect(nextSceneName(scenesOf("画布一", "画布1", "画布2"))).toBe("画布3");
  });

  it("回归：删除中间画布后不重名", () => {
    // 旧实现 画布${length} 在删掉 画布1 后仍返回 画布2，与现存画布重名
    expect(nextSceneName(scenesOf("画布1", "画布2"))).toBe("画布3");
    // 编号有空洞时优先补空洞
    expect(nextSceneName(scenesOf("画布1", "画布3"))).toBe("画布2");
  });

  it("空集合从 画布1 开始", () => {
    expect(nextSceneName(new Map())).toBe("画布1");
  });

  it("忽略非「画布N」命名的画布", () => {
    expect(nextSceneName(scenesOf("我的图", "画布1"))).toBe("画布2");
  });
});

describe("scrollSceneIntoView", () => {
  const withStub = (id: string, fn: (calls: unknown[]) => void) => {
    const el = document.createElement("div");
    el.id = id;
    document.body.appendChild(el);
    const calls: unknown[] = [];
    // jsdom 没有实现 scrollIntoView，这里打桩记录调用参数
    el.scrollIntoView = (options?: boolean | ScrollIntoViewOptions) => {
      calls.push(options);
    };
    try {
      fn(calls);
    } finally {
      el.remove();
    }
  };

  it("滚动到指定画布，并用 block: nearest 避免被 sticky 搜索栏遮住", () => {
    withStub("scene-1", (calls) => {
      scrollSceneIntoView("scene-1");
      expect(calls).toStrictEqual([{ block: "nearest" }]);
    });
  });

  it("id 为空或元素不存在时不报错", () => {
    expect(() => scrollSceneIntoView(null)).not.toThrow();
    expect(() => scrollSceneIntoView(undefined)).not.toThrow();
    expect(() => scrollSceneIntoView("")).not.toThrow();
    expect(() => scrollSceneIntoView("not-exist")).not.toThrow();
  });
});
