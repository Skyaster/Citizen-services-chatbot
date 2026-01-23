// WhatsApp Web Sidebar - VMC Chatbot with Filter Tabs
import React, { useState } from 'react';

// Tick Icon SVG
const TickIcon = () => (
    <svg viewBox="0 0 16 11" width="16" height="11" fill="currentColor">
        <path d="M4 10.5L.5 7l1.5-1.5L4 7.5l8-8L13.5 1 4 10.5z" />
    </svg>
);

export const ChatSidebar: React.FC = () => {
    const [activeFilter, setActiveFilter] = useState('all');

    return (
        <div className="chat-sidebar">
            {/* Sidebar Header - WhatsApp Style */}
            <div className="sidebar-header">
                <span className="sidebar-title">Chats</span>
                <div className="sidebar-actions">
                    <button className="icon-btn" title="New chat">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path>
                        </svg>
                    </button>
                    <button className="icon-btn" title="Menu">⋮</button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                <button
                    className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('all')}
                >
                    All
                </button>
                <button
                    className={`filter-tab ${activeFilter === 'unread' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('unread')}
                >
                    Unread
                </button>
                <button
                    className={`filter-tab ${activeFilter === 'favourites' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('favourites')}
                >
                    Favourites
                </button>
                <button
                    className={`filter-tab ${activeFilter === 'groups' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('groups')}
                >
                    Groups
                </button>
            </div>

            {/* Search */}
            <div className="sidebar-search">
                <div className="search-container">
                    <span className="search-icon">🔍</span>
                    <input type="text" placeholder="Search or start new chat" />
                </div>
            </div>

            {/* Chat List - Only VMC */}
            <div className="chat-list">
                <div className="chat-item active">
                    <div className="chat-avatar emoji-avatar">🏛️</div>
                    <div className="chat-info">
                        <div className="chat-top-row">
                            <span className="chat-name">VMC Citizen Services</span>
                            <span className="chat-time">Now</span>
                        </div>
                        <div className="chat-bottom-row">
                            <span className="chat-preview">
                                <span className="status-icon read" style={{ marginRight: '4px', marginLeft: 0 }}>
                                    <TickIcon />
                                    <TickIcon />
                                </span>
                                How can I help you today?
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};