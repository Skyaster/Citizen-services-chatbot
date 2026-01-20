// Request Timeline Component
import React from 'react';
import type { TimelineEvent } from '../types/adminTypes';

interface RequestTimelineProps {
    events: TimelineEvent[];
}

const eventIcons: Record<string, string> = {
    created: '🆕',
    status_changed: '🔄',
    assigned: '👤',
    reassigned: '🔀',
    note_added: '📝',
    escalated: '⬆️',
    resolved: '✅',
    closed: '🔒',
};

export const RequestTimeline: React.FC<RequestTimelineProps> = ({ events }) => {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (events.length === 0) {
        return (
            <div className="timeline timeline--empty">
                <p>No timeline events yet</p>
            </div>
        );
    }

    return (
        <div className="timeline">
            <h4 className="timeline__title">Request Timeline</h4>
            <div className="timeline__list">
                {events.map((event, index) => (
                    <div key={event.id || index} className="timeline__item">
                        <div className="timeline__line" />
                        <div className="timeline__dot">
                            {eventIcons[event.event_type] || '📌'}
                        </div>
                        <div className="timeline__content">
                            <p className="timeline__description">{event.description}</p>
                            <div className="timeline__meta">
                                <span className="timeline__time">{formatDate(event.timestamp)}</span>
                                {event.actor && (
                                    <span className="timeline__actor">by {event.actor}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
