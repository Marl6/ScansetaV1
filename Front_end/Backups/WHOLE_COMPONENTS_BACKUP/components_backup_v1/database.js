// src/components/database.js
const getMedicineInfo = async (medicineName) => {
    try {
        const response = await fetch(`http://localhost:5000/medicine/${medicineName}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching medicine info:', error);
        throw error; // Rethrow the error for handling in the calling function
    }
};

module.exports = { getMedicineInfo };