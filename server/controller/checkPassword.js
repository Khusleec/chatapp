const UserModel = require("../models/UserModel");
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function checkPassword(request, response) {
    try {
        const { password, userId } = request.body;
        const user = await UserModel.findById(userId);

        const verifyPassword = await bcryptjs.compare(password, user.password);
        // console.log(verifyPassword)
        if (!verifyPassword) {
            return response.status(400).json({
                message: "Please check the password",
                error: true
            });
        }

        const tokenData = {
            id: user._id,
            email: user.email
        };

        console.log(process.env.JWT_SECRET_KEY)

        const token = await jwt.sign(tokenData, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });
        const cookieOptions = {
            httpOnly: true, // Зассан хэсэг
            secure: true // Аюулгүй байдлыг хангахын тулд
        };

        return response.cookie('token', token, cookieOptions).status(200).json({
            message: "Login successfully",
            token: token,
            success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true
        });
    }
}

module.exports = checkPassword;
