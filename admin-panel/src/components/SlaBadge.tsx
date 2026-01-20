// SLA Badge Component
import React from 'react';

interface SlaBadgeProps {
    badge: 'Overdue' | 'On time' | 'No SLA';
    dueAt?: string | null;
}

export const SlaBadge: React.FC<SlaBadgeProps> = ({ badge, dueAt }) => {
    const getIcon = () => {
        switch (badge) {
            case 'Overdue':
                return '⚠️';
            case 'On time':
                return '✅';
            default:
                return '⏳';
        }
    };

    const formatDueDate = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const diffMs = d.getTime() - now.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays < 0) {
            return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`;
        } else if (diffDays === 0) {
            if (diffHours < 0) {
                return `${Math.abs(diffHours)} hour${Math.abs(diffHours) !== 1 ? 's' : ''} overdue`;
            }
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} remaining`;
        } else {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`;
        }
    };

    return (
        <div className={`sla-badge sla-badge--${badge.toLowerCase().replace(' ', '-')}`}>
            <span className="sla-badge__icon">{getIcon()}</span>
            <span className="sla-badge__label">{badge}</span>
            {dueAt && badge !== 'No SLA' && (
                <span className="sla-badge__time">{formatDueDate(dueAt)}</span>
            )}
        </div>
    );
};
