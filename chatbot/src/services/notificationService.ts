// Notification Service - Fetch and manage notifications for citizens
import { supabase, isDemoMode } from './supabase';

export interface Notification {
    id: string;
    title: string;
    message: string;
    created_at: string;
    read?: boolean;
}

// Mock notifications for demo mode
const demoNotifications: Notification[] = [
    {
        id: '1',
        title: 'Water Supply Maintenance',
        message: 'Water supply will be affected in Ward 4 tomorrow from 10 AM to 2 PM.',
        created_at: new Date().toISOString(),
        read: false
    }
];

export async function getUnreadNotifications(citizenId: string): Promise<Notification[]> {
    if (isDemoMode) {
        return demoNotifications.filter(n => !n.read);
    }

    try {
        // 1. Get all relevant notifications (broadcast or targeted)
        console.log('Fetching notifications...');
        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('target_type', 'all')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('Error fetching notifications table:', error);
            throw error;
        }

        console.log('Notifications fetched:', notifications?.length);
        if (!notifications || notifications.length === 0) return [];

        // 2. Get read receipts for this citizen
        console.log('Fetching read receipts for:', citizenId);
        const { data: reads, error: readError } = await supabase
            .from('notification_reads')
            .select('notification_id')
            .eq('citizen_id', citizenId);

        if (readError) {
            console.error('Error fetching notification_reads table:', readError);
            throw readError;
        }

        const readIds = new Set((reads || []).map(r => r.notification_id));

        // Add local storage reads (Fallback)
        try {
            const localReads = JSON.parse(localStorage.getItem('notification_reads') || '[]');
            localReads.forEach((id: string) => readIds.add(id));
        } catch (e) { /* ignore */ }

        // 3. Filter out read notifications
        return notifications.filter(n => !readIds.has(n.id));
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}

export async function markAsRead(notificationId: string, citizenId: string): Promise<boolean> {
    // Optimistic: Always save to local storage first
    try {
        const localReads = JSON.parse(localStorage.getItem('notification_reads') || '[]');
        if (!localReads.includes(notificationId)) {
            localReads.push(notificationId);
            localStorage.setItem('notification_reads', JSON.stringify(localReads));
        }
    } catch (e) {
        console.error('Error saving local read receipt:', e);
    }

    if (isDemoMode) {
        const notif = demoNotifications.find(n => n.id === notificationId);
        if (notif) notif.read = true;
        return true;
    }

    try {
        const { error } = await supabase
            .from('notification_reads')
            .insert({
                notification_id: notificationId,
                citizen_id: citizenId
            });

        if (error) {
            // Ignore duplicate key error (already read)
            if (error.code !== '23505') throw error;
        }
        return true;
    } catch (error) {
        console.error('Error marking read (DB):', error);
        // Return true anyway because we saved locally
        return true;
    }
}

/**
 * Verify which notifications still exist in the database
 * Returns the list of IDs that are still valid.
 */
export async function verifyActiveNotifications(notificationIds: string[]): Promise<string[]> {
    if (!notificationIds || notificationIds.length === 0) return [];

    if (isDemoMode) {
        return notificationIds.filter(id => demoNotifications.some(n => n.id === id));
    }

    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('id')
            .in('id', notificationIds);

        if (error) throw error;

        return (data || []).map(n => String(n.id));
    } catch (error) {
        console.error('Error verifying notifications:', error);
        return notificationIds; // If error, assume verified to prevent accidental deletion
    }
}
