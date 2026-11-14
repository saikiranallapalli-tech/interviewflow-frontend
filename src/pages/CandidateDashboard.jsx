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
        if (!window.confirm(`Cancel your interview for "${jobTitle}" and release the time slot so you can book a different one?`)) {
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

    const skillTags = (profile.skills || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    const filteredJobs = jobs.filter(job => {
        const matchesKeyword =
            (job.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (job.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (job.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLocation =
            (job.location || '').toLowerCase().includes(locationFilter.toLowerCase());
        return matchesKeyword && matchesLocation;
    });

    const getStatusBadge = (status) => {
        if (status === 'SELECTED') return { background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' };
        if (status === 'REJECTED') return { background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' };
        return { background: '#dbeafe', color: '#1d4ed8', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' };
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1150px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ marginBottom: '0.25rem' }}>Candidate Career Portal</h2>
                    <p style={{ color: '#475569', margin: 0 }}>
                        Welcome back, <strong>{user.name}</strong>! {profile.headline ? `— ${profile.headline}` : ''}
                    </p>
                </div>
                <button onClick={() => setShowProfileEditor(!showProfileEditor)} style={styles.profileToggleBtn}>
                    {showProfileEditor ? 'Close Skills Profile' : 'Edit Skills Matrix & Profile'}
                </button>
            </div>

            {/* Verified Skills Matrix Summary Banner */}
            <div style={styles.profileSummaryBar}>
                <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>
                        Verified Skills Matrix ({profile.experience_years} Yrs Exp)
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                        {skillTags.length > 0 ? (
                            skillTags.map((tag, i) => (
                                <span key={i} style={styles.skillPill}>{tag}</span>
                            ))
                        ) : (
                            <span style={{ fontSize: '0.84rem', color: '#94a3b8' }}>No skills listed yet — click "Edit Skills Matrix & Profile" to add your tech stack.</span>
                        )}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    {profile.verified_assessment ? (
                        <span style={styles.verifiedBadge}>
                            Verified Assessment: {profile.verified_assessment.score}/{profile.verified_assessment.total_marks}
                        </span>
                    ) : (
                        <span style={styles.unverifiedBadge}>Assessment Pending</span>
                    )}
                </div>
            </div>

            {/* Collapsible Profile & Skills Matrix Editor */}
            {showProfileEditor && (
                <div style={{ ...styles.sectionCard, marginBottom: '1.5rem', border: '2px solid #2563eb' }}>
                    <h3 style={{ marginTop: 0 }}>Update Candidate Profile & Skills Matrix</h3>
                    <form onSubmit={handleSaveProfile}>
                        <div style={styles.grid}>
                            <div>
                                <label style={styles.label}>Professional Headline:</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Full Stack Java & React Developer"
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
                                <label style={styles.label}>GitHub URL:</label>
                                <input
                                    type="text"
                                    placeholder="https://github.com/yourusername"
                                    value={profile.github_url}
                                    onChange={e => setProfile({ ...profile, github_url: e.target.value })}
                                    style={styles.input}
                                />
                            </div>
                        </div>
                        <label style={styles.label}>LinkedIn URL:</label>
                        <input
                            type="text"
                            placeholder="https://linkedin.com/in/yourprofile"
                            value={profile.linkedin_url}
                            onChange={e => setProfile({ ...profile, linkedin_url: e.target.value })}
                            style={styles.input}
                        />
                        <button type="submit" style={styles.btnPrimary}>Save Skills Matrix</button>
                    </form>
                </div>
            )}

            {/* Printable Offer Letter Modal */}
            {activeOffer && (
                <div style={styles.modalBackdrop}>
                    <div style={styles.offerDocument}>
                        <div style={{ borderBottom: '3px solid #1e293b', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ margin: 0, color: '#0f172a' }}>{activeOffer.company}</h2>
                                <small style={{ color: '#64748b' }}>{activeOffer.location} · Official Employment Offer</small>
                            </div>
                            <span style={{ background: '#dcfce7', color: '#15803d', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.82rem' }}>
                                OFFER EXTENDED
                            </span>
                        </div>

                        <p style={{ fontSize: '0.92rem', color: '#475569' }}>
                            Date: <strong>{new Date(activeOffer.offer_issued_at).toLocaleDateString()}</strong>
                        </p>
                        <p style={{ fontSize: '1rem', color: '#0f172a' }}>Dear <strong>{user.name}</strong>,</p>
                        <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#334155' }}>
                            Following your logic assessment and technical interview with <strong>{activeOffer.company}</strong>, we are pleased to formally offer you the full-time position of <strong>{activeOffer.job_title}</strong> ({activeOffer.location}).
                        </p>

                        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '1rem', margin: '1.25rem 0' }}>
                            <div style={{ marginBottom: '0.5rem' }}><strong>Position Title:</strong> {activeOffer.job_title}</div>
                            <div style={{ marginBottom: '0.5rem' }}><strong>Annual Compensation:</strong> {activeOffer.offer_salary}</div>
                            <div><strong>Commencement Date:</strong> {new Date(activeOffer.offer_start_date).toLocaleDateString()}</div>
                        </div>

                        <p style={{ fontSize: '0.92rem', lineHeight: '1.6', color: '#334155' }}>
                            We were impressed by your problem-solving performance and look forward to welcoming you to the team.
                        </p>

                        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <strong>{activeOffer.recruiter_name || 'Talent Acquisition Team'}</strong>
                                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Authorized Signatory, {activeOffer.company}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.6rem' }}>
                                <button onClick={() => window.print()} style={styles.btnPrimary}>
                                    Print / Save PDF
                                </button>
                                <button onClick={() => setActiveOffer(null)} style={styles.closeModalBtn}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Visual 3-Step Workflow Guide */}
            <div style={styles.stepBar}>
                <div style={{ ...styles.stepCard, borderColor: selectedJob ? '#16a34a' : '#2563eb' }}>
                    <span style={styles.stepTag}>STEP 1</span>
                    <h4 style={{ margin: '0.3rem 0' }}>Choose a Job Role</h4>
                    <p style={styles.stepDesc}>
                        {selectedJob ? `Selected: ${selectedJob.title}` : 'Filter and pick a position from Available Jobs below.'}
                    </p>
                </div>
                <div style={styles.stepCard}>
                    <span style={styles.stepTag}>STEP 2</span>
                    <h4 style={{ margin: '0.3rem 0' }}>Take Logic Test</h4>
                    <p style={styles.stepDesc}>Complete the timed MCQ exam to send your score to recruiters.</p>
                </div>
                <div style={{ ...styles.stepCard, borderColor: myBookings.length > 0 ? '#16a34a' : '#cbd5e1' }}>
                    <span style={styles.stepTag}>STEP 3</span>
                    <h4 style={{ margin: '0.3rem 0' }}>Attach Resume & Book</h4>
                    <p style={styles.stepDesc}>
                        {myBookings.length > 0 ? `${myBookings.length} Interview(s) Scheduled` : 'Add your resume/GitHub link and reserve a slot.'}
                    </p>
                </div>
            </div>

            {message && <div style={styles.alert}>{message}</div>}

            {/* My Scheduled Interviews & Status Tracker */}
            <div style={{ ...styles.sectionCard, marginBottom: '2rem' }}>
                <h3>My Scheduled Interviews & Application Status ({myBookings.length})</h3>
                {myBookings.length === 0 ? (
                    <p style={{ color: '#64748b' }}>You have no scheduled interviews yet. Complete Steps 1 to 3 below!</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                        {myBookings.map(b => (
                            <div key={b.application_id} style={styles.bookingCard}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={{ margin: 0 }}>{b.job_title}</h4>
                                    <span style={getStatusBadge(b.status)}>{b.status}</span>
                                </div>
                                <p style={{ margin: '0.4rem 0', fontSize: '0.9rem', color: '#475569' }}>
                                    <strong>{b.company}</strong> — {b.location}
                                </p>
                                <p style={{ margin: '0.4rem 0', fontSize: '0.85rem' }}>
                                    Date: {new Date(b.start_time).toLocaleString()}
                                </p>

                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                                    {b.offer_issued_at && (
                                        <button onClick={() => setActiveOffer(b)} style={styles.offerBtn}>
                                            View / Print Offer Letter
                                        </button>
                                    )}
                                    <a href={b.meeting_link} target="_blank" rel="noreferrer" style={styles.joinBtn}>
                                        Join Virtual Interview Room
                                    </a>
                                    {b.resume_url && (
                                        <a href={formatExternalUrl(b.resume_url)} target="_blank" rel="noreferrer" style={styles.resumeLinkBtn}>
                                            Submitted Resume
                                        </a>
                                    )}
                                    {b.status === 'SCHEDULED' && (
                                        <button
                                            onClick={() => handleCancelBooking(b.application_id, b.job_title)}
                                            style={styles.cancelBtn}
                                        >
                                            Cancel / Reschedule
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={styles.grid}>
                {/* Step 1: Search & Filter Available Jobs */}
                <div style={styles.sectionCard}>
                    <h3>Step 1: Search & Select a Job ({filteredJobs.length})</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
                        <input
                            type="text"
                            placeholder="Search title, company, skill..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={styles.filterInput}
                        />
                        <input
                            type="text"
                            placeholder="Filter location (e.g. Chennai)"
                            value={locationFilter}
                            onChange={e => setLocationFilter(e.target.value)}
                            style={styles.filterInput}
                        />
                    </div>

                    {filteredJobs.length === 0 ? (
                        <p style={{ color: '#64748b' }}>No jobs match your search filters.</p>
                    ) : (
                        filteredJobs.map(job => {
                            const isSelected = selectedJob?.id === job.id;
                            return (
                                <div key={job.id} style={{ ...styles.itemCard, borderLeft: isSelected ? '5px solid #16a34a' : '1px solid #cbd5e1', background: isSelected ? '#f0fdf4' : '#fff' }}>
                                    <h4 style={{ margin: '0 0 0.4rem 0' }}>{job.title}</h4>
                                    <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.9rem' }}><strong>Company:</strong> {job.company} | <strong>Location:</strong> {job.location}</p>
                                    <p style={{ fontSize: '0.85rem', color: '#475569' }}>{job.description}</p>
                                    <button
                                        style={isSelected ? styles.btnSelected : styles.btnPrimary}
                                        onClick={() => setSelectedJob(job)}
                                    >
                                        {isSelected ? 'Selected for Booking' : 'Select This Job'}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Step 2 & Step 3: Assessment & Interview Booking with Resume Link */}
                <div style={styles.sectionCard}>
                    <h3>Step 2 & Step 3: Complete Your Application</h3>

                    <div style={styles.actionCard}>
                        <h4>Step 2: Logic & Skill Assessment</h4>
                        <p style={{ fontSize: '0.9rem', color: '#475569' }}>Complete the timed MCQ test. Your score is automatically attached to your recruiter profile.</p>
                        <button onClick={() => navigate('/assessment')} style={styles.btnSuccess}>
                            Start Assessment Test
                        </button>
                    </div>

                    <div style={{ ...styles.actionCard, marginTop: '1.5rem' }}>
                        <h4>Step 3: Attach Resume & Book Slot</h4>
                        <p style={{ fontSize: '0.9rem', color: '#475569' }}>
                            Applying for: <strong>{selectedJob ? `${selectedJob.title} (${selectedJob.company})` : 'None (Select a job on the left first)'}</strong>
                        </p>

                        <label style={styles.label}>Resume / GitHub / Portfolio URL (Optional):</label>
                        <input
                            type="text"
                            placeholder="https://github.com/yourusername or Drive resume link"
                            value={resumeUrl}
                            onChange={e => setResumeUrl(e.target.value)}
                            style={styles.input}
                        />

                        {slots.length === 0 ? (
                            <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No open interview slots available at this moment.</p>
                        ) : (
                            slots.map(slot => (
                                <div key={slot.id} style={styles.slotRow}>
                                    <div>
                                        <strong>{new Date(slot.start_time).toLocaleString()}</strong>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Available Slot</div>
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
    profileToggleBtn: { background: '#1e293b', color: '#fff', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' },
    profileSummaryBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.9rem 1.25rem', marginTop: '1rem' },
    skillPill: { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '3px 10px', borderRadius: '14px', fontSize: '0.78rem', fontWeight: '600' },
    verifiedBadge: { background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '5px 12px', borderRadius: '16px', fontSize: '0.82rem', fontWeight: 'bold' },
    unverifiedBadge: { background: '#f1f5f9', color: '#64748b', padding: '5px 12px', borderRadius: '16px', fontSize: '0.82rem', fontWeight: 'bold' },
    stepBar: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', margin: '1.25rem 0 1.75rem' },
    stepCard: { background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '2px solid #cbd5e1' },
    stepTag: { background: '#1e293b', color: '#fff', fontSize: '0.72rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' },
    stepDesc: { margin: 0, fontSize: '0.84rem', color: '#475569' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' },
    sectionCard: { background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' },
    bookingCard: { background: '#fff', padding: '1.25rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' },
    itemCard: { background: '#fff', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' },
    actionCard: { background: '#fff', padding: '1rem', borderRadius: '6px', border: '1px solid #cbd5e1' },
    slotRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' },
    filterInput: { width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '0.88rem' },
    input: { width: '100%', padding: '0.6rem', margin: '0.35rem 0 1rem 0', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '0.88rem' },
    label: { fontSize: '0.82rem', fontWeight: 'bold', color: '#475569' },
    btnPrimary: { background: '#2563eb', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    btnSelected: { background: '#16a34a', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    btnSuccess: { background: '#059669', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '4px', cursor: 'pointer', width: '100%', fontSize: '1rem', fontWeight: 'bold' },
    offerBtn: { background: '#16a34a', color: '#fff', border: 'none', padding: '0.5rem 0.9rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 'bold' },
    joinBtn: { display: 'inline-block', background: '#0ea5e9', color: '#fff', padding: '0.5rem 0.9rem', borderRadius: '4px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 'bold' },
    resumeLinkBtn: { display: 'inline-block', background: '#e2e8f0', color: '#1e293b', padding: '0.5rem 0.9rem', borderRadius: '4px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 'bold' },
    cancelBtn: { background: '#ef4444', color: '#fff', border: 'none', padding: '0.5rem 0.9rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 'bold' },
    closeModalBtn: { background: '#64748b', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    modalBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
    offerDocument: { background: '#fff', padding: '2.25rem', borderRadius: '10px', width: '100%', maxWidth: '620px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
    alert: { background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontWeight: 'bold' }
};

export default CandidateDashboard;