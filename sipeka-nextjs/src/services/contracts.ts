import type { Dataset, Worker, Company, MonthlyCheck, Ticket, CreateTicketInput, ClarificationInput, ResolutionInput, RequestInput, InformationInput, EmploymentInput, EmploymentChange } from "../domain/schemas";

export interface DataFilter { workerId?: string; companyId?: string; period?: string }
export interface TicketFilter extends DataFilter { status?: Ticket["status"]; issueType?: Ticket["issueType"]; hasEvidence?: boolean }
export interface DataEnvelope<T> { data: T; meta?: { schemaVersion?: string; requestId?: string; total?: number } }
export interface ErrorEnvelope { error: { code: string; message: string; details?: unknown } }

/** UI calls this contract only. The mock and HTTP adapters share these DTOs. */
export interface SipekaRepository {
  getMetadata(): Promise<Dataset["metadata"]>;
  listCompanies(): Promise<Company[]>;
  listWorkers(filter?: Pick<DataFilter, "companyId">): Promise<Worker[]>;
  listChecks(filter?: DataFilter): Promise<MonthlyCheck[]>;
  listTickets(filter?: TicketFilter): Promise<Ticket[]>;
  listEmploymentChanges(filter?: Pick<DataFilter, "workerId" | "companyId">): Promise<EmploymentChange[]>;
  createTicket(input: CreateTicketInput): Promise<Ticket>;
  startReview(ticketId: string): Promise<Ticket>;
  requestInformation(ticketId: string, input: RequestInput): Promise<Ticket>;
  clarifyTicket(ticketId: string, input: ClarificationInput): Promise<Ticket>;
  provideInformation(ticketId: string, input: InformationInput): Promise<Ticket>;
  continueReview(ticketId: string, note: string): Promise<Ticket>;
  resolveTicket(ticketId: string, input: ResolutionInput): Promise<Ticket>;
  recordEmploymentChange(input: EmploymentInput): Promise<EmploymentChange>;
}

export class RepositoryError extends Error {
  constructor(public code: string, message: string, public status = 400, public details?: unknown) {
    super(message); this.name = "RepositoryError";
  }
}
