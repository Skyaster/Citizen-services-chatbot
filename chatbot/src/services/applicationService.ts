// Application Service - CRUD operations for certificates and licenses

import { supabase, isDemoMode } from './supabase';
import type { Application, ApplicationStatus, ApplicationDetails } from '../types';
import { generateApplicationId } from '../utils/helpers';

// Demo storage
const demoApplications: Map<string, Application> = new Map();

/**
 * Create a new application (certificate or license)
 */
export async function createApplication(data: {
    citizen_id?: string;
    type: 'certificate' | 'license';
    subtype: string;
    details: ApplicationDetails;
    documents?: string[];
}): Promise<{ success: boolean; application_id?: string; error?: string }> {
    const application_id = generateApplicationId();

    if (isDemoMode) {
        // ... demo code ...
        const application: Application = {
            id: demoApplications.size + 1,
            application_id,
            citizen_id: data.citizen_id || 'demo-citizen',
            type: data.type,
            subtype: data.subtype,
            details: data.details,
            documents: data.documents,
            status: 'Pending',
            created_at: new Date().toISOString()
        };
        demoApplications.set(application_id, application);
        console.log('📋 Demo application created:', application);
        return { success: true, application_id };
    }

    try {
        // 1. Insert into applications table (existing)
        const { error: appError } = await supabase
            .from('applications')
            .insert({
                application_id,
                ...data,
                status: 'Pending'
            });

        if (appError) throw appError;

        // 2. Insert into service_requests table (for Admin Panel)
        const slaDueAt = new Date();
        slaDueAt.setDate(slaDueAt.getDate() + 7); // 7 days default SLA for certificates

        const metadata = {
            document_type: data.subtype,
            ...data.details,
            reference_id: application_id,
            pending_documents: data.documents ? [] : getRequiredDocuments(data.type, data.subtype)
        };

        await supabase
            .from('service_requests')
            .insert({
                citizen_id: data.citizen_id,
                category: data.type, // 'certificate' or 'license'
                sub_category: data.subtype,
                status: 'new',
                priority: 'medium',
                channel: 'whatsapp',
                department: getDepartmentForApplication(data.type, data.subtype),
                description: `Application for ${data.subtype.replace('_', ' ')}`,
                metadata: metadata,
                sla_due_at: slaDueAt.toISOString()
            });

        return { success: true, application_id };
    } catch (error) {
        console.error('Error creating application:', error);
        return { success: false, error: 'Failed to create application' };
    }
}

function getDepartmentForApplication(type: string, subtype: string): string {
    if (subtype.includes('tax')) return 'Revenue Dept';
    if (subtype.includes('birth') || subtype.includes('death')) return 'Health Dept';
    if (subtype.includes('shop') || subtype.includes('trade')) return 'Licensing Dept';
    return type === 'certificate' ? 'Citizen Services' : 'Licensing Dept';
}

/**
 * Get application by ID
 */
export async function getApplication(application_id: string): Promise<Application | null> {
    if (isDemoMode) {
        const app = demoApplications.get(application_id);
        if (app) return app;

        // Return mock data for demo
        return {
            id: 1,
            application_id,
            citizen_id: 'demo-citizen',
            type: 'certificate',
            subtype: 'birth_certificate',
            details: {
                applicant_name: 'Demo User',
                date_of_birth: '2024-01-15',
                place_of_birth: 'City Hospital, Mumbai',
                father_name: 'Demo Father',
                mother_name: 'Demo Mother'
            },
            status: 'Under Review',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        };
    }

    try {
        const { data, error } = await supabase
            .from('applications')
            .select('*')
            .eq('application_id', application_id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching application:', error);
        return null;
    }
}

/**
 * Update application status
 */
export async function updateApplicationStatus(
    application_id: string,
    status: ApplicationStatus
): Promise<boolean> {
    if (isDemoMode) {
        const app = demoApplications.get(application_id);
        if (app) {
            app.status = status;
            app.updated_at = new Date().toISOString();
        }
        return true;
    }

    try {
        const { error } = await supabase
            .from('applications')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('application_id', application_id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error updating application:', error);
        return false;
    }
}

/**
 * Get all applications for a citizen
 */
export async function getCitizenApplications(citizen_id: string): Promise<Application[]> {
    if (isDemoMode) {
        return Array.from(demoApplications.values())
            .filter(a => a.citizen_id === citizen_id);
    }

    try {
        const { data, error } = await supabase
            .from('applications')
            .select('*')
            .eq('citizen_id', citizen_id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching applications:', error);
        return [];
    }
}

/**
 * Get required documents for a certificate/license type
 */
export function getRequiredDocuments(type: string, subtype: string): string[] {
    const requirements: Record<string, string[]> = {
        'certificate:birth_certificate': [
            'Hospital discharge summary or birth report',
            'Parents\' Aadhaar cards',
            'Parents\' marriage certificate',
            'Address proof'
        ],
        'certificate:income_certificate': [
            'Aadhaar Card',
            'Salary slips or income proof',
            'Bank statement (last 6 months)',
            'Ration card (if available)',
            'Self-declaration affidavit'
        ],
        'certificate:caste_certificate': [
            'Aadhaar Card',
            'Father\'s caste certificate',
            'School leaving certificate',
            'Ration card',
            'Affidavit on stamp paper'
        ],
        'certificate:domicile_certificate': [
            'Aadhaar Card',
            'Address proof (electricity bill/rent agreement)',
            'Proof of residence for 15+ years',
            'School/college certificates',
            'Passport size photos'
        ],
        'license:shop_license': [
            'Identity proof (Aadhaar/PAN)',
            'Address proof of shop',
            'Rent agreement or ownership document',
            'Passport size photos',
            'NOC from landlord (if rented)'
        ],
        'license:trade_license': [
            'Identity proof',
            'Address proof',
            'Business registration certificate',
            'GST registration (if applicable)',
            'Passport size photos'
        ],
        'license:parking_permit': [
            'Vehicle registration certificate (RC)',
            'Driving license',
            'Address proof',
            'Passport size photo'
        ],
        'license:event_permission': [
            'Application letter with event details',
            'Identity proof of organizer',
            'NOC from local police',
            'Venue ownership/rental agreement',
            'List of expected attendees'
        ]
    };

    return requirements[`${type}:${subtype}`] || [
        'Aadhaar Card',
        'Address proof',
        'Passport size photos'
    ];
}
