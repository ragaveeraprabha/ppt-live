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

  socket.emit("slide-change", currentSlide);
  socket.emit("presentation-upload", currentPresentation);

  socket.on("change-slide", (slideNumber) => {
    if (!Number.isInteger(slideNumber) || slideNumber < 1) {
      return;
    }

    currentSlide = slideNumber;

    io.emit("slide-change", currentSlide);
  });

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

    io.emit("presentation-upload", currentPresentation);
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