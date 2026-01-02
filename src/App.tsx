// Main App Component

import React from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import './index.css';

function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <ChatWindow />
    </div>
  );
}

export default App;
