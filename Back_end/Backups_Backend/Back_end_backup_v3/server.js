const express = require('express');
const cors = require('cors'); // Import the cors package
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 5000;

// Enable CORS for all routes
app.use(cors());

// Open the SQLite database
const db = new sqlite3.Database('D:\\EJIE SCHOOLING\\CLASSES\\5th year\\Thesis\\Scanseta_Collab\\Scanseta\\Back_end\\medicine_infos.db');

// API endpoint to get medicine info by name
app.get('/medicine/:medicineName', (req, res) => {
    const medicineName = req.params.medicineName;
    const sql = `SELECT * FROM medicines WHERE generic_name = ?`;

    db.get(sql, [medicineName], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ message: 'Medicine not found' });
        }
    });
});

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to the Medicine API!');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});