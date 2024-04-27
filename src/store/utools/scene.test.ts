import { newAScene } from "@/utils/scene";
import { describe, expect, it } from "vitest";
import { restoreScenesArray } from "./scene";

describe("handle scene data", () => {
  it("restore array of scenes data by settings", () => {
    const scenes = new Map([
      ["David", newAScene({ id: "David", name: "David" })],
      ["Lucy", newAScene({ id: "Lucy", name: "Lucy" })],
    ]);
    const { idArray } = restoreScenesArray(scenes, ["David", "Lucy"]);
    expect(idArray).toStrictEqual(["David", "Lucy"]);
  });

  it("restore scene, weather the scene is in the ordering or not.", () => {
    const scenes = new Map([
      ["David", newAScene({ id: "David", name: "David" })],
      ["Lucy", newAScene({ id: "Lucy", name: "Lucy" })],
    ]);
    const { idArray } = restoreScenesArray(scenes, ["David"]);

    expect(idArray).toStrictEqual(["David", "Lucy"]);
  });

  it("drop the id, if it's not in the scenes", () => {
    const scenes = new Map([
      ["David", newAScene({ id: "David", name: "David" })],
      ["Lucy", newAScene({ id: "Lucy", name: "Lucy" })],
    ]);
    const { idArray } = restoreScenesArray(scenes, [
      "David",
      "Rebecca",
      "Lucy",
    ]);
    expect(idArray).toStrictEqual(["David", "Lucy"]);
  });

  it("drop id if the scene if expired", () => {
    const scenes = new Map([
      ["David", newAScene({ id: "David", name: "David" })],
      ["Lucy", newAScene({ id: "Lucy", name: "Lucy", deleted: true })],
    ]);

    const { idArray } = restoreScenesArray(scenes, ["David", "Lucy"]);
    expect(idArray).toStrictEqual(["David"]);
  });
});
