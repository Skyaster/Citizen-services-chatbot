// Main App Component - Citizen Services Chatbot

import React from 'react';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatWindow } from './components/ChatWindow';
import './index.css';

function App() {
    return (
        <div className="app-container">
            <ChatSidebar />
            <ChatWindow />
        </div>
    );
}

export default App;
