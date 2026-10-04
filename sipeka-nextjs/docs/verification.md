# Pemeriksaan prototipe

- Build Next.js menghasilkan seluruh route sebagai static export (`out/`).
- TypeScript strict diperiksa sebagai bagian build.
- Tes repository memeriksa JSON/schema, relasi ID, idempotensi, workflow tiga peran, isolasi periode, bukti privat, validasi klarifikasi, pembaruan data minimum, reset sesi, dan format request/response HTTP.
- Review browser lokal: pekerja Dimas membuat laporan September, petugas memulai pemeriksaan dan meminta klarifikasi, perusahaan melampirkan rekonsiliasi fiktif, petugas menyelesaikan, kemudian pekerja melihat status September sesuai dan tiket selesai.
- Saat perusahaan membuka tiket, catatan privat pekerja serta slip yang tidak dibagikan tidak muncul di tampilan.
- Desain diperiksa di ukuran desktop dan seluler; tabel perbandingan menggunakan scroll horizontal di wadah tabel.
- Hash SHA-256 untuk seluruh 12 berkas proyek `../sipeka` (selain file environment yang tidak dibaca) tetap identik dengan sebelum pembuatan proyek baru.

Mode default tidak memanggil adapter HTTP. Tes HTTP memakai transport mock, bukan koneksi jaringan. Integrasi autentikasi, API nyata, upload dokumen asli, dan perilaku backend Anda belum diuji.

## Login statis dan Poppins

- Build statis dan seluruh 10 tes lulus setelah penambahan login.
- Browser: password salah menampilkan pesan validasi; ketiga akun yang benar masuk ke dashboard pekerja, perusahaan, dan petugas.
- Akun pekerja yang membuka `/bpjs/` diarahkan ke `/pekerja/`. Dashboard tanpa login mengarah ke `/login/`. Keluar kembali ke form login.
- Pemeriksaan computed style untuk heading, tombol, input, select, dan tabel menunjukkan `Poppins, sans-serif`; font berhasil dimuat dan WOFF2 masuk build lokal.
- Pemilih “Peran demo” tidak ada pada DOM dashboard.
- Login diperiksa pada desktop dan viewport seluler 390 × 844. Pratinjau tersimpan di `preview-login.jpg` dan `preview-login-mobile.jpg`.
