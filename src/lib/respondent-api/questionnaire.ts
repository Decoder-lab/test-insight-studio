// The closed answer lists of the questionnaire. Keep in sync with `BudgetRange`, `DisappointmentLevel`
// and `PurchaseIntent` in contracts/openapi.yaml: the backend rejects any other value with
// `400 validation_error`. The surveys build their select options and zod schemas from these lists.

export const BUDGET_RANGES = ["<€1K", "€1-5K", "€5-10K", ">€10K"] as const;

export const DISAPPOINTED_OPTIONS = ["Very disappointed", "Somewhat disappointed", "Not disappointed"] as const;

export const WOULD_BUY_OPTIONS = ["Yes", "Maybe", "No"] as const;
