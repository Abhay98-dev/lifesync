const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, '../client')));
app.get('/ambulance', (req, res) => res.sendFile(path.join(__dirname, '../client/ambulance.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, '../client/dashboard.html')));

// 🚨 ADITYA'S PC IP ADDRESS 🚨
const PYTHON_AI_BASE_URL = 'http://10.25.34.195:8000';

io.on('connection', (socket) => {
    console.log('🟢 Mobile Unit Connected:', socket.id);

    // ABHA ID LOOKUP
    socket.on('fetch_patient', async (abhaId) => {
        try {
            const response = await axios.get(`${PYTHON_AI_BASE_URL}/patient/${abhaId}`);
            if (response.data.status === 'success') {
                io.emit('patient_data_received', response.data.data);
            }
        } catch (error) {
            console.error("🔴 AI Vault unreachable for ABHA lookup.");
        }
    });

    // VITALS PIPELINE
    socket.on('vitals', async (data) => {
        try {
            const aiResponse = await axios.post(`${PYTHON_AI_BASE_URL}/predict`, data);
            io.emit('update', {
                ...data, risk: aiResponse.data.risk_score, status: aiResponse.data.status,
                hash: aiResponse.data.secure_hash, assigned_hospital: aiResponse.data.assigned_hospital
            });
        } catch (error) {
            console.error("🔴 AI Engine unreachable. Fallback engaged.");
            io.emit('update', { ...data, risk: 0, status: 'OFFLINE', hash: 'Awaiting network...' });
        }
    });

    socket.on('send_message', (data) => io.emit('receive_message', data));
    socket.on('disconnect', () => console.log('🔴 Unit Disconnected'));
});

server.listen(3000, '0.0.0.0', () => {
    console.log(`🚀 Edge Gateway active on port 3000`);
    console.log(`🧠 AI Engine Target: ${PYTHON_AI_BASE_URL}`);
});