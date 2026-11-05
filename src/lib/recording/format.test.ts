import { afterEach, describe, expect, it, vi } from "vitest";
import { pickRecorderFormat, recorderBitrates } from "./format";

const canRecord = (...types: string[]) => vi.stubGlobal("MediaRecorder", { isTypeSupported: (type: string) => types.includes(type) });

afterEach(() => vi.unstubAllGlobals());

describe("pickRecorderFormat", () => {
  const both = ["video/webm", "video/mp4"] as const;

  it("prefers VP9 WebM with Opus and gives the bare content type for the upload", () => {
    canRecord("video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4");

    expect(pickRecorderFormat(both)).toEqual({ mimeType: "video/webm;codecs=vp9,opus", contentType: "video/webm" });
  });

  it.each([
    [["video/webm;codecs=vp8,opus", "video/webm"], "video/webm;codecs=vp8,opus"],
    [["video/webm"], "video/webm"],
  ])("falls back to the next WebM variant (%j)", (supported, mimeType) => {
    canRecord(...supported);

    expect(pickRecorderFormat(both)).toEqual({ mimeType, contentType: "video/webm" });
  });

  it("uses MP4 where only MP4 can be recorded (Safari)", () => {
    canRecord("video/mp4;codecs=avc1,mp4a.40.2", "video/mp4");

    expect(pickRecorderFormat(both)).toEqual({ mimeType: "video/mp4;codecs=avc1,mp4a.40.2", contentType: "video/mp4" });
  });

  it("never picks a type the project does not accept", () => {
    canRecord("video/webm;codecs=vp9,opus", "video/webm", "video/mp4");

    expect(pickRecorderFormat(["video/mp4"])).toEqual({ mimeType: "video/mp4", contentType: "video/mp4" });
    expect(pickRecorderFormat([])).toBeNull();
  });

  it("returns null when the browser can record none of the accepted types", () => {
    canRecord("video/webm");

    expect(pickRecorderFormat(["video/mp4"])).toBeNull();
  });

  it("returns null in a browser without MediaRecorder", () => {
    vi.stubGlobal("MediaRecorder", undefined);

    expect(pickRecorderFormat(both)).toBeNull();
  });
});

describe("recorderBitrates", () => {
  const MIB = 1024 * 1024;
  const expectedSize = ({ audioBitsPerSecond, videoBitsPerSecond }: ReturnType<typeof recorderBitrates>, seconds: number) =>
    ((audioBitsPerSecond + videoBitsPerSecond) * seconds) / 8;

  it("caps the video at 1 Mbps, which keeps 120 s at about 16 MB under the 50 MiB limit", () => {
    const bitrates = recorderBitrates({ maxSizeBytes: 50 * MIB, maxDurationSeconds: 120 });

    expect(bitrates).toEqual({ audioBitsPerSecond: 64_000, videoBitsPerSecond: 1_000_000 });
    expect(expectedSize(bitrates, 120)).toBeLessThan(17 * 1_000_000);
  });

  it.each([
    [20 * MIB, 120],
    [10 * MIB, 120],
    [50 * MIB, 600],
  ])("plans for 60%% of a %d byte limit at %d s, leaving room for encoder overshoot", (maxSizeBytes, maxDurationSeconds) => {
    const bitrates = recorderBitrates({ maxSizeBytes, maxDurationSeconds });

    expect(expectedSize(bitrates, maxDurationSeconds)).toBeLessThanOrEqual(maxSizeBytes * 0.6);
    expect(bitrates.videoBitsPerSecond).toBeLessThanOrEqual(1_000_000);
  });

  it("never asks for a video bitrate below a usable minimum", () => {
    expect(recorderBitrates({ maxSizeBytes: 1000, maxDurationSeconds: 120 }).videoBitsPerSecond).toBe(100_000);
  });
});
