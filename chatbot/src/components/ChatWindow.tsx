// Main Chat Window Component

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Message, ConversationContext } from '../types';
import { processMessage, getWelcomeMessage, createUserMessage, isApiConfigured } from '../services/chatService';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { QuickActions } from './QuickActions';
import { TypingIndicator } from './TypingIndicator';
import { delay } from '../utils/helpers';


// Import notification service
import { getUnreadNotifications, markAsRead, verifyActiveNotifications } from '../services/notificationService';

export const ChatWindow: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [context, setContext] = useState<ConversationContext>({ currentFlow: 'idle' });
    const [isTyping, setIsTyping] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesRef = useRef<Message[]>([]); // Ref to access messages in interval

    // Mock citizen ID (must be a valid UUID for DB)
    const citizenId = '00000000-0000-0000-0000-000000000000';

    // Scroll to bottom when messages change
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        messagesRef.current = messages; // Keep ref in sync
        scrollToBottom();
    }, [messages, isTyping, scrollToBottom]);

    // Initialize with welcome message and fetch notifications
    useEffect(() => {
        const welcome = getWelcomeMessage();
        setMessages([welcome]);

        // Initial fetch
        checkNotifications();

        // Poll every 5 seconds (faster to catch deletions)
        const interval = setInterval(() => {
            checkNotifications();
            verifyNotifications();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const checkNotifications = async () => {
        const unread = await getUnreadNotifications(citizenId);

        if (unread.length > 0) {
            const newMessages: Message[] = unread.map(n => ({
                id: `notif_${n.id}`,
                content: `📢 **${n.title}**\n\n${n.message}`,
                sender: 'bot',
                timestamp: new Date(n.created_at),
                status: 'read'
            }));

            setMessages(prev => [...prev, ...newMessages]);

            // Mark all as read immediately so they don't reappear
            unread.forEach(n => markAsRead(n.id, citizenId));
        }
    };

    const verifyNotifications = async () => {
        // Use ref to get current messages without stale closure
        const currentMessages = messagesRef.current;
        const notificationIds = currentMessages
            .filter(m => m.id.startsWith('notif_'))
            .map(m => m.id.replace('notif_', ''));

        if (notificationIds.length === 0) return;

        // Check which ones still exist in DB
        const activeIds = await verifyActiveNotifications(notificationIds);
        const activeSet = new Set(activeIds);

        // If some are missing (deleted), update state to remove them
        if (activeIds.length !== notificationIds.length) {
            setMessages(prev => prev.filter(m => {
                if (!m.id.startsWith('notif_')) return true; // Keep normal messages
                return activeSet.has(m.id.replace('notif_', ''));
            }));
        }
    };

    const handleSendMessage = async (content: string) => {
        // ... existing implementation ...
        if (!content.trim()) return;

        // Add user message
        const userMessage = createUserMessage(content);
        setMessages(prev => [...prev, userMessage]);
        setShowQuickActions(false);

        // Show typing indicator
        setIsTyping(true);

        // Simulate natural typing delay (300-800ms based on response complexity)
        await delay(Math.random() * 500 + 300);

        try {
            // Process message and get bot response
            const { botMessage, newContext } = await processMessage(
                content,
                messages,
                context
            );

            // Update message status to delivered
            setMessages(prev =>
                prev.map(m =>
                    m.id === userMessage.id
                        ? { ...m, status: 'delivered' as const }
                        : m
                )
            );

            // Small delay before showing bot response
            await delay(200);

            setIsTyping(false);
            setMessages(prev => [...prev, botMessage]);
            setContext(newContext);

            // Show quick actions based on context
            if (newContext.currentFlow === 'idle' || !newContext.currentFlow) {
                setShowQuickActions(true);
            }

            // Update message status to read
            setTimeout(() => {
                setMessages(prev =>
                    prev.map(m =>
                        m.id === userMessage.id
                            ? { ...m, status: 'read' as const }
                            : m
                    )
                );
            }, 1000);

        } catch (error) {
            console.error('Error processing message:', error);
            setIsTyping(false);

            // Add error message
            const errorMessage: Message = {
                id: `error_${Date.now()}`,
                content: "I'm sorry, something went wrong. Please try again.",
                sender: 'bot',
                timestamp: new Date(),
                status: 'delivered'
            };
            setMessages(prev => [...prev, errorMessage]);
        }
    };

    const handleQuickAction = (action: string) => {
        handleSendMessage(action);
    };



    return (
        <div className="chat-main">
            {/* Demo mode banner */}
            {!isApiConfigured() && (
                <div className="demo-banner">
                    <span>🎮</span> Demo Mode - Add Gemini API key for full AI responses
                </div>
            )}

            <ChatHeader />

            <div className="chat-messages">
                {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                ))}

                {isTyping && <TypingIndicator />}

                <div ref={messagesEndRef} />
            </div>

            {showQuickActions && !isTyping && (
                <QuickActions onAction={handleQuickAction} />
            )}

            <MessageInput
                onSend={handleSendMessage}
                disabled={isTyping}
            />
        </div>
    );
};
