import { useEffect, useState, useRef } from 'react'
import ACTIONS from '../config/action'

const SERVER_URL = 'http://localhost:5000'

const ChatPanel = ({ socketRef, roomId }) => {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const messagesEndRef = useRef(null)
    const fileInputRef = useRef(null)

    /* ================= FILE UPLOAD ================= */
    const handleFileUpload = async (e) => {
        const file = e.target.files[0]
        if (!file || !socketRef.current) return

        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch(`${SERVER_URL}/upload`, {
                method: 'POST',
                body: formData,
            })
            const data = await res.json()

            socketRef.current.emit(ACTIONS.CHAT_FILE, {
                roomId,
                file: data,
            })
        } catch (err) {
            console.error("File upload failed", err)
        }
    }

    const triggerFileInput = () => {
        fileInputRef.current.click()
    }

    /* ================= TEXT MESSAGE ================= */
    const sendMessage = () => {
        if (!input.trim() || !socketRef.current) return

        socketRef.current.emit(ACTIONS.CHAT_MESSAGE, {
            roomId,
            message: input,
        })

        setInput('')
    }

    /* ================= SOCKET LISTENERS ================= */
    useEffect(() => {
        if (!socketRef.current) return

        const handleChatMessage = (data) => {
            setMessages((prev) => [
                ...prev,
                {
                    ...data,
                    isSelf: data.socketId === socketRef.current.id,
                },
            ])
        }

        const handleFileMessage = (data) => {
            setMessages((prev) => [
                ...prev,
                {
                    ...data,
                    type: 'file',
                    isSelf: data.socketId === socketRef.current.id,
                },
            ])
        }

        socketRef.current.on(ACTIONS.CHAT_MESSAGE, handleChatMessage)
        socketRef.current.on(ACTIONS.CHAT_FILE, handleFileMessage)

        return () => {
            socketRef.current.off(ACTIONS.CHAT_MESSAGE, handleChatMessage)
            socketRef.current.off(ACTIONS.CHAT_FILE, handleFileMessage)
        }
    }, [socketRef.current])

    /* ================= AUTO SCROLL ================= */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    return (
        <div className="chat-panel">
            <div className="chat-header">
                <h3>Messages</h3>
            </div>
            
            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`chat-message ${msg.isSelf ? 'self' : 'other'}`}
                    >
                        {!msg.isSelf && (
                            <span
                                className="chat-username"
                                style={{ color: msg.color }}
                            >
                                {msg.username}
                            </span>
                        )}

                        <div className="msg-bubble">
                            {msg.type === 'file' ? (
                                <a
                                    href={`${SERVER_URL}/uploads/${msg.file.filename}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="file-link"
                                >
                                    📎 {msg.file.originalName}
                                </a>
                            ) : (
                                <p className='msg-text'>{msg.message}</p>
                            )}
                        </div>
                        <span className="chat-time">{msg.time}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
                <input
                    className='msgInput'
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                />
                <button className='send-btn' onClick={sendMessage}>Send</button>
            </div>
        </div>
    )
}

export default ChatPanel