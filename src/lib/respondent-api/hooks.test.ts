import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RecordedVideos } from "@/lib/recording/types";
import { RespondentApiError } from "./errors";
import { useRecordingUpload } from "./hooks";

const api = vi.hoisted(() => ({ createUploadUrl: vi.fn(), uploadRecording: vi.fn(), verifyRecording: vi.fn() }));
vi.mock("./client", () => ({ respondentApi: api }));

const TOKEN = "SECRET-TOKEN";

const video = (kind: "camera" | "screen", durationMs: number) => ({
  kind,
  blob: new Blob([kind], { type: "video/webm" }),
  contentType: "video/webm" as const,
  durationMs,
});
const take = (): RecordedVideos => ({ camera: video("camera", 4200), screen: video("screen", 4100) });

const urlFor = (kind: string) => ({ bucket: "recordings", path: `p1/${kind}/r1.webm`, token: `UPLOAD-${kind}`, signedUrl: "u" });

beforeEach(() => {
  vi.resetAllMocks();
  api.createUploadUrl.mockImplementation(async (_token: string, kind: string) => urlFor(kind));
  api.uploadRecording.mockResolvedValue(undefined);
  api.verifyRecording.mockResolvedValue({});
});

const upload = async (videos: RecordedVideos) => {
  const { result } = renderHook(() => useRecordingUpload(TOKEN));
  const run = (v: RecordedVideos) => act(() => result.current.upload(v));
  return { result, run, first: await run(videos) };
};

describe("useRecordingUpload", () => {
  it("requests a URL, uploads and verifies each recording in turn, with the token only for the API", async () => {
    const videos = take();

    const { first, result } = await upload(videos);

    expect(first).toBe(true);
    expect(result.current.error).toBeNull();
    expect(api.createUploadUrl.mock.calls).toEqual([
      [TOKEN, "camera", "video/webm"],
      [TOKEN, "screen", "video/webm"],
    ]);
    expect(api.uploadRecording.mock.calls).toEqual([
      [urlFor("camera"), videos.camera?.blob, "video/webm"],
      [urlFor("screen"), videos.screen?.blob, "video/webm"],
    ]);
    expect(api.verifyRecording.mock.calls).toEqual([
      [TOKEN, "camera", 4200],
      [TOKEN, "screen", 4100],
    ]);
    // Each file is verified before the next one is requested.
    const order = [api.createUploadUrl, api.verifyRecording].flatMap((fn, index) =>
      fn.mock.invocationCallOrder.map((at) => [at, index]),
    );
    expect(order.sort(([a], [b]) => a - b).map(([, index]) => index)).toEqual([0, 1, 0, 1]);
  });

  it("uploads only the kinds that were recorded", async () => {
    await upload({ camera: video("camera", 1000) });

    expect(api.createUploadUrl).toHaveBeenCalledOnce();
    expect(api.createUploadUrl).toHaveBeenCalledWith(TOKEN, "camera", "video/webm");
  });

  it("reports the failure and does not go on to the next recording", async () => {
    const failure = new RespondentApiError("upload", 0);
    api.uploadRecording.mockRejectedValueOnce(failure);

    const { first, result } = await upload(take());

    expect(first).toBe(false);
    expect(result.current.error).toBe(failure);
    expect(api.verifyRecording).not.toHaveBeenCalled();
    expect(api.createUploadUrl).toHaveBeenCalledOnce();
  });

  it("clears the error on the next attempt", async () => {
    api.createUploadUrl.mockRejectedValueOnce(new RespondentApiError("network", 0));
    const videos = take();
    const { result, run } = await upload(videos);
    expect(result.current.error).not.toBeNull();

    expect(await run(videos)).toBe(true);

    expect(result.current.error).toBeNull();
  });

  it("retries with a fresh URL after a failed upload, and never re-sends a recording that is already verified", async () => {
    const videos = take();
    api.uploadRecording.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new RespondentApiError("upload", 0));
    const { run } = await upload(videos); // camera verified, screen's upload failed
    expect(api.verifyRecording).toHaveBeenCalledTimes(1);

    expect(await run(videos)).toBe(true);

    expect(api.createUploadUrl.mock.calls.map(([, kind]) => kind)).toEqual(["camera", "screen", "screen"]);
    expect(api.uploadRecording).toHaveBeenCalledTimes(3);
    expect(api.verifyRecording.mock.calls.map(([, kind]) => kind)).toEqual(["camera", "screen"]);
  });

  it("only verifies again when the file reached Storage but the verification failed, because a new URL would answer 409", async () => {
    const videos = { camera: video("camera", 4200) };
    api.verifyRecording.mockRejectedValueOnce(new RespondentApiError("network", 0));
    const { run } = await upload(videos);

    expect(await run(videos)).toBe(true);

    expect(api.createUploadUrl).toHaveBeenCalledOnce();
    expect(api.uploadRecording).toHaveBeenCalledOnce();
    expect(api.verifyRecording).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["the object is missing", new RespondentApiError("unexpected", 404, "not_found")],
    ["the file is rejected", new RespondentApiError("validation", 400, "validation_error")],
  ])("uploads the file again when the backend says %s, since verifying it again cannot help", async (_why, rejection) => {
    const videos = { camera: video("camera", 4200) };
    api.verifyRecording.mockRejectedValueOnce(rejection);
    const { run } = await upload(videos);

    expect(await run(videos)).toBe(true);

    expect(api.createUploadUrl).toHaveBeenCalledTimes(2);
    expect(api.uploadRecording).toHaveBeenCalledTimes(2);
    expect(api.verifyRecording).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["the server fails", new RespondentApiError("unexpected", 500)],
    ["the request is rate limited", new RespondentApiError("rate_limited", 429)],
    ["there is no connection", new RespondentApiError("network", 0)],
  ])("only verifies again when %s, since the file may well be fine", async (_why, failure) => {
    const videos = { camera: video("camera", 4200) };
    api.verifyRecording.mockRejectedValueOnce(failure);
    const { run } = await upload(videos);

    expect(await run(videos)).toBe(true);

    expect(api.uploadRecording).toHaveBeenCalledOnce();
    expect(api.verifyRecording).toHaveBeenCalledTimes(2);
  });

  it("treats a new take as new: nothing of an earlier one is skipped", async () => {
    const { run } = await upload({ camera: video("camera", 4200) });

    await run({ camera: video("camera", 3000) });

    expect(api.createUploadUrl).toHaveBeenCalledTimes(2);
    expect(api.verifyRecording).toHaveBeenLastCalledWith(TOKEN, "camera", 3000);
  });
});
