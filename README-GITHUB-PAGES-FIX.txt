VORTEXUS 26 — GITHUB PAGES + FIREBASE ONLINE

ISI ZIP INI SUDAH DIBERSIHKAN UNTUK GITHUB PAGES.

1. Upload SEMUA ISI ZIP ini ke ROOT repository GitHub Pages (jangan membuat folder VORTEXUS26_LENGKAP di dalam repository).
2. Jangan upload file PHP/database/.htaccess dari versi lama. GitHub Pages tidak menjalankan PHP.
3. Pastikan index.html berada langsung di ROOT repository.
4. Settings > Pages > Deploy from branch > main > /(root).
5. Isi firebase-config.js sesuai project Firebase kamu.
6. Aktifkan Authentication Email/Password, Firestore, dan Storage di Firebase.
7. Pasang isi firestore.rules dan storage.rules pada Firebase Console.
8. Buat akun 4 kelas + 1 admin, lalu isi emailnya di firebase-config.js.
9. Setelah konfigurasi selesai, upload foto/video dari website. Data akan tersimpan online di Firebase sehingga hasil approval dapat dilihat semua perangkat.

STRUKTUR ROOT:
index.html
login.html
admin-login.html
admin.html
style.css
script.js
github-pages.js
firebase-config.js
firestore.rules
storage.rules
logo-smkn1.png
logo-vortexus.png
.nojekyll

CATATAN PENTING:
- Firebase config di frontend boleh berisi Web API key; keamanan data ditentukan oleh Authentication dan Security Rules.
- 3 foto yang sebelumnya hanya tersimpan di browser admin tidak otomatis pindah ke Firebase. Foto tersebut perlu di-upload ulang setelah Firebase aktif.
