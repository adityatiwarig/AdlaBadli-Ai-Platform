const http = require("http")
const { Server } = require("socket.io")

const port = Number(process.env.SOCKET_PORT || 4001)
const corsOrigin = process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000"

const httpServer = http.createServer((_, res) => {
  res.writeHead(200, { "Content-Type": "application/json" })
  res.end(JSON.stringify({ ok: true, service: "adlabadli-socket" }))
})

const io = new Server(httpServer, {
  cors: { origin: corsOrigin, methods: ["GET", "POST"] },
})

io.on("connection", (socket) => {
  socket.on("join", (userId) => {
    if (typeof userId === "string" && userId) {
      socket.join(`user:${userId}`)
    }
  })

  socket.on("chat:send", ({ toUserId, message }) => {
    if (!toUserId || !message) return
    io.to(`user:${toUserId}`).emit("chat:receive", message)
  })
})

httpServer.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Socket server listening on port ${port}`)
})
