// Request Dashboard Component
import React, { useState, useEffect } from 'react';
import { RequestList } from './RequestList';
import {
    fetchAllRequests,
    getDashboardStats,
} from '../services/adminService';
import type { ServiceRequest } from '../types/adminTypes';

interface DashboardStats {
    total: number;
    pending: number;
    overdue: number;
    resolvedToday: number;
}

export const RequestDashboard: React.FC = () => {
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [stats, setStats] = useState<DashboardStats>({
        total: 0,
        pending: 0,
        overdue: 0,
        resolvedToday: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: '',
        status: '',
        priority: '',
        search: '',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRequests, setTotalRequests] = useState(0);
    const pageSize = 20;

    useEffect(() => {
        loadData();
    }, [filters, currentPage]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [requestsResult, statsResult] = await Promise.all([
                fetchAllRequests(currentPage, pageSize, filters),
                getDashboardStats(),
            ]);
            setRequests(requestsResult.requests);
            setTotalRequests(requestsResult.total);
            setStats(statsResult);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(totalRequests / pageSize);

    return (
        <div className="dashboard">
            {/* Stats Cards */}
            <div className="dashboard__stats">
                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--total">📊</div>
                    <div className="stat-card__content">
                        <span className="stat-card__value">{stats.total}</span>
                        <span className="stat-card__label">Total Requests</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--pending">⏳</div>
                    <div className="stat-card__content">
                        <span className="stat-card__value">{stats.pending}</span>
                        <span className="stat-card__label">Pending</span>
                    </div>
                </div>

                <div className="stat-card stat-card--warning">
                    <div className="stat-card__icon stat-card__icon--overdue">⚠️</div>
                    <div className="stat-card__content">
                        <span className="stat-card__value">{stats.overdue}</span>
                        <span className="stat-card__label">Overdue</span>
                    </div>
                </div>

                <div className="stat-card stat-card--success">
                    <div className="stat-card__icon stat-card__icon--resolved">✅</div>
                    <div className="stat-card__content">
                        <span className="stat-card__value">{stats.resolvedToday}</span>
                        <span className="stat-card__label">Resolved Today</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="dashboard__filters">
                <div className="filter-group">
                    <input
                        type="text"
                        className="filter-input"
                        placeholder="🔍 Search by ID or description..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <select
                        className="filter-select"
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                        <option value="">All Categories</option>
                        <option value="complaint">Complaints</option>
                        <option value="certificate">Certificates</option>
                        <option value="payment">Payments</option>
                    </select>
                </div>

                <div className="filter-group">
                    <select
                        className="filter-select"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="new">New</option>
                        <option value="in_progress">In Progress</option>
                        <option value="under_review">Under Review</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>

                <div className="filter-group">
                    <select
                        className="filter-select"
                        value={filters.priority}
                        onChange={(e) => handleFilterChange('priority', e.target.value)}
                    >
                        <option value="">All Priorities</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>

                <button className="filter-btn" onClick={() => setFilters({ category: '', status: '', priority: '', search: '' })}>
                    Clear Filters
                </button>
            </div>

            {/* Request List */}
            <RequestList requests={requests} isLoading={isLoading} />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="dashboard__pagination">
                    <button
                        className="pagination-btn"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                    >
                        ← Previous
                    </button>
                    <span className="pagination-info">
                        Page {currentPage} of {totalPages} ({totalRequests} total)
                    </span>
                    <button
                        className="pagination-btn"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
};
