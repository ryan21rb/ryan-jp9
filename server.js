const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

/* 
========================================================================
KONFIGURASI DATABASE MYSQL ONLINE (cPanel)
------------------------------------------------------------------------
PENTING: Agar komputer lokal Anda bisa terhubung ke database cPanel,
Anda wajib menambahkan IP Publik internet lokal Anda (atau gunakan tanda '%') 
di menu "Remote MySQL" pada cPanel himaif-iwu.com Anda.
========================================================================
*/
const dbConfig = {
    host: 'himaif-iwu.com',             // Nama domain hosting cPanel Anda
    user: 'himaifiw_jp_9',              // User database Anda (sesuaikan jika berbeda, misal: himaifiw)
    password: 'Q?L}FsXtPDD=Wbr7',       // Password database yang Anda berikan
    database: 'himaifiw_jp_9',          // Nama database di phpMyAdmin cPanel Anda
    port: 3306                          // Port MySQL standar
};

let db = null;
let isConnecting = false;

function connectDatabase() {
    if (isConnecting) return;
    isConnecting = true;

    console.log(`Mencoba menghubungkan ke MySQL Online (${dbConfig.host})...`);
    const connection = mysql.createConnection(dbConfig);

    connection.connect((err) => {
        isConnecting = false;
        if (err) {
            console.error("====================================================");
            console.error("GAGAL MENGHUBUNGKAN KE SERVER MYSQL ONLINE!");
            console.error("Pesan Error:", err.message);
            console.error("----------------------------------------------------");
            console.error("SOLUSI MASALAH INI:");
            console.error("1. Pastikan IP Publik Anda sudah di-whitelist di menu 'Remote MySQL' di cPanel.");
            console.error("2. Pastikan username ('himaifiw_jp_9') dan nama database sudah sesuai.");
            console.error("====================================================");

            db = null;
            // Coba lagi menghubungkan setelah 7 detik
            setTimeout(connectDatabase, 7000);
            return;
        }

        console.log("Berhasil terhubung ke database MySQL cPanel!");

        // Buat tabel users jika belum ada (jika sudah ada, MySQL tidak akan menimpanya)
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL
            )
        `;
        connection.query(createTableQuery, (err) => {
            if (err) {
                console.error("Gagal memeriksa/membuat tabel 'users':", err.message);
                connection.end();
                db = null;
                setTimeout(connectDatabase, 7000);
            } else {
                console.log("Tabel 'users' siap digunakan di database MySQL Online.");
                db = connection;
            }
        });
    });

    // Tangani error koneksi tak terduga setelah terhubung
    connection.on('error', (err) => {
        console.error('Database connection error event:', err.message);
        db = null;
        if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNREFUSED') {
            console.log('Koneksi terputus/gagal. Mencoba menghubungkan kembali ke MySQL Online...');
            setTimeout(connectDatabase, 7000);
        }
    });
}

connectDatabase();

// API endpoint untuk Registrasi Konvensional (mendukung lokal & subdirectory cPanel)
app.post(['/api/register', '/backend/api/register'], (req, res) => {
    if (!db) {
        return res.status(503).json({
            success: false,
            error: "Database online belum siap. Pastikan konfigurasi Remote MySQL di cPanel sudah benar."
        });
    }
    const { username, password } = req.body;
    const hashedPassword = Buffer.from(password).toString('base64'); // Simulasi hash server-side

    db.query(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], (err, results) => {
        if (err) {
            console.error("Error Registrasi:", err.message);
            return res.status(500).json({ success: false, error: "Username mungkin sudah terdaftar atau terjadi error database." });
        }
        res.json({ success: true, message: "Data berhasil disimpan ke MySQL Online!" });
    });
});

// API endpoint untuk Login Konvensional (mendukung lokal & subdirectory cPanel)
app.post(['/api/login', '/backend/api/login'], (req, res) => {
    if (!db) {
        return res.status(503).json({
            success: false,
            error: "Database online belum siap. Pastikan konfigurasi Remote MySQL di cPanel sudah benar."
        });
    }
    const { username, password } = req.body;
    const hashedPassword = Buffer.from(password).toString('base64');

    db.query(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, hashedPassword], (err, results) => {
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
// GANTI baris app.listen(3000) menjadi ini:
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend Server running on port ${PORT}`));
