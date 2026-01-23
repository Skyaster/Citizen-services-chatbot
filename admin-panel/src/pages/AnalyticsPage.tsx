// Analytics Page - Comprehensive chatbot analytics dashboard
import React, { useState, useEffect, useCallback } from 'react';
import {
    AreaChart, Area, BarChart, Bar, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    fetchAnalyticsData, calculateAnalyticsKPIs, calculateConversationVolume, calculateCategoryBreakdown,
    calculateStatusBreakdown, calculatePeakUsageHeatmap, calculateTopIntents,
    type AnalyticsFilters, type KPIData, type TimeSeriesPoint,
    type CategoryBreakdown, type StatusBreakdown,
    type HeatmapCell, type TopIntent
} from '../services/analyticsService';

// Chart colors
const COLORS = ['#00a884', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const STATUS_COLORS: Record<string, string> = {
    'New': '#3b82f6',
    'In Progress': '#f59e0b',
    'Under Review': '#8b5cf6',
    'Resolved': '#22c55e',
    'Closed': '#6b7280',
    'Rejected': '#ef4444',
};

// KPI Card Component
const KPICard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: number;
    icon: React.ReactNode;
    color?: string;
}> = ({ title, value, subtitle, trend, icon, color = 'var(--wa-teal)' }) => (
    <div className="analytics-kpi-card">
        <div className="analytics-kpi-card__icon" style={{ backgroundColor: `${color}20`, color }}>
            {icon}
        </div>
        <div className="analytics-kpi-card__content">
            <span className="analytics-kpi-card__title">{title}</span>
            <span className="analytics-kpi-card__value">{value}</span>
            {subtitle && <span className="analytics-kpi-card__subtitle">{subtitle}</span>}
            {trend !== undefined && (
                <span className={`analytics-kpi-card__trend ${trend >= 0 ? 'positive' : 'negative'}`}>
                    {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
                </span>
            )}
        </div>
    </div>
);

// Heatmap Component
const Heatmap: React.FC<{ data: HeatmapCell[] }> = ({ data }) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const maxCount = Math.max(...data.map(d => d.count), 1);

    const getColor = (count: number) => {
        const intensity = count / maxCount;
        if (intensity === 0) return 'var(--wa-input-bg)';
        if (intensity < 0.25) return 'rgba(0, 168, 132, 0.2)';
        if (intensity < 0.5) return 'rgba(0, 168, 132, 0.4)';
        if (intensity < 0.75) return 'rgba(0, 168, 132, 0.6)';
        return 'rgba(0, 168, 132, 0.9)';
    };

    return (
        <div className="analytics-heatmap">
            <div className="analytics-heatmap__header">
                <span></span>
                {hours.filter((_, i) => i % 3 === 0).map(h => (
                    <span key={h} className="analytics-heatmap__hour-label">{h}:00</span>
                ))}
            </div>
            {days.map((day, dayIdx) => (
                <div key={day} className="analytics-heatmap__row">
                    <span className="analytics-heatmap__day-label">{day}</span>
                    <div className="analytics-heatmap__cells">
                        {hours.map(hour => {
                            const cell = data.find(d => d.day === dayIdx && d.hour === hour);
                            return (
                                <div
                                    key={hour}
                                    className="analytics-heatmap__cell"
                                    style={{ backgroundColor: getColor(cell?.count || 0) }}
                                    title={`${day} ${hour}:00 - ${cell?.count || 0} requests`}
                                />
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export const AnalyticsPage: React.FC = () => {
    // Date range state (default: last 30 days)
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });
    const [categoryFilter, setCategoryFilter] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Data state
    const [kpis, setKpis] = useState<KPIData | null>(null);
    const [volumeData, setVolumeData] = useState<TimeSeriesPoint[]>([]);
    const [categoryData, setCategoryData] = useState<CategoryBreakdown[]>([]);
    const [statusData, setStatusData] = useState<StatusBreakdown[]>([]);
    const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([]);
    const [topIntents, setTopIntents] = useState<TopIntent[]>([]);

    const filters: AnalyticsFilters = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        category: categoryFilter || undefined,
    };

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            // optimized: single fetch
            const { current, previous } = await fetchAnalyticsData(filters);

            // synchronous calculations
            setKpis(calculateAnalyticsKPIs(current, previous));
            setVolumeData(calculateConversationVolume(current, filters));
            setCategoryData(calculateCategoryBreakdown(current));
            setStatusData(calculateStatusBreakdown(current));
            setHeatmapData(calculatePeakUsageHeatmap(current));
            setTopIntents(calculateTopIntents(current));

        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setIsLoading(false);
        }
    }, [dateRange, categoryFilter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Calculate trends
    const conversationTrend = kpis && kpis.previousPeriod.totalConversations > 0
        ? ((kpis.totalConversations - kpis.previousPeriod.totalConversations) / kpis.previousPeriod.totalConversations) * 100
        : 0;

    return (
        <div className="analytics-page">
            <div className="analytics-page__header">
                <h1 className="analytics-page__title">Chatbot Analytics</h1>
                <p className="analytics-page__subtitle">Monitor citizen engagement and service performance</p>
            </div>

            {/* Filter Bar */}
            <div className="analytics-filter-bar">
                <div className="analytics-filter-group">
                    <label>Start Date</label>
                    <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="analytics-filter-input"
                    />
                </div>
                <div className="analytics-filter-group">
                    <label>End Date</label>
                    <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="analytics-filter-input"
                    />
                </div>
                <div className="analytics-filter-group">
                    <label>Category</label>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="analytics-filter-select"
                    >
                        <option value="">All Categories</option>
                        <option value="complaint">Complaints</option>
                        <option value="certificate">Certificates</option>
                        <option value="payment">Payments</option>
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="analytics-loading">
                    <div className="spinner"></div>
                    <p>Loading analytics data...</p>
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="analytics-kpi-grid">
                        <KPICard
                            title="Total Conversations"
                            value={kpis?.totalConversations.toLocaleString() || '0'}
                            trend={conversationTrend}
                            icon={<span>•</span>}
                        />
                        <KPICard
                            title="Unique Citizens"
                            value={kpis?.uniqueCitizens.toLocaleString() || '0'}
                            subtitle="Served this period"
                            icon={<span>•</span>}
                            color="#3b82f6"
                        />
                        <KPICard
                            title="Resolution Rate"
                            value={`${kpis?.resolutionRate.toFixed(1) || 0}%`}
                            subtitle={`${kpis?.resolvedCount || 0} resolved`}
                            icon={<span>•</span>}
                            color="#22c55e"
                        />
                        <KPICard
                            title="Avg Resolution Time"
                            value={kpis?.avgResolutionHours ? `${kpis.avgResolutionHours.toFixed(1)}h` : 'N/A'}
                            subtitle="Hours to resolve"
                            icon={<span>•</span>}
                            color="#8b5cf6"
                        />
                        <KPICard
                            title="Overdue Rate"
                            value={`${kpis?.overdueRate.toFixed(1) || 0}%`}
                            subtitle={`${kpis?.overdueCount || 0} overdue`}
                            icon={<span>•</span>}
                            color="#ef4444"
                        />
                        <KPICard
                            title="Pending Requests"
                            value={kpis?.pendingCount.toLocaleString() || '0'}
                            subtitle="Awaiting action"
                            icon={<span>•</span>}
                            color="#f59e0b"
                        />
                    </div>

                    {/* Charts Row 1 */}
                    <div className="analytics-charts-row">
                        {/* Conversation Volume Chart */}
                        <div className="analytics-chart-card analytics-chart-card--wide">
                            <h3 className="analytics-chart-title">Conversation Volume Over Time</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={volumeData}>
                                    <defs>
                                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00a884" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#00a884" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--wa-border)" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fill: 'var(--wa-text-secondary)', fontSize: 12 }}
                                        tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    />
                                    <YAxis tick={{ fill: 'var(--wa-text-secondary)', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--wa-bg-secondary)',
                                            border: '1px solid var(--wa-border)',
                                            borderRadius: '8px',
                                        }}
                                        labelFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        name="Conversations"
                                        stroke="#00a884"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorVolume)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Charts Row 2 */}
                    <div className="analytics-charts-row">
                        {/* Category Breakdown */}
                        <div className="analytics-chart-card">
                            <h3 className="analytics-chart-title">Requests by Category</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={categoryData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--wa-border)" />
                                    <XAxis type="number" tick={{ fill: 'var(--wa-text-secondary)', fontSize: 12 }} />
                                    <YAxis dataKey="category" type="category" tick={{ fill: 'var(--wa-text-secondary)', fontSize: 12 }} width={100} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--wa-bg-secondary)',
                                            border: '1px solid var(--wa-border)',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Bar dataKey="count" name="Requests" barSize={24} radius={[0, 4, 4, 0]}>
                                        {categoryData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>



                        {/* Status Breakdown */}
                        <div className="analytics-chart-card">
                            <h3 className="analytics-chart-title">Requests by Status</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={statusData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--wa-border)" />
                                    <XAxis dataKey="status" tick={{ fill: 'var(--wa-text-secondary)', fontSize: 11 }} />
                                    <YAxis tick={{ fill: 'var(--wa-text-secondary)', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--wa-bg-secondary)',
                                            border: '1px solid var(--wa-border)',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Bar dataKey="count" name="Requests" barSize={32} radius={[4, 4, 0, 0]}>
                                        {statusData.map((entry) => (
                                            <Cell key={`cell-${entry.status}`} fill={STATUS_COLORS[entry.status] || '#6b7280'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Charts Row 3 */}
                    <div className="analytics-charts-row">
                        {/* Peak Usage Heatmap */}
                        <div className="analytics-chart-card">
                            <h3 className="analytics-chart-title">Peak Usage Times</h3>
                            <Heatmap data={heatmapData} />
                        </div>

                        {/* Top Intents */}
                        <div className="analytics-chart-card">
                            <h3 className="analytics-chart-title">Top Request Types</h3>
                            <div className="analytics-intents-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Type</th>
                                            <th>Count</th>
                                            <th>Resolution</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topIntents.map((intent, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    <span className="intent-name">{intent.subCategory}</span>
                                                    <small className="intent-category">{intent.category}</small>
                                                </td>
                                                <td>{intent.count}</td>
                                                <td>
                                                    <div className="resolution-bar">
                                                        <div
                                                            className="resolution-bar__fill"
                                                            style={{ width: `${intent.resolutionRate}%` }}
                                                        />
                                                        <span>{intent.resolutionRate.toFixed(0)}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {topIntents.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="empty-state">No data available</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
