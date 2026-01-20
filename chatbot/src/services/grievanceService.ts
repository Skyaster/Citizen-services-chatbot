// Grievance Service - CRUD operations for grievances

import { supabase, isDemoMode } from './supabase';
import type { Grievance, GrievanceStatus } from '../types';
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
}): Promise<{ success: boolean; grievance_id?: string; error?: string }> {
    const grievance_id = generateGrievanceId();

    // Use demo citizen ID if not provided
    const citizenId = data.citizen_id || '00000000-0000-0000-0000-000000000000';

    if (isDemoMode) {
        // ... demo code ...\
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

        console.log('📤 Inserting service request:', { citizenId, category: data.category, description: data.description });

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
 * Get grievance by ID
 */
export async function getGrievance(grievance_id: string): Promise<Grievance | null> {
    if (isDemoMode) {
        const grievance = demoGrievances.get(grievance_id);
        if (grievance) return grievance;

        // Return mock data for demo
        return {
            id: 1,
            grievance_id,
            citizen_id: 'demo-citizen',
            category: 'Roads',
            subcategory: 'Pothole',
            description: 'Large pothole near main market',
            location: 'Ward 5, Main Road',
            landmark: 'Near SBI Bank',
            status: 'In Progress',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            assigned_department: 'Roads Department',
            notes: 'Field team scheduled for inspection'
        };
    }

    try {
        const { data, error } = await supabase
            .from('grievances')
            .select('*')
            .eq('grievance_id', grievance_id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching grievance:', error);
        return null;
    }
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
