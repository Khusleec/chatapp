// socket/index.js
const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const getUserDetailsFromToken = require('../helpers/getUserDetailsFromToken');
const UserModel = require('../models/UserModel');
const { ConversationModel, MessageModel } = require('../models/ConversationModel');
const getConversation = require('../helpers/getConversation');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true
    }
});

const onlineUser = new Set();

io.on('connection', async (socket) => {
    console.log("Connected User: ", socket.id);

    const token = socket.handshake.auth.token;
    const user = await getUserDetailsFromToken(token);

    if (user && user._id) {
        socket.join(user._id.toString());
        onlineUser.add(user._id.toString());

        io.emit('onlineUser', Array.from(onlineUser));

        socket.on('message-page', async (userId) => {
            const userDetails = await UserModel.findById(userId).select("-password");
            
            const payload = {
                _id: userDetails?._id,
                name: userDetails?.name,
                email: userDetails?.email,
                profile_pic: userDetails?.profile_pic,
                online: onlineUser.has(userId)
            };
            socket.emit('message-user', payload);

            const conversation = await ConversationModel.findOne({
                "$or": [
                    { sender: user._id, receiver: userId },
                    { sender: userId, receiver: user._id }
                ]
            }).populate('messages').sort({ updatedAt: -1 });

            socket.emit('message', conversation?.messages || []);
        });

        socket.on('new message', async (data) => {
            let conversation = await ConversationModel.findOne({
                "$or": [
                    { sender: data.sender, receiver: data.receiver },
                    { sender: data.receiver, receiver: data.sender }
                ]
            });

            if (!conversation) {
                conversation = await ConversationModel.create({
                    sender: data.sender,
                    receiver: data.receiver
                });
            }

            const message = new MessageModel({
                text: data.text,
                imageUrl: data.imageUrl,
                videoUrl: data.videoUrl,
                msgByUserId: data.msgByUserId
            });
            const savedMessage = await message.save();

            await ConversationModel.updateOne(
                { _id: conversation._id },
                { "$push": { messages: savedMessage._id } }
            );

            const updatedConversation = await ConversationModel.findOne({
                "$or": [
                    { sender: data.sender, receiver: data.receiver },
                    { sender: data.receiver, receiver: data.sender }
                ]
            }).populate('messages').sort({ updatedAt: -1 });

            io.to(data.sender).emit('message', updatedConversation?.messages || []);
            io.to(data.receiver).emit('message', updatedConversation?.messages || []);

            const conversationSender = await getConversation(data.sender);
            const conversationReceiver = await getConversation(data.receiver);

            io.to(data.sender).emit('conversation', conversationSender);
            io.to(data.receiver).emit('conversation', conversationReceiver);
        });

        socket.on('sidebar', async (currentUserId) => {
            const conversation = await getConversation(currentUserId);
            socket.emit('conversation', conversation);
        });

        socket.on('seen', async (msgByUserId) => {
            let conversation = await ConversationModel.findOne({
                "$or": [
                    { sender: user._id, receiver: msgByUserId },
                    { sender: msgByUserId, receiver: user._id }
                ]
            });

            const conversationMessageIds = conversation?.messages || [];

            await MessageModel.updateMany(
                { _id: { "$in": conversationMessageIds }, msgByUserId: msgByUserId },
                { "$set": { seen: true } }
            );

            const conversationSender = await getConversation(user._id.toString());
            const conversationReceiver = await getConversation(msgByUserId);

            io.to(user._id.toString()).emit('conversation', conversationSender);
            io.to(msgByUserId).emit('conversation', conversationReceiver);
        });
    } else {
        console.error("User not authenticated or user ID is missing.");
        socket.emit("error", { message: "User not authenticated." });
    }

    socket.on('disconnect', () => {
        // Only delete if `user` and `user._id` exist
        if (user && user._id) {
            onlineUser.delete(user._id.toString());
            console.log('Disconnected User: ', socket.id);
            io.emit('onlineUser', Array.from(onlineUser));
        } else {
            console.log("User was not authenticated or already removed.");
        }
    });
});

module.exports = {
    app,
    server,
    io
};
