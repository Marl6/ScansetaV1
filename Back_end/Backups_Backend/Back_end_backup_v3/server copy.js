// back_end/server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Path to the database
const dbPath = path.join(__dirname, 'medicine_infos.db');

// Middleware to parse JSON requests
app.use(express.json());

// Endpoint to get medicine info
app.get('/medicine/:name', (req, res) => {
    const medicineName = req.params.name;

    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
    });

    const sql = `SELECT * FROM medicines WHERE generic_name = ?`;
    db.get(sql, [medicineName], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database query error' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Medicine not found' });
        }
        res.json(row);
    });

    db.close();
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});