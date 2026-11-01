import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import PostSurvey from "./PostSurvey";
import PreSurvey from "./PreSurvey";

beforeAll(() => {
  // jsdom has no scrollIntoView; Radix Select calls it when its list opens.
  Element.prototype.scrollIntoView = vi.fn();
});

const type = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

// Radix Select opens on a key press and selects on click (no pointer events needed in jsdom).
const choose = (label: RegExp, option: string) => {
  fireEvent.keyDown(screen.getByRole("combobox", { name: label }), { key: "Enter" });
  fireEvent.click(screen.getByRole("option", { name: option }));
};

const fillPreSurvey = () => {
  type(/What problem/, "Slow onboarding");
  type(/What would make you buy/, "Saves time");
  choose(/budget range/, "€1-5K");
};

const fillPostSurvey = () => {
  choose(/no longer use/, "Very disappointed");
  choose(/Would you buy/, "Yes");
  type(/most confusing/, "Pricing");
  type(/like most/, "Speed");
  type(/What's missing/, "Export");
};

const pending = () => {
  let finish: () => void = () => undefined;
  const promise = new Promise<void>((resolve) => (finish = resolve));
  return { promise, finish };
};

describe.each([
  ["PreSurvey", PreSurvey, fillPreSurvey, "Continue to recording"],
  ["PostSurvey", PostSurvey, fillPostSurvey, "View Results"],
])("%s", (_name, Survey, fill, defaultLabel) => {
  it("keeps the submit button disabled until an async onComplete has settled", async () => {
    const saving = pending();
    const onComplete = vi.fn(() => saving.promise);
    render(<Survey onComplete={onComplete} />);
    fill();

    fireEvent.click(screen.getByRole("button", { name: defaultLabel }));

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: defaultLabel })).toBeDisabled();

    saving.finish();

    await waitFor(() => expect(screen.getByRole("button", { name: defaultLabel })).toBeEnabled());
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("does not submit while required answers are missing", async () => {
    const onComplete = vi.fn();
    render(<Survey onComplete={onComplete} />);

    fireEvent.click(screen.getByRole("button", { name: defaultLabel }));

    expect((await screen.findAllByText(/Required|Please select/)).length).toBeGreaterThan(0);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("shows the error and the label it is given", () => {
    render(<Survey onComplete={vi.fn()} error={<p role="alert">Could not send</p>} submitLabel="Submit" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Could not send");
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: defaultLabel })).not.toBeInTheDocument();
  });
});

describe("answers", () => {
  it("PreSurvey passes the trimmed answers to onComplete", async () => {
    const onComplete = vi.fn();
    render(<PreSurvey onComplete={onComplete} />);
    fillPreSurvey();

    fireEvent.click(screen.getByRole("button", { name: "Continue to recording" }));

    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(onComplete.mock.calls[0][0]).toEqual({
      problemToSolve: "Slow onboarding",
      buyMotivation: "Saves time",
      budgetRange: "€1-5K",
      urgency: 3,
    });
  });

  it("PostSurvey passes the answers to onComplete", async () => {
    const onComplete = vi.fn();
    render(<PostSurvey onComplete={onComplete} />);
    fillPostSurvey();

    fireEvent.click(screen.getByRole("button", { name: "View Results" }));

    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(onComplete.mock.calls[0][0]).toEqual({
      disappointed: "Very disappointed",
      wouldBuy: "Yes",
      mostConfusing: "Pricing",
      likedMost: "Speed",
      whatsMissing: "Export",
    });
  });
});
