VORTEXUS 26 — GITHUB PAGES + FIREBASE

Versi ini sudah diubah dari IndexedDB lokal menjadi backend online Firebase. GitHub Pages tetap menjadi hosting website, sedangkan Firebase menyimpan login, database metadata, dan foto/video.

PENTING: isi firebase-config.js sebelum deploy. Tanpa konfigurasi Firebase, upload/approval online belum aktif.

Setup singkat:
1. Buat project Firebase dan Web App.
2. Aktifkan Authentication > Sign-in method > Email/Password.
3. Buat 4 akun kelas: PPLDG26, OTOMOTIF26, ATPH26, BUSANA26. Email akun diisi ke firebase-config.js; password akun = kode kelas.
4. Buat 1 akun admin Email/Password. Emailnya diisi sebagai VORTEXUS_ADMIN_EMAIL.
5. Buat Firestore Database.
6. Buat Storage. Catatan: Cloud Storage for Firebase saat ini membutuhkan paket Blaze/pay-as-you-go; penggunaan gratis masih tersedia sesuai kuota Google.
7. Salin isi firestore.rules ke Firestore Rules dan storage.rules ke Storage Rules. Ganti EMAIL_ADMIN di kedua file dengan email admin kamu.
8. Isi firebase-config.js dengan konfigurasi Web App dari Firebase Console.
9. Upload seluruh isi folder ini ke root repository GitHub Pages.
10. Buka /MEMORY/ lalu login kelas, upload foto, masuk /MEMORY/admin-login.html untuk approve.

Keamanan:
- Pengunjung hanya membaca media approved.
- Upload harus memakai akun Firebase kelas.
- Hanya email admin yang ditetapkan di rules yang boleh melihat pending, approve, reject, atau delete.
- Password kelas tidak lagi hanya dipercaya dari JavaScript; login dilakukan oleh Firebase Authentication.

Catatan foto lama:
3 foto yang sebelumnya terlihat di panel lokal berada di IndexedDB browser laptop dan TIDAK ikut tersimpan di ZIP/GitHub. Setelah backend Firebase aktif, tiga foto tersebut perlu di-upload ulang dari halaman website agar masuk ke penyimpanan online.
