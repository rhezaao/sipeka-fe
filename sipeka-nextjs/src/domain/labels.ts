import type { MonthlyCheck, Ticket, Worker } from "./schemas";

export const checkLabels = { MATCHED: "Sesuai", NEEDS_REVIEW: "Perlu dicek", DATA_UNAVAILABLE: "Data belum tersedia" };
export const statusLabels = { SUBMITTED: "Terkirim", IN_REVIEW: "Sedang diperiksa", AWAITING_COMPANY: "Menunggu klarifikasi", AWAITING_WORKER: "Perlu informasi dari Anda", RESOLVED: "Selesai" };
export const issueLabels = { CONTRIBUTION_MISMATCH: "Perbedaan iuran", WAGE_MISMATCH: "Perbedaan upah", NOT_REGISTERED: "Belum terdaftar", EMPLOYMENT_CHANGE: "Perubahan kerja", DATA_UNAVAILABLE: "Data belum tersedia" };
export const scenarioLabels: Record<Worker["scenario"], string> = { real: "Selisih iuran", normal: "Data sesuai", delay: "Pembaruan terlambat", missing: "Data belum tersedia" };
export const clarificationLabels = { CORRECT: "Data sudah benar", CORRECTION_REQUIRED: "Data perlu diperbaiki", FURTHER_REVIEW: "Perlu pemeriksaan lanjut" };
export const resolutionLabels = { DATA_UPDATED: "Data telah diperbarui", UPDATE_DELAY: "Perbedaan terjadi karena waktu pembaruan data", NO_DATA_CHANGE: "Pemeriksaan selesai, data belum berubah" };
export const roleLabels = { worker: "Pekerja", company: "Perusahaan", bpjs: "Petugas BPJS Kesehatan" };
export const rupiah = (value: number | null) => value === null ? "Belum tersedia" : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
export const periodLabel = (period: string) => new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${period}-01T00:00:00Z`));
export const dateLabel = (date: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
export const timeLabel = (timestamp: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date(timestamp)) + " WIB";
export const checkTone = (status: MonthlyCheck["status"]) => status === "MATCHED" ? "ok" : status === "NEEDS_REVIEW" ? "warn" : "gray";
export const ticketTone = (status: Ticket["status"]) => status === "RESOLVED" ? "ok" : status === "AWAITING_COMPANY" || status === "AWAITING_WORKER" ? "warn" : "blue";
