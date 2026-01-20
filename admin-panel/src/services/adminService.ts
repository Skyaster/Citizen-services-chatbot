// Admin Service for Citizen Services Platform
import { supabase } from './supabase';
import type {
    AdminUser,
    ServiceRequest,
    CitizenDetails,
    RequestHistory,
    InternalNote,
    AdminPanelResponse,
    AdminPayload,
    RequestStatus,
    SlaInfo,
    AdminActions,
    TimelineEvent,
} from '../types/adminTypes';

// Fetch all service requests with pagination
export async function fetchAllRequests(
    page: number = 1,
    limit: number = 20,
    filters?: {
        category?: string;
        status?: string;
        priority?: string;
        search?: string;
    }
): Promise<{ requests: ServiceRequest[]; total: number }> {
    let query = supabase
        .from('service_requests')
        .select(`
      *,
      citizens!inner(name, phone),
      admin_users(name)
    `, { count: 'exact' });

    // Apply filters
    if (filters?.category) {
        query = query.eq('category', filters.category);
    }
    if (filters?.status) {
        query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
        query = query.eq('priority', filters.priority);
    }
    if (filters?.search) {
        query = query.or(`id.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        console.error('Error fetching requests:', error);
        return { requests: [], total: 0 };
    }

    const requests: ServiceRequest[] = (data || []).map((item: Record<string, unknown>) => ({
        id: item.id as string,
        citizen_id: item.citizen_id as string,
        category: item.category as ServiceRequest['category'],
        sub_category: item.sub_category as string,
        status: item.status as ServiceRequest['status'],
        priority: item.priority as ServiceRequest['priority'],
        channel: item.channel as ServiceRequest['channel'],
        department: item.department as string,
        assigned_to: item.assigned_to as string | undefined,
        assigned_to_name: ((item.admin_users as Record<string, unknown>)?.name as string) || undefined,
        description: item.description as string,
        metadata: (item.metadata as Record<string, unknown>) || {},
        attachments: (item.attachments as ServiceRequest['attachments']) || [],
        sla: {
            due_at: item.sla_due_at as string | null,
            is_overdue: item.sla_due_at ? new Date(item.sla_due_at as string) < new Date() : false,
        },
        created_at: item.created_at as string,
        updated_at: item.updated_at as string,
        resolved_at: item.resolved_at as string | undefined,
    }));

    return { requests, total: count || 0 };
}

// Fetch single request with full details
export async function fetchRequestDetails(requestId: string): Promise<{
    request: ServiceRequest | null;
    citizen: CitizenDetails | null;
    history: RequestHistory[];
    notes: InternalNote[];
}> {
    // Fetch request
    const { data: requestData, error: requestError } = await supabase
        .from('service_requests')
        .select(`
      *,
      admin_users(id, name)
    `)
        .eq('id', requestId)
        .single();

    if (requestError || !requestData) {
        console.error('Error fetching request:', requestError);
        return { request: null, citizen: null, history: [], notes: [] };
    }

    // Fetch citizen
    const { data: citizenData } = await supabase
        .from('citizens')
        .select('*')
        .eq('id', requestData.citizen_id)
        .single();

    // Fetch history
    const { data: historyData } = await supabase
        .from('request_history')
        .select(`
      *,
      admin_users(name)
    `)
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

    // Fetch internal notes
    const { data: notesData } = await supabase
        .from('internal_notes')
        .select(`
      *,
      admin_users(name)
    `)
        .eq('request_id', requestId)
        .order('created_at', { ascending: false });

    // Count total requests for citizen
    const { count: totalRequests } = await supabase
        .from('service_requests')
        .select('*', { count: 'exact', head: true })
        .eq('citizen_id', requestData.citizen_id);

    const request: ServiceRequest = {
        id: requestData.id,
        citizen_id: requestData.citizen_id,
        category: requestData.category,
        sub_category: requestData.sub_category,
        status: requestData.status,
        priority: requestData.priority,
        channel: requestData.channel,
        department: requestData.department,
        assigned_to: requestData.assigned_to,
        assigned_to_name: requestData.admin_users?.name,
        description: requestData.description,
        metadata: requestData.metadata || {},
        attachments: requestData.attachments || [],
        sla: {
            due_at: requestData.sla_due_at,
            is_overdue: requestData.sla_due_at ? new Date(requestData.sla_due_at) < new Date() : false,
        },
        created_at: requestData.created_at,
        updated_at: requestData.updated_at,
        resolved_at: requestData.resolved_at,
    };

    const citizen: CitizenDetails | null = citizenData ? {
        id: citizenData.id,
        name: citizenData.name || 'Unknown',
        phone: citizenData.phone || '',
        whatsapp_number: citizenData.whatsapp_number || citizenData.phone,
        language: citizenData.language || 'en',
        address: citizenData.address,
        city: citizenData.city,
        ward: citizenData.ward,
        total_requests: totalRequests || 0,
        risk_flags: citizenData.risk_flags || [],
        created_at: citizenData.created_at,
    } : null;

    const history: RequestHistory[] = (historyData || []).map((item: Record<string, unknown>) => ({
        id: item.id as number,
        request_id: item.request_id as string,
        event_type: item.event_type as RequestHistory['event_type'],
        description: item.description as string,
        old_value: item.old_value as string | undefined,
        new_value: item.new_value as string | undefined,
        performed_by: item.performed_by as string,
        performed_by_name: ((item.admin_users as Record<string, unknown>)?.name as string) || 'System',
        created_at: item.created_at as string,
    }));

    const notes: InternalNote[] = (notesData || []).map((item: Record<string, unknown>) => ({
        id: item.id as number,
        request_id: item.request_id as string,
        note: item.note as string,
        author_id: item.author_id as string,
        author_name: ((item.admin_users as Record<string, unknown>)?.name as string) || 'Unknown',
        created_at: item.created_at as string,
    }));

    return { request, citizen, history, notes };
}

// Update request status
export async function updateRequestStatus(
    requestId: string,
    status: RequestStatus,
    adminId?: string
): Promise<boolean> {
    const updateData: Record<string, unknown> = { status };

    if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
        .from('service_requests')
        .update(updateData)
        .eq('id', requestId);

    if (error) {
        console.error('Error updating status:', error);
        return false;
    }

    return true;
}

// Assign request to admin
export async function assignRequest(
    requestId: string,
    adminId: string
): Promise<boolean> {
    const { error } = await supabase
        .from('service_requests')
        .update({ assigned_to: adminId })
        .eq('id', requestId);

    if (error) {
        console.error('Error assigning request:', error);
        return false;
    }

    return true;
}

// Add internal note
export async function addInternalNote(
    requestId: string,
    note: string,
    authorId: string
): Promise<boolean> {
    const { error } = await supabase
        .from('internal_notes')
        .insert({
            request_id: requestId,
            note,
            author_id: authorId,
        });

    if (error) {
        console.error('Error adding note:', error);
        return false;
    }

    // Log in history
    await supabase
        .from('request_history')
        .insert({
            request_id: requestId,
            event_type: 'note_added',
            description: 'Internal note added',
            performed_by: authorId,
        });

    return true;
}

// Fetch all admin users for assignment dropdown
export async function fetchAdminUsers(): Promise<AdminUser[]> {
    const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .in('role', ['department_admin', 'super_admin']);

    if (error) {
        console.error('Error fetching admins:', error);
        return [];
    }

    return data || [];
}

// Calculate SLA badge
export function calculateSlaBadge(sla: SlaInfo): 'Overdue' | 'On time' | 'No SLA' {
    if (!sla.due_at) {
        return 'No SLA';
    }

    if (sla.is_overdue) {
        return 'Overdue';
    }

    return 'On time';
}

// Get actions based on admin role
export function getActionsForRole(role: string): AdminActions {
    const baseActions: AdminActions = {
        can_change_status: false,
        can_assign: false,
        can_add_note: false,
        can_escalate: false,
        can_close: false,
        can_transfer: false,
        available_statuses: ['new', 'in_progress', 'under_review', 'resolved', 'closed', 'rejected'],
        available_assignees: [],
    };

    if (role === 'viewer') {
        return baseActions;
    }

    if (role === 'department_admin') {
        return {
            ...baseActions,
            can_change_status: true,
            can_assign: true,
            can_add_note: true,
        };
    }

    if (role === 'super_admin') {
        return {
            ...baseActions,
            can_change_status: true,
            can_assign: true,
            can_add_note: true,
            can_escalate: true,
            can_close: true,
            can_transfer: true,
        };
    }

    return baseActions;
}

// Transform payload to AdminPanelResponse
export function transformToAdminPanelResponse(payload: AdminPayload): AdminPanelResponse {
    const validationErrors: string[] = [];

    // Validate required fields
    if (!payload.citizen?.id) {
        validationErrors.push('Missing required field: citizen.id');
    }
    if (!payload.request?.id) {
        validationErrors.push('Missing required field: request.id');
    }

    const sla: SlaInfo = {
        due_at: payload.request?.sla?.due_at || null,
        is_overdue: payload.request?.sla?.is_overdue || false,
    };

    // Build citizen summary
    const citizenSummary = {
        id: payload.citizen?.id || null,
        name: payload.citizen?.name || null,
        phone: payload.citizen?.phone || null,
        whatsapp_number: payload.citizen?.whatsapp_number || payload.citizen?.phone || null,
        language: payload.citizen?.language || null,
        address: payload.citizen?.address || null,
        total_requests: payload.citizen?.total_requests || null,
        risk_flags: payload.citizen?.risk_flags || [],
    };

    // Build request header
    const requestHeader = {
        id: payload.request?.id || null,
        category: payload.request?.category || null,
        sub_category: payload.request?.sub_category || null,
        status: payload.request?.status || null,
        priority: payload.request?.priority || null,
        channel: payload.request?.channel || null,
    };

    // Build request details
    const requestDetails = {
        description: payload.request?.description || null,
        department: payload.request?.department || null,
        assigned_to: payload.request?.assigned_to || null,
        assigned_to_name: payload.request?.assigned_to_name || null,
        created_at: payload.request?.created_at || null,
        updated_at: payload.request?.updated_at || null,
        resolved_at: payload.request?.resolved_at || null,
        sla_badge: calculateSlaBadge(sla),
        sla_due_at: sla.due_at,
        attachments: payload.request?.attachments || [],
    };

    // Build category-specific data
    const metadata = payload.request?.metadata || {};
    const categorySpecific: AdminPanelResponse['category_specific'] = {
        type: payload.request?.category || null,
    };

    if (payload.request?.category === 'complaint') {
        categorySpecific.problem_type = (metadata.problem_type as string) || null;
        categorySpecific.severity = (metadata.severity as string) || null;
        categorySpecific.location = (metadata.location as string) || null;
        categorySpecific.landmark = (metadata.landmark as string) || null;
        categorySpecific.citizen_impact = (metadata.citizen_impact as string) || null;
    } else if (payload.request?.category === 'certificate') {
        categorySpecific.document_type = (metadata.document_type as string) || null;
        categorySpecific.reference_id = (metadata.reference_id as string) || null;
        categorySpecific.missing_documents = (metadata.missing_documents as string[]) || [];
        categorySpecific.pending_documents = (metadata.pending_documents as string[]) || [];
    } else if (payload.request?.category === 'payment') {
        categorySpecific.payment_type = (metadata.payment_type as string) || null;
        categorySpecific.reference_id = (metadata.reference_id as string) || null;
        categorySpecific.amount = (metadata.amount as number) || null;
        categorySpecific.payment_status = (metadata.payment_status as string) || null;
    }

    // Build timeline
    const timeline: TimelineEvent[] = (payload.history || []).map((event, index) => ({
        id: event.id || index,
        event_type: event.event_type || 'unknown',
        description: event.description || 'Event occurred',
        timestamp: event.created_at || new Date().toISOString(),
        actor: event.performed_by_name || null,
    }));

    // Get actions based on admin role
    const actions = getActionsForRole(payload.admin?.role || 'viewer');

    // Visibility settings
    const visibility = {
        show_internal_notes: payload.admin?.role !== 'viewer',
        show_actions: payload.admin?.role !== 'viewer',
        show_citizen_contact: true,
    };

    return {
        citizen_summary: citizenSummary,
        request_header: requestHeader,
        request_details: requestDetails,
        category_specific: categorySpecific,
        timeline,
        actions,
        visibility,
        validation_errors: validationErrors,
    };
}

// Get dashboard stats
export async function getDashboardStats(): Promise<{
    total: number;
    pending: number;
    overdue: number;
    resolvedToday: number;
}> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalResult, pendingResult, overdueResult, resolvedResult] = await Promise.all([
        supabase.from('service_requests').select('*', { count: 'exact', head: true }),
        supabase.from('service_requests').select('*', { count: 'exact', head: true }).in('status', ['new', 'in_progress', 'under_review']),
        supabase.from('service_requests').select('*', { count: 'exact', head: true }).lt('sla_due_at', new Date().toISOString()).in('status', ['new', 'in_progress', 'under_review']),
        supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'resolved').gte('resolved_at', today.toISOString()),
    ]);

    return {
        total: totalResult.count || 0,
        pending: pendingResult.count || 0,
        overdue: overdueResult.count || 0,
        resolvedToday: resolvedResult.count || 0,
    };
}

/**
 * Create a new notification
 */
export async function sendNotification(data: {
    title: string;
    message: string;
    target_type: 'all' | 'department' | 'individual';
    target_ids?: string[];
    sent_by: string;
    email?: string; // Optional: email to lookup/sync admin user
}): Promise<boolean> {
    try {
        let adminId = data.sent_by;

        // 1. Try to verify if this ID exists in admin_users
        const { data: existingAdmin } = await supabase
            .from('admin_users')
            .select('id')
            .eq('id', adminId)
            .single();

        if (!existingAdmin) {
            // 2. If ID mismatch, try to find by Email
            if (data.email) {
                const { data: byEmail } = await supabase
                    .from('admin_users')
                    .select('id')
                    .eq('email', data.email)
                    .single();

                if (byEmail) {
                    adminId = byEmail.id;
                } else {
                    // 3. If not found by email either, create a NEW admin user entry
                    // This syncs the Auth ID with the admin_users table
                    const { data: newAdmin, error: createError } = await supabase
                        .from('admin_users')
                        .insert({
                            id: adminId, // Use the Auth ID as the PK
                            email: data.email,
                            name: 'Admin User', // Default name
                            role: 'viewer',
                            department: 'General'
                        })
                        .select()
                        .single();

                    if (createError) {
                        console.error('Failed to auto-create admin user:', createError);
                        // Fallback: If creation fails (maybe ID conflict?), just try to proceed or fail gracefully
                    } else {
                        adminId = newAdmin.id;
                    }
                }
            }
        }

        const { error } = await supabase
            .from('notifications')
            .insert({
                title: data.title,
                message: data.message,
                target_type: data.target_type,
                target_ids: data.target_ids || [],
                sent_by: adminId
            });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error sending notification:', error);
        return false;
    }
}

/**
 * Delete a notification
 */
export async function deleteNotification(id: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting notification:', error);
        return false;
    }
}

/**
 * Fetch all notifications (for admin history)
 */
export async function fetchNotifications(): Promise<any[]> {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select(`
                *,
                admin_users (name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}
