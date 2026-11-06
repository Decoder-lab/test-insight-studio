// The closed answer lists of the questionnaire. Keep in sync with `BudgetRange`, `DisappointmentLevel`
// and `PurchaseIntent` in contracts/openapi.yaml: the backend rejects any other value with
// `400 validation_error`. The surveys build their select options and zod schemas from these lists.

import type { PostSurveyAnswers, PreSurveyAnswers } from "./types";

export const BUDGET_RANGES = ["<€1K", "€1-5K", "€5-10K", ">€10K"] as const;

export const DISAPPOINTED_OPTIONS = ["Very disappointed", "Somewhat disappointed", "Not disappointed"] as const;

export const WOULD_BUY_OPTIONS = ["Yes", "Maybe", "No"] as const;

// The question wording, shared by the surveys and by the admin's view of the stored answers so that the
// two cannot drift apart. The urgency question is shown with its current value ("(3/5)") by the survey.
export const PRE_SURVEY_QUESTIONS = {
  problemToSolve: "What problem are you trying to solve?",
  buyMotivation: "What would make you buy this product?",
  budgetRange: "What's your budget range?",
  urgency: "How urgent is solving this?",
} as const satisfies Record<keyof PreSurveyAnswers, string>;

export const POST_SURVEY_QUESTIONS = {
  disappointed: "How would you feel if you could no longer use this product?",
  wouldBuy: "Would you buy this product?",
  mostConfusing: "What was most confusing?",
  likedMost: "What did you like most?",
  whatsMissing: "What's missing?",
} as const satisfies Record<keyof PostSurveyAnswers, string>;
