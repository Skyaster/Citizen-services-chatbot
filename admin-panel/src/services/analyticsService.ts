// Analytics Service - Fetch and aggregate chatbot analytics data
import { supabase } from './supabase';

export interface AnalyticsFilters {
    startDate: string;
    endDate: string;
    channel?: string;
    category?: string;
    status?: string;
}

export interface AnalyticsRawData {
    id: string;
    citizen_id: string;
    status: string;
    category: string;
    sub_category?: string;
    channel: string;
    created_at: string;
    resolved_at?: string;
    sla_due_at?: string;
}

export interface KPIData {
    totalConversations: number;
    uniqueCitizens: number;
    resolvedCount: number;
    resolutionRate: number;
    avgResolutionHours: number;
    overdueCount: number;
    overdueRate: number;
    pendingCount: number;
    previousPeriod: {
        totalConversations: number;
        resolvedCount: number;
    };
}

export interface TimeSeriesPoint {
    date: string;
    count: number;
}

export interface CategoryBreakdown {
    category: string;
    count: number;
    percentage: number;
}

export interface ChannelBreakdown {
    channel: string;
    count: number;
    percentage: number;
}

export interface StatusBreakdown {
    status: string;
    count: number;
    percentage: number;
}

export interface HeatmapCell {
    day: number; // 0-6 (Sun-Sat)
    hour: number; // 0-23
    count: number;
}

export interface TopIntent {
    subCategory: string;
    category: string;
    count: number;
    resolvedCount: number;
    resolutionRate: number;
}

/**
 * Fetch all analytics data in a single request (optimized)
 * Returns raw data for current period and previous period (for trends)
 */
