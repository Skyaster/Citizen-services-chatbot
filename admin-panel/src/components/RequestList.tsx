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

const categoryLabels: Record<string, string> = {
    complaint: 'C',
    certificate: 'D',
    payment: 'P',
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
                    <span className="request-list__empty-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
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
                            <td>
                                <div className="request-list__category">
                                    <span className="request-list__category-icon">
                                        {categoryLabels[request.category] || 'R'}
                                    </span>
                                    <span className="request-list__category-text">
                                        {request.category}
                                        {request.sub_category && (
                                            <small> / {request.sub_category}</small>
                                        )}
                                    </span>
                                </div>
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
