// Hand-written from contracts/openapi.yaml (Test Insight Studio Backend API, 0.4.0-draft).
// Keep in sync with the contract; do not add fields that are not in it.

import type { ErrorCode, ProjectStatus, RecordingProgress } from "@/lib/admin-api/types";
import type { BUDGET_RANGES, DISAPPOINTED_OPTIONS, WOULD_BUY_OPTIONS } from "./questionnaire";

export type { ErrorCode, ProjectStatus, RecordingProgress };

export type RecordingContentType = "video/webm" | "video/mp4";

export interface RecordingLimits {
  /** Fixed at 120 by the contract. */
  maxDurationSeconds: number;
  /** 52428800 (50 MiB) on the Supabase Free plan; may change with the storage tier. */
  maxSizeBytes: number;
  allowedContentTypes: RecordingContentType[];
}

export type BudgetRange = (typeof BUDGET_RANGES)[number];
export type DisappointmentLevel = (typeof DISAPPOINTED_OPTIONS)[number];
export type PurchaseIntent = (typeof WOULD_BUY_OPTIONS)[number];

/** Text answers are trimmed and 1 to 1000 characters; the backend rejects anything else. */
export interface PreSurveyAnswers {
  problemToSolve: string;
  buyMotivation: string;
  budgetRange: BudgetRange;
  /** Integer from 1 to 5. */
  urgency: number;
}

export interface PostSurveyAnswers {
  disappointed: DisappointmentLevel;
  wouldBuy: PurchaseIntent;
  mostConfusing: string;
  likedMost: string;
  whatsMissing: string;
}

/**
 * The complete set of answers. A submission replaces what was stored before, so `postSurvey` is
 * left out until the post-survey is done and the later submission repeats `preSurvey`. The backend
 * rejects unknown keys, so a new question is a contract change.
 */
export interface QuestionnaireAnswers {
  preSurvey: PreSurveyAnswers;
  postSurvey?: PostSurveyAnswers;
}

export interface QuestionnaireReceipt {
  /** ISO 8601 date-time. */
  submittedAt: string;
}

/** The only project information a respondent may see. Deliberately minimal. */
export interface RespondentProject {
  id: string;
  name: string;
  status: ProjectStatus;
  limits: RecordingLimits;
  progress: {
    questionnaireSubmitted: boolean;
    recordings: { camera: RecordingProgress; screen: RecordingProgress };
  };
}
