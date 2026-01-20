// Request List Component
import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { ServiceRequest } from '../types/adminTypes';
import { StatusBadge } from './StatusBadge';
import { SlaBadge } from './SlaBadge';
import { calculateSlaBadge } from '../services/adminService';

interface RequestListProps {
    requests: ServiceRequest[];
    isLoading: boolean;
}

const categoryIcons: Record<string, string> = {
    complaint: '⚠️',
    certificate: '📄',
    payment: '💰',
};

const priorityColors: Record<string, string> = {
    low: 'priority--low',
    medium: 'priority--medium',
    high: 'priority--high',
    critical: 'priority--critical',
};

export const RequestList: React.FC<RequestListProps> = ({ requests, isLoading }) => {
    const navigate = useNavigate();

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <div className="request-list request-list--loading">
                <div className="request-list__skeleton">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="request-list__skeleton-row" />
                    ))}
                </div>
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="request-list request-list--empty">
                <div className="request-list__empty-state">
                    <span className="request-list__empty-icon">📋</span>
                    <h3>No Requests Found</h3>
                    <p>There are no requests matching your filters.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="request-list">
            <table className="request-list__table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>SLA</th>
                        <th>Assigned</th>
                        <th>Updated</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.map((request) => (
                        <tr
                            key={request.id}
                            className="request-list__row"
                            onClick={() => navigate(`/request/${request.id}`)}
                        >
                            <td className="request-list__id">
                                <code>{request.id.slice(0, 8)}...</code>
                            </td>
                            <td className="request-list__category">
                                <span className="request-list__category-icon">
                                    {categoryIcons[request.category] || '📌'}
                                </span>
                                <span className="request-list__category-text">
                                    {request.category}
                                    {request.sub_category && (
                                        <small> / {request.sub_category}</small>
                                    )}
                                </span>
                            </td>
                            <td className="request-list__description">
                                {request.description?.slice(0, 50)}
                                {request.description && request.description.length > 50 ? '...' : ''}
                            </td>
                            <td>
                                <StatusBadge status={request.status} size="sm" />
                            </td>
                            <td>
                                <span className={`priority-badge ${priorityColors[request.priority]}`}>
                                    {request.priority}
                                </span>
                            </td>
                            <td>
                                <SlaBadge badge={calculateSlaBadge(request.sla)} />
                            </td>
                            <td className="request-list__assigned">
                                {request.assigned_to_name || (
                                    <span className="request-list__unassigned">Unassigned</span>
                                )}
                            </td>
                            <td className="request-list__date">
                                {formatDate(request.updated_at)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
