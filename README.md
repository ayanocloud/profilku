# 🚀 Web Profil Interaktif & Admin Dashboard (Full-Stack GAS + Tailwind CSS)

Project website profil pribadi & portofolio interaktif modern dengan **Admin Dashboard** terproteksi, menggunakan **Google Sheets** sebagai basis data (*database*) dan **Google Apps Script (GAS)** sebagai backend serverless API.

---

## 📁 Struktur File Project

```text
profilku/
├── Code.gs             # Backend Google Apps Script (doGet, doPost, API, Database CRUD)
├── Index.html          # Frontend Web Profil Publik (Hero, About, Projects, Contact, Footer)
├── Admin.html          # Admin Dashboard (Autentikasi Passcode, Tab Management, CRUD)
├── js/
│   ├── api.js          # Utilitas terpusat apiCall, penanganan CORS, Toast & Demo Mock Data
│   ├── main.js         # Logika interaktif halaman profil publik & fetch data portofolio
│   └── admin.js        # Logika autentikasi admin, tab switching, dan operasi CRUD
└── README.md           # Panduan lengkap instalasi, deployment, dan konfigurasi
```

---

## 🗄️ 1. Skema Database Google Sheets

Database terdiri dari 3 sheet/tab di dalam satu file Google Spreadsheet:

### A. Sheet `Profile` (Key-Value)
| Key (Kolom A) | Value (Kolom B) |
|---|---|
| `Name` | Ahmad Rizky Pratama |
| `Role` | Full Stack Developer & Cloud Architect |
| `Bio` | Software engineer dengan pengalaman membangun aplikasi web modern... |
| `Email` | ahmad.rizky@example.com |
| `Phone` | +62 812-3456-7890 |
| `Github` | https://github.com/username |
| `Linkedin` | https://linkedin.com/in/username |
| `Instagram` | https://instagram.com/username |
| `Admin_Passcode` | `admin123` *(Dapat diubah lewat Admin Dashboard)* |

### B. Sheet `Projects`
Menyimpan daftar karya dan portofolio:
- **Kolom A**: `ID` (e.g. `proj_1`, `proj_2`)
- **Kolom B**: `Title` (Judul Proyek)
- **Kolom C**: `Description` (Deskripsi Lengkap)
- **Kolom D**: `Image_URL` (URL Gambar Sampul / Screenshot Proyek)
- **Kolom E**: `Tech_Stack` (Daftar teknologi dipisahkan koma, misal: *React, Tailwind CSS, Python*)
- **Kolom F**: `Category` (Kategori Proyek, misal: *Web Development, Mobile App, AI*)
- **Kolom G**: `Project_URL` (Tautan demo live atau repositori GitHub)
- **Kolom H**: `Created_At` (Timestamp ISO tanggal pembuatan)

### C. Sheet `Messages`
Menampung pesan masuk dari form kontak publik:
- **Kolom A**: `Timestamp` (Waktu pesan dikirim, e.g. `2026-10-30 15:30:00`)
- **Kolom B**: `Name` (Nama Pengirim)
- **Kolom C**: `Email` (Alamat Email Pengirim)
- **Kolom D**: `Subject` (Subjek Pesan)
- **Kolom E**: `Message` (Isi Pesan Lengkap)

> 💡 **Fitur Otomatis:** Anda **tidak perlu** membuat tabel di atas secara manual! Fungsi `setupDatabase()` di dalam `Code.gs` akan membuatkan seluruh sheet beserta data awal (*seed data*) dalam 1 kali klik.

---

## ⚙️ 2. Langkah Instalasi & Deployment Google Apps Script

