const { createServer } = require("http");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = Number(process.env.PORT) || 5030;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  httpServer.listen(port, () => {
    console.log(`> Next.js server ready on http://${hostname}:${port}`);
  });
});