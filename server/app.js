import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import ACTIONS from './config.js'
import multer from 'multer'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config()

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

const COLORS = [
  '#ff5252',
  '#40c4ff',
  '#69f0ae',
  '#ffd740',
  '#b388ff',
  '#ff8a65',
]

const userSocketMap = {}

const getRandomColor = () =>
  COLORS[Math.floor(Math.random() * COLORS.length)]

const getAllConnectedClients = roomId =>
  Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    socketId => ({
      socketId,
      username: userSocketMap[socketId]?.username,
      color: userSocketMap[socketId]?.color,
    })
  )

io.on('connection', socket => {
  console.log('socket connected:', socket.id)

  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = {
      username,
      color: getRandomColor(),
      isOnline: true,
    }

    socket.join(roomId)

    const clients = getAllConnectedClients(roomId)

    clients.forEach(client => {
      io.to(client.socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      })
    })
  })

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code })
  })

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code })
  })

  socket.on(ACTIONS.CURSOR_CHANGE, ({ roomId, cursor }) => {
    socket.in(roomId).emit(ACTIONS.CURSOR_CHANGE, {
      socketId: socket.id,
      cursor,
      username: userSocketMap[socket.id]?.username,
      color: userSocketMap[socket.id]?.color,
    })
  })

  socket.on(ACTIONS.CHAT_FILE, ({ roomId, file }) => {
    io.to(roomId).emit(ACTIONS.CHAT_FILE, {
      file,
      username: userSocketMap[socket.id]?.username,
      color: userSocketMap[socket.id]?.color,
      socketId: socket.id,
      time: new Date().toLocaleTimeString(),
    })
  })


  socket.on(ACTIONS.CHAT_MESSAGE, ({ roomId, message }) => {
    if (!message?.trim()) return

    io.to(roomId).emit(ACTIONS.CHAT_MESSAGE, {
      message,
      username: userSocketMap[socket.id]?.username,
      color: userSocketMap[socket.id]?.color,
      socketId: socket.id,
      time: new Date().toLocaleTimeString(),
    })
  })

  socket.on(ACTIONS.LANGUAGE_CHANGE, ({ roomId, language }) => {
    socket.in(roomId).emit(ACTIONS.LANGUAGE_CHANGE, {
      language,
    })
  })


  socket.on('disconnecting', () => {
    const rooms = [...socket.rooms].filter(r => r !== socket.id)

    rooms.forEach(roomId => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id]?.username,
      })
    })

    delete userSocketMap[socket.id]
  })
})



const uploadDir = './uploads'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir)
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const unique = Date.now() + '-' + file.originalname
    cb(null, unique)
  },
})

const upload = multer({ storage })

app.use('/uploads', express.static('uploads'))

app.post('/upload', upload.single('file'), (req, res) => {
  res.json({
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
  })
})

const PORT = process.env.PORT 

server.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port 5000')
})
