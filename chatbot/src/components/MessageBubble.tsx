// Message Bubble Component

import React from 'react';
import type { Message } from '../types';
import { formatTime } from '../utils/helpers';

interface MessageBubbleProps {
    message: Message;
}

// Tick Icon SVG
const TickIcon = () => (
    <svg viewBox="0 0 16 11" width="16" height="11" fill="currentColor">
        <path d="M4 10.5L.5 7l1.5-1.5L4 7.5l8-8L13.5 1 4 10.5z" />
    </svg>
);

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const isUser = message.sender === 'user';

    // Parse markdown-like formatting
    const formatContent = (content: string): React.ReactNode => {
        // Replace *text* with bold
        let formatted = content.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
        // Replace _text_ with italic
        formatted = formatted.replace(/_([^_]+)_/g, '<em>$1</em>');
        // Replace bullet points
        formatted = formatted.replace(/^• /gm, '• ');

        return (
            <span
                className="message-content"
                dangerouslySetInnerHTML={{ __html: formatted }}
            />
        );
    };

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'sent':
                return (
                    <span className="status-icon sent">
                        <TickIcon />
                    </span>
                );
            case 'delivered':
                return (
                    <span className="status-icon delivered">
                        <TickIcon />
                        <TickIcon />
                    </span>
                );
            case 'read':
                return (
                    <span className="status-icon read">
                        <TickIcon />
                        <TickIcon />
                    </span>
                );
            default:
                return (
                    <span className="status-icon pending">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2A10 10 0 1 0 22 12 10 10 0 0 0 12 2Zm1 15h-2v-2h2Zm0-4h-2V7h2Z" /></svg>
                    </span>
                );
        }
    };

    return (
        <div className={`message-container ${isUser ? 'user' : 'bot'}`}>
            <div className="message-bubble">
                {/* Render attachment if present */
                    message.content.startsWith('[ATTACHMENT:') ? (
                        (() => {
                            const matches = message.content.match(/\[ATTACHMENT: (\w+)\] (.*?) \| (.*?)($| \| (.*))/);
                            if (!matches) return formatContent(message.content); // Fallback

                            const [_, type, url, name, __, size] = matches;

                            if (type === 'image' || type === 'photo' || type === 'camera') {
                                return (
                                    <div className="attachment-preview">
                                        <img src={url} alt={name} style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '4px' }} />
                                        <div style={{ fontSize: '12px', opacity: 0.8 }}>📷 {name}</div>
                                    </div>
                                );
                            } else {
                                return (
                                    <div className="attachment-file" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.1)', padding: '8px', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '24px' }}>📄</span>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 500 }}>{name}</span>
                                            {size && <span style={{ fontSize: '10px', opacity: 0.7 }}>{size}</span>}
                                        </div>
                                    </div>
                                );
                            }
                        })()
                    ) : (
                        formatContent(message.content)
                    )}
                <div className="message-timestamp">
                    {formatTime(message.timestamp)}
                    {isUser && getStatusIcon(message.status)}
                </div>
            </div>
        </div>
    );
};
