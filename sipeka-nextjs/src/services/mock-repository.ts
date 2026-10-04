import placeholder from "../data/placeholder.json";
import { datasetSchema, createTicketSchema, clarificationInputSchema, resolutionInputSchema, requestInputSchema, informationInputSchema, employmentInputSchema } from "../domain/schemas";
import type { Dataset, Ticket, TicketEvent, Evidence, Role, CreateTicketInput, ClarificationInput, ResolutionInput, RequestInput, InformationInput, EmploymentInput } from "../domain/schemas";
import { RepositoryError } from "./contracts";
import type { SipekaRepository, DataFilter, TicketFilter } from "./contracts";

const clone = <T,>(v: T): T => structuredClone(v);
const matches = (v: {workerId?: string; companyId?: string; period?: string}, filter: DataFilter = {}) => Object.entries(filter).every(([key, value]) => value === undefined || v[key as keyof typeof v] === value);

/** Each instance is a disposable session. Never writes the JSON file, localStorage, or a server. */
export class MockSipekaRepository implements SipekaRepository {
  private data: Dataset;
  private sequence = 200;
  private requests = new Map<string, string>();
  constructor(seed: unknown = placeholder, private clock = () => new Date().toISOString()) { this.data = clone(datasetSchema.parse(seed)); }
  async getMetadata() { return clone(this.data.metadata); }
  async listCompanies() { return clone(this.data.companies); }
  async listWorkers(filter: Pick<DataFilter,"companyId"> = {}) { return clone(this.data.workers.filter(w => !filter.companyId || w.companyId === filter.companyId)); }
  async listChecks(filter: DataFilter = {}) { return clone(this.data.checks.filter(c => matches(c, filter))); }
  async listTickets(filter: TicketFilter = {}) { const { status, issueType, hasEvidence, ...base } = filter; return clone(this.data.tickets.filter(t => matches(t, base) && (!status || t.status === status) && (!issueType || t.issueType === issueType) && (hasEvidence === undefined || Boolean(t.evidence.length) === hasEvidence))); }
  async listEmploymentChanges(filter: Pick<DataFilter,"workerId"|"companyId"> = {}) { return clone(this.data.employmentChanges.filter(c => matches(c, filter))); }
  private ticket(id: string) { const t = this.data.tickets.find(t => t.id === id); if (!t) throw new RepositoryError("NOT_FOUND", "Tiket tidak ditemukan", 404); return t; }
  private openTicket(id: string) { const t = this.ticket(id); if (t.status === "RESOLVED") throw new RepositoryError("INVALID_TRANSITION", "Tiket sudah selesai", 409); return t; }
  private event(t: Ticket, role: Role, action: string, note: string, visibility: TicketEvent["visibility"] = "ALL") {
    const w = this.data.workers.find(w => w.id === t.workerId)!;
    const at = this.clock(); t.updatedAt = at;
    t.events.unshift({ id:`EV-${++this.sequence}`, occurredAt:at, actorRole:role, actorName:role === "worker" ? w.name : this.data.metadata.actors[role], action, note, visibility });
  }
  private payslip(workerId: string, companyId: string, period: string, shared: boolean): Evidence {
    const c = this.data.checks.find(c => c.workerId === workerId && c.companyId === companyId && c.period === period);
    return { id:`EVD-${++this.sequence}`, type:"PAYSLIP", title:"Slip gaji simulasi", period, source:"WORKER", sharedWithCompany:shared, declaredWage:c?.declaredWage ?? null, deduction:c?.workerDeduction ?? null, synthetic:true };
  }
  async createTicket(value: CreateTicketInput) {
    const input = createTicketSchema.parse(value);
    const previous = this.requests.get(input.clientRequestId); if (previous) return clone(this.ticket(previous));
    const worker = this.data.workers.find(w => w.id === input.workerId && w.companyId === input.companyId);
    if (!worker) throw new RepositoryError("WORKER_COMPANY_MISMATCH", "Pekerja dan perusahaan tidak cocok", 422);
    if (!this.data.metadata.periods.includes(input.period)) throw new RepositoryError("UNKNOWN_PERIOD", "Periode tidak ada pada dataset simulasi", 422);
    const duplicate = this.data.tickets.find(t => t.workerId === input.workerId && t.companyId === input.companyId && t.period === input.period && t.issueType === input.issueType && t.status !== "RESOLVED");
    if (duplicate) { this.requests.set(input.clientRequestId, duplicate.id); return clone(duplicate); }
    const check = this.data.checks.find(c => matches(c, {workerId:input.workerId,companyId:input.companyId,period:input.period}));
    const at = this.clock(); const missing = !check || check.status === "DATA_UNAVAILABLE";
    const t: Ticket = {id:`SPK-2026-${String(++this.sequence).padStart(4,"0")}`,workerId:input.workerId,companyId:input.companyId,period:input.period,issueType:input.issueType,status:"SUBMITTED",description:check?.reason ?? "Data periode ini belum tersedia.",workerNote:input.workerNote,createdAt:at,updatedAt:at,nextActor:"bpjs",nextStep:"Petugas meninjau laporan Anda.",priority:missing?"NEEDS_DATA":"MEDIUM",priorityReason:missing?"Data dasar belum tersedia; bukti perlu dilengkapi.":"Perbedaan pada satu periode memerlukan pencocokan dan klarifikasi.",request:null,evidence:input.attachPayslip?[this.payslip(input.workerId,input.companyId,input.period,input.shareEvidenceWithCompany)]:[],events:[],clarification:null,resolution:null};
    this.event(t,"worker","Tiket terkirim","Laporan diterima untuk pemeriksaan.");
    this.data.tickets.unshift(t); this.requests.set(input.clientRequestId,t.id); return clone(t);
  }
  async startReview(id: string) { const t=this.openTicket(id); if(t.status!=="SUBMITTED")throw new RepositoryError("INVALID_TRANSITION","Tiket bukan laporan baru",409);t.status="IN_REVIEW";t.nextActor="bpjs";t.nextStep="Petugas mencocokkan bukti dan data.";this.event(t,"bpjs","Pemeriksaan dimulai","Laporan dan bukti sedang ditinjau.");return clone(t); }
  async requestInformation(id: string, value: RequestInput) { const input=requestInputSchema.parse(value);const t=this.openTicket(id);t.status=input.target==="company"?"AWAITING_COMPANY":"AWAITING_WORKER";t.nextActor=input.target;t.nextStep=input.target==="company"?"Perusahaan memberikan klarifikasi.":"Anda melengkapi informasi.";t.request=input.note;this.event(t,"bpjs",input.target==="company"?"Klarifikasi perusahaan diminta":"Informasi pekerja diminta",input.note);return clone(t); }
  async clarifyTicket(id: string, value: ClarificationInput) { const input=clarificationInputSchema.parse(value);const t=this.openTicket(id);if(t.status!=="AWAITING_COMPANY")throw new RepositoryError("INVALID_TRANSITION","Belum ada permintaan klarifikasi perusahaan",409);t.clarification={...input,submittedAt:this.clock()};if(input.evidenceAttached)t.evidence.push({id:`EVD-${++this.sequence}`,type:"RECONCILIATION",title:"Catatan rekonsiliasi simulasi",period:t.period,source:"COMPANY",sharedWithCompany:true,declaredWage:null,deduction:null,synthetic:true});t.status="IN_REVIEW";t.nextActor="bpjs";t.nextStep="Petugas meninjau klarifikasi perusahaan.";this.event(t,"company","Klarifikasi perusahaan diterima",input.note);return clone(t); }
  async provideInformation(id: string, value: InformationInput) { const input=informationInputSchema.parse(value);const t=this.openTicket(id);if(t.status!=="AWAITING_WORKER")throw new RepositoryError("INVALID_TRANSITION","Belum ada permintaan informasi pekerja",409);if(input.attachPayslip&&!t.evidence.some(e=>e.type==="PAYSLIP"))t.evidence.push(this.payslip(t.workerId,t.companyId,t.period,false));t.status="IN_REVIEW";t.nextActor="bpjs";t.nextStep="Petugas meninjau informasi tambahan.";this.event(t,"worker","Informasi pekerja dilengkapi",input.note,"WORKER_OFFICER");return clone(t); }
  async continueReview(id: string, note: string) { const t=this.openTicket(id);if(!note.trim())throw new RepositoryError("VALIDATION_ERROR","Isi alasan pemeriksaan lanjut");t.status="IN_REVIEW";t.nextActor="bpjs";t.nextStep="Petugas melakukan pemeriksaan lanjutan.";this.event(t,"bpjs","Pemeriksaan diteruskan",note.trim());return clone(t); }
  async resolveTicket(id: string, value: ResolutionInput) { const input=resolutionInputSchema.parse(value);const t=this.openTicket(id);const check=this.data.checks.find(c=>matches(c,{workerId:t.workerId,companyId:t.companyId,period:t.period}));
    if(input.updateMonthlyData){if(!check||check.status==="DATA_UNAVAILABLE"||!check.registeredCompanyId||check.registeredCompanyId!==check.declaredCompanyId||!check.registeredStartDate||check.registeredStartDate!==check.declaredStartDate||check.reportedWage===null||!check.comparableWage||check.declaredWage!==check.reportedWage)throw new RepositoryError("INCOMPLETE_DATA","Data minimum belum lengkap atau belum cocok; catat hasil tanpa mengubah status bulanan",422);check.status="MATCHED";check.paymentStatus="MATCHED";check.updatedAt=this.clock();check.reason=input.explanation;}
    t.resolution={...input,resolvedAt:this.clock()};t.status="RESOLVED";t.nextActor="none";t.nextStep="Tidak ada tindakan lanjutan untuk tiket ini.";this.event(t,"bpjs","Pemeriksaan selesai",input.explanation);return clone(t);
  }
  async recordEmploymentChange(value: EmploymentInput) {const input=employmentInputSchema.parse(value);if(!this.data.workers.some(w=>w.id===input.workerId&&w.companyId===input.companyId))throw new RepositoryError("WORKER_COMPANY_MISMATCH","Pekerja dan perusahaan tidak cocok",422);const change={...input,id:`EMP-${++this.sequence}`,recordedAt:this.clock()};this.data.employmentChanges.unshift(change);return clone(change);}
}
