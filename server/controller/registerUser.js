const UserModel = require("../models/UserModel");
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Function to generate JWT
function generateToken(user) {
    const secretKey = process.env.JWT_SECRET_KEY; // Get your secret key
    const payload = {
        userId: user._id,
        email: user.email,
        // Add any other claims as needed
    };

    // Create the token
    const token = jwt.sign(payload, secretKey, { expiresIn: '1h' }); // Token expires in 1 hour
    return token;
}

async function registerUser(request, response) {
    try {
        const { name, email, password, username } = request.body; // Removed profile_pic for now
        console.log(name,email,password)

        const checkEmail = await UserModel.findOne({ email });
        const checkUsername = await UserModel.findOne({ username });

        if (checkEmail || checkUsername) {
            return response.status(400).json({
                message: "User with this email or username already exists",
                error: true,
            });
        }

        // Hash the password
        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(password, salt);

        // Create user payload without including the password
        const userPayload = {
            name,
            email,
            username,
            password: hashPassword // Store the hashed password
        };

        // Save the user
        const user = new UserModel(userPayload);
        const userSave = await user.save();

        // Generate JWT for the newly created user
        const token = generateToken(userSave);

        return response.status(201).json({
            message: "User created successfully",
            data: {
                user: {
                    id: userSave._id,
                    name: userSave.name,
                    email: userSave.email,
                    username: userSave.username,
                    // Include any other user details you want to return
                },
                token, // Return the generated token
            },
            success: true
        });

    } catch (error) {
        console.error("Registration error:", error);
        return response.status(500).json({
            message: error.message || "An error occurred during registration",
            error: true
        });
    }
}

module.exports = registerUser;
