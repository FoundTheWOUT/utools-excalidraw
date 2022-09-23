import { Scene } from "@/types";
import { describe, expect, it } from "vitest";
import { newAScene, restoreScenesArray } from "./scene";

describe("handle scene data", () => {
  it("restore array of scenes data by settings", () => {
    const scenes: Scene[] = [
      newAScene({ id: "David", name: "David" }),
      newAScene({ id: "Lucy", name: "Lucy" }),
    ];
    expect(restoreScenesArray(scenes, ["David", "Lucy"])).toStrictEqual(scenes);
  });

  it("restore scene, weather the scene is in the ordering or not.", () => {
    const scenes: Scene[] = [
      newAScene({ id: "David", name: "David" }),
      newAScene({ id: "Lucy", name: "Lucy" }),
    ];
    expect(restoreScenesArray(scenes, ["David"])).toStrictEqual(scenes);
  });

  it("drop the id, if it's not in the scenes", () => {
    const scenes: Scene[] = [
      newAScene({ id: "David", name: "David" }),
      newAScene({ id: "Lucy", name: "Lucy" }),
    ];
    expect(
      restoreScenesArray(scenes, ["David", "Rebecca", "Lucy"])
    ).toStrictEqual(scenes);
  });
});
