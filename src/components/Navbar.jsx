import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Hide navbar on login/register pages
    if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/') {
        return null;
    }

    const handleSignOut = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <header style={styles.header}>
            <div style={styles.brand} onClick={() => navigate(user.role === 'RECRUITER' ? '/recruiter' : '/candidate')}>
                InterviewFlow <span style={styles.badge}>{user.role || 'USER'}</span>
            </div>
            
            <div style={styles.userSection}>
                <div style={styles.userInfo}>
                    <span style={styles.userName}>{user.name || 'Account'}</span>
                    <span style={styles.userEmail}>{user.email}</span>
                </div>
                <button onClick={handleSignOut} style={styles.signOutBtn}>
                    Sign Out
                </button>
            </div>
        </header>
    );
}

const styles = {
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#0f172a',
        color: '#f1f5f9',
        padding: '0.85rem 2rem',
        borderBottom: '1px solid #1e293b',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    brand: {
        fontSize: '1.2rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        color: '#fff'
    },
    badge: {
        background: '#2563eb',
        color: '#fff',
        fontSize: '0.72rem',
        fontWeight: 'bold',
        padding: '2px 8px',
        borderRadius: '12px',
        letterSpacing: '0.5px'
    },
    userSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem'
    },
    userInfo: {
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'right'
    },
    userName: {
        fontSize: '0.9rem',
        fontWeight: 'bold',
        color: '#f8fafc'
    },
    userEmail: {
        fontSize: '0.75rem',
        color: '#94a3b8'
    },
    signOutBtn: {
        background: '#ef4444',
        color: '#fff',
        border: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '0.82rem',
        transition: 'background 0.2s'
    }
};

export default Navbar;