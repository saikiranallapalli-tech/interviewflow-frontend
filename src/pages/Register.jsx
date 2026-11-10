import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

function Register() {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'CANDIDATE' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.post('/auth/register', formData);
            alert('Registration successful! Please login.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div style={styles.container}>
            <form style={styles.card} onSubmit={handleSubmit}>
                <h2>Register for InterviewFlow</h2>
                {error && <p style={styles.error}>{error}</p>}
                <input type="text" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={styles.input} />
                <input type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required style={styles.input} />
                <input type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required style={styles.input} />
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} style={styles.input}>
                    <option value="CANDIDATE">Candidate (Job Seeker)</option>
                    <option value="RECRUITER">Recruiter (Employer)</option>
                </select>
                <button type="submit" style={styles.button}>Create Account</button>
                <p>Already have an account? <Link to="/login">Login here</Link></p>
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

export default Register;