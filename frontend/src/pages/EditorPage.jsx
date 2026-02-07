import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../config/socket';
import ACTIONS from '../config/action';
import toast from 'react-hot-toast';
import { useState, useRef, useEffect } from 'react';
import { useNavigate, Navigate, useParams, useLocation } from 'react-router-dom';
import ChatPanel from '../components/ChatPanel';

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef('');
    const location = useLocation();
    const navigate = useNavigate();
    const { roomId } = useParams();
    
    // UI State
    const [typingUsers, setTypingUsers] = useState({});
    const [clients, setClients] = useState([]);
    const [socketReady, setSocketReady] = useState(false);
    const [language, setLanguage] = useState('javascript');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile Toggle State

    // Resolve username
    const username = location.state?.username || localStorage.getItem('username');

    if (!username) {
        return <Navigate to="/" />;
    }

    const handleErrors = (err) => {
        console.error('Socket error:', err);
        toast.error('Socket connection failed: ' + err.toString());
    };

    const handleLanguageChange = (e) => {
        const selectedLanguage = e.target.value;
        setLanguage(selectedLanguage);

        socketRef.current.emit(ACTIONS.LANGUAGE_CHANGE, {
            roomId,
            language: selectedLanguage,
        });
    };

    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            try {
                const socket = await initSocket();
                if (!isMounted) return;

                socketRef.current = socket;
                setSocketReady(true);

                socket.on('connect_error', handleErrors);
                socket.on('connect_failed', handleErrors);

                socket.emit(ACTIONS.JOIN, {
                    roomId,
                    username,
                });

                socket.on(ACTIONS.TYPING, ({ socketId, username }) => {
                    setTypingUsers((prev) => ({
                        ...prev,
                        [socketId]: username,
                    }));
                });

                socket.on(ACTIONS.STOP_TYPING, ({ socketId }) => {
                    setTypingUsers((prev) => {
                        const updated = { ...prev };
                        delete updated[socketId];
                        return updated;
                    });
                });

                socket.on(ACTIONS.JOINED, ({ clients, username: joinedUser }) => {
                    if (joinedUser !== username) {
                        toast.success(`${joinedUser} joined the room`);
                    }
                    setClients(clients);
                });

                socket.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
                    toast.success(`${username} left the room`);
                    setClients((prev) =>
                        prev.filter((client) => client.socketId !== socketId)
                    );
                });
            } catch (err) {
                handleErrors(err);
            }
        };

        init();

        return () => {
            isMounted = false;
            if (socketRef.current) {
                socketRef.current.off(ACTIONS.JOINED);
                socketRef.current.off(ACTIONS.TYPING);
                socketRef.current.off(ACTIONS.STOP_TYPING);
                socketRef.current.off(ACTIONS.DISCONNECTED);
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    const copyRoomId = async () => {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID copied');
        } catch (ex) {
            console.error('Clipboard copy failed:', ex);
            toast.error('Could not copy Room ID');
        }
    };

    const leaveRoom = () => {
        navigate('/');
    };

    return (
        <div className="mainWrap">
            {/* MOBILE MENU TOGGLE */}
            <button 
                className="mobile-toggle" 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                {isSidebarOpen ? '✕' : '☰'}
            </button>

            {/* SIDEBAR */}
            <div className={`aside ${isSidebarOpen ? 'open' : ''}`}>
                <div className="asideInner">
                    <div className="logo">
                        <div className="logo-container">
                          <span className="logo-bracket">&lt;</span>
                          <span className="logo-text">Code<span className="logo-highlight">Together</span></span>
                          <span className="logo-bracket">&gt;</span>
                        </div>
                    </div>
                    <h3>Connected</h3>
                    <div className="clientList">
                        {clients.map((client) => (
                            <Client
                                key={client.socketId}
                                username={client.username}
                                color={client.color}
                                isOnline={true}
                            />
                        ))}
                    </div>
                </div>
                <button className="btn copyBtn" onClick={copyRoomId}>
                    Copy ROOM ID
                </button>
                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave ROOM
                </button>
            </div>

            {/* EDITOR SECTION */}
            <div className="editorWrap">
                <div className="language-bar">
                    <select value={language} onChange={handleLanguageChange}>
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="markdown">Markdown</option>
                    </select>
                    
                    {/* Typing Indicator in Bar */}
                    <div className="typing-status">
                        {Object.values(typingUsers).length > 0 && (
                            <span className="typing-indicator">
                                {Object.values(typingUsers)[0]} is typing...
                            </span>
                        )}
                    </div>
                </div>

                <Editor
                    socketRef={socketRef}
                    roomId={roomId}
                    socketReady={socketReady}
                    onCodeChange={(code) => {
                        codeRef.current = code;
                    }}
                />
            </div>

            {/* CHAT SECTION */}
            <ChatPanel
                socketRef={socketRef}
                roomId={roomId}
                username={username}
            />
        </div>
    );
};

export default EditorPage;