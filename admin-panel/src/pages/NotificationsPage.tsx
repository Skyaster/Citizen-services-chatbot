// Notifications Page
import React, { useState, useEffect } from 'react';
import { sendNotification, fetchNotifications, deleteNotification } from '../services/adminService';
import { useAuth } from '../context/AuthContext';

interface NotificationHistory {
    id: string;
    title: string;
    message: string;
    target_type: string;
    created_at: string;
    admin_users: { name: string };
}

export const NotificationsPage: React.FC = () => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetType, setTargetType] = useState<'all' | 'department' | 'individual'>('all');
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState<NotificationHistory[]>([]);
    const [showHistory, setShowHistory] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const data = await fetchNotifications();
        setHistory(data);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this notification?')) return;

        const success = await deleteNotification(id);
        if (success) {
            loadHistory();
        } else {
            alert('Failed to delete notification.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !message) return;

        setIsLoading(true);
        try {
            const success = await sendNotification({
                title,
                message,
                target_type: targetType,
                sent_by: user?.id || 'system', // Use authorized admin ID
                email: user?.email
            });

            if (success) {
                alert('Notification sent successfully!');
                setTitle('');
                setMessage('');
                loadHistory(); // Refresh history
            } else {
                alert('Failed to send notification.');
            }
        } catch (error) {
            console.error('Error sending:', error);
            alert('An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="notifications-page">
            <h1 className="page-title">📢 Broadcast Notifications</h1>

            <div className="notifications-container">
                {/* Compose Section */}
                <div className="notification-card compose-card">
                    <h2 className="card-title">Compose Message</h2>
                    <form onSubmit={handleSubmit} className="notification-form">
                        <div className="form-group">
                            <label>Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Water Supply Maintenance"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Target Audience</label>
                            <select
                                value={targetType}
                                onChange={(e) => setTargetType(e.target.value as any)}
                            >
                                <option value="all"> All Citizens</option>
                                <option value="department">🔒 Department Specific (Coming Soon)</option>
                                <option value="individual">👤 Individual Citizen (Coming Soon)</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Message</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Write your message here..."
                                rows={5}
                                required
                            />
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="btn-primary btn-lg"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Sending...' : '🚀 Send Broadcast'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* History Section */}
                <div className="notification-card history-card">
                    <div className="card-header">
                        <h2 className="card-title">Recent Broadcasts</h2>
                        <button
                            className="btn-text"
                            onClick={() => setShowHistory(!showHistory)}
                        >
                            {showHistory ? 'Hide' : 'Show'}
                        </button>
                    </div>

                    {showHistory && (
                        <div className="notification-list">
                            {history.length === 0 ? (
                                <p className="empty-text">No notifications sent yet.</p>
                            ) : (
                                history.map((item) => (
                                    <div key={item.id} className="notification-item">
                                        <div className="notification-header">
                                            <span className="notification-title">{item.title}</span>
                                            <div className="header-actions">
                                                <span className="notification-date">
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </span>
                                                <button
                                                    className="btn-icon delete-btn"
                                                    onClick={() => handleDelete(item.id)}
                                                    title="Delete Notification"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                        <p className="notification-body">{item.message}</p>
                                        <div className="notification-meta">
                                            <span className="meta-badge target">👥 {item.target_type}</span>
                                            <span className="meta-badge author">✍️ {item.admin_users?.name || 'Admin'}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