export async function fetchAnalyticsData(filters: AnalyticsFilters): Promise<{
    current: AnalyticsRawData[];
    previous: AnalyticsRawData[];
}> {
    const { startDate, endDate, channel, category, status } = filters;

    // Calculate previous period
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const periodDays = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
    const prevStartDate = new Date(startDateObj.getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString();
    const prevEndDate = startDate;

    // Build Current Period Query
    let currentQuery = supabase
        .from('service_requests')
        .select('id, citizen_id, status, category, sub_category, channel, created_at, resolved_at, sla_due_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

    if (channel) currentQuery = currentQuery.eq('channel', channel);
    if (category) currentQuery = currentQuery.eq('category', category);
    if (status) currentQuery = currentQuery.eq('status', status);

    // Build Previous Period Query
    let prevQuery = supabase
        .from('service_requests')
        .select('id, status, created_at') // Minimal fields for trend calc
        .gte('created_at', prevStartDate)
        .lt('created_at', prevEndDate);

    if (channel) prevQuery = prevQuery.eq('channel', channel);
    if (category) prevQuery = prevQuery.eq('category', category);
    if (status) prevQuery = prevQuery.eq('status', status);

    // Execute in parallel
    const [currentRes, prevRes] = await Promise.all([currentQuery, prevQuery]);

    if (currentRes.error) console.error('Error fetching current analytics:', currentRes.error);
    if (prevRes.error) console.error('Error fetching previous analytics:', prevRes.error);

    return {
        current: (currentRes.data as AnalyticsRawData[]) || [],
        previous: (prevRes.data as AnalyticsRawData[]) || []
    };
}

// Recalculate KPI metrics from raw data (Sync)
export function calculateAnalyticsKPIs(currentData: AnalyticsRawData[], previousData: AnalyticsRawData[]): KPIData {
    // Current stats
    const totalConversations = currentData.length;
    const uniqueCitizens = new Set(currentData.map(r => r.citizen_id)).size;
    const resolvedRecords = currentData.filter(r => r.status === 'resolved' || r.status === 'closed');
    const pendingRecords = currentData.filter(r => ['new', 'in_progress', 'under_review'].includes(r.status));
    const overdueRecords = currentData.filter(r => r.sla_due_at && new Date(r.sla_due_at) < new Date());

    // Average resolution time
    let totalResolutionHours = 0;
    let resolutionCount = 0;
    resolvedRecords.forEach(r => {
        if (r.resolved_at && r.created_at) {
            const hours = (new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60);
            totalResolutionHours += hours;
            resolutionCount++;
        }
    });

    // Previous stats
    const prevTotal = previousData.length;
    const prevResolved = previousData.filter(r => r.status === 'resolved' || r.status === 'closed').length;

    return {
        totalConversations,
        uniqueCitizens,
        resolvedCount: resolvedRecords.length,
        resolutionRate: totalConversations ? (resolvedRecords.length / totalConversations) * 100 : 0,
        avgResolutionHours: resolutionCount ? totalResolutionHours / resolutionCount : 0,
        overdueCount: overdueRecords.length,
        overdueRate: totalConversations ? (overdueRecords.length / totalConversations) * 100 : 0,
        pendingCount: pendingRecords.length,
        previousPeriod: {
            totalConversations: prevTotal,
            resolvedCount: prevResolved,
        },
    };
}

// Calculate conversation volume (Sync)
export function calculateConversationVolume(data: AnalyticsRawData[], filters: AnalyticsFilters): TimeSeriesPoint[] {
    const { startDate, endDate } = filters;

    // Group by date
    const dateMap = new Map<string, number>();
    data.forEach(record => {
        const date = new Date(record.created_at).toISOString().split('T')[0];
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    // Fill in missing dates
    const result: TimeSeriesPoint[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        result.push({
            date: dateStr,
            count: dateMap.get(dateStr) || 0,
        });
        current.setDate(current.getDate() + 1);
    }

    return result;
}

// Calculate category breakdown (Sync)
export function calculateCategoryBreakdown(data: AnalyticsRawData[]): CategoryBreakdown[] {
    const categoryMap = new Map<string, number>();
    data.forEach(record => {
        const cat = record.category || 'unknown';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    });

    const total = data.length || 1;
    return Array.from(categoryMap.entries()).map(([category, count]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        count,
        percentage: (count / total) * 100,
    }));
}

// Calculate channel breakdown (Sync)
export function calculateChannelBreakdown(data: AnalyticsRawData[]): ChannelBreakdown[] {
    const channelMap = new Map<string, number>();
    data.forEach(record => {
        const ch = record.channel || 'unknown';
        channelMap.set(ch, (channelMap.get(ch) || 0) + 1);
    });

    const total = data.length || 1;
    return Array.from(channelMap.entries()).map(([channel, count]) => ({
        channel: channel.charAt(0).toUpperCase() + channel.slice(1),
        count,
        percentage: (count / total) * 100,
    }));
}

// Calculate status breakdown (Sync)
export function calculateStatusBreakdown(data: AnalyticsRawData[]): StatusBreakdown[] {
    const statusMap = new Map<string, number>();
    data.forEach(record => {
        const st = record.status || 'unknown';
        statusMap.set(st, (statusMap.get(st) || 0) + 1);
    });

    const total = data.length || 1;
    const statusLabels: Record<string, string> = {
        new: 'New',
        in_progress: 'In Progress',
        under_review: 'Under Review',
        resolved: 'Resolved',
        closed: 'Closed',
        rejected: 'Rejected',
    };

    return Array.from(statusMap.entries()).map(([status, count]) => ({
        status: statusLabels[status] || status,
        count,
        percentage: (count / total) * 100,
    }));
}

// Calculate heatmap (Sync)
export function calculatePeakUsageHeatmap(data: AnalyticsRawData[]): HeatmapCell[] {
    // Initialize matrix
    const matrix: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));

    data.forEach(record => {
        const date = new Date(record.created_at);
        const day = date.getDay(); // 0-6
        const hour = date.getHours(); // 0-23
        matrix[day][hour]++;
    });

    // Flatten to cells
    const cells: HeatmapCell[] = [];
    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            cells.push({ day, hour, count: matrix[day][hour] });
        }
    }

    return cells;
}

// Calculate top intents (Sync)
export function calculateTopIntents(data: AnalyticsRawData[], limit: number = 10): TopIntent[] {
    const intentMap = new Map<string, { category: string; count: number; resolved: number }>();

    data.forEach(record => {
        const key = record.sub_category || 'General';
        const existing = intentMap.get(key) || { category: record.category, count: 0, resolved: 0 };
        existing.count++;
        if (record.status === 'resolved' || record.status === 'closed') {
            existing.resolved++;
        }
        intentMap.set(key, existing);
    });

    return Array.from(intentMap.entries())
        .map(([subCategory, data]) => ({
            subCategory,
            category: data.category,
            count: data.count,
            resolvedCount: data.resolved,
            resolutionRate: data.count ? (data.resolved / data.count) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

