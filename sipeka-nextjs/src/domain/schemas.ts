import { z } from "zod";

export const roleSchema = z.enum(["worker", "company", "bpjs"]);
export const periodSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Periode harus YYYY-MM");
export const dateSchema = z.iso.date();
export const timestampSchema = z.iso.datetime({ offset: true });
export const checkStatusSchema = z.enum(["MATCHED", "NEEDS_REVIEW", "DATA_UNAVAILABLE"]);
export const issueTypeSchema = z.enum(["CONTRIBUTION_MISMATCH", "WAGE_MISMATCH", "NOT_REGISTERED", "EMPLOYMENT_CHANGE", "DATA_UNAVAILABLE"]);
export const ticketStatusSchema = z.enum(["SUBMITTED", "IN_REVIEW", "AWAITING_COMPANY", "AWAITING_WORKER", "RESOLVED"]);
export const clarificationChoiceSchema = z.enum(["CORRECT", "CORRECTION_REQUIRED", "FURTHER_REVIEW"]);
export const resolutionCodeSchema = z.enum(["DATA_UPDATED", "UPDATE_DELAY", "NO_DATA_CHANGE"]);
export const moneySchema = z.number().int().nonnegative();

export const companySchema = z.object({ id: z.string().min(1), name: z.string().min(1) });
export const workerSchema = z.object({
  id: z.string().min(1), name: z.string().min(1), initials: z.string(), companyId: z.string().min(1),
  employmentStartDate: dateSchema, membershipStatus: z.enum(["ACTIVE", "UNKNOWN"]),
  scenario: z.enum(["real", "normal", "delay", "missing"]),
});
export const checkSchema = z.object({
  id: z.string(), workerId: z.string(), companyId: z.string(), period: periodSchema,
  status: checkStatusSchema, updatedAt: timestampSchema,
  declaredCompanyId: z.string(), registeredCompanyId: z.string().nullable(),
  declaredStartDate: dateSchema, registeredStartDate: dateSchema.nullable(),
  wageComponent: z.literal("FIXED_MONTHLY_WAGE"), comparableWage: z.boolean(),
  declaredWage: moneySchema, reportedWage: moneySchema.nullable(),
  workerDeduction: moneySchema, paymentStatus: z.enum(["MATCHED", "UNMATCHED", "UNAVAILABLE"]),
  reason: z.string(),
});
export const evidenceSchema = z.object({
  id: z.string(), type: z.enum(["PAYSLIP", "RECONCILIATION"]), title: z.string(),
  period: periodSchema, source: z.enum(["WORKER", "COMPANY"]), sharedWithCompany: z.boolean(),
  declaredWage: moneySchema.nullable(), deduction: moneySchema.nullable(), synthetic: z.literal(true),
});
export const eventSchema = z.object({
  id: z.string(), occurredAt: timestampSchema, actorRole: roleSchema, actorName: z.string(),
  action: z.string(), note: z.string(), visibility: z.enum(["ALL", "WORKER_OFFICER"]),
});
export const clarificationSchema = z.object({
  choice: clarificationChoiceSchema, note: z.string().min(1).max(2000),
  correctionDate: dateSchema.nullable(), evidenceAttached: z.boolean(), submittedAt: timestampSchema,
});
export const resolutionSchema = z.object({
  code: resolutionCodeSchema, explanation: z.string().min(1).max(2000),
  updateMonthlyData: z.boolean(), resolvedAt: timestampSchema,
});
export const ticketSchema = z.object({
  id: z.string(), workerId: z.string(), companyId: z.string(), period: periodSchema,
  issueType: issueTypeSchema, status: ticketStatusSchema,
  description: z.string(), workerNote: z.string(), createdAt: timestampSchema, updatedAt: timestampSchema,
  nextActor: z.enum(["worker", "company", "bpjs", "none"]), nextStep: z.string(),
  priority: z.enum(["MEDIUM", "NEEDS_DATA"]), priorityReason: z.string(),
  request: z.string().nullable(), evidence: z.array(evidenceSchema), events: z.array(eventSchema),
  clarification: clarificationSchema.nullable(), resolution: resolutionSchema.nullable(),
});
export const employmentChangeSchema = z.object({
  id: z.string(), workerId: z.string(), companyId: z.string(),
  type: z.enum(["START", "MOVE", "END"]), companyName: z.string().min(1).max(100),
  effectiveDate: dateSchema, recordedAt: timestampSchema,
});
export const metadataSchema = z.object({
  schemaVersion: z.literal("1.0"), currency: z.literal("IDR"), timezone: z.literal("Asia/Jakarta"),
  updatedAt: timestampSchema, defaultPeriod: periodSchema, periods: z.array(periodSchema),
  actors: z.object({ company: z.string(), bpjs: z.string() }),
});
export const datasetSchema = z.object({
  metadata: metadataSchema, companies: z.array(companySchema), workers: z.array(workerSchema),
  checks: z.array(checkSchema), tickets: z.array(ticketSchema), employmentChanges: z.array(employmentChangeSchema),
});
export const createTicketSchema = z.object({
  workerId: z.string().min(1), companyId: z.string().min(1), period: periodSchema,
  issueType: issueTypeSchema, workerNote: z.string().max(2000),
  confirmed: z.literal(true), attachPayslip: z.boolean(), shareEvidenceWithCompany: z.boolean(),
  clientRequestId: z.string().min(1),
});
export const clarificationInputSchema = z.object({
  choice: clarificationChoiceSchema, note: z.string().trim().min(1).max(2000),
  correctionDate: dateSchema.nullable(), evidenceAttached: z.boolean(),
}).superRefine((v, ctx) => {
  if (v.choice === "CORRECTION_REQUIRED" && !v.correctionDate) ctx.addIssue({ code: "custom", message: "Isi tanggal rencana perbaikan", path: ["correctionDate"] });
  if (v.choice === "CORRECT" && !v.evidenceAttached) ctx.addIssue({ code: "custom", message: "Lampirkan bukti simulasi", path: ["evidenceAttached"] });
});
export const resolutionInputSchema = z.object({
  code: resolutionCodeSchema, explanation: z.string().trim().min(1).max(2000), updateMonthlyData: z.boolean(),
}).superRefine((v, ctx) => {
  if (v.code === "DATA_UPDATED" && !v.updateMonthlyData) ctx.addIssue({ code: "custom", message: "Konfirmasi catatan terbaru sudah lengkap dan cocok", path: ["updateMonthlyData"] });
  if (v.code === "NO_DATA_CHANGE" && v.updateMonthlyData) ctx.addIssue({ code: "custom", message: "Hasil ini tidak mengubah data bulanan", path: ["updateMonthlyData"] });
});
export const informationInputSchema = z.object({ note: z.string().trim().min(1).max(2000), attachPayslip: z.boolean() });
export const requestInputSchema = z.object({ target: z.enum(["worker", "company"]), note: z.string().trim().min(1).max(2000) });
export const employmentInputSchema = employmentChangeSchema.omit({ id: true, recordedAt: true });

export type Role = z.infer<typeof roleSchema>;
export type Period = z.infer<typeof periodSchema>;
export type Worker = z.infer<typeof workerSchema>;
export type Company = z.infer<typeof companySchema>;
export type MonthlyCheck = z.infer<typeof checkSchema>;
export type Ticket = z.infer<typeof ticketSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type TicketEvent = z.infer<typeof eventSchema>;
export type Dataset = z.infer<typeof datasetSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type ClarificationInput = z.infer<typeof clarificationInputSchema>;
export type ResolutionInput = z.infer<typeof resolutionInputSchema>;
export type RequestInput = z.infer<typeof requestInputSchema>;
export type InformationInput = z.infer<typeof informationInputSchema>;
export type EmploymentInput = z.infer<typeof employmentInputSchema>;
export type EmploymentChange = z.infer<typeof employmentChangeSchema>;
