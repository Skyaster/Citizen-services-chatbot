// Chat Header Component

import React from 'react';

interface ChatHeaderProps {
    isOnline?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ isOnline = true }) => {
    return (
        <div className="chat-header">
            <div className="chat-header-avatar">🏛️</div>
            <div className="chat-header-info">
                <h2>VMC Citizen Services</h2>
                <p>{isOnline ? 'Online • Always ready to help' : 'Connecting...'}</p>
            </div>
            <div className="chat-header-actions">
                <button className="icon-btn" title="Search">🔍</button>
                <button className="icon-btn" title="Menu">⋮</button>
            </div>
        </div>
    );
};
