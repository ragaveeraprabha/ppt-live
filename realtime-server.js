const { createServer } = require("http");
const { Server } = require("socket.io");

const hostname = "0.0.0.0";
const port = Number(process.env.REALTIME_PORT) || 5033;

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: true,
  },

  maxHttpBufferSize: 50 * 1024 * 1024,
});

let currentSlide = 1;
let currentPresentation = null;

io.on("connection", (socket) => {
  console.log("✓ Client connected:", socket.id);

  // Send current state to new client
  if (currentPresentation) {
    console.log("  → Sending current presentation:", currentPresentation.name);
    socket.emit("presentation-upload", currentPresentation);
  } else {
    console.log("  → No presentation available yet");
  }
  console.log("  → Sending current slide:", currentSlide);
  socket.emit("slide-change", currentSlide);

  socket.on("change-slide", (slideNumber) => {
    console.log(`  → Client ${socket.id} requested slide change to:`, slideNumber);
    
    if (!Number.isInteger(slideNumber) || slideNumber < 1) {
      console.log("    ⚠ Invalid slide number");
      return;
    }

    currentSlide = slideNumber;
    console.log("  ✓ Broadcasting slide change to all clients:", currentSlide);
    io.emit("slide-change", currentSlide);
  });

  socket.on("presentation-upload", (presentation) => {
    console.log(`  → Client ${socket.id} uploaded presentation:`, {
      name: presentation?.name,
      type: presentation?.type,
      dataLength: presentation?.data?.length,
    });

    if (
      !presentation ||
      typeof presentation.name !== "string" ||
      typeof presentation.data !== "string"
    ) {
      console.log("    ⚠ Invalid presentation object format");
      return;
    }

    currentPresentation = presentation;
    currentSlide = 1;

    console.log("  ✓ Presentation stored, broadcasting to all clients");
    console.log("    Name:", presentation.name);
    console.log("    Size:", presentation.data.length, "bytes");

    io.emit("presentation-upload", currentPresentation);
    io.emit("slide-change", currentSlide);
    console.log("  ✓ Broadcast complete");
  });

  socket.on("disconnect", () => {
    console.log("✗ Client disconnected:", socket.id);
  });
});

httpServer.listen(port, hostname, () => {
  console.log(
    `> Realtime server ready on http://${hostname}:${port}`
  );
});