const mongoose = require('mongoose');

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);  // Зассан хэсэг

        const connection = mongoose.connection;

        connection.on('connected', () => {
            console.log("Connected to DB");
        });

        connection.on('error', (error) => {
            console.log("Something is wrong with MongoDB:", error);
        });
    } catch (error) {
        console.log("Something is wrong:", error);
    }
}

module.exports = connectDB;
