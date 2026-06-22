const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Global durum yönetimi
let connectedUsers = {}; 

io.on('connection', (socket) => {
    console.log(`📡 Bağlantı sağlandı: ${socket.id}`);

    // Kullanıcı Kayıt/Giriş İşlemi
    socket.on('auth-user', (data) => {
        connectedUsers[socket.id] = {
            id: socket.id,
            username: data.username,
            avatar: data.username.charAt(0).toUpperCase(),
            currentVoiceRoom: null
        };
        socket.emit('auth-success', connectedUsers[socket.id]);
    });

    // Metin Sohbeti (Anlık Mesajlaşma)
    socket.on('msg-send', (text) => {
        const user = connectedUsers[socket.id];
        if (!user) return;

        const payload = {
            username: user.username,
            avatar: user.avatar,
            text: text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        io.emit('msg-receive', payload);
    });

    // Sesli Kanala Katılım
    socket.on('voice-join', (roomName) => {
        const user = connectedUsers[socket.id];
        if (!user) return;

        // Kullanıcı zaten bir odadaysa önce oradan çıkart
        if (user.currentVoiceRoom) {
            socket.leave(user.currentVoiceRoom);
            const oldRoom = user.currentVoiceRoom;
            user.currentVoiceRoom = null;
            updateRoomOccupants(oldRoom);
        }

        user.currentVoiceRoom = roomName;
        socket.join(roomName);
        updateRoomOccupants(roomName);
    });

    // Sesli Kanaldan Ayrılma
    socket.on('voice-leave', () => {
        const user = connectedUsers[socket.id];
        if (!user || !user.currentVoiceRoom) return;

        const targetRoom = user.currentVoiceRoom;
        user.currentVoiceRoom = null;
        socket.leave(targetRoom);
        updateRoomOccupants(targetRoom);
    });

    // Bağlantı Koptuğunda Güvenli Temizlik
    socket.on('disconnect', () => {
        const user = connectedUsers[socket.id];
        if (user) {
            const activeRoom = user.currentVoiceRoom;
            delete connectedUsers[socket.id];
            if (activeRoom) {
                updateRoomOccupants(activeRoom);
            }
        }
        console.log(`❌ Bağlantı kesildi: ${socket.id}`);
    });
});

// Odadaki üyeleri güncelleyen ve o odaya yayınlayan fonksiyon
function updateRoomOccupants(roomName) {
    const members = Object.values(connectedUsers).filter(u => u.currentVoiceRoom === roomName);
    io.to(roomName).emit('voice-room-update', members);
}

server.listen(PORT, () => {
    console.log(`🚀 Sunucu ${PORT} portunda ayağa kalktı.`);
});
