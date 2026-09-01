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
  console.log("Client connected:", socket.id);

  // Send current state to newly connected client
  socket.emit("slide-change", currentSlide);
  socket.emit("presentation-upload", currentPresentation);

  // Admin changes slide
  socket.on("change-slide", (slideNumber) => {
    if (!Number.isInteger(slideNumber) || slideNumber < 1) {
      return;
    }

    currentSlide = slideNumber;

    // Send slide change to Admin and User
    io.emit("slide-change", currentSlide);
  });

  // Admin uploads PPT
  socket.on("presentation-upload", (presentation) => {
    if (
      !presentation ||
      typeof presentation.name !== "string" ||
      typeof presentation.data !== "string"
    ) {
      return;
    }

    currentPresentation = presentation;
    currentSlide = 1;

    console.log("Presentation uploaded:", presentation.name);

    // Send PPT to Admin and User
    io.emit("presentation-upload", currentPresentation);

    // Reset slide to 1
    io.emit("slide-change", currentSlide);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

httpServer.listen(port, hostname, () => {
  console.log(
    `> Realtime server ready on http://${hostname}:${port}`
  );
});