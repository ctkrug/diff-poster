import { describe, expect, it } from "vitest";
import { buildDownloadFilename, canvasToBlob } from "../src/export/canvasExport.js";

describe("buildDownloadFilename", () => {
  it("formats a date as diff-poster-YYYYMMDD-HHMMSS.png", () => {
    const date = new Date(2026, 0, 5, 3, 4, 5);
    expect(buildDownloadFilename(date)).toBe("diff-poster-20260105-030405.png");
  });

  it("zero-pads single-digit month, day, hour, minute, and second", () => {
    const date = new Date(2026, 8, 9, 9, 9, 9);
    expect(buildDownloadFilename(date)).toBe("diff-poster-20260909-090909.png");
  });
});

describe("canvasToBlob", () => {
  it("resolves with the blob produced by canvas.toBlob", async () => {
    const fakeBlob = { type: "image/png" };
    const canvas = { toBlob: (cb) => cb(fakeBlob) };
    await expect(canvasToBlob(canvas)).resolves.toBe(fakeBlob);
  });

  it("rejects when toBlob produces no blob", async () => {
    const canvas = { toBlob: (cb) => cb(null) };
    await expect(canvasToBlob(canvas)).rejects.toThrow();
  });

  it("rejects when the canvas has no toBlob support", async () => {
    const canvas = {};
    await expect(canvasToBlob(canvas)).rejects.toThrow();
  });
});
