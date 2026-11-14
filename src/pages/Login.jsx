import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await API.post('/auth/login', { email, password });

            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            if (res.data.user.role === 'RECRUITER' || res.data.user.role === 'ADMIN') {
                navigate('/recruiter');
            } else {
                navigate('/candidate');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Login to InterviewFlow</h2>
                <p style={styles.subtitle}>Sign in to access your Candidate or Recruiter workspace</p>

                {error && <div style={styles.errorBox}>{error}</div>}

                <form onSubmit={handleLogin}>
                    <label style={styles.label}>Email Address</label>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={styles.input}
                    />

                    <label style={styles.label}>Password</label>
                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={styles.input}
                    />

                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? 'Signing in...' : 'Login'}
                    </button>
                </form>

                <p style={styles.footerText}>
                    Need an account? <Link to="/register" style={styles.link}>Register here</Link>
                </p>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f1f5f9',
        padding: '1rem'
    },
    card: {
        background: '#ffffff',
        padding: '2.25rem',
        borderRadius: '10px',
        width: '100%',
        maxWidth: '410px',
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.08)',
        border: '1px solid #e2e8f0'
    },
    title: {
        margin: '0 0 0.4rem 0',
        color: '#0f172a',
        textAlign: 'center'
    },
    subtitle: {
        margin: '0 0 1.5rem 0',
        color: '#64748b',
        fontSize: '0.88rem',
        textAlign: 'center'
    },
    label: {
        display: 'block',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        color: '#334155',
        marginBottom: '0.35rem'
    },
    input: {
        width: '100%',
        padding: '0.7rem',
        marginBottom: '1.1rem',
        borderRadius: '6px',
        border: '1px solid #cbd5e1',
        boxSizing: 'border-box',
        fontSize: '0.95rem'
    },
    button: {
        width: '100%',
        padding: '0.75rem',
        background: '#2563eb',
        color: '#ffffff',
        border: 'none',
        borderRadius: '6px',
        fontSize: '1rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '0.25rem'
    },
    errorBox: {
        background: '#fee2e2',
        color: '#b91c1c',
        padding: '0.7rem',
        borderRadius: '6px',
        marginBottom: '1rem',
        fontSize: '0.88rem',
        fontWeight: '600',
        textAlign: 'center'
    },
    footerText: {
        marginTop: '1.25rem',
        textAlign: 'center',
        fontSize: '0.9rem',
        color: '#475569'
    },
    link: {
        color: '#2563eb',
        fontWeight: 'bold',
        textDecoration: 'none'
    }
};

export default Login;