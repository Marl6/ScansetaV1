const express = require('express');
const cors = require('cors'); // Import the cors package
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 5000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json()); // Enable JSON parsing in Express

// Open the SQLite database
const db = new sqlite3.Database('C:/Users/Gwen/Downloads/Scanseta (FINAL BACKUP Jan 28 2025)/Scanseta (FINAL BACKUP Jan 28 2025)/Scanseta (FINAL BACKUP Jan 28 2025)/Back_end/medicine_infos.db');

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to the Medicine API!');
});

// API endpoint to get medicine info by name
app.get('/medicine/:medicineName', (req, res) => {
    const medicineName = req.params.medicineName;
    const sql = 'SELECT * FROM medicines WHERE generic_name = ? COLLATE NOCASE';

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


// API endpoint to handle scan-image
app.get('/scan-image', (req, res) => {
    res.json({ message: 'Scan Image endpoint reached!' });
});


// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
