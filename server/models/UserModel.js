const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Provide name"]
    },
    email: {
        type: String,
        required: [true, "Provide email"],
        unique: true
    },
    username: {
        type: String,
        required: [true, "Provide username"],
        unique: true  // Ensures usernames are unique
    },
    password: {
        type: String,
        required: [true, "Provide password"]
    },
    profile_pic: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;
