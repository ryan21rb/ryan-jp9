const express = require('express');
const cors = require('cors');

const app = express();

// Konfigurasi CORS Lintas Domain (Supaya Vercel bisa akses)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Jalur Root untuk Testing di Browser (Mencegah Error Cannot GET /)
app.get(['/', '/backend'], (req, res) => {
    res.json({
        status: "active",
        message: "Backend Server Node.js HIMAIF IWU Berhasil Menyala Tanpa Crash!"
    });
});

// Gunakan Port dinamis dari Phusion Passenger cPanel
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend Server running on port ${PORT}`));