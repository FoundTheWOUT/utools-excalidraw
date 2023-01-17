import { Scene } from "@/types";
import { newAScene } from "@/utils/utils";
import { describe, expect, it } from "vitest";
import { restoreScenesArray } from "./scene";

describe("handle scene data", () => {
  it("restore array of scenes data by settings", () => {
    const scenes: Scene[] = [
      newAScene({ id: "David", name: "David" }),
      newAScene({ id: "Lucy", name: "Lucy" }),
    ];
    const { scenes: res } = restoreScenesArray(scenes, ["David", "Lucy"]);
    expect(res).toStrictEqual(scenes);
  });

  it("restore scene, weather the scene is in the ordering or not.", () => {
    const scenes: Scene[] = [
      newAScene({ id: "David", name: "David" }),
      newAScene({ id: "Lucy", name: "Lucy" }),
    ];
    const { scenes: res } = restoreScenesArray(scenes, ["David"]);

    expect(res).toStrictEqual(scenes);
  });

  it("drop the id, if it's not in the scenes", () => {
    const scenes: Scene[] = [
      newAScene({ id: "David", name: "David" }),
      newAScene({ id: "Lucy", name: "Lucy" }),
    ];
    const { scenes: res } = restoreScenesArray(scenes, [
      "David",
      "Rebecca",
      "Lucy",
    ]);
    expect(res).toStrictEqual(scenes);
  });
});
