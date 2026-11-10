import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <nav style={styles.nav}>
            <h2 style={styles.logo}>
                <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>InterviewFlow</Link>
            </h2>
            <div style={styles.links}>
                {token ? (
                    <>
                        <span style={styles.userText}>Welcome, {user.name} ({user.role})</span>
                        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" style={styles.link}>Login</Link>
                        <Link to="/register" style={styles.linkBtn}>Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
}

const styles = {
    nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: '#1e293b', color: '#fff' },
    logo: { margin: 0, fontSize: '1.5rem', fontWeight: 'bold' },
    links: { display: 'flex', gap: '1rem', alignItems: 'center' },
    link: { color: '#cbd5e1', textDecoration: 'none' },
    linkBtn: { background: '#2563eb', color: '#fff', padding: '0.5rem 1rem', borderRadius: '4px', textDecoration: 'none' },
    userText: { color: '#94a3b8', fontSize: '0.9rem' },
    logoutBtn: { background: '#ef4444', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }
};

export default Navbar;