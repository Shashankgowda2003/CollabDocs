const http = require("http");
const WebSocket = require("ws");
const { setupWSConnection } = require("y-websocket/bin/utils");

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT) || 1234;

const server = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("CollabDocs WebSocket server running");
});

const wss = new WebSocket.Server({ server });

wss.on("connection", setupWSConnection);

server.listen(port, host, () => {
  console.log(`y-websocket running on ${host}:${port}`);
});
