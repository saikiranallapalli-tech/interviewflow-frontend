import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

function CandidateDashboard() {
    const [jobs, setJobs] = useState([]);
    const [slots, setSlots] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [message, setMessage] = useState('');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const navigate = useNavigate();

    useEffect(() => {
        // Load active jobs
        API.get('/jobs')
            .then(res => setJobs(res.data))
            .catch(err => console.error(err));

        // Load unbooked interview slots
        API.get('/interviews/slots')
            .then(res => setSlots(res.data))
            .catch(err => console.error(err));
    }, []);

    const handleBookSlot = async (slotId) => {
        if (!selectedJob) {
            alert('Please select a job position first before booking a slot!');
            return;
        }

        try {
            const res = await API.post('/interviews/book', { slot_id: slotId, job_id: selectedJob });
            setMessage(res.data.message);
            // Refresh available slots
            const updatedSlots = await API.get('/interviews/slots');
            setSlots(updatedSlots.data);
        } catch (err) {
            alert(err.response?.data?.error || 'Booking failed');
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <h2>Candidate Dashboard</h2>
            <p>Welcome back, <strong>{user.name}</strong>!</p>

            {message && <div style={styles.alert}>{message}</div>}

            <div style={styles.grid}>
                {/* Available Jobs Section */}
                <div style={styles.sectionCard}>
                    <h3>Available Job Positions</h3>
                    {jobs.length === 0 ? (
                        <p style={{ color: '#64748b' }}>No active job listings posted yet.</p>
                    ) : (
                        jobs.map(job => (
                            <div key={job.id} style={{ ...styles.itemCard, borderLeft: selectedJob === job.id ? '4px solid #2563eb' : '1px solid #cbd5e1' }}>
                                <h4>{job.title}</h4>
                                <p><strong>Company:</strong> {job.company} | <strong>Location:</strong> {job.location}</p>
                                <p style={{ fontSize: '0.9rem', color: '#475569' }}>{job.description}</p>
                                <button 
                                    style={selectedJob === job.id ? styles.btnSelected : styles.btnPrimary}
                                    onClick={() => setSelectedJob(job.id)}
                                >
                                    {selectedJob === job.id ? 'Selected for Booking' : 'Select This Job'}
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Next Steps: Assessment & Interview Booking */}
                <div style={styles.sectionCard}>
                    <h3>Action Required</h3>
                    
                    <div style={styles.actionCard}>
                        <h4>Step 1: Logic & Skill Assessment</h4>
                        <p style={{ fontSize: '0.9rem', color: '#475569' }}>Complete our 2-minute timed logic test to qualify for interview scheduling.</p>
                        <button onClick={() => navigate('/assessment')} style={styles.btnSuccess}>
                            Start Assessment Test
                        </button>
                    </div>

                    <div style={{ ...styles.actionCard, marginTop: '1.5rem' }}>
                        <h4>Step 2: Self-Book Interview Slot</h4>
                        <p style={{ fontSize: '0.9rem', color: '#475569' }}>Select an available slot provided by hiring managers.</p>
                        
                        {slots.length === 0 ? (
                            <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No open interview slots available at this moment.</p>
                        ) : (
                            slots.map(slot => (
                                <div key={slot.id} style={styles.slotRow}>
                                    <div>
                                        <strong>{new Date(slot.start_time).toLocaleString()}</strong>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Recruiter: {slot.recruiter_name}</div>
                                    </div>
                                    <button onClick={() => handleBookSlot(slot.id)} style={styles.btnPrimary}>
                                        Book Slot
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' },
    sectionCard: { background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' },
    itemCard: { background: '#fff', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' },
    actionCard: { background: '#fff', padding: '1rem', borderRadius: '6px', border: '1px solid #cbd5e1' },
    slotRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' },
    btnPrimary: { background: '#2563eb', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' },
    btnSelected: { background: '#16a34a', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' },
    btnSuccess: { background: '#059669', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '4px', cursor: 'pointer', width: '100%', fontSize: '1rem' },
    alert: { background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontWeight: 'bold' }
};

export default CandidateDashboard;