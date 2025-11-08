# 📈 CallMaker - Trading Signal Management System

![CallMaker](https://img.shields.io/badge/CallMaker-Trading%20Platform-blue)
![Vue.js](https://img.shields.io/badge/Vue.js-3.x-green)
![Node.js](https://img.shields.io/badge/Node.js-Express-brightgreen)
![MySQL](https://img.shields.io/badge/MySQL-Database-orange)

> CallMaker adalah aplikasi web modern berbasis **Vue.js** dan **Node.js (Express)** untuk mengelola sinyal trading dengan sistem **role-based authentication** (Admin, CallMaker, User).

---

## ✨ Fitur Utama

### 🔐 Sistem Autentikasi
- Login & Register dengan **JWT Token**
- **Role-based Access Control** (Admin / CallMaker / User)
- **Protected Routes** dengan validasi token otomatis

### 👥 Multi-Role System
#### 👑 Administrator
- Melihat seluruh sinyal
- Menyetujui / menolak sinyal pending
- Membuat sinyal langsung disetujui
- Mengelola pengguna

#### 📞 CallMaker
- Membuat sinyal trading baru
- Melihat dan mengedit sinyal yang dibuat sendiri
- Hanya dapat mengedit sinyal berstatus pending

#### 👤 User
- Melihat sinyal yang sudah disetujui
- Tidak bisa membuat atau mengedit sinyal

---

## 🛠️ Tech Stack

### Frontend
- ⚡ **Vue 3 (Composition API)**
- 🧭 **Vue Router** — navigasi antar halaman
- 🌐 **Axios** — komunikasi ke backend
- 🎨 **CSS3** — desain responsif dan ringan

### Backend
- 🟢 **Node.js + Express.js**
- 🔒 **JWT** — autentikasi berbasis token
- 🔑 **bcryptjs** — hashing password
- 🗄️ **Sequelize ORM** — koneksi MySQL
- 🧩 **MySQL** — database utama

---

## 🚀 Instalasi

### Prasyarat
- Node.js (v14 atau lebih tinggi)
- MySQL aktif
- npm atau yarn

### 1️⃣ Clone Repository
```bash
git clone https://github.com/rizkyprofs/Callmaker.git
cd Callmaker
```

### 2️⃣ Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Ubah konfigurasi database di file .env sesuai MySQL kamu
```

### 3️⃣ Setup Database
```sql
CREATE DATABASE callmaker_db;
```

### 4️⃣ Frontend Setup
```bash
cd ../client
npm install
```

---

## 🧭 Menjalankan Aplikasi

### Mode Development
**Backend (Port 5000)**
```bash
cd backend
npm run dev
```

**Frontend (Port 5173)**
```bash
cd client
npm run dev
```

> Akses aplikasi di: http://localhost:5173

### Mode Production
```bash
# Build frontend
cd client
npm run build

# Jalankan backend
cd ../backend
npm start
```

---

## 👤 Akun Default

| Role | Username | Password | Hak Akses |
|------|-----------|-----------|-----------|
| 👑 Admin | `admin` | `password` | Full access |
| 📞 CallMaker | `callmaker` | `password` | Membuat & kelola sinyal sendiri |
| 👤 User | `user` | `password` | Melihat sinyal yang sudah approved |

---

## 📁 Struktur Proyek

```
Callmaker/
├── client/                 # Frontend (Vue.js)
│   ├── src/
│   │   ├── views/         # Halaman utama
│   │   ├── router/        # Routing
│   │   └── main.js        # Entry point
│   └── package.json
├── backend/               # Backend (Express)
│   ├── routes/            # API routes
│   ├── models/            # Sequelize models
│   ├── middleware/        # Auth & validation
│   ├── config/            # Konfigurasi DB
│   └── server.js          # Entry server
└── README.md
```

---

## 🔌 API Endpoints

### 🔐 Authentication
| Method | Endpoint | Deskripsi |
|--------|-----------|------------|
| `POST` | `/api/auth/login` | Login pengguna |
| `POST` | `/api/auth/register` | Registrasi pengguna |
| `GET`  | `/api/auth/user` | Mendapatkan data pengguna aktif |

### 📊 Signals
| Method | Endpoint | Deskripsi |
|--------|-----------|------------|
| `GET` | `/api/signals` | Mendapatkan sinyal (filter per role) |
| `POST` | `/api/signals` | Membuat sinyal baru (CallMaker/Admin) |
| `PATCH` | `/api/signals/:id/status` | Update status sinyal (Admin) |
| `DELETE` | `/api/signals/:id` | Hapus sinyal (Admin/Pembuat) |

---

## 🎯 Contoh Penggunaan

### Sebagai Admin
1. Login dengan akun admin  
2. Lihat semua sinyal di dashboard  
3. Approve / reject sinyal pending  
4. Buat sinyal langsung “published”

### Sebagai CallMaker
1. Login sebagai CallMaker  
2. Tambah sinyal trading baru  
3. Lihat status sinyal  
4. Edit sinyal yang belum disetujui

### Sebagai User
1. Login sebagai user  
2. Lihat sinyal yang sudah approved  
3. Tidak bisa mengedit atau membuat sinyal

---

## 🐛 Troubleshooting

| Masalah | Solusi |
|----------|--------|
| ❌ **Database connection error** | Pastikan MySQL berjalan dan kredensial `.env` benar |
| ⚠️ **JWT token invalid** | Hapus `localStorage` dan login ulang |
| 🔥 **CORS blocked** | Pastikan backend berjalan di port 5000 dan CORS diaktifkan |

---

## 🤝 Kontribusi

1. Fork repository ini  
2. Buat branch baru:  
   ```bash
   git checkout -b feature/NamaFitur
   ```
3. Commit perubahan:
   ```bash
   git commit -m "Add: Nama fitur"
   ```
4. Push branch ke GitHub:
   ```bash
   git push origin feature/NamaFitur
   ```
5. Buka Pull Request 🎉

---

## 📄 Lisensi

Distribusikan di bawah lisensi **MIT License**.

---

## 👨‍💻 Author

**Rizky Profs**  
📦 Project: [CallMaker](https://github.com/rizkyprofs/Callmaker)  
💻 GitHub: [@rizkyprofs](https://github.com/rizkyprofs)
