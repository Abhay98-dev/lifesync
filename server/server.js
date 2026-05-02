const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const { calculateRisk } = require("./services/riskEngine");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

// Serve frontend
app.use(express.static(path.join(__dirname, "../client")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/ambulance.html"));
});

io.on("connection", (socket) => {
  console.log("Client connected");

  // VITALS
  socket.on("vitals", (data) => {
    const payload = {
      heartRate: Number(data.heartRate),
      spo2: Number(data.spo2),
      lat: data.lat,
      lng: data.lng,
      timestamp: Date.now()
    };

    const { risk, status } = calculateRisk(payload);

    const response = {
      ...payload,
      risk,
      status
    };

    io.emit("update", response);
  });

  // 💬 MESSAGE SYSTEM
  socket.on("send_message", (msgData) => {
    io.emit("receive_message", msgData);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

server.listen(3000, () => {
  console.log("🚑 Server running at http://localhost:3000");
});