import type { ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RecordedVideos } from "@/lib/recording/types";
import type { RecordingLimits } from "@/lib/respondent-api/types";
import { TARGET_FRAME_SANDBOX } from "./TargetFrame";
import RecordingSession from "./RecordingSession";

// Animations would need real time to finish; the phases are what matters here.
vi.mock("framer-motion", async () => {
  const { createElement } = await import("react");
  const motion = new Proxy(
    {},
    {
      get:
        (_target, tag: string) =>
        ({ initial, animate, exit, transition, ...props }: Record<string, unknown>) =>
          createElement(tag, props),
    },
  );
  return { motion, AnimatePresence: ({ children }: { children: ReactNode }) => children };
});

const TARGET_URL = "https://example.com/pricing";

const LIMITS: RecordingLimits = {
  maxDurationSeconds: 120,
  maxSizeBytes: 50 * 1024 * 1024,
  allowedContentTypes: ["video/webm", "video/mp4"],
};

let supportedTypes: string[] = [];

/** Delivers its data and its `stop` event after `stop()`, like a real recorder (asynchronously). */
class FakeMediaRecorder {
  static instances: FakeMediaRecorder[] = [];
  static isTypeSupported = (type: string) => supportedTypes.includes(type);

  state: "inactive" | "recording" = "inactive";
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstart: (() => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(
    readonly stream: FakeStream,
    readonly options: MediaRecorderOptions,
  ) {
    FakeMediaRecorder.instances.push(this);
  }

  start() {
    this.state = "recording";
    queueMicrotask(() => this.onstart?.());
  }

  stop() {
    if (this.state === "inactive") return;
    this.state = "inactive";
    queueMicrotask(() => {
      this.ondataavailable?.({ data: new Blob(["video-bytes"]) });
      this.onstop?.();
    });
  }
}

type FakeStream = MediaStream & { tracks: Array<{ stop: ReturnType<typeof vi.fn>; addEventListener: ReturnType<typeof vi.fn> }> };

const fakeStream = (): FakeStream => {
  const tracks = [
    { stop: vi.fn(), addEventListener: vi.fn() },
    { stop: vi.fn(), addEventListener: vi.fn() },
  ];
  return { tracks, getTracks: () => tracks, getVideoTracks: () => [tracks[0]], getAudioTracks: () => [tracks[1]] } as unknown as FakeStream;
};

const denied = () => Object.assign(new Error("denied"), { name: "NotAllowedError" });

let cameraStream: FakeStream;
let screenStream: FakeStream;
let getUserMedia: ReturnType<typeof vi.fn>;
let getDisplayMedia: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  FakeMediaRecorder.instances = [];
  supportedTypes = ["video/webm;codecs=vp9,opus", "video/webm"];
  vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
  getUserMedia = vi.fn(async () => (cameraStream = fakeStream()));
  getDisplayMedia = vi.fn(async () => (screenStream = fakeStream()));
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia, getDisplayMedia } });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// Fake timers also stop testing-library's polling, so everything is advanced by hand.
const advance = (ms = 0) => act(async () => void (await vi.advanceTimersByTimeAsync(ms)));
const click = (name: string | RegExp) =>
  act(async () => {
    fireEvent.click(screen.getByRole("button", { name }));
    await vi.advanceTimersByTimeAsync(0);
  });

const setup = (props: Partial<React.ComponentProps<typeof RecordingSession>> = {}) => {
  const onRecorded = props.onRecorded
    ? vi.mocked(props.onRecorded)
    : vi.fn(async (_videos: RecordedVideos) => true);
  const onComplete = vi.fn();
  const view = render(
    <RecordingSession targetURL={TARGET_URL} limits={LIMITS} onComplete={onComplete} {...props} onRecorded={onRecorded} />,
  );
  return { onRecorded, onComplete, ...view };
};

const startRecording = () => click(/Start Recording/);
const stopRecording = () => click(/Stop & Submit/);

