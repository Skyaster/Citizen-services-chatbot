// Admin Layout Component
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AdminLayout: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const mainRef = useRef<HTMLElement>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

    // Get user info from auth
    const currentAdmin = {
        name: user?.email?.split('@')[0] || 'Admin User',
        role: 'Admin',
        email: user?.email || '',
    };

    const getInitials = (name: string) => {
        return name
            .split(/[._-]/)
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'AD';
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    // Handle scroll to show/hide scroll-to-top button
    useEffect(() => {
        const handleScroll = () => {
            if (mainRef.current) {
                setShowScrollTop(mainRef.current.scrollTop > 300);
            }
        };

        const mainElement = mainRef.current;
        if (mainElement) {
            mainElement.addEventListener('scroll', handleScroll);
            return () => mainElement.removeEventListener('scroll', handleScroll);
        }
    }, []);

    const scrollToTop = () => {
        if (mainRef.current) {
            mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="admin-layout">
            {/* Top Navigation */}
            <header className="admin-header">
                <div className="admin-header__brand">
                    <span className="admin-header__logo">🏛️</span>
                    <div className="admin-header__title">
                        <h1>Citizen Services</h1>
                        <span className="admin-header__subtitle">Admin Panel</span>
                    </div>
                </div>

                <nav className="admin-header__nav">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            `admin-nav-link ${isActive ? 'admin-nav-link--active' : ''}`
                        }
                    >
                        📊 Dashboard
                    </NavLink>
                    <NavLink
                        to="/notifications"
                        className={({ isActive }) =>
                            `admin-nav-link ${isActive ? 'admin-nav-link--active' : ''}`
                        }
                    >
                        📢 Notifications
                    </NavLink>
                </nav>

                <div className="admin-header__user">
                    <div className="admin-header__user-info">
                        <span className="admin-header__user-name">{currentAdmin.name}</span>
                        <span className="admin-header__user-role">{currentAdmin.email}</span>
                    </div>
                    <div className="admin-header__avatar">
                        {getInitials(currentAdmin.name)}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="admin-header__logout"
                        title="Sign Out"
                    >
                        🚪
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="admin-main" ref={mainRef}>
                <Outlet />
            </main>

            {/* Scroll to Top Button */}
            <button
                className={`scroll-to-top ${showScrollTop ? '' : 'hidden'}`}
                onClick={scrollToTop}
                title="Scroll to top"
            >
                ↑
            </button>
        </div>
    );
};
