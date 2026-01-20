// Admin Panel Types for Citizen Services Platform

export type AdminRole = 'viewer' | 'department_admin' | 'super_admin';

export interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: AdminRole;
    department?: string;
    avatar_url?: string;
    created_at: string;
}

export interface CitizenDetails {
    id: string;
    name: string;
    phone: string;
    whatsapp_number?: string;
    language: 'en' | 'hi' | 'hinglish';
    address?: string;
    city?: string;
    ward?: string;
    total_requests: number;
    risk_flags?: string[];
    created_at: string;
}

export type RequestCategory = 'complaint' | 'certificate' | 'payment';
export type RequestStatus = 'new' | 'in_progress' | 'under_review' | 'resolved' | 'closed' | 'rejected';
export type RequestPriority = 'low' | 'medium' | 'high' | 'critical';
export type RequestChannel = 'whatsapp' | 'web' | 'phone';

export interface SlaInfo {
    due_at: string | null;
    is_overdue: boolean;
}

export interface ServiceRequest {
    id: string;
    citizen_id: string;
    category: RequestCategory;
    sub_category: string;
    status: RequestStatus;
    priority: RequestPriority;
    channel: RequestChannel;
    department: string;
    assigned_to?: string;
    assigned_to_name?: string;
    description: string;
    metadata: Record<string, unknown>;
    attachments: Attachment[];
    sla: SlaInfo;
    created_at: string;
    updated_at: string;
    resolved_at?: string;
}

export interface Attachment {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
}

export type HistoryEventType =
    | 'created'
    | 'status_changed'
    | 'assigned'
    | 'reassigned'
    | 'note_added'
    | 'escalated'
    | 'resolved'
    | 'closed';

export interface RequestHistory {
    id: number;
    request_id: string;
    event_type: HistoryEventType;
    description: string;
    old_value?: string;
    new_value?: string;
    performed_by: string;
    performed_by_name: string;
    created_at: string;
}

export interface InternalNote {
    id: number;
    request_id: string;
    note: string;
    author_id: string;
    author_name: string;
    created_at: string;
}

// Category-specific metadata interfaces
export interface ComplaintMetadata {
    problem_type: string;
    severity: 'minor' | 'moderate' | 'severe' | 'critical';
    location: string;
    landmark?: string;
    citizen_impact: string;
    photo_url?: string;
}

export interface CertificateMetadata {
    document_type: string;
    reference_id?: string;
    applicant_name: string;
    required_documents: string[];
    submitted_documents: string[];
    missing_documents: string[];
    pending_documents: string[];
}

export interface PaymentMetadata {
    payment_type: 'electricity' | 'water' | 'property_tax' | 'other';
    reference_id: string;
    consumer_number?: string;
    amount?: number;
    payment_status?: 'pending' | 'processing' | 'completed' | 'failed';
    due_date?: string;
    late_fee?: number;
}

// Admin Panel Response Format
export interface CitizenSummary {
    id: string | null;
    name: string | null;
    phone: string | null;
    whatsapp_number: string | null;
    language: string | null;
    address: string | null;
    total_requests: number | null;
    risk_flags: string[];
}

export interface RequestHeader {
    id: string | null;
    category: string | null;
    sub_category: string | null;
    status: string | null;
    priority: string | null;
    channel: string | null;
}

export interface RequestDetails {
    description: string | null;
    department: string | null;
    assigned_to: string | null;
    assigned_to_name: string | null;
    created_at: string | null;
    updated_at: string | null;
    resolved_at: string | null;
    sla_badge: 'Overdue' | 'On time' | 'No SLA';
    sla_due_at: string | null;
    attachments: Attachment[];
}

export interface CategorySpecific {
    type: RequestCategory | null;
    // For complaints
    problem_type?: string | null;
    severity?: string | null;
    location?: string | null;
    landmark?: string | null;
    citizen_impact?: string | null;
    // For certificates
    document_type?: string | null;
    reference_id?: string | null;
    missing_documents?: string[];
    pending_documents?: string[];
    // For payments
    payment_type?: string | null;
    amount?: number | null;
    payment_status?: string | null;
}

export interface TimelineEvent {
    id: number;
    event_type: string;
    description: string;
    timestamp: string;
    actor: string | null;
}

export interface AdminActions {
    can_change_status: boolean;
    can_assign: boolean;
    can_add_note: boolean;
    can_escalate: boolean;
    can_close: boolean;
    can_transfer: boolean;
    available_statuses: RequestStatus[];
    available_assignees: { id: string; name: string }[];
}

export interface VisibilitySettings {
    show_internal_notes: boolean;
    show_actions: boolean;
    show_citizen_contact: boolean;
}

export interface AdminPanelResponse {
    citizen_summary: CitizenSummary;
    request_header: RequestHeader;
    request_details: RequestDetails;
    category_specific: CategorySpecific;
    timeline: TimelineEvent[];
    actions: AdminActions;
    visibility: VisibilitySettings;
    validation_errors: string[];
}

// Input payload interface (what comes from chatbot)
export interface AdminPayload {
    admin: AdminUser;
    citizen: Partial<CitizenDetails>;
    request: Partial<ServiceRequest>;
    history?: Partial<RequestHistory>[];
    internal_notes?: Partial<InternalNote>[];
}
