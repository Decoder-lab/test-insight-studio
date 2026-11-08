import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TARGET_FRAME_SANDBOX } from "@/components/TargetFrame";
import TargetUrlCheckDialog from "./TargetUrlCheckDialog";

const URL_A = "https://example.com/pricing";
const URL_B = "https://example.org/other";

const frame = () => screen.getByTitle("Target page preview") as HTMLIFrameElement;

describe("TargetUrlCheckDialog", () => {
  it("renders no dialog and loads nothing while closed", () => {
    render(<TargetUrlCheckDialog url={null} onClose={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Target page preview")).not.toBeInTheDocument();
  });

  it("loads the address in the same sandboxed frame the recording uses", () => {
    render(<TargetUrlCheckDialog url={URL_A} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Check the target page" })).toBeInTheDocument();
    expect(frame()).toHaveAttribute("src", URL_A);
    expect(frame()).toHaveAttribute("sandbox", TARGET_FRAME_SANDBOX);
  });

  it("says that the page is loading until the frame has loaded", () => {
    render(<TargetUrlCheckDialog url={URL_A} onClose={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading the page");

    fireEvent.load(frame());

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("starts loading again when another address is checked", () => {
    const { rerender } = render(<TargetUrlCheckDialog url={URL_A} onClose={vi.fn()} />);
    fireEvent.load(frame());

    rerender(<TargetUrlCheckDialog url={URL_B} onClose={vi.fn()} />);

    expect(frame()).toHaveAttribute("src", URL_B);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("opens the page in a new tab without giving it access to this window", () => {
    render(<TargetUrlCheckDialog url={URL_A} onClose={vi.fn()} />);

    const link = screen.getByRole("link", { name: "Open in new tab" });

    expect(link).toHaveAttribute("href", URL_A);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("asks to be closed from the Done button and from the corner X", () => {
    const onClose = vi.fn();
    render(<TargetUrlCheckDialog url={URL_A} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
