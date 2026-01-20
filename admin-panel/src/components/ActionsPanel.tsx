// Actions Panel Component
import React, { useState } from 'react';
import type { AdminActions, RequestStatus, AdminUser } from '../types/adminTypes';

interface ActionsPanelProps {
    actions: AdminActions;
    currentStatus: RequestStatus | string | null;
    assignees: AdminUser[];
    currentAssignee?: string;
    onStatusChange: (status: RequestStatus) => Promise<void>;
    onAssign: (adminId: string) => Promise<void>;
}

export const ActionsPanel: React.FC<ActionsPanelProps> = ({
    actions,
    currentStatus,
    assignees,
    currentAssignee,
    onStatusChange,
    onAssign,
}) => {
    const [selectedStatus, setSelectedStatus] = useState<RequestStatus | ''>(
        (currentStatus as RequestStatus) || ''
    );
    const [selectedAssignee, setSelectedAssignee] = useState(currentAssignee || '');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStatusChange = async () => {
        if (!selectedStatus || selectedStatus === currentStatus || isUpdating) return;

        setIsUpdating(true);
        try {
            await onStatusChange(selectedStatus);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedAssignee || selectedAssignee === currentAssignee || isUpdating) return;

        setIsUpdating(true);
        try {
            await onAssign(selectedAssignee);
        } finally {
            setIsUpdating(false);
        }
    };

    const statusLabels: Record<RequestStatus, string> = {
        new: 'New',
        in_progress: 'In Progress',
        under_review: 'Under Review',
        resolved: 'Resolved',
        closed: 'Closed',
        rejected: 'Rejected',
    };

    if (!actions.can_change_status && !actions.can_assign && !actions.can_add_note) {
        return (
            <div className="actions-panel actions-panel--disabled">
                <p className="actions-panel__notice">
                    🔒 You have view-only access. Contact an administrator for action permissions.
                </p>
            </div>
        );
    }

    return (
        <div className="actions-panel">
            <h4 className="actions-panel__title">Actions</h4>

            {actions.can_change_status && (
                <div className="actions-panel__section">
                    <label className="actions-panel__label">Change Status</label>
                    <div className="actions-panel__row">
                        <select
                            className="actions-panel__select"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value as RequestStatus)}
                            disabled={isUpdating}
                        >
                            <option value="">Select status...</option>
                            {actions.available_statuses.map((status) => (
                                <option key={status} value={status}>
                                    {statusLabels[status]}
                                </option>
                            ))}
                        </select>
                        <button
                            className="actions-panel__btn actions-panel__btn--primary"
                            onClick={handleStatusChange}
                            disabled={!selectedStatus || selectedStatus === currentStatus || isUpdating}
                        >
                            {isUpdating ? 'Updating...' : 'Update'}
                        </button>
                    </div>
                </div>
            )}

            {actions.can_assign && (
                <div className="actions-panel__section">
                    <label className="actions-panel__label">Assign To</label>
                    <div className="actions-panel__row">
                        <select
                            className="actions-panel__select"
                            value={selectedAssignee}
                            onChange={(e) => setSelectedAssignee(e.target.value)}
                            disabled={isUpdating}
                        >
                            <option value="">Select assignee...</option>
                            {assignees.map((admin) => (
                                <option key={admin.id} value={admin.id}>
                                    {admin.name} ({admin.department || 'No Dept'})
                                </option>
                            ))}
                        </select>
                        <button
                            className="actions-panel__btn actions-panel__btn--primary"
                            onClick={handleAssign}
                            disabled={!selectedAssignee || selectedAssignee === currentAssignee || isUpdating}
                        >
                            {isUpdating ? 'Assigning...' : 'Assign'}
                        </button>
                    </div>
                </div>
            )}

            {actions.can_escalate && (
                <div className="actions-panel__section">
                    <button className="actions-panel__btn actions-panel__btn--warning" disabled={isUpdating}>
                        ⬆️ Escalate Request
                    </button>
                </div>
            )}

            {actions.can_transfer && (
                <div className="actions-panel__section">
                    <button className="actions-panel__btn actions-panel__btn--secondary" disabled={isUpdating}>
                        🔀 Transfer Department
                    </button>
                </div>
            )}
        </div>
    );
};
