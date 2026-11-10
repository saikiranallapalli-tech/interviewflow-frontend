import React, { useState, useEffect } from 'react';
import API from '../services/api';

function RecruiterDashboard() {
    const [jobs, setJobs] = useState([]);
    const [slots, setSlots] = useState([]);
    const [message, setMessage] = useState('');
    
    // Form states
    const [jobData, setJobData] = useState({ title: '', description: '', company: '', location: '' });
    const [slotData, setSlotData] = useState({ start_time: '', end_time: '' });

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        API.get('/jobs').then(res => setJobs(res.data)).catch(err => console.error(err));
        API.get('/interviews/slots').then(res => setSlots(res.data)).catch(err => console.error(err));
    };

    const handleCreateJob = async (e) => {
        e.preventDefault();
        try {
            await API.post('/jobs', jobData);
            setMessage('Job opening created successfully!');
            setJobData({ title: '', description: '', company: '', location: '' });
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to create job');
        }
    };

    const handleCreateSlot = async (e) => {
        e.preventDefault();
        try {
            await API.post('/interviews/slots', slotData);
            setMessage('Interview slot created successfully!');
            setSlotData({ start_time: '', end_time: '' });
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to create slot');
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
            <h2>Recruiter Management Control Panel</h2>
            <p>Welcome, <strong>{user.name}</strong> (Recruiter)</p>

            {message && <div style={styles.alert}>{message}</div>}

            <div style={styles.grid}>
                {/* Post New Job Form */}
                <div style={styles.card}>
                    <h3>Post New Job Opening</h3>
                    <form onSubmit={handleCreateJob}>
                        <input type="text" placeholder="Job Title (e.g. Full Stack Engineer)" value={jobData.title} onChange={e => setJobData({...jobData, title: e.target.value})} required style={styles.input} />
                        <input type="text" placeholder="Company Name" value={jobData.company} onChange={e => setJobData({...jobData, company: e.target.value})} required style={styles.input} />
                        <input type="text" placeholder="Location (e.g. Remote / Singapore)" value={jobData.location} onChange={e => setJobData({...jobData, location: e.target.value})} required style={styles.input} />
                        <textarea placeholder="Job Description & Requirements" value={jobData.description} onChange={e => setJobData({...jobData, description: e.target.value})} required style={{ ...styles.input, height: '80px' }} />
                        <button type="submit" style={styles.btnPrimary}>Publish Job Posting</button>
                    </form>
                </div>

                {/* Create Interview Time Slot Form */}
                <div style={styles.card}>
                    <h3>Publish Interview Time Slot</h3>
                    <form onSubmit={handleCreateSlot}>
                        <label style={styles.label}>Start Date & Time:</label>
                        <input type="datetime-local" value={slotData.start_time} onChange={e => setSlotData({...slotData, start_time: e.target.value.replace('T', ' ') + ':00'})} required style={styles.input} />
                        <label style={styles.label}>End Date & Time:</label>
                        <input type="datetime-local" value={slotData.end_time} onChange={e => setSlotData({...slotData, end_time: e.target.value.replace('T', ' ') + ':00'})} required style={styles.input} />
                        <button type="submit" style={styles.btnSuccess}>Publish Time Slot</button>
                    </form>
                </div>
            </div>

            {/* Current Active Listings */}
            <div style={{ ...styles.grid, marginTop: '2rem' }}>
                <div style={styles.card}>
                    <h3>Active Job Openings</h3>
                    {jobs.map(j => (
                        <div key={j.id} style={styles.listItem}>
                            <strong>{j.title}</strong> - {j.company} ({j.location})
                        </div>
                    ))}
                </div>
                <div style={styles.card}>
                    <h3>Available Interview Slots</h3>
                    {slots.map(s => (
                        <div key={s.id} style={styles.listItem}>
                            🕒 {new Date(s.start_time).toLocaleString()} to {new Date(s.end_time).toLocaleString()}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const styles = {
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' },
    card: { background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' },
    input: { width: '100%', padding: '0.65rem', margin: '0.4rem 0 1rem 0', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' },
    label: { fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' },
    btnPrimary: { width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '4px', cursor: 'pointer' },
    btnSuccess: { width: '100%', background: '#059669', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '4px', cursor: 'pointer' },
    alert: { background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem', fontWeight: 'bold' },
    listItem: { background: '#fff', padding: '0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0', marginBottom: '0.5rem' }
};

export default RecruiterDashboard;