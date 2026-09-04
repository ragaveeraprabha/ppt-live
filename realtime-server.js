const { createServer } = require("http");
const { Server } = require("socket.io");

const hostname = "0.0.0.0";
const port = Number(process.env.REALTIME_PORT) || 5031;
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: true },
  maxHttpBufferSize: 50 * 1024 * 1024,
});

let currentSlide = 1;
let currentPresentation = null;

io.on("connection", (socket) => {
  const role = socket.handshake.auth?.role === "admin" ? "admin" : "viewer";
  socket.data.role = role;
  console.log(`Client connected: ${socket.id} (${role})`);

  if (currentPresentation) {
    socket.emit("presentation-upload", currentPresentation);
  }
  socket.emit("slide-change", currentSlide);

  socket.on("change-slide", (slideNumber) => {
    if (socket.data.role !== "admin" || !Number.isInteger(slideNumber) || slideNumber < 1) {
      return;
    }

    currentSlide = slideNumber;
    io.emit("slide-change", currentSlide);
  });

  socket.on("presentation-upload", (presentation) => {
    if (
      socket.data.role !== "admin" ||
      !presentation ||
      typeof presentation.name !== "string" ||
      typeof presentation.data !== "string"
    ) {
      return;
    }

    currentPresentation = presentation;
    currentSlide = 1;
    io.emit("presentation-upload", currentPresentation);
    io.emit("slide-change", currentSlide);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(port, hostname, () => {
  console.log(`> Socket.IO server ready on http://${hostname}:${port}`);
});