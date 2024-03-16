import { Scene } from "@/types";
import { collectAllFileId } from "./data";
import { describe, it, expect } from "vitest";

describe("collectAllFileId", () => {
  it("should return an empty set when scenes is an empty array", () => {
    const scenes: Scene[] = [];
    const result = collectAllFileId(scenes);
    expect(result.size).toBe(0);
  });

  it("should only add fileIds from image elements in scenes with data properties", () => {
    const scenes = [
      { data: '{"elements": [{"type": "text", "fileId": 1}]}' },
      { data: '{"elements": [{"type": "image", "fileId": 2}]}' },
      { data: '{"elements": [{"type": "image", "fileId": 3}]}' },
      { data: '{"elements": [{"type": "shape", "fileId": 4}]}' },
    ];
    const result = collectAllFileId(scenes as Scene[]);
    expect(result.size).toBe(2);
  });
});
