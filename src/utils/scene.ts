import { nanoid } from "nanoid";
import type { Scene } from "@/types";

export const six_nanoid = () => nanoid(6);

export const newAScene = ({
  id,
  ...rest
}: Partial<Scene> & { name: string }): Scene => {
  return {
    id: id ? id : six_nanoid(),
    sticky: rest.sticky ?? false,
    deleted: rest.deleted ?? false,
    deletedAt: rest.deletedAt ?? null,
    name: rest.name,
    data: rest.data,
  };
};

const SCENE_NAME_PREFIX = "画布";

/**
 * 生成不与现有画布重名的新画布名。
 *
 * 旧实现用 `画布${scenesId.length}`，删除画布后会重名
 * （例：画布1/画布2 删掉 画布1 后 length 仍为 2，新建又叫「画布2」）。
 * 这里从 1 开始取最小未被占用的编号；首位画布默认叫「画布一」，
 * 因此首个新增画布仍然是「画布1」，与旧行为一致。
 */
export const nextSceneName = (scenes: Map<string, Scene>): string => {
  const used = new Set<string>();
  scenes.forEach((scene) => {
    if (scene.name) {
      used.add(scene.name);
    }
  });

  let index = 1;
  while (used.has(`${SCENE_NAME_PREFIX}${index}`)) {
    index += 1;
  }
  return `${SCENE_NAME_PREFIX}${index}`;
};

/**
 * 把画布条目滚动进可见区域。切换画布、以及**新建画布**（新条目追加在列表末尾，
 * 大概率不在视口内）后调用。
 *
 * `block: "nearest"` 表示只在必要时滚动 —— 侧栏顶部搜索栏是 `sticky` 的，
 * 用默认的 `block: "start"` 会把条目顶到搜索栏底下。
 */
export const scrollSceneIntoView = (sceneId?: string | null) => {
  if (!sceneId || typeof document === "undefined") {
    return;
  }
  document.getElementById(sceneId)?.scrollIntoView({ block: "nearest" });
};
