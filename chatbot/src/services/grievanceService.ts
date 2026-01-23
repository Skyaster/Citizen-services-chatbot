// Grievance Service - CRUD operations for grievances

import { supabase, isDemoMode } from './supabase';
import type { Grievance, GrievanceStatus, Attachment } from '../types';
import { generateGrievanceId } from '../utils/helpers';


// Demo storage for mock mode
const demoGrievances: Map<string, Grievance> = new Map();

/**
 * Create a new grievance
 */
export async function createGrievance(data: {
    citizen_id?: string;
    category: string;
    subcategory?: string;
    description: string;
    location: string;
    landmark?: string;
    photo_url?: string;
    attachments?: Attachment[];
}): Promise<{ success: boolean; grievance_id?: string; error?: string }> {
    const grievance_id = generateGrievanceId();

    // Use demo citizen ID if not provided
    const citizenId = data.citizen_id || '00000000-0000-0000-0000-000000000000';

    if (isDemoMode) {
        // ... demo code ...
        const grievance: Grievance = {
            id: demoGrievances.size + 1,
            grievance_id,
            citizen_id: citizenId,
            category: data.category,
            subcategory: data.subcategory,
            description: data.description,
            location: data.location,
            landmark: data.landmark,
            photo_url: data.photo_url,
            attachments: data.attachments, // Store attachments in demo mode
            status: 'New',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        demoGrievances.set(grievance_id, grievance);
        console.log('📝 Demo grievance created:', grievance);
        return { success: true, grievance_id };
    }

    try {
        // Insert directly into service_requests table (for Admin Panel)
        const slaDueAt = new Date();
        slaDueAt.setDate(slaDueAt.getDate() + 3);

        const metadata = {
            problem_type: data.subcategory || 'General',
            severity: 'medium',
            location: data.location,
            landmark: data.landmark,
            grievance_id: grievance_id
        };

        console.log('📤 Inserting service request with attachments:', { citizenId, category: data.category, attachments: data.attachments?.length });

        const { error: adminError } = await supabase
            .from('service_requests')
            .insert({
                citizen_id: citizenId,
                category: 'complaint',
                sub_category: data.category,
                status: 'new',
                priority: 'medium',
                channel: 'whatsapp',
                department: getDepartmentForCategory(data.category),
                description: data.description,
                metadata: metadata,
                attachments: data.attachments || [], // Store attachments in DB
                sla_due_at: slaDueAt.toISOString()
            });

        if (adminError) {
            console.error('❌ Failed to insert service request:', adminError);
            return { success: false, error: adminError.message };
        }

        console.log('✅ Service request created successfully:', grievance_id);
        return { success: true, grievance_id };
    } catch (error) {
        console.error('❌ Error creating grievance:', error);
        return { success: false, error: 'Failed to create grievance' };
    }
}

function getDepartmentForCategory(category: string): string {
    const map: Record<string, string> = {
        'Roads': 'Public Works',
        'Water': 'Water Supply',
        'Garbage': 'Sanitation',
        'Electricity': 'Power Dept',
        'Drainage': 'Sewerage Dept'
    };
    return map[category] || 'General Administration';
}

/**
 * Get grievance by ID - queries service_requests table
 */
export async function getGrievance(grievance_id: string): Promise<Grievance | null> {
    // First check demo storage
    const demoGrievance = demoGrievances.get(grievance_id);
    if (demoGrievance) return demoGrievance;

    if (isDemoMode) {
        // Return null in demo mode if not found in local storage
        // This allows the UI to show "not found" instead of fake data
        return null;
    }

    try {
        // Query service_requests table where grievance_id is stored in metadata
        const { data, error } = await supabase
            .from('service_requests')
            .select('*')
            .contains('metadata', { grievance_id: grievance_id })
            .single();

        if (error) {
            console.error('Error fetching grievance from service_requests:', error);
            // Try alternate query using the ID directly
            const { data: altData, error: altError } = await supabase
                .from('service_requests')
                .select('*')
                .eq('id', grievance_id.replace(/^GR/i, ''))
                .single();

            if (altError) {
                console.error('Alternate query also failed:', altError);
                return null;
            }

            if (altData) {
                return transformServiceRequestToGrievance(altData);
            }
            return null;
        }

        if (data) {
            return transformServiceRequestToGrievance(data);
        }
        return null;
    } catch (error) {
        console.error('Error fetching grievance:', error);
        return null;
    }
}

/**
 * Transform service_request record to Grievance type
 */
function transformServiceRequestToGrievance(record: Record<string, unknown>): Grievance {
    const metadata = (record.metadata as Record<string, unknown>) || {};
    return {
        id: record.id as number,
        grievance_id: (metadata.grievance_id as string) || `GR${String(record.id).padStart(5, '0')}`,
        citizen_id: record.citizen_id as string,
        category: record.sub_category as string || record.category as string,
        subcategory: metadata.problem_type as string,
        description: record.description as string,
        location: metadata.location as string || 'Not specified',
        landmark: metadata.landmark as string,
        status: mapStatusToGrievanceStatus(record.status as string),
        created_at: record.created_at as string,
        updated_at: record.updated_at as string,
        assigned_department: record.department as string,
        notes: metadata.notes as string
    };
}

/**
 * Map service_request status to grievance status
 */
function mapStatusToGrievanceStatus(status: string): GrievanceStatus {
    const statusMap: Record<string, GrievanceStatus> = {
        'new': 'New',
        'in_progress': 'In Progress',
        'under_review': 'Under Review',
        'resolved': 'Resolved',
        'closed': 'Closed',
        'rejected': 'Rejected',
        'pending': 'New' // Map pending to New
    };
    return statusMap[status?.toLowerCase()] || 'New';
}

/**
 * Update grievance status
 */
export async function updateGrievanceStatus(
    grievance_id: string,
    status: GrievanceStatus,
    notes?: string
): Promise<boolean> {
    if (isDemoMode) {
        const grievance = demoGrievances.get(grievance_id);
        if (grievance) {
            grievance.status = status;
            grievance.notes = notes;
            grievance.updated_at = new Date().toISOString();
        }
        return true;
    }

    try {
        const { error } = await supabase
            .from('grievances')
            .update({ status, notes, updated_at: new Date().toISOString() })
            .eq('grievance_id', grievance_id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error updating grievance:', error);
        return false;
    }
}

/**
 * Get all grievances for a citizen
 */
export async function getCitizenGrievances(citizen_id: string): Promise<Grievance[]> {
    if (isDemoMode) {
        return Array.from(demoGrievances.values())
            .filter(g => g.citizen_id === citizen_id);
    }

    try {
        const { data, error } = await supabase
            .from('grievances')
            .select('*')
            .eq('citizen_id', citizen_id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching grievances:', error);
        return [];
    }
}
