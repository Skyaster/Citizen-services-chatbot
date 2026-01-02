// Typing Indicator Component

import React from 'react';

export const TypingIndicator: React.FC = () => {
    return (
        <div className="typing-indicator">
            <div className="typing-avatar">🏛️</div>
            <div className="typing-bubble">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
            </div>
        </div>
    );
};
