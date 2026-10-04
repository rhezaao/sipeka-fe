# SIPEKA · Next.js

Prototipe baru dan mandiri. Proyek `../sipeka` tidak diubah. Seluruh identitas, catatan JKN, bukti, dan tiket adalah data fiktif; tidak menggunakan integrasi BPJS.

## Menjalankan

Node.js >= 20.9 dan pnpm 11 diperlukan.

```sh
pnpm install
pnpm dev
```

Buka http://localhost:3001. Untuk pemeriksaan:

```sh
pnpm typecheck
pnpm test
pnpm build
```

Build menghasilkan situs statis di `out/`. Tidak ada database, API route, server action, atau permintaan HTTP dalam mode default. Perubahan tiket berjalan di memori React dan kembali ke JSON awal saat reload/reset. Navigasi Next.js dalam sesi mempertahankan perubahan. Draf form hanya selama halaman form terbuka.

## Stack

Next.js 16 (App Router), React 19, TypeScript strict, CSS responsif, Zod untuk validasi DTO. Seluruh tampilan memakai Poppins yang dibundel lokal melalui `@fontsource/poppins`, termasuk judul, form, tabel, dan tombol. SVG lokal; tanpa permintaan font eksternal saat aplikasi dibuka.

## Login statis

Buka `/login/` atau halaman awal. Peran ditentukan akun, tanpa pemilih peran di dashboard.

| Peran | Username | Password |
| --- | --- | --- |
| Pekerja | `pekerja` | `Pekerja123!` |
| Perusahaan | `perusahaan` | `Perusahaan123!` |
| Petugas BPJS Kesehatan | `petugas` | `Petugas123!` |

Akun adalah fixture publik di `src/data/demo-accounts.json`. Login statis ini hanya simulasi frontend. Session menyimpan username di `sessionStorage` untuk mempertahankan login saat reload, tanpa menyimpan password. Dashboard mengarahkan pengguna yang belum login ke `/login/`, dan akun yang membuka route peran lain diarahkan ke berandanya sendiri. Penjagaan UI bukan otorisasi server.

Tombol **Keluar** mengakhiri login. Masuk dengan akun lain untuk melanjutkan alur lintas peran; navigasi internal dan pergantian akun mempertahankan tiket di memori. Reload tetap mengembalikan JSON tiket awal. Pemilih pekerja masih tersedia untuk mencoba skenario fiktif.

## Coba alur utama

1. Login **pekerja**, pilih **Dimas Pratama**, September 2026. Buka pemeriksaan → buat aduan → konfirmasi → lampirkan slip fiktif → tinjau → kirim.
2. Keluar, login **petugas**, buka antrean dan tiket baru → mulai pemeriksaan → minta klarifikasi perusahaan.
3. Keluar, login **perusahaan**, buka tiket → beri klarifikasi dan lampiran rekonsiliasi simulasi.
4. Keluar, login **petugas**, buka tiket yang sama → catat hasil → konfirmasi catatan telah cocok → selesaikan.
5. Keluar, login **pekerja**, lihat linimasa dan September yang kini sesuai dalam simulasi.

Nadia memberi contoh data sesuai. Arif memiliki contoh tiket selesai akibat keterlambatan pembaruan. Sinta memberi contoh data belum tersedia; catatan minimum yang belum lengkap tidak dapat dipaksa menjadi sesuai.

## Struktur

- `src/data/placeholder.json`: satu sumber data statis, boleh diubah langsung dengan format yang sama.
- `src/domain/schemas.ts`: DTO, enum, dan validasi Zod; tipe TypeScript diturunkan dari skema.
- `src/domain/labels.ts`: label Bahasa Indonesia dan format angka/tanggal, terpisah dari kode API.
- `src/services/contracts.ts`: antarmuka akses data.
- `src/services/mock-repository.ts`: simulasi workflow di memori.
- `src/services/http-repository.ts`: adapter opsional untuk backend Anda; belum diaktifkan.
- `src/components/`: komponen React dan formulir per peran.
- `src/app/`: route pekerja, perusahaan, dan petugas.
- `docs/backend-integration.md` dan `docs/openapi.json`: kontrak integrasi.
- `tests/`: pemeriksaan lifecycle, isolasi data periode, dan transport HTTP.

`scripts/generate-fixtures.mjs` hanya alat untuk membuat ulang JSON awal. Aplikasi membaca JSON yang sudah tersimpan; generator tidak dijalankan saat aplikasi digunakan.

## Backend dan deployment

Lihat `docs/backend-integration.md`. Default selalu `mock`. Adapter HTTP memakai base URL backend Anda, bukan alamat BPJS. Kontrak frontend dapat diimpor atau disalin ke BE TypeScript, atau memakai OpenAPI untuk BE bahasa lain.

Project ini dapat dibuat sebagai project Vercel baru dengan framework Next.js dan build `pnpm build`. Jika repository berisi folder ini bersama proyek lain, gunakan Root Directory `sipeka-nextjs`. Biarkan Output Directory pada default framework (override dimatikan); jangan set `out`. Adapter Next.js Vercel membaca metadata build dari `.next` dan menangani konfigurasi `output: "export"` secara otomatis. `out/` dipakai untuk hosting HTML statis biasa. Jangan tautkan folder ini ke project deployment lama jika ingin mempertahankan demo lama.

Login statis adalah demo, bukan autentikasi produksi. Semua JSON yang dibundel adalah publik. BE produksi harus menerapkan autentikasi, pembatasan akses per identitas/perusahaan, penyaringan atribut privat di server, idempotensi, audit, dan validasi transisi. Ganti `AuthProvider`/`demo-auth` dengan integrasi login BE Anda; adapter HTTP tetap terpisah dari komponen UI.
