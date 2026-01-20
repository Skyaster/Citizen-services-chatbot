// WhatsApp Web Sidebar - Simplified (Only VMC Chatbot)
import React from 'react';

export const ChatSidebar: React.FC = () => {
    return (
        <div className="chat-sidebar">
            {/* Search Only - No Header */}
            <div className="sidebar-search">
                <div className="search-container">
                    <span className="search-icon">🔍</span>
                    <input type="text" placeholder="Search or start new chat" />
                </div>
            </div>

            {/* Chat List - Only VMC */}
            <div className="chat-list">
                {/* VMC Chat - Active */}
                <div className="chat-item active">
                    <div className="chat-avatar">
                        <img src="https://cdn-icons-png.flaticon.com/512/2600/2600329.png" alt="VMC" />
                    </div>
                    <div className="chat-info">
                        <div className="chat-top-row">
                            <span className="chat-name">VMC Citizen Services</span>
                            <span className="chat-time">Now</span>
                        </div>
                        <div className="chat-bottom-row">
                            <span className="chat-preview">
                                <span className="tick">✓✓</span> How can I help you today?
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
