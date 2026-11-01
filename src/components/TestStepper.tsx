import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type Step = "pre-survey" | "recording" | "post-survey";

const stepLabels: Record<Step, string> = {
  "pre-survey": "Pre-Survey",
  recording: "Recording",
  "post-survey": "Post-Survey",
};

const stepOrder: Step[] = ["pre-survey", "recording", "post-survey"];

interface TestStepperProps {
  step: Step;
  /** Shown before the breadcrumbs, e.g. the DEMO badge of the demo flow. */
  badge?: ReactNode;
}

/** Breadcrumbs, progress bar and step labels shared by the demo flow and the respondent flow. */
const TestStepper = ({ step, badge }: TestStepperProps) => {
  const currentIndex = stepOrder.indexOf(step);

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        {badge}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink className="cursor-default">Test</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{stepLabels[step]}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-10">
        {stepOrder.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                currentIndex >= i ? "bg-accent" : "bg-border"
              }`}
            />
          </div>
        ))}
      </div>

      {/* Step labels */}
      <div className="flex justify-between mb-8 text-xs text-muted-foreground">
        {stepOrder.map((s, i) => (
          <span key={s} className={`font-medium ${currentIndex >= i ? "text-accent" : ""}`}>
            {stepLabels[s]}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TestStepper;
