// Message Input Component

import React, { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSend, disabled = false }) => {
    const [message, setMessage] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [message]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmedMessage = message.trim();
        if (trimmedMessage && !disabled) {
            onSend(trimmedMessage);
            setMessage('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="chat-input-container">
            <button className="emoji-btn" title="Emoji">😊</button>
            <button className="attach-btn" title="Attach file">📎</button>

            <div className="input-wrapper">
                <textarea
                    ref={textareaRef}
                    className="message-input"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    rows={1}
                />
            </div>

            <button
                className="send-btn"
                onClick={() => handleSubmit()}
                disabled={!message.trim() || disabled}
                title="Send message"
            >
                ➤
            </button>
        </div>
    );
};