### Langkah 1: Buat Google Spreadsheet Baru
1. Buka [Google Sheets](https://sheets.new) di browser Anda.
2. Beri nama spreadsheet, misalnya: **"Database Profil Web"**.

### Langkah 2: Buka Script Editor (Google Apps Script)
1. Di menu atas Google Spreadsheet, klik **Extensions (Ekstensi)** > **Apps Script**.
2. Hapus seluruh kode default di file `Code.gs`, lalu salin seluruh isi dari file [`Code.gs`](file:///Users/macbookprom12020/Documents/Ayat%20File/Proyek%20Website/profilku/Code.gs) di project ini dan tempelkan (*paste*).
3. Simpan proyek dengan menekan `Ctrl + S` atau `Cmd + S`.

### Langkah 3: Inisialisasi Database Otomatis
1. Pada toolbar atas editor Apps Script, pilih fungsi **`setupDatabase`** pada dropdown menu fungsi.
2. Klik tombol **Run (Jalankan)** ▶️.
3. Berikan izin (*authorization*) ketika Google meminta izin akses spreadsheet (klik *Review permissions* > pilih akun Anda > *Advanced* > *Go to ... (unsafe)* > *Allow*).
4. Kembali ke tab Google Spreadsheet Anda, sheet `Profile`, `Projects`, dan `Messages` kini sudah terisi otomatis!

### Langkah 4: Deploy sebagai Web App
1. Di pojok kanan atas editor Apps Script, klik tombol biru **Deploy** > **New deployment**.
2. Klik ikon gerigi ⚙️ di samping "Select type", pilih **Web app**.
3. Isi konfigurasi sebagai berikut:
   - **Description**: `Web Profil API v1`
   - **Execute as**: **`Me (emailanda@gmail.com)`**
   - **Who has access**: **`Anyone`** *(Penting: Harus dipilih 'Anyone' agar frontend dapat mengakses API tanpa login akun Google)*
4. Klik **Deploy**.
5. Salin (**Copy**) URL Web App yang muncul (format: `https://script.google.com/macros/s/AKfycb.../exec`).

---

## 🔗 3. Menghubungkan Frontend ke Google Apps Script

Ada dua cara mudah untuk menghubungkan frontend ke backend API Anda:

### Cara A: Melalui Antarmuka Langsung (Tanpa Edit File)
1. Buka `Index.html` atau `Admin.html` di browser Anda.
2. Klik tombol ikon **Setting ⚙️** (atau link **Atur URL API** di banner atas).
3. Tempelkan (*paste*) URL Web App Google Apps Script Anda ke kotak input.
4. Klik **Simpan & Hubungkan**. URL akan tersimpan di `localStorage` peramban Anda.

### Cara B: Mengisi Default URL di File `js/api.js`
Buka file [`js/api.js`](file:///Users/macbookprom12020/Documents/Ayat%20File/Proyek%20Website/profilku/js/api.js) lalu ubah variabel `DEFAULT_GAS_API_URL`:
```javascript
const DEFAULT_GAS_API_URL = "https://script.google.com/macros/s/AKfycb.../exec";
```

---

## 🖥️ 4. Menjalankan Website Secara Lokal

Anda dapat membuka file `Index.html` langsung dengan double-click di browser, atau menggunakan local web server:

```bash
# Menggunakan Python 3:
python3 -m http.server 8080

# Lalu buka di browser:
# Halaman Publik: http://localhost:8080/Index.html
# Dashboard Admin: http://localhost:8080/Admin.html
```

---

## 🔐 5. Panduan Penggunaan Admin Dashboard (`Admin.html`)

1. Buka `Admin.html` di browser Anda.
2. Masukkan passcode default: **`admin123`** lalu klik **Masuk Dashboard**.
3. **Tab Portofolio**:
   - Tambah proyek baru dengan klik tombol **Tambah Proyek Baru**.
   - Edit atau Hapus portofolio langsung dari tabel. Perubahan akan tersinkronisasi ke sheet `Projects`.
4. **Tab Profil**:
   - Perbarui nama, role, bio singkat, email, no HP, dan tautan sosial media.
   - Anda juga dapat mengganti **Admin Passcode** di bagian bawah form untuk meningkatkan keamanan.
5. **Tab Pesan Masuk**:
   - Melihat daftar pesan yang dikirim pengunjung melalui form kontak.
   - Klik ikon **Balas** untuk langsung membuka aplikasi email Anda, atau klik **Hapus** untuk menghapus pesan dari spreadsheet.
