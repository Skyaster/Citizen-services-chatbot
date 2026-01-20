// Sidebar Component

import React from 'react';

interface SidebarProps {
    onNewChat?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNewChat }) => {
    const recentChats = [
        {
            id: '1',
            name: 'VMC Citizen Services',
            lastMessage: 'How can I help you today?',
            time: 'Now',
            unread: 0,
            avatar: '🏛️'
        }
    ];

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-brand">
                    <div className="chat-avatar">🇮🇳</div>
                    <h1>VMC Portal</h1>
                </div>
                <button className="icon-btn" onClick={onNewChat} title="New Chat">+</button>
            </div>

            <div className="sidebar-search">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search or start new chat"
                />
            </div>

            <div className="sidebar-content">
                {recentChats.map(chat => (
                    <div key={chat.id} className="chat-list-item active">
                        <div className="chat-avatar">{chat.avatar}</div>
                        <div className="chat-info">
                            <h3>{chat.name}</h3>
                            <p>{chat.lastMessage}</p>
                        </div>
                        <div className="chat-meta">
                            <span className="chat-time">{chat.time}</span>
                            {chat.unread > 0 && (
                                <span className="unread-badge">{chat.unread}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
