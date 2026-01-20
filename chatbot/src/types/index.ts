// Types for Citizen Services Chatbot

export interface Citizen {
    id: string;
    phone: string;
    name: string;
    city?: string;
    ward?: string;
    created_at: string;
}

export interface Message {
    id: string;
    content: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    status?: 'sent' | 'delivered' | 'read';
    structuredData?: StructuredData;
}

export interface StructuredData {
    type: 'grievance' | 'application' | 'bill' | 'status_query' | 'info';
    category?: string;
    subcategory?: string;
    citizen_name?: string;
    phone?: string;
    area?: string;
    ward?: string;
    landmark?: string;
    description?: string;
    consumer_number?: string;
    application_id?: string;
    grievance_id?: string;
    [key: string]: string | undefined;
}

export interface Grievance {
    id: number;
    grievance_id: string;
    citizen_id: string;
    category: string;
    subcategory?: string;
    description: string;
    location: string;
    landmark?: string;
    photo_url?: string;
    status: GrievanceStatus;
    created_at: string;
    updated_at: string;
    assigned_department?: string;
    notes?: string;
}

export type GrievanceStatus =
    | 'New'
    | 'In Progress'
    | 'Under Review'
    | 'Resolved'
    | 'Closed'
    | 'Rejected';

export interface Application {
    id: number;
    application_id: string;
    citizen_id: string;
    type: 'certificate' | 'license';
    subtype: string;
    details: ApplicationDetails;
    documents?: string[];
    status: ApplicationStatus;
    created_at: string;
    updated_at?: string;
}

export interface ApplicationDetails {
    applicant_name?: string;
    date_of_birth?: string;
    place_of_birth?: string;
    father_name?: string;
    mother_name?: string;
    address?: string;
    purpose?: string;
    [key: string]: string | undefined;
}

export type ApplicationStatus =
    | 'Pending'
    | 'Under Review'
    | 'Document Verification'
    | 'Approved'
    | 'Rejected'
    | 'Ready for Collection';

export interface Bill {
    id: number;
    consumer_number: string;
    bill_type: 'electricity' | 'water' | 'property_tax' | 'other';
    amount: number;
    due_date: string;
    status: 'unpaid' | 'paid' | 'overdue';
    late_fee?: number;
}

export type FlowType =
    | 'bill_payment'
    | 'grievance'
    | 'certificate'
    | 'license'
    | 'status_tracking'
    | 'general_info'
    | 'idle';

export interface ConversationContext {
    currentFlow?: FlowType;
    collectedData?: Partial<StructuredData>;
    step?: number;
    awaitingInput?: string;
    language?: 'en' | 'hi' | 'hinglish';
}

export interface Conversation {
    id: string;
    citizen_id?: string;
    messages: Message[];
    context: ConversationContext;
    created_at: string;
    updated_at: string;
}

export type ServiceCategory =
    | 'electricity'
    | 'water'
    | 'property_tax'
    | 'roads'
    | 'garbage'
    | 'street_lights'
    | 'drainage'
    | 'birth_certificate'
    | 'income_certificate'
    | 'caste_certificate'
    | 'domicile_certificate'
    | 'shop_license'
    | 'trade_license'
    | 'parking_permit'
    | 'event_permission';

export interface QuickAction {
    id: string;
    label: string;
    icon: string;
    flow: FlowType;
    category?: string;
}