describe("by default (camera only)", () => {
  it("tells the respondent that only the camera and voice are recorded", () => {
    setup();

    expect(screen.getByText(/record your camera and voice/)).toBeInTheDocument();
    expect(screen.getByText(/Your screen is not recorded/)).toBeInTheDocument();
    expect(screen.getByText("Camera")).toBeInTheDocument();
    expect(screen.getByText("Microphone")).toBeInTheDocument();
    expect(screen.queryByText("Screen")).not.toBeInTheDocument();
  });

  it("asks for the camera with sound only: no screen picker, one recorder with capped bitrates", async () => {
    setup();

    await startRecording();

    expect(getUserMedia).toHaveBeenCalledOnce();
    expect(getUserMedia).toHaveBeenCalledWith(expect.objectContaining({ audio: true }));
    expect(getDisplayMedia).not.toHaveBeenCalled();
    expect(FakeMediaRecorder.instances).toHaveLength(1);
    expect(FakeMediaRecorder.instances[0].stream).toBe(cameraStream);
    expect(FakeMediaRecorder.instances[0].options).toEqual({
      mimeType: "video/webm;codecs=vp9,opus",
      audioBitsPerSecond: 64_000,
      videoBitsPerSecond: 1_000_000,
    });
    expect(screen.getByText("REC")).toBeInTheDocument();
  });

  it("shows the camera in the preview", async () => {
    setup();

    await startRecording();

    expect(document.querySelector("video")?.srcObject).toBe(cameraStream);
  });

  it("covers the whole screen while recording and gives the page back afterwards", async () => {
    document.body.style.overflow = "auto";
    const { container } = setup();

    await startRecording();

    const page = screen.getByTitle("Target page");
    expect(page).toHaveAttribute("src", TARGET_URL); // the project's page, the same frame the admin checked
    expect(page).toHaveAttribute("sandbox", TARGET_FRAME_SANDBOX);
    expect(container).not.toContainElement(page); // not squeezed into the surrounding layout
    expect(screen.getByRole("button", { name: /Stop & Submit/ })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    await stopRecording();

    expect(screen.queryByTitle("Target page")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("auto");
    document.body.style.overflow = "";
  });

  it("hands over the recording with a bare content type and the measured duration, then moves on", async () => {
    const { onRecorded, onComplete } = setup();
    await startRecording();
    await advance(5000);

    await stopRecording();

    expect(onRecorded).toHaveBeenCalledOnce();
    const { camera, screen: screenVideo } = onRecorded.mock.calls[0][0];
    expect(screenVideo).toBeUndefined();
    expect(camera).toMatchObject({ kind: "camera", contentType: "video/webm", durationMs: 5000 });
    expect(camera?.blob.type).toBe("video/webm"); // not "video/webm;codecs=vp9,opus"
    expect(camera?.blob.size).toBeGreaterThan(0);
    expect(screen.getByText("Upload complete!")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    await advance(1200);

    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("releases the camera when the recording ends", async () => {
    setup();
    await startRecording();

    await stopRecording();

    expect(cameraStream.tracks.every((track) => track.stop.mock.calls.length > 0)).toBe(true);
  });

  it("stops by itself at the maximum duration", async () => {
    const { onRecorded } = setup({ limits: { ...LIMITS, maxDurationSeconds: 30 } });
    await startRecording();

    await advance(29_000);
    expect(onRecorded).not.toHaveBeenCalled();
    await advance(1_000);

    expect(onRecorded).toHaveBeenCalledOnce();
    expect(onRecorded.mock.calls[0][0].camera?.durationMs).toBe(30_000);
  });

  it("counts down the time left", async () => {
    setup();
    await startRecording();

    await advance(15_000);

    expect(screen.getByText("01:45 remaining")).toBeInTheDocument();
  });

  it("records MP4 where the browser cannot record WebM", async () => {
    supportedTypes = ["video/mp4;codecs=avc1,mp4a.40.2", "video/mp4"];
    const { onRecorded } = setup();
    await startRecording();

    await stopRecording();

    expect(FakeMediaRecorder.instances[0].options.mimeType).toBe("video/mp4;codecs=avc1,mp4a.40.2");
    expect(onRecorded.mock.calls[0][0].camera).toMatchObject({ contentType: "video/mp4" });
    expect(onRecorded.mock.calls[0][0].camera?.blob.type).toBe("video/mp4");
  });
});

describe("when something goes wrong before recording", () => {
  it("explains a denied permission and stays on the instructions", async () => {
    getUserMedia.mockRejectedValue(denied());
    const { onRecorded } = setup();

    await startRecording();

    expect(screen.getByRole("alert")).toHaveTextContent("permission denied");
    expect(screen.getByRole("button", { name: /Start Recording/ })).toBeEnabled();
    expect(FakeMediaRecorder.instances).toHaveLength(0);
    expect(onRecorded).not.toHaveBeenCalled();
  });

  it("explains a missing camera", async () => {
    getUserMedia.mockRejectedValue(Object.assign(new Error("none"), { name: "NotFoundError" }));
    setup();

    await startRecording();

    expect(screen.getByRole("alert")).toHaveTextContent("No camera or microphone found");
  });

  it("does not ask for the camera when the browser can record none of the allowed types", async () => {
    supportedTypes = [];
    setup();

    await startRecording();

    expect(screen.getByRole("alert")).toHaveTextContent("can't record video");
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("offers to try again when nothing was recorded", async () => {
    const { onRecorded } = setup();
    await startRecording();
    FakeMediaRecorder.instances[0].stop = function () {
      this.state = "inactive";
      queueMicrotask(() => this.onstop?.()); // stopped without ever delivering data
    };

    await stopRecording();

    expect(onRecorded).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Nothing was recorded");
    expect(screen.getByRole("button", { name: /Start Recording/ })).toBeEnabled();
  });
});

describe("when sending fails", () => {
  const failOnce = () => {
    const onRecorded = vi.fn<(videos: RecordedVideos) => Promise<boolean>>().mockResolvedValueOnce(false).mockResolvedValue(true);
    return setup({ onRecorded, error: <p>Upload failed because of the network.</p> });
  };

  it("keeps the recording and sends the same one again on Try again, without asking for the camera", async () => {
    const { onRecorded, onComplete } = failOnce();
    await startRecording();
    await stopRecording();

    expect(screen.getByText("Upload failed because of the network.")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    await click("Try again");

    expect(onRecorded).toHaveBeenCalledTimes(2);
    expect(onRecorded.mock.calls[1][0]).toBe(onRecorded.mock.calls[0][0]);
    expect(getUserMedia).toHaveBeenCalledOnce();
    expect(screen.getByText("Upload complete!")).toBeInTheDocument();
    await advance(1200);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("starts over on Record again", async () => {
    const { onRecorded } = failOnce();
    await startRecording();
    await stopRecording();

    await click("Record again");

    expect(screen.getByRole("heading", { name: "Ready to record?" })).toBeInTheDocument();
    expect(screen.queryByText("Upload failed because of the network.")).not.toBeInTheDocument();
    await startRecording();
    expect(getUserMedia).toHaveBeenCalledTimes(2);
    await stopRecording();
    expect(onRecorded).toHaveBeenCalledTimes(2);
    expect(onRecorded.mock.calls[1][0]).not.toBe(onRecorded.mock.calls[0][0]);
  });

  it("does not send a recording larger than the project allows, and only offers to record again", async () => {
    const { onRecorded } = setup({ limits: { ...LIMITS, maxSizeBytes: 5 } });
    await startRecording();

    await stopRecording();

    expect(onRecorded).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("too large");
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Record again" })).toBeInTheDocument();
  });
});

describe("leaving", () => {
  it("releases the camera and sends nothing when the respondent leaves during the recording", async () => {
    const { onRecorded, unmount } = setup();
    await startRecording();

    unmount();
    await advance(0);

    expect(cameraStream.tracks.every((track) => track.stop.mock.calls.length > 0)).toBe(true);
    expect(FakeMediaRecorder.instances[0].state).toBe("inactive");
    expect(onRecorded).not.toHaveBeenCalled();
  });

  it("releases the camera when the respondent leaves while the permission prompt is open", async () => {
    let allow: (stream: FakeStream) => void = () => undefined;
    getUserMedia.mockReturnValue(new Promise((resolve) => (allow = resolve)));
    const { unmount } = setup();
    await startRecording();

    unmount();
    const late = fakeStream();
    await act(async () => allow(late));

    expect(late.tracks.every((track) => track.stop.mock.calls.length > 0)).toBe(true);
    expect(FakeMediaRecorder.instances).toHaveLength(0);
  });

  it("warns before the page is closed while recording, and not on the instructions", async () => {
    setup();
    const beforeUnload = () => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(beforeUnload()).toBe(false);

    await startRecording();

    expect(beforeUnload()).toBe(true);
  });
});

describe("with the screen enabled", () => {
  const KINDS = ["camera", "screen"] as const;

  it("shows the screen card and asks to record the screen too", () => {
    setup({ kinds: KINDS });

    expect(screen.getByText("Screen")).toBeInTheDocument();
    expect(screen.getByText(/record your screen, camera, and voice/)).toBeInTheDocument();
    expect(screen.queryByText(/Your screen is not recorded/)).not.toBeInTheDocument();
  });

  it("records both and hands over both, each with its own duration", async () => {
    const { onRecorded } = setup({ kinds: KINDS });

    await startRecording();
    expect(getDisplayMedia).toHaveBeenCalledWith({ video: { displaySurface: "browser" }, audio: false });
    expect(FakeMediaRecorder.instances.map((recorder) => recorder.stream)).toEqual([cameraStream, screenStream]);
    await advance(3000);
    await stopRecording();

    const { camera, screen: screenVideo } = onRecorded.mock.calls[0][0];
    expect(camera).toMatchObject({ kind: "camera", contentType: "video/webm", durationMs: 3000 });
    expect(screenVideo).toMatchObject({ kind: "screen", contentType: "video/webm", durationMs: 3000 });
    expect(screenStream.tracks.every((track) => track.stop.mock.calls.length > 0)).toBe(true);
  });

  it("goes on with the camera alone when the respondent declines to share the screen", async () => {
    getDisplayMedia.mockRejectedValue(denied());
    const { onRecorded } = setup({ kinds: KINDS });

    await startRecording();
    await stopRecording();

    expect(onRecorded.mock.calls[0][0].camera).toBeDefined();
    expect(onRecorded.mock.calls[0][0].screen).toBeUndefined();
    expect(FakeMediaRecorder.instances).toHaveLength(1);
  });

  it("does not ask for the screen when the camera is denied", async () => {
    getUserMedia.mockRejectedValue(denied());
    setup({ kinds: KINDS });

    await startRecording();

    expect(screen.getByRole("alert")).toHaveTextContent("permission denied");
    expect(getDisplayMedia).not.toHaveBeenCalled();
  });

  it("ends the recording when the respondent stops sharing the screen", async () => {
    const { onRecorded } = setup({ kinds: KINDS });
    await startRecording();
    const [event, handler] = screenStream.tracks[0].addEventListener.mock.calls[0];
    expect(event).toBe("ended");

    await act(async () => {
      handler();
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(onRecorded).toHaveBeenCalledOnce();
    expect(onRecorded.mock.calls[0][0].camera).toBeDefined();
  });
});
