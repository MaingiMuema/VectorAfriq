export const REPORT_REASONS = [
  "Fake or misleading listing",
  "Property already sold/rented",
  "Wrong price or fees",
  "Inaccurate location",
  "Spam or scam",
  "Inappropriate content",
  "Duplicate listing",
  "Other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];
