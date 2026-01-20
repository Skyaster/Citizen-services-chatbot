// Status Badge Component
import React from 'react';
import type { RequestStatus } from '../types/adminTypes';

interface StatusBadgeProps {
    status: RequestStatus | string | null;
    size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, { label: string; className: string }> = {
    new: { label: 'New', className: 'status-badge--new' },
    in_progress: { label: 'In Progress', className: 'status-badge--in-progress' },
    under_review: { label: 'Under Review', className: 'status-badge--under-review' },
    resolved: { label: 'Resolved', className: 'status-badge--resolved' },
    closed: { label: 'Closed', className: 'status-badge--closed' },
    rejected: { label: 'Rejected', className: 'status-badge--rejected' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
    if (!status) return null;

    const config = statusConfig[status.toLowerCase().replace(' ', '_')] || {
        label: status,
        className: 'status-badge--default',
    };

    return (
        <span className={`status-badge status-badge--${size} ${config.className}`}>
            {config.label}
        </span>
    );
};
