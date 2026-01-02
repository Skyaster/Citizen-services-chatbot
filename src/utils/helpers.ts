// Utility functions for Citizen Services Chatbot

/**
 * Generate a grievance ID (e.g., GR00001)
 */
export function generateGrievanceId(): string {
    const num = Math.floor(Math.random() * 99999) + 1;
    return `GR${num.toString().padStart(5, '0')}`;
}

/**
 * Generate an application ID (e.g., APP00001)
 */
export function generateApplicationId(): string {
    const num = Math.floor(Math.random() * 99999) + 1;
    return `APP${num.toString().padStart(5, '0')}`;
}

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format timestamp for display
 */
export function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

/**
 * Detect if text contains Hindi/Hinglish
 */
export function detectLanguage(text: string): 'en' | 'hi' | 'hinglish' {
    // Hindi Unicode range: \u0900-\u097F
    const hindiRegex = /[\u0900-\u097F]/;
    const hasHindi = hindiRegex.test(text);

    // Common Hinglish patterns
    const hinglishPatterns = [
        /\b(hai|hain|nahi|kya|kaise|kab|kaha|kyun|bhai|ji|aap|mera|meri|humara|yeh|woh|abhi|bahut|accha|theek|paani|sadak|bijli|light|bill|problem|issue)\b/i
    ];
    const hasHinglish = hinglishPatterns.some(pattern => pattern.test(text));

    if (hasHindi) return 'hi';
    if (hasHinglish) return 'hinglish';
    return 'en';
}

/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Get greeting based on time of day
 */
export function getTimeGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

/**
 * Parse structured data from bot response
 */
export function parseStructuredData(response: string): {
    message: string;
    structuredData?: Record<string, string>
} {
    const structuredMatch = response.match(/\[STRUCTURED_DATA\]([\s\S]*?)\[\/STRUCTURED_DATA\]/);

    if (structuredMatch) {
        const cleanMessage = response.replace(/\[STRUCTURED_DATA\][\s\S]*?\[\/STRUCTURED_DATA\]/, '').trim();
        const dataLines = structuredMatch[1].trim().split('\n');
        const structuredData: Record<string, string> = {};

        dataLines.forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length) {
                structuredData[key.trim()] = valueParts.join(':').trim();
            }
        });

        return { message: cleanMessage, structuredData };
    }

    return { message: response };
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
}

/**
 * Delay utility for typing indicator
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get category icon emoji
 */
export function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
        electricity: '⚡',
        water: '💧',
        property_tax: '🏠',
        roads: '🛣️',
        garbage: '🗑️',
        street_lights: '💡',
        drainage: '🌊',
        birth_certificate: '👶',
        income_certificate: '💰',
        caste_certificate: '📋',
        domicile_certificate: '🏡',
        shop_license: '🏪',
        trade_license: '📜',
        parking_permit: '🅿️',
        event_permission: '🎉',
        bill_payment: '💳',
        grievance: '📝',
        certificate: '📄',
        license: '📋',
        status: '🔍',
        info: 'ℹ️'
    };
    return icons[category.toLowerCase()] || '📌';
}

/**
 * Get status color class
 */
export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        'New': 'status-new',
        'Pending': 'status-pending',
        'In Progress': 'status-progress',
        'Under Review': 'status-review',
        'Document Verification': 'status-verification',
        'Approved': 'status-approved',
        'Resolved': 'status-resolved',
        'Rejected': 'status-rejected',
        'Closed': 'status-closed',
        'Ready for Collection': 'status-ready'
    };
    return colors[status] || 'status-default';
}
