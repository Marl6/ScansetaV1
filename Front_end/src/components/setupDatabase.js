const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Define the paths for the databases
const frontendDbPath = path.join(__dirname, 'medicine_infos.db');
const backendDbPath = path.join('D:', 'EJIE SCHOOLING', 'CLASSES', '5th year', 'Thesis', 'Scanseta_Collab', 'Scanseta', 'Back_end', 'medicine_infos.db'); // Backend database path

// Function to create or open the database and set up the tables and data
// Function to create or open the database and set up the tables and data
const setupDatabase = (dbPath) => {
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
        } else {
            console.log(`Connected to the medicine_infos database at ${dbPath}.`);
            createTable(db); // Call createTable after successful connection
        }
    });

    // Close the database connection if it wasn't closed in insertMedicines
    db.on('close', () => {
        console.log(`Database connection closed for ${dbPath}.`);
    });
};

// Function to create the medicines table
const createTable = (db) => {
    db.run(`CREATE TABLE IF NOT EXISTS medicines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        generic_name TEXT NOT NULL,
        information TEXT NOT NULL,
        usage TEXT NOT NULL,
        complication TEXT NOT NULL,
        warning TEXT NOT NULL
    )`, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        } else {
            console.log('Medicines table created or already exists.');
            insertMedicines(db); // Call insertMedicines after table creation
        }
    });
};

// Function to insert medicines into the table
const insertMedicines = (db) => {
    const medicines = [
        { generic_name: "Amoxicillin", information: "Info about Amoxicillin", usage: "Usage of Amoxicillin", complication: "Complications of Amoxicillin", warning: "Warnings for Amoxicillin" },
        { generic_name: "Penicillin G benzathine", information: "Info about Penicillin G", usage: "Usage of Penicillin G", complication: "Complications of Penicillin G", warning: "Warnings for Penicillin G" },
        { generic_name: "Clavulanate", information: "Info about Clavulanate", usage: "Usage of Clavulanate", complication: "Complications of Clavulanate", warning: "Warnings for Clavulanate" },
        { generic_name: "Amlodipine", information: "Info about Amlodipine", usage: "Usage of Amlodipine", complication: "Complications of Amlodipine", warning: "Warnings for Amlodipine" },
        { generic_name: "Losartan", information: "Info about Losartan", usage: "Usage of Losartan", complication: "Complications of Losartan", warning: "Warnings for Losartan" },
        { generic_name: "Nifedipine", information: "Info about Nifedipine", usage: "Usage of Nifedipine", complication: "Complications of Nifedipine", warning: "Warnings for Nifedipine" },
        { generic_name: "Bactrim", information: "Info about Bactrim", usage: "Usage of Bactrim", complication: "Complications of Bactrim", warning: "Warnings for Bactrim" },
        { generic_name: "Nitrofurantoin", information: "Info about Nitrofurantoin", usage: "Usage of Nitrofurantoin", complication: "Complications of Nitrofurantoin", warning: "Warnings for Nitrofurantoin" },
        { generic_name: "Fosfomycin", information: "Info about Fosfomycin", usage: "Usage of Fosfomycin", complication: "Complications of Fosfomycin", warning: "Warnings for Fosfomycin" },
        { generic_name: "Insulin Regular", information: "Info about Insulin Regular", usage: "Usage of Insulin Regular", complication: "Complications of Insulin Regular", warning: "Warnings for Insulin Regular" },
        { generic_name: "Metformin", information: "Info about Metformin", usage: "Usage of Metformin", complication: "Complications of Metformin", warning: "Warnings for Met formin" },
        { generic_name: "Glimepiride", information: "Info about Glimepiride", usage: "Usage of Glimepiride", complication: "Complications of Glimepiride", warning: "Warnings for Glimepiride" },
        { generic_name: "Aciclovir", information: "Info about Aciclovir", usage: "Usage of Aciclovir", complication: "Complications of Aciclovir", warning: "Warnings for Aciclovir" },
        { generic_name: "Azathioprine", information: "Info about Azathioprine", usage: "Usage of Azathioprine", complication: "Complications of Azathioprine", warning: "Warnings for Azathioprine" },
        { generic_name: "Griseofulvin", information: "Info about Griseofulvin", usage: "Usage of Griseofulvin", complication: "Complications of Griseofulvin", warning: "Warnings for Griseofulvin" }
    ];

    // Use a transaction to insert multiple records
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        medicines.forEach(medicine => {
            db.run(`INSERT INTO medicines (generic_name, information, usage, complication, warning) VALUES (?, ?, ?, ?, ?)`,
                [medicine.generic_name, medicine.information, medicine.usage, medicine.complication, medicine.warning],
                (err) => {
                    if (err) {
                        console.error('Error inserting medicine:', err.message);
                    } else {
                        console.log(`Inserted ${medicine.generic_name}`);
                    }
                });
        });
        db.run("COMMIT", (err) => {
            if (err) {
                console.error('Error committing transaction:', err.message);
            } else {
                console.log('All medicines inserted successfully.');
                db.close(); // Close the database connection after all operations are done
            }
        });
    });
};

// Set up both databases
setupDatabase(frontendDbPath);
setupDatabase(backendDbPath);