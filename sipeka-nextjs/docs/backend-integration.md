# Kontrak backend SIPEKA v1

Default proyek adalah `MockSipekaRepository`. Tidak ada HTTP request atau integrasi BPJS dalam mode ini. DTO dan adapter disediakan untuk backend milik Anda di masa depan.

## Mengaktifkan backend nanti

Salin `.env.example` menjadi `.env.local`, lalu set:

```dotenv
NEXT_PUBLIC_DATA_SOURCE=http
NEXT_PUBLIC_API_BASE_URL=https://backend-anda.example/v1
```

Build ulang karena variabel `NEXT_PUBLIC_*` masuk ke bundle browser. Jangan menaruh secret/API key di variabel ini. Tambahkan integrasi login Anda di `createRepository()` dengan callback `getAccessToken` milik `HttpSipekaRepository`; callback dipanggil sebelum setiap request. Contoh: `new HttpSipekaRepository(baseUrl, fetch, async () => sessionAccessToken)`. Identitas dari login statis tidak dipercaya oleh backend produksi. Bila memilih cookie HttpOnly, sesuaikan transport `credentials` dan kebijakan CORS/CSRF pada BE Anda.

Login saat ini menggunakan fixture `demo-accounts.json` dan session username di `sessionStorage`. Ganti `AuthProvider` serta `demo-auth` dengan login BE Anda. Session demo bukan bearer token dan tidak dikirim ke adapter HTTP. Route guard frontend hanya menampilkan dashboard sesuai peran; BE tetap memverifikasi identitas dan hak akses di setiap endpoint.

Backend perlu mengizinkan origin frontend dan header `Authorization`, `Content-Type`, `Idempotency-Key` jika memakai bearer token lintas origin. Adapter memberi batas waktu request 15 detik dan tidak melakukan retry POST otomatis.

## Bentuk data lintas sistem

- ID adalah string opaque. Jangan mengandalkan prefix atau urutan dari mock.
- Periode `YYYY-MM`, tanggal `YYYY-MM-DD`, timestamp ISO 8601 dengan offset atau UTC `Z`.
- Uang integer rupiah (`IDR`), bukan string berformat atau float desimal.
- `null` berarti belum tersedia; nol adalah nilai, bukan data kosong.
- Status dan jenis masalah adalah enum mesin (`SUBMITTED`, `AWAITING_COMPANY`, dll.); label Bahasa Indonesia hanya di UI.
- Pencocokan bulanan memakai gabungan `workerId`, `companyId`, `period` dan komponen upah yang sama (`FIXED_MONTHLY_WAGE`).
- Metadata `schemaVersion: "1.0"`, `timezone: "Asia/Jakarta"`, `currency: "IDR"`.

Respons sukses: `{ "data": <DTO atau array DTO>, "meta": { "schemaVersion": "1.0" } }`. Array list v1 harus lengkap; pagination harus ditambahkan bersama perubahan kontrak provider. Respons gagal: `{ "error": { "code": "INVALID_TRANSITION", "message": "...", "details": ... } }` dengan HTTP 400/401/403/404/409/422 yang sesuai. Adapter memvalidasi respons dengan Zod dan menolak format tidak valid.

## Endpoint yang dipakai adapter

| Metode | Path relatif terhadap base URL | Payload / hasil |
| --- | --- | --- |
| GET | `/metadata` | Metadata |
| GET | `/companies` | Company[] |
| GET | `/workers?companyId=...` | Worker[] |
| GET | `/checks?workerId=...&companyId=...&period=...` | MonthlyCheck[] |
| GET | `/tickets?workerId=...&companyId=...&period=...&status=...&issueType=...&hasEvidence=true` | Ticket[] |
| GET | `/employment-changes?workerId=...&companyId=...` | EmploymentChange[] |
| POST | `/tickets` | CreateTicketInput → Ticket |
| POST | `/tickets/{id}/review` | `{}` → Ticket |
| POST | `/tickets/{id}/requests` | `{target:"company"\|"worker",note}` → Ticket |
| POST | `/tickets/{id}/clarification` | `{choice,note,correctionDate,evidenceAttached}` → Ticket |
| POST | `/tickets/{id}/information` | `{note,attachPayslip}` → Ticket |
| POST | `/tickets/{id}/continue` | `{note}` → Ticket |
| POST | `/tickets/{id}/resolution` | `{code,explanation,updateMonthlyData}` → Ticket |
| POST | `/employment-changes` | EmploymentInput → EmploymentChange |

`clientRequestId` dikirim juga sebagai header `Idempotency-Key` pada pembuatan tiket. Mock mengembalikan tiket yang sama untuk request berulang dan tidak menggandakan tiket aktif dengan kombinasi pekerja/perusahaan/periode/masalah sama. Implementasikan idempotensi atomik di BE.

## Workflow dan privasi

`SUBMITTED` → `IN_REVIEW` → `AWAITING_COMPANY` / `AWAITING_WORKER` → `IN_REVIEW` → `RESOLVED`. Petugas juga dapat meneruskan pemeriksaan atau menutup tanpa perubahan data. Tiket selesai menolak mutasi lanjut. Transisi dan pembaruan catatan harus dilaksanakan atomik di BE dengan audit.

Pilihan `CORRECT` memerlukan bukti klarifikasi; `CORRECTION_REQUIRED` memerlukan tanggal perbaikan. Resolusi `DATA_UPDATED` memerlukan konfirmasi catatan cocok; `NO_DATA_CHANGE` melarang pembaruan bulanan. Data belum lengkap atau upah yang belum cocok tidak dapat menjadi `MATCHED` hanya dengan menutup tiket.

UI menyaring catatan pekerja, event `WORKER_OFFICER`, dan bukti yang tidak dibagikan dari tampilan perusahaan. Pada produksi, BE harus menghilangkan atribut tersebut sebelum respons dikirim; jangan hanya bergantung pada penyaringan UI. BE dapat mengembalikan `workerNote:""`, event dan bukti yang sudah disaring, serta daftar pekerja/tiket yang dibatasi identitas. Petugas harus dibatasi wilayah/wewenangnya. Query filter bukan otorisasi.

## Bukti dan data resmi

`attachPayslip`, `evidenceAttached`, serta DTO evidence `synthetic:true` sengaja merepresentasikan dokumen fiktif. Tidak ada upload, akses dokumen nyata, atau koneksi ke sumber kepesertaan sungguhan. Untuk produksi, tambahkan layanan unggah serta `evidenceIds` terverifikasi, metadata file, izin akses, dan skema DTO versi berikutnya. Jangan menganggap boolean ini sebagai bukti pembayaran. Perubahan pekerjaan mencatat informasi pekerja, tidak otomatis mengganti catatan resmi.

OpenAPI di `openapi.json` mendokumentasikan kontrak mock v1. Refinement lintas atribut seperti kewajiban bukti dan tanggal tetap harus diterapkan BE; JSON Schema alone tidak menjelaskan semua aturan workflow.

