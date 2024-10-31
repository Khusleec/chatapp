const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');

const getUserDetailsFromToken = async (token) => {
    
    if (!token) {
        return {
            message: "Session expired",
            logout: true,
        };
    }

    try {
        // Verify the token using the correct environment variable
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        console.log(decoded)

        // Fetch user details from the database
        const user = await UserModel.findById(decoded.id);

        if (!user) {
            return {
                message: "User not found",
                logout: true,
            };
        }

        return user;
    } catch (error) {
        console.error("Error verifying token:", error);
        return {
            message: "Invalid token",
            logout: true,
        };
    }
};

module.exports = getUserDetailsFromToken;

