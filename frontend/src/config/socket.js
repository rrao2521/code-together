import {io} from 'socket.io-client'

// const LINK = process.env.LINK
// const LINK = "http://192.168.1.33:5000"
const LINK = import.meta.env.VITE_BACK_END_URL

export const initSocket = async () => {
  return io(LINK, {
    transports: ['websocket'],
  })
}