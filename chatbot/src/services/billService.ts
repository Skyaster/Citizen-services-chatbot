// Bill Service - Bill lookup and payment simulation

import { supabase, isDemoMode } from './supabase';
import type { Bill } from '../types';
import { formatCurrency } from '../utils/helpers';

// Demo bills data
const demoBills: Map<string, Bill> = new Map([
    ['1234567890', {
        id: 1,
        consumer_number: '1234567890',
        bill_type: 'electricity',
        amount: 2450,
        due_date: '2024-12-31',
        status: 'unpaid'
    }],
    ['9876543210', {
        id: 2,
        consumer_number: '9876543210',
        bill_type: 'electricity',
        amount: 1850,
        due_date: '2025-01-05',
        status: 'unpaid'
    }],
    ['5555555555', {
        id: 3,
        consumer_number: '5555555555',
        bill_type: 'water',
        amount: 650,
        due_date: '2024-12-28',
        status: 'unpaid'
    }],
    ['PROP123456', {
        id: 4,
        consumer_number: 'PROP123456',
        bill_type: 'property_tax',
        amount: 12500,
        due_date: '2025-03-31',
        status: 'unpaid'
    }]
]);

/**
 * Get bill by consumer number
 */
export async function getBill(consumer_number: string): Promise<Bill | null> {
    if (isDemoMode) {
        // Check demo bills
        const bill = demoBills.get(consumer_number);
        if (bill) return bill;

        // Generate random bill for any input (demo purposes)
        const randomAmount = Math.floor(Math.random() * 5000) + 500;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30));

        return {
            id: Math.floor(Math.random() * 1000),
            consumer_number,
            bill_type: 'electricity',
            amount: randomAmount,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'unpaid'
        };
    }

    try {
        console.log('Fetching bill from Supabase for:', consumer_number);
        const { data, error } = await supabase
            .from('bills')
            .select('*')
            .eq('consumer_number', consumer_number)
            .single();

        if (error || !data) {
            console.warn('Supabase lookup failed or empty, checking demo data...');
            // Fallback to demo data if available (Hybrid mode)
            const demoBill = demoBills.get(consumer_number);
            if (demoBill) return demoBill;

            if (error) console.error('Supabase error:', error);
            return null;
        }
        console.log('Supabase data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching bill:', error);
        // Fallback to demo data on crash
        return demoBills.get(consumer_number) || null;
    }
}

/**
 * Get all unpaid bills for a consumer
 */
export async function getUnpaidBills(consumer_number: string): Promise<Bill[]> {
    if (isDemoMode) {
        const bill = demoBills.get(consumer_number);
        return bill ? [bill] : [];
    }

    try {
        const { data, error } = await supabase
            .from('bills')
            .select('*')
            .eq('consumer_number', consumer_number)
            .eq('status', 'unpaid');

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching unpaid bills:', error);
        return [];
    }
}

/**
 * Generate payment link (simulated)
 */
export function generatePaymentLink(bill: Bill): string {
    // In production, this would integrate with a payment gateway
    const baseUrl = 'https://pay.gov.in/citizen';
    const params = new URLSearchParams({
        type: bill.bill_type,
        consumer: bill.consumer_number,
        amount: bill.amount.toString(),
        ref: `PAY${Date.now()}`
    });

    return `${baseUrl}?${params.toString()}`;
}

/**
 * Mark bill as paid (simulation)
 */
export async function markBillPaid(consumer_number: string, billDetails?: Bill): Promise<boolean> {
    if (isDemoMode) {
        const bill = demoBills.get(consumer_number);
        if (bill) {
            bill.status = 'paid';
        }
        return true;
    }

    try {
        // 1. Update bill status
        const { error } = await supabase
            .from('bills')
            .update({ status: 'paid' })
            .eq('consumer_number', consumer_number);

        if (error) throw error;

        // 2. Log payment request in admin panel
        if (billDetails) {
            const metadata = {
                payment_type: billDetails.bill_type,
                reference_id: consumer_number,
                amount: billDetails.amount,
                payment_status: 'success',
                transaction_id: `TXN${Date.now()}`
            };

            await supabase
                .from('service_requests')
                .insert({
                    category: 'payment',
                    status: 'resolved', // Automatically resolved
                    priority: 'medium',
                    channel: 'whatsapp',
                    department: 'Finance',
                    description: `Bill payment for ${billDetails.bill_type} - Consumer: ${consumer_number}`,
                    metadata: metadata,
                    resolved_at: new Date().toISOString()
                });
        }

        return true;
    } catch (error) {
        console.error('Error marking bill as paid:', error);
        return false;
    }
}

/**
 * Format bill details for display
 */
export function formatBillDetails(bill: Bill): string {
    const isPastDue = new Date(bill.due_date) < new Date();
    const lateFee = isPastDue ? Math.floor(bill.amount * 0.1) : 0;
    const totalAmount = bill.amount + lateFee;

    let message = `📄 *Bill Details*\n\n`;
    message += `Consumer Number: ${bill.consumer_number}\n`;
    message += `Bill Type: ${bill.bill_type.replace('_', ' ').toUpperCase()}\n`;
    message += `Amount: ${formatCurrency(bill.amount)}\n`;
    message += `Due Date: ${bill.due_date}\n`;

    if (isPastDue) {
        message += `\n⚠️ *Bill is overdue!*\n`;
        message += `Late Fee: ${formatCurrency(lateFee)}\n`;
        message += `Total Payable: ${formatCurrency(totalAmount)}`;
    }

    return message;
}
