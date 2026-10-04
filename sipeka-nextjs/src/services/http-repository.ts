import { z } from "zod";
import { datasetSchema, ticketSchema, employmentChangeSchema } from "../domain/schemas";
import type { CreateTicketInput, ClarificationInput, ResolutionInput, RequestInput, InformationInput, EmploymentInput } from "../domain/schemas";
import { RepositoryError, type SipekaRepository, type DataFilter, type TicketFilter } from "./contracts";

/** Optional adapter. Mock mode never instantiates this client or makes HTTP calls. */
export class HttpSipekaRepository implements SipekaRepository {
  constructor(private baseUrl: string, private transport: typeof fetch = fetch, private getAccessToken?: () => Promise<string | null>) {
    if (!/^https?:\/\//.test(baseUrl)) throw new Error("API base URL must be an absolute http(s) URL");
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }
  private async call<T>(path: string, schema: z.ZodType<T>, body?: unknown, idempotencyKey?: string): Promise<T> {
    const token = await this.getAccessToken?.();
    const response = await this.transport(`${this.baseUrl}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { Accept: "application/json", ...(body === undefined ? {} : {"Content-Type":"application/json"}), ...(token ? {Authorization:`Bearer ${token}`} : {}), ...(idempotencyKey ? {"Idempotency-Key":idempotencyKey} : {}) },
      ...(body === undefined ? {} : {body:JSON.stringify(body)}), signal:AbortSignal.timeout(15000),
    });
    const raw: unknown = await response.json();
    if (!response.ok) {
      const error = z.object({error:z.object({code:z.string(),message:z.string(),details:z.unknown().optional()})}).safeParse(raw);
      throw new RepositoryError(error.success ? error.data.error.code : "HTTP_ERROR", error.success ? error.data.error.message : `API mengembalikan ${response.status}`, response.status, error.success ? error.data.error.details : undefined);
    }
    const parsed = z.object({data:schema}).safeParse(raw);
    if (!parsed.success) throw new RepositoryError("INVALID_RESPONSE", "Format respons backend tidak sesuai kontrak", 502, parsed.error.issues);
    return parsed.data.data as T;
  }
  private query(filter: object = {}) { const params = new URLSearchParams(); Object.entries(filter).forEach(([k,v]) => {if(v !== undefined)params.set(k,String(v));}); return params.size ? `?${params}` : ""; }
  private ticketPath(id:string, action:string) {return `/tickets/${encodeURIComponent(id)}/${action}`;}
  getMetadata() {return this.call("/metadata",datasetSchema.shape.metadata);}
  listCompanies() {return this.call("/companies",datasetSchema.shape.companies);}
  listWorkers(filter:Pick<DataFilter,"companyId"> = {}) {return this.call(`/workers${this.query(filter)}`,datasetSchema.shape.workers);}
  listChecks(filter:DataFilter = {}) {return this.call(`/checks${this.query(filter)}`,datasetSchema.shape.checks);}
  listTickets(filter:TicketFilter = {}) {return this.call(`/tickets${this.query(filter)}`,datasetSchema.shape.tickets);}
  listEmploymentChanges(filter:Pick<DataFilter,"workerId"|"companyId"> = {}) {return this.call(`/employment-changes${this.query(filter)}`,datasetSchema.shape.employmentChanges);}
  createTicket(input:CreateTicketInput) {return this.call("/tickets",ticketSchema,input,input.clientRequestId);}
  startReview(id:string) {return this.call(this.ticketPath(id,"review"),ticketSchema,{});}
  requestInformation(id:string,input:RequestInput) {return this.call(this.ticketPath(id,"requests"),ticketSchema,input);}
  clarifyTicket(id:string,input:ClarificationInput) {return this.call(this.ticketPath(id,"clarification"),ticketSchema,input);}
  provideInformation(id:string,input:InformationInput) {return this.call(this.ticketPath(id,"information"),ticketSchema,input);}
  continueReview(id:string,note:string) {return this.call(this.ticketPath(id,"continue"),ticketSchema,{note});}
  resolveTicket(id:string,input:ResolutionInput) {return this.call(this.ticketPath(id,"resolution"),ticketSchema,input);}
  recordEmploymentChange(input:EmploymentInput) {return this.call("/employment-changes",employmentChangeSchema,input);}
}
