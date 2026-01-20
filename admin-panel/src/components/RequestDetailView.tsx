// Request Detail View Component
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    fetchRequestDetails,
    fetchAdminUsers,
    updateRequestStatus,
    assignRequest,
    addInternalNote,
    getActionsForRole,
    calculateSlaBadge,
    transformToAdminPanelResponse,
} from '../services/adminService';
import type {
    ServiceRequest,
    CitizenDetails,
    RequestHistory,
    InternalNote,
    AdminUser,
    RequestStatus,
    AdminPanelResponse,
} from '../types/adminTypes';
import { StatusBadge } from './StatusBadge';
import { SlaBadge } from './SlaBadge';
import { CitizenInfoCard } from './CitizenInfoCard';
import { RequestTimeline } from './RequestTimeline';
import { InternalNotesSection } from './InternalNotesSection';
import { ActionsPanel } from './ActionsPanel';

export const RequestDetailView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [request, setRequest] = useState<ServiceRequest | null>(null);
    const [citizen, setCitizen] = useState<CitizenDetails | null>(null);
    const [, setHistory] = useState<RequestHistory[]>([]);
    const [notes, setNotes] = useState<InternalNote[]>([]);
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [panelResponse, setPanelResponse] = useState<AdminPanelResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Mock current admin (in production, this would come from auth context)
    const currentAdmin: AdminUser = {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Rahul Sharma',
        email: 'rahul.sharma@gov.in',
        role: 'super_admin',
        department: 'Municipal Corporation',
        created_at: new Date().toISOString(),
    };

    useEffect(() => {
        if (id) {
            loadRequestDetails();
        }
    }, [id]);

    const loadRequestDetails = async () => {
        if (!id) return;

        setIsLoading(true);
        try {
            const [details, admins] = await Promise.all([
                fetchRequestDetails(id),
                fetchAdminUsers(),
            ]);

            setRequest(details.request);
            setCitizen(details.citizen);
            setHistory(details.history);
            setNotes(details.notes);
            setAdminUsers(admins);

            // Transform to panel response format
            if (details.request && details.citizen) {
                const response = transformToAdminPanelResponse({
                    admin: currentAdmin,
                    citizen: details.citizen,
                    request: details.request,
                    history: details.history,
                    internal_notes: details.notes,
                });
                setPanelResponse(response);
            }
        } catch (error) {
            console.error('Error loading request details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (status: RequestStatus) => {
        if (!request) return;
        const success = await updateRequestStatus(request.id, status, currentAdmin.id);
        if (success) {
            loadRequestDetails();
        }
    };

    const handleAssign = async (adminId: string) => {
        if (!request) return;
        const success = await assignRequest(request.id, adminId);
        if (success) {
            loadRequestDetails();
        }
    };

    const handleAddNote = async (note: string) => {
        if (!request) return;
        const success = await addInternalNote(request.id, note, currentAdmin.id);
        if (success) {
            loadRequestDetails();
        }
    };

    if (isLoading) {
        return (
            <div className="request-detail request-detail--loading">
                <div className="request-detail__skeleton">
                    <div className="skeleton-header" />
                    <div className="skeleton-content" />
                </div>
            </div>
        );
    }

    if (!request || !panelResponse) {
        return (
            <div className="request-detail request-detail--error">
                <h2>Request Not Found</h2>
                <p>The request you're looking for doesn't exist or has been deleted.</p>
                <button onClick={() => navigate('/')} className="btn-back">
                    ← Back to Dashboard
                </button>
            </div>
        );
    }

    const actions = getActionsForRole(currentAdmin.role);
    const categorySpecific = panelResponse.category_specific;

    return (
        <div className="request-detail">
            {/* Header */}
            <div className="request-detail__header">
                <button onClick={() => navigate('/')} className="btn-back">
                    ← Back
                </button>
                <div className="request-detail__title-section">
                    <h1 className="request-detail__title">
                        Request #{request.id.slice(0, 8)}
                    </h1>
                    <div className="request-detail__badges">
                        <StatusBadge status={request.status} size="lg" />
                        <span className={`priority-badge priority--${request.priority}`}>
                            {request.priority}
                        </span>
                        <SlaBadge
                            badge={calculateSlaBadge(request.sla)}
                            dueAt={request.sla.due_at}
                        />
                    </div>
                </div>
            </div>

            {/* Validation Errors */}
            {panelResponse.validation_errors.length > 0 && (
                <div className="request-detail__errors">
                    <h4>⚠️ Validation Errors</h4>
                    <ul>
                        {panelResponse.validation_errors.map((error, i) => (
                            <li key={i}>{error}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="request-detail__content">
                {/* Left Column */}
                <div className="request-detail__main">
                    {/* Request Info */}
                    <div className="request-detail__section">
                        <h3 className="section-title">Request Information</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">Category</span>
                                <span className="info-value">
                                    {request.category} / {request.sub_category}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Channel</span>
                                <span className="info-value">{request.channel}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Department</span>
                                <span className="info-value">{request.department || 'Not assigned'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Assigned To</span>
                                <span className="info-value">
                                    {request.assigned_to_name || 'Unassigned'}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Created</span>
                                <span className="info-value">
                                    {new Date(request.created_at).toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Last Updated</span>
                                <span className="info-value">
                                    {new Date(request.updated_at).toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="request-detail__section">
                        <h3 className="section-title">Description</h3>
                        <p className="request-description">{request.description}</p>
                    </div>

                    {/* Category Specific */}
                    <div className="request-detail__section">
                        <h3 className="section-title">
                            {request.category === 'complaint' && '🚨 Complaint Details'}
                            {request.category === 'certificate' && '📄 Certificate Details'}
                            {request.category === 'payment' && '💰 Payment Details'}
                        </h3>
                        <div className="category-specific">
                            {request.category === 'complaint' && (
                                <>
                                    <div className="info-item">
                                        <span className="info-label">Problem Type</span>
                                        <span className="info-value">{categorySpecific.problem_type || 'Not specified'}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Severity</span>
                                        <span className={`severity-badge severity--${categorySpecific.severity}`}>
                                            {categorySpecific.severity || 'Not specified'}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Location</span>
                                        <span className="info-value">{categorySpecific.location || 'Not specified'}</span>
                                    </div>
                                    {categorySpecific.landmark && (
                                        <div className="info-item">
                                            <span className="info-label">Landmark</span>
                                            <span className="info-value">{categorySpecific.landmark}</span>
                                        </div>
                                    )}
                                    <div className="info-item">
                                        <span className="info-label">Citizen Impact</span>
                                        <span className="info-value">{categorySpecific.citizen_impact || 'Not specified'}</span>
                                    </div>
                                </>
                            )}

                            {request.category === 'certificate' && (
                                <>
                                    <div className="info-item">
                                        <span className="info-label">Document Type</span>
                                        <span className="info-value">{categorySpecific.document_type || 'Not specified'}</span>
                                    </div>
                                    {categorySpecific.reference_id && (
                                        <div className="info-item">
                                            <span className="info-label">Reference ID</span>
                                            <span className="info-value">{categorySpecific.reference_id}</span>
                                        </div>
                                    )}
                                    {categorySpecific.missing_documents && categorySpecific.missing_documents.length > 0 && (
                                        <div className="info-item info-item--full">
                                            <span className="info-label">Missing Documents</span>
                                            <div className="document-list document-list--missing">
                                                {categorySpecific.missing_documents.map((doc, i) => (
                                                    <span key={i} className="document-tag document-tag--missing">{doc}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {categorySpecific.pending_documents && categorySpecific.pending_documents.length > 0 && (
                                        <div className="info-item info-item--full">
                                            <span className="info-label">Pending Documents</span>
                                            <div className="document-list">
                                                {categorySpecific.pending_documents.map((doc, i) => (
                                                    <span key={i} className="document-tag document-tag--pending">{doc}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {request.category === 'payment' && (
                                <>
                                    <div className="info-item">
                                        <span className="info-label">Payment Type</span>
                                        <span className="info-value">{categorySpecific.payment_type || 'Not specified'}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Reference ID</span>
                                        <span className="info-value">{categorySpecific.reference_id || 'Not specified'}</span>
                                    </div>
                                    {categorySpecific.amount && (
                                        <div className="info-item">
                                            <span className="info-label">Amount</span>
                                            <span className="info-value info-value--amount">₹{categorySpecific.amount.toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                    <div className="info-item">
                                        <span className="info-label">Payment Status</span>
                                        <span className={`payment-status payment-status--${categorySpecific.payment_status}`}>
                                            {categorySpecific.payment_status || 'Not specified'}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Attachments */}
                    {request.attachments && request.attachments.length > 0 && (
                        <div className="request-detail__section">
                            <h3 className="section-title">📎 Attachments</h3>
                            <div className="attachments-list">
                                {request.attachments.map((attachment) => (
                                    <a
                                        key={attachment.id}
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="attachment-item"
                                    >
                                        <span className="attachment-icon">📄</span>
                                        <span className="attachment-name">{attachment.name}</span>
                                        <span className="attachment-size">
                                            {(attachment.size / 1024).toFixed(1)} KB
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="request-detail__section">
                        <RequestTimeline
                            events={panelResponse.timeline}
                        />
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="request-detail__sidebar">
                    {/* Citizen Info */}
                    {citizen && (
                        <CitizenInfoCard citizen={panelResponse.citizen_summary} />
                    )}

                    {/* Actions */}
                    {panelResponse.visibility.show_actions && (
                        <ActionsPanel
                            actions={actions}
                            currentStatus={request.status}
                            assignees={adminUsers}
                            currentAssignee={request.assigned_to}
                            onStatusChange={handleStatusChange}
                            onAssign={handleAssign}
                        />
                    )}

                    {/* Internal Notes */}
                    {panelResponse.visibility.show_internal_notes && (
                        <InternalNotesSection
                            notes={notes}
                            canAddNote={actions.can_add_note}
                            onAddNote={handleAddNote}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
