// Chat Header Component

import React from 'react';

interface ChatHeaderProps {
    isOnline?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ isOnline = true }) => {
    return (
        <div className="chat-header">
            <div className="header-profile">
                <div className="bot-avatar">
                    <img src="https://cdn-icons-png.flaticon.com/512/2600/2600329.png" alt="VMC" />
                </div>
                <div className="header-info">
                    <h1>VMC Citizen Services</h1>
                    <span className="status-badge">
                        {isOnline ? 'Online' : 'Connecting...'}
                    </span>
                </div>
            </div>
            <div className="card-actions">
                <button className="icon-btn" title="Search">🔍</button>
                <button className="icon-btn" title="Menu">⋮</button>
            </div>
        </div>
    );
};
