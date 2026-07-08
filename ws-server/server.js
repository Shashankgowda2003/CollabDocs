const PORT = process.env.PORT || 1234;
const HOST = process.env.HOST || "0.0.0.0";
process.env.HOST = HOST;
process.env.PORT = String(PORT);
require("y-websocket/bin/server.cjs");
