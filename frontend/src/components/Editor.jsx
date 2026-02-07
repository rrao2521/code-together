import { useEffect, useRef } from 'react';
import CodeMirror from 'codemirror';

// CodeMirror Styles and Themes
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';

// CodeMirror Modes
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/css/css';
import 'codemirror/mode/markdown/markdown';

// CodeMirror Addons
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';

import ACTIONS from '../config/action';

const Editor = ({ socketRef, roomId, onCodeChange, socketReady }) => {
    const textareaRef = useRef(null);
    const editorRef = useRef(null);
    const cursorMarkersRef = useRef({});
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);

    const languageMap = {
        javascript: 'javascript',
        python: 'python',
        html: 'xml',
        css: 'css',
        markdown: 'markdown',
    };

    useEffect(() => {
        // Initialize CodeMirror only once
        if (!editorRef.current && textareaRef.current) {
            editorRef.current = CodeMirror.fromTextArea(textareaRef.current, {
                mode: 'javascript',
                theme: 'dracula',
                autoCloseTags: true,
                autoCloseBrackets: true,
                lineNumbers: true,
                viewportMargin: Infinity, // Helps with rendering in flexible containers
            });
        }

        if (!socketReady || !socketRef.current || !editorRef.current) return;

        const editor = editorRef.current;

        // --- CODE CHANGE EMITTER ---
        const handleChange = (instance, changes) => {
            const { origin } = changes;
            if (origin === 'setValue') return;

            const code = instance.getValue();
            onCodeChange(code);

            // Typing indicator logic
            if (!isTypingRef.current) {
                isTypingRef.current = true;
                socketRef.current.emit(ACTIONS.TYPING, { roomId });
            }

            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                isTypingRef.current = false;
                socketRef.current.emit(ACTIONS.STOP_TYPING, { roomId });
            }, 1200);

            socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                roomId,
                code,
            });
        };

        editor.on('change', handleChange);

        // --- CURSOR ACTIVITY EMITTER ---
        let lastCursor = null;
        const handleCursorActivity = (instance) => {
            const cursor = instance.getCursor();
            if (
                lastCursor &&
                cursor.line === lastCursor.line &&
                cursor.ch === lastCursor.ch
            ) return;

            lastCursor = cursor;
            socketRef.current.emit(ACTIONS.CURSOR_CHANGE, {
                roomId,
                cursor,
            });
        };

        editor.on('cursorActivity', handleCursorActivity);

        // --- SOCKET LISTENERS ---

        // Receive Remote Code
        socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
            if (code !== null && code !== editor.getValue()) {
                editor.setValue(code);
            }
        });

        // Receive Remote Language Change
        socketRef.current.on(ACTIONS.LANGUAGE_CHANGE, ({ language }) => {
            editor.setOption('mode', languageMap[language] || 'javascript');
        });

        // Receive Remote Cursor Position
        socketRef.current.on(ACTIONS.CURSOR_CHANGE, ({ socketId, cursor, username, color }) => {
            // Clear existing marker for this user
            if (cursorMarkersRef.current[socketId]) {
                cursorMarkersRef.current[socketId].clear();
            }

            // Create custom cursor element
            const wrapper = document.createElement('span');
            wrapper.className = 'remote-cursor-wrapper';

            const label = document.createElement('div');
            label.className = 'remote-cursor-label';
            label.textContent = username;
            label.style.backgroundColor = color;

            const cursorLine = document.createElement('span');
            cursorLine.className = 'remote-cursor smooth-cursor';
            cursorLine.style.borderLeft = `2px solid ${color}`;

            wrapper.appendChild(label);
            wrapper.appendChild(cursorLine);

            // Place marker in editor
            const marker = editor.setBookmark(cursor, {
                widget: wrapper,
                insertLeft: true,
            });

            cursorMarkersRef.current[socketId] = marker;
        });

        // Clean up cursors when user disconnects
        socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId }) => {
            if (cursorMarkersRef.current[socketId]) {
                cursorMarkersRef.current[socketId].clear();
                delete cursorMarkersRef.current[socketId];
            }
        });

        // --- CLEANUP ON UNMOUNT ---
        return () => {
            editor.off('change', handleChange);
            editor.off('cursorActivity', handleCursorActivity);
            if (socketRef.current) {
                socketRef.current.off(ACTIONS.CODE_CHANGE);
                socketRef.current.off(ACTIONS.CURSOR_CHANGE);
                socketRef.current.off(ACTIONS.DISCONNECTED);
                socketRef.current.off(ACTIONS.LANGUAGE_CHANGE);
            }
        };
    }, [socketReady]);

    return (
        <div className="editor-container">
            <textarea ref={textareaRef} />
        </div>
    );
};

export default Editor;