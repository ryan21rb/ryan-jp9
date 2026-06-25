const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// Konfigurasi CORS Lintas Domain (Supaya Vercel bisa akses)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

/* ========================================================================
   KONFIGURASI DATABASE MYSQL ONLINE (Menggunakan Connection Pool)
   ======================================================================== */
const dbConfig = {
    host: 'localhost',                  // Jauh lebih aman & cepat pakai localhost karena satu server cPanel
    user: 'himaifiw_jp_9',
    password: 'Q?L}FsXtPDD=Wbr7',
    database: 'himaifiw_jp_9',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 5,                 // Membatasi proses agar cPanel tidak terkena limit resource lagi
    queueLimit: 0
};

// Menggunakan Pool alih-alih createConnection biasa agar auto-reconnect tanpa bikin crash
const pool = mysql.createPool(dbConfig);

// Cek koneksi awal sekaligus buat tabel jika belum ada
pool.getConnection((err, connection) => {
    if (err) {
        console.error("====================================================");
        console.error("GAGAL MENGHUBUNGKAN KE MYSQL INTERNAL LOCALHOST:", err.message);
        console.error("Pastikan User Database sudah di-Assign ke Database di cPanel dengan ALL PRIVILEGES.");
        console.error("====================================================");
        return;
    }

    console.log("Berhasil terhubung ke database MySQL Localhost!");

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL
        )
    `;
    connection.query(createTableQuery, (err) => {
        connection.release(); // Kembalikan koneksi ke pool
        if (err) {
            console.error("Gagal memeriksa/membuat tabel 'users':", err.message);
        } else {
            console.log("Tabel 'users' siap digunakan.");
        }
    });
});

// Jalur Root untuk Testing di Browser (Mencegah Error Cannot GET /)
app.get(['/', '/backend'], (req, res) => {
    res.json({
        status: "active",
        message: "Backend Server Node.js HIMAIF IWU Berhasil Menyala Tanpa Crash!"
    });
});

// API endpoint untuk Registrasi
app.post(['/api/register', '/backend/api/register'], (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = Buffer.from(password).toString('base64');

    pool.query(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], (err, results) => {
        if (err) {
            console.error("Error Registrasi:", err.message);
            return res.status(500).json({ success: false, error: "Username sudah terdaftar atau terjadi error database." });
        }
        res.json({ success: true, message: "Data berhasil disimpan ke MySQL Online!" });
    });
});

// API endpoint untuk Login
app.post(['/api/login', '/backend/api/login'], (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = Buffer.from(password).toString('base64');

    pool.query(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, hashedPassword], (err, results) => {
        if (err) {
            console.error("Error Login:", err.message);
            return res.status(500).json({ success: false, error: "Terjadi kesalahan sistem saat verifikasi." });
        }
        if (results.length === 0) {
            return res.json({ success: false, message: "Kredensial salah atau tidak ditemukan." });
        }
        res.json({ success: true, message: "Sesi dicocokkan di MySQL Online!" });
    });
});

// Gunakan Port dinamis dari Phusion Passenger cPanel
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend Server running on port ${PORT}`));