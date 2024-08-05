const express = require("express");
const router = express.Router();

const WebSocket = require("ws");
const port = 4005;

const wss = new WebSocket.Server({ port });

wss.on("connection", function connection(ws) {
  console.log("Tips Chat4 연결 완료");

  ws.on("message", (data) => {
    console.log(data.toString());

    // 연결된 전체 웹소켓에 메세지 전달
    wss.clients.forEach((client) => {
      if (client !== ws) {
        client.send(data.toString());
      }
    });

    // ws.send(data.toString());
  });
});

wss.on("listening", () => {
  console.log(`Tips Web Socket server 4 listening on port ${port}`);
});

module.exports = router;
