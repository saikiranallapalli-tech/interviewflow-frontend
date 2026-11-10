import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await API.post('/auth/login', formData);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid credentials');
        }
    };

    return (
        <div style={styles.container}>
            <form style={styles.card} onSubmit={handleSubmit}>
                <h2>Login to InterviewFlow</h2>
                {error && <p style={styles.error}>{error}</p>}
                <input type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required style={styles.input} />
                <input type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required style={styles.input} />
                <button type="submit" style={styles.button}>Login</button>
                <p>Need an account? <Link to="/register">Register here</Link></p>
            </form>
        </div>
    );
}

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' },
    card: { background: '#f8fafc', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '350px', textAlign: 'center' },
    input: { width: '100%', padding: '0.75rem', margin: '0.5rem 0', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' },
    button: { width: '100%', padding: '0.75rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '0.5rem' },
    error: { color: '#ef4444', fontSize: '0.9rem' }
};

export default Login;