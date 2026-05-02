const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const path = require('path'); // <-- Added this

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 👇 FIX: Point to the 'client' folder correctly!
app.use(express.static(path.join(__dirname, '../client')));

io.on('connection', (socket) => {
    console.log('🟢 New client connected:', socket.id);

    socket.on('vitals', async (data) => {
        try {
            const aiResponse = await axios.post('http://10.25.34.195:8000/predict', {
                heartRate: data.heartRate,
                spo2: data.spo2,
                lat: data.lat,
                lng: data.lng
            });

            const enrichedData = {
                ...data,
                risk: aiResponse.data.risk_score,
                status: aiResponse.data.status,
                hash: aiResponse.data.secure_hash,
                assigned_hospital: aiResponse.data.assigned_hospital
            };

            io.emit('update', enrichedData);

        } catch (error) {
            console.error("🔴 AI Agent unreachable. Using fallback logic.");
            io.emit('update', { ...data, risk: 0, status: 'OFFLINE', hash: 'Waiting...' });
        }
    });

    socket.on('send_message', (data) => {
        io.emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log('🔴 Client disconnected:', socket.id);
    });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Edge Gateway active on port ${PORT}`);
    console.log(`🧠 Routing AI Traffic to: http://192.168.0.10:8000/predict`);
});