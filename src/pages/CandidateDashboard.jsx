import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

function CandidateDashboard() {
    const [jobs, setJobs] = useState([]);
    const [slots, setSlots] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [resumeUrl, setResumeUrl] = useState('');
    const [activeOffer, setActiveOffer] = useState(null);
    const [showProfileEditor, setShowProfileEditor] = useState(false);
    const [profile, setProfile] = useState({
        headline: '',
        skills: '',
        experience_years: 0,
        github_url: '',
        linkedin_url: '',
        verified_assessment: null
    });
    const [message, setMessage] = useState('');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const navigate = useNavigate();

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = () => {
        API.get('/jobs').then(res => setJobs(res.data || [])).catch(err => console.error(err));
        API.get('/interviews/slots').then(res => setSlots(res.data || [])).catch(err => console.error(err));
        API.get('/interviews/my-bookings').then(res => setMyBookings(res.data || [])).catch(err => console.error(err));
        API.get('/auth/profile').then(res => {
            if (res.data) {
                setProfile({
                    headline: res.data.headline || '',
                    skills: res.data.skills || '',
                    experience_years: res.data.experience_years || 0,
                    github_url: res.data.github_url || '',
                    linkedin_url: res.data.linkedin_url || '',
                    verified_assessment: res.data.verified_assessment || null
                });
            }
        }).catch(err => console.error(err));
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            const res = await API.put('/auth/profile', profile);
            setMessage(res.data.message);
            setShowProfileEditor(false);
            loadAll();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to save profile');
        }
    };

    const handleBookSlot = async (slotId) => {
        if (!selectedJob) {
            alert('Step 1 Required: Please click "Select This Job" on the left before booking an interview slot!');
            return;
        }

        try {
            const res = await API.post('/interviews/book', {
                slot_id: slotId,
                job_id: selectedJob.id,
                resume_url: resumeUrl || profile.github_url
            });
            setMessage(res.data.message || 'Booked successfully!');
            setResumeUrl('');
            loadAll();
        } catch (err) {
            alert(err.response?.data?.error || 'Booking failed');
        }
    };

    const handleCancelBooking = async (applicationId, jobTitle) => {
        if (!window.confirm(`Cancel your interview for "${jobTitle}" and release the time slot?`)) {
            return;
        }

        try {
            const res = await API.delete(`/interviews/my-bookings/${applicationId}`);
            setMessage(res.data.message || 'Interview cancelled and time slot released.');
            loadAll();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to cancel interview');
        }
    };

    const formatExternalUrl = (url) => {
        if (!url) return '';
        return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    };

    const skillTags = (profile.skills || '').split(',').map(s => s.trim()).filter(Boolean);

    const filteredJobs = jobs.filter(job => {
        const matchesKeyword =
            (job.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (job.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (job.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLocation = (job.location || '').toLowerCase().includes(locationFilter.toLowerCase());
        return matchesKeyword && matchesLocation;
    });

    const getStatusBadge = (status) => {
        if (status === 'SELECTED') return { background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontWeight: '600', fontSize: '0.78rem' };
        if (status === 'REJECTED') return { background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '12px', fontWeight: '600', fontSize: '0.78rem' };
        return { background: '#dbeafe', color: '#1d4ed8', padding: '4px 10px', borderRadius: '12px', fontWeight: '600', fontSize: '0.78rem' };
    };

    return (
        <div style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '1.75rem', color: '#0f172a' }}>Candidate Career Portal</h1>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>
                        Welcome, <strong>{user.name}</strong> {profile.headline ? `— ${profile.headline}` : ''}
                    </p>
                </div>
                <button onClick={() => setShowProfileEditor(!showProfileEditor)} style={styles.profileToggleBtn}>
                    {showProfileEditor ? 'Close Profile Editor' : 'Edit Skills Matrix & Profile'}
                </button>
            </div>

            {/* Profile Summary Card */}
            <div style={styles.profileSummaryBar}>
                <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Verified Skills Matrix ({profile.experience_years} Years Exp)
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        {skillTags.length > 0 ? (
                            skillTags.map((tag, i) => <span key={i} style={styles.skillPill}>{tag}</span>)
                        ) : (
                            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No technical skills added yet. Click edit to add your stack.</span>
                        )}
                    </div>
                </div>
                <div>
                    {profile.verified_assessment ? (
                        <span style={styles.verifiedBadge}>
                            Assessment: {profile.verified_assessment.score}/{profile.verified_assessment.total_marks}
                        </span>
                    ) : (
                        <span style={styles.unverifiedBadge}>Assessment Pending</span>
                    )}
                </div>
            </div>

            {/* Profile Editor Modal / Drawer */}
            {showProfileEditor && (
                <div style={styles.sectionCard}>
                    <h3 style={{ marginTop: 0, color: '#0f172a' }}>Update Profile & Skills Matrix</h3>
                    <form onSubmit={handleSaveProfile}>
                        <div style={styles.grid}>
                            <div>
                                <label style={styles.label}>Professional Headline:</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Full Stack Java & React Engineer"
                                    value={profile.headline}
                                    onChange={e => setProfile({ ...profile, headline: e.target.value })}
                                    style={styles.input}
                                />
                                <label style={styles.label}>Technical Skills (Comma-separated):</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Java, Spring Boot, React, Node.js, MySQL"
                                    value={profile.skills}
                                    onChange={e => setProfile({ ...profile, skills: e.target.value })}
                                    style={styles.input}
                                />
                            </div>
                            <div>
                                <label style={styles.label}>Years of Experience:</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="40"
                                    value={profile.experience_years}
                                    onChange={e => setProfile({ ...profile, experience_years: e.target.value })}
                                    style={styles.input}
                                />
                                <label style={styles.label}>GitHub Profile URL:</label>
                                <input
                                    type="text"
                                    placeholder="https://github.com/username"
                                    value={profile.github_url}
                                    onChange={e => setProfile({ ...profile, github_url: e.target.value })}
                                    style={styles.input}
                                />
                            </div>
                        </div>
                        <label style={styles.label}>LinkedIn Profile URL:</label>
                        <input
                            type="text"
                            placeholder="https://linkedin.com/in/username"
                            value={profile.linkedin_url}
                            onChange={e => setProfile({ ...profile, linkedin_url: e.target.value })}
                            style={styles.input}
                        />
                        <button type="submit" style={styles.btnPrimary}>Save Profile Changes</button>
                    </form>
                </div>
            )}

            {/* Offer Letter Document Modal */}
            {activeOffer && (
                <div style={styles.modalBackdrop}>
                    <div style={styles.offerDocument}>
                        <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ margin: 0, color: '#0f172a' }}>{activeOffer.company}</h2>
                                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{activeOffer.location} · Official Employment Offer</span>
                            </div>
                            <span style={{ background: '#dcfce7', color: '#15803d', padding: '5px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem' }}>
                               OFFER EXTENDED
                            </span>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: '#475569' }}>Date: <strong>{new Date(activeOffer.offer_issued_at).toLocaleDateString()}</strong></p>
                        <p style={{ fontSize: '0.95rem', color: '#0f172a' }}>Dear <strong>{user.name}</strong>,</p>
                        <p style={{ fontSize: '0.92rem', lineHeight: '1.6', color: '#334155' }}>
                            Following your technical assessment and interview with <strong>{activeOffer.company}</strong>, we are delighted to offer you the position of <strong>{activeOffer.job_title}</strong>.
                        </p>
                        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '1rem', margin: '1rem 0' }}>
                            <div style={{ marginBottom: '0.4rem' }}><strong>Role:</strong> {activeOffer.job_title}</div>
                            <div style={{ marginBottom: '0.4rem' }}><strong>Compensation:</strong> {activeOffer.offer_salary}</div>
                            <div><strong>Start Date:</strong> {new Date(activeOffer.offer_start_date).toLocaleDateString()}</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                            <button onClick={() => window.print()} style={styles.btnPrimary}>Print / Save PDF</button>
                            <button onClick={() => setActiveOffer(null)} style={styles.btnSecondary}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {message && <div style={styles.alert}>{message}</div>}

            {/* Scheduled Interviews & Bookings */}
            <div style={{ ...styles.sectionCard, marginBottom: '2rem' }}>
                <h3 style={{ marginTop: 0, color: '#0f172a' }}>My Scheduled Interviews & Status ({myBookings.length})</h3>
                {myBookings.length === 0 ? (
                    <p style={{ color: '#64748b', margin: 0 }}>You have no active interviews scheduled. Browse jobs and book a slot below.</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                        {myBookings.map(b => (
                            <div key={b.application_id} style={styles.bookingCard}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <h4 style={{ margin: 0, color: '#0f172a' }}>{b.job_title}</h4>
                                    <span style={getStatusBadge(b.status)}>{b.status}</span>
                                </div>
                                <p style={{ margin: '0.3rem 0', fontSize: '0.88rem', color: '#475569' }}><strong>{b.company}</strong> · {b.location}</p>
                                <p style={{ margin: '0.3rem 0', fontSize: '0.85rem', color: '#334155' }}>Time: {new Date(b.start_time).toLocaleString()}</p>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.85rem' }}>
                                    {b.offer_issued_at && (
                                        <button onClick={() => setActiveOffer(b)} style={styles.offerBtn}>View Offer Letter</button>
                                    )}
                                    <a href={b.meeting_link} target="_blank" rel="noreferrer" style={styles.joinBtn}>Join Interview Room</a>
                                    {b.status === 'SCHEDULED' && (
                                        <button onClick={() => handleCancelBooking(b.application_id, b.job_title)} style={styles.cancelBtn}>Cancel</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Main Workflow Section */}
            <div style={styles.grid}>
                {/* Job Search */}
                <div style={styles.sectionCard}>
                    <h3 style={{ marginTop: 0, color: '#0f172a' }}>1. Available Job Openings ({filteredJobs.length})</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                        <input
                            type="text"
                            placeholder="Search keyword..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={styles.input}
                        />
                        <input
                            type="text"
                            placeholder="Location..."
                            value={locationFilter}
                            onChange={e => setLocationFilter(e.target.value)}
                            style={styles.input}
                        />
                    </div>
                    {filteredJobs.length === 0 ? (
                        <p style={{ color: '#64748b' }}>No jobs match your filter criteria.</p>
                    ) : (
                        filteredJobs.map(job => {
                            const isSelected = selectedJob?.id === job.id;
                            return (
                                <div key={job.id} style={{ ...styles.jobItem, borderColor: isSelected ? '#2563eb' : '#cbd5e1', background: isSelected ? '#eff6ff' : '#fff' }}>
                                    <h4 style={{ margin: '0 0 0.3rem 0', color: '#0f172a' }}>{job.title}</h4>
                                    <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.88rem', color: '#475569' }}><strong>{job.company}</strong> ({job.location})</p>
                                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>{job.description}</p>
                                    <button onClick={() => setSelectedJob(job)} style={isSelected ? styles.btnSelected : styles.btnPrimary}>
                                        {isSelected ? 'Selected for Booking' : 'Select This Job'}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Assessment & Slot Booking */}
                <div style={styles.sectionCard}>
                    <h3 style={{ marginTop: 0, color: '#0f172a' }}>2. Assessment & Interview Booking</h3>
                    <div style={styles.subCard}>
                        <h4 style={{ margin: '0 0 0.3rem 0', color: '#0f172a' }}>Logic & Skill Assessment</h4>
                        <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>Complete the proctored MCQ test to attach your score to recruiters.</p>
                        <button onClick={() => navigate('/assessment')} style={styles.btnSuccess}>Start Assessment Test</button>
                    </div>

                    <div style={{ ...styles.subCard, marginTop: '1.25rem' }}>
                        <h4 style={{ margin: '0 0 0.3rem 0', color: '#0f172a' }}>Book Interview Slot</h4>
                        <p style={{ fontSize: '0.88rem', color: '#475569', margin: '0 0 0.5rem 0' }}>
                            Selected Job: <strong>{selectedJob ? selectedJob.title : 'None (Pick from left)'}</strong>
                        </p>
                        <label style={styles.label}>Resume / Portfolio Link (Optional):</label>
                        <input
                            type="text"
                            placeholder="https://github.com/username or Drive link"
                            value={resumeUrl}
                            onChange={e => setResumeUrl(e.target.value)}
                            style={styles.input}
                        />
                        {slots.length === 0 ? (
                            <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>No open time slots currently available.</p>
                        ) : (
                            slots.map(slot => (
                                <div key={slot.id} style={styles.slotRow}>
                                    <span style={{ fontSize: '0.88rem', color: '#0f172a' }}>{new Date(slot.start_time).toLocaleString()}</span>
                                    <button onClick={() => handleBookSlot(slot.id)} style={styles.btnPrimary}>Book Slot</button>
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
    profileToggleBtn: { background: '#0f172a', color: '#fff', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' },
    profileSummaryBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    skillPill: { background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '3px 9px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '600' },
    verifiedBadge: { background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '5px 12px', borderRadius: '16px', fontSize: '0.82rem', fontWeight: 'bold' },
    unverifiedBadge: { background: '#f1f5f9', color: '#64748b', padding: '5px 12px', borderRadius: '16px', fontSize: '0.82rem', fontWeight: '600' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
    sectionCard: { background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    subCard: { background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' },
    bookingCard: { background: '#f8fafc', padding: '1.25rem', borderRadius: '6px', border: '1px solid #cbd5e1' },
    jobItem: { background: '#fff', padding: '1rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '0.75rem' },
    slotRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0', marginBottom: '0.4rem' },
    input: { width: '100%', padding: '0.6rem', margin: '0.3rem 0 0.8rem 0', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' },
    label: { fontSize: '0.82rem', fontWeight: '600', color: '#475569' },
    btnPrimary: { background: '#2563eb', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' },
    btnSelected: { background: '#16a34a', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' },
    btnSuccess: { background: '#059669', color: '#fff', border: 'none', padding: '0.6rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', width: '100%', fontSize: '0.9rem' },
    btnSecondary: { background: '#64748b', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' },
    offerBtn: { background: '#16a34a', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600' },
    joinBtn: { display: 'inline-block', background: '#0ea5e9', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '4px', textDecoration: 'none', fontSize: '0.78rem', fontWeight: '600' },
    cancelBtn: { background: '#ef4444', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600' },
    modalBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
    offerDocument: { background: '#fff', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '600px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
    alert: { background: '#dcfce7', color: '#15803d', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.25rem', fontWeight: '600', fontSize: '0.9rem' }
};

export default CandidateDashboard;