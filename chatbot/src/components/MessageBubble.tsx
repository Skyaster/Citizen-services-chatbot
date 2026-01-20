// Message Bubble Component

import React from 'react';
import type { Message } from '../types';
import { formatTime } from '../utils/helpers';

interface MessageBubbleProps {
    message: Message;
}

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
            case 'sent': return '✓';
            case 'delivered': return '✓✓';
            case 'read': return '✓✓';
            default: return '⏳';
        }
    };

    return (
        <div className={`message-container ${isUser ? 'user' : 'bot'}`}>
            <div className="message-bubble">
                {formatContent(message.content)}
                <div className="message-timestamp">
                    {formatTime(message.timestamp)}
                    {isUser && (
                        <span className="message-status">{getStatusIcon(message.status)}</span>
                    )}
                </div>
            </div>
        </div>
    );
};
