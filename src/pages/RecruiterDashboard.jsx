import React, { useState, useEffect } from 'react';
import API from '../services/api';

function RecruiterDashboard() {
    const [activeTab, setActiveTab] = useState('pipeline');
    const [jobs, setJobs] = useState([]);
    const [slots, setSlots] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [message, setMessage] = useState('');

    // Offer Letter Modal State
    const [offerTarget, setOfferTarget] = useState(null);
    const [offerForm, setOfferForm] = useState({ offer_salary: '', offer_start_date: '' });

    // Form states
    const [jobData, setJobData] = useState({ title: '', description: '', company: '', location: '' });
    const [slotData, setSlotData] = useState({ start_time: '', end_time: '' });
    const [questionData, setQuestionData] = useState({
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: 'A',
        marks: 2
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        API.get('/jobs').then(res => setJobs(res.data || [])).catch(err => console.error(err));
        API.get('/interviews/slots').then(res => setSlots(res.data || [])).catch(err => console.error(err));
        API.get('/interviews/recruiter-bookings').then(res => setBookings(res.data || [])).catch(err => console.error(err));
        API.get('/assessments/manage').then(res => setQuestions(res.data || [])).catch(err => console.error(err));
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

    const handleDeleteJob = async (jobId) => {
        if (!window.confirm('Remove this job opening and any linked applications?')) return;
        try {
            const res = await API.delete(`/jobs/${jobId}`);
            setMessage(res.data.message);
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete job');
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

    const handleDeleteSlot = async (slotId) => {
        try {
            await API.delete(`/interviews/slots/${slotId}`);
            setMessage('Unbooked slot removed.');
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete slot');
        }
    };

    const handleStatusChange = async (applicationId, newStatus) => {
        try {
            const res = await API.patch(`/interviews/applications/${applicationId}/status`, { status: newStatus });
            setMessage(res.data.message);
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update status');
        }
    };

    const openOfferModal = (booking) => {
        setOfferTarget(booking);
        setOfferForm({
            offer_salary: booking.offer_salary || '',
            offer_start_date: booking.offer_start_date ? booking.offer_start_date.split('T')[0] : ''
        });
    };

    const handleIssueOffer = async (e) => {
        e.preventDefault();
        if (!offerTarget) return;
        try {
            const res = await API.post(`/interviews/applications/${offerTarget.application_id}/offer`, offerForm);
            setMessage(res.data.message);
            setOfferTarget(null);
            setOfferForm({ offer_salary: '', offer_start_date: '' });
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to issue offer letter');
        }
    };

    const handleDeleteApplication = async (applicationId) => {
        if (!window.confirm('Remove this candidate from the active pipeline and release their time slot?')) return;
        try {
            const res = await API.delete(`/interviews/applications/${applicationId}`);
            setMessage(res.data.message);
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to remove candidate');
        }
    };

    const handleCreateQuestion = async (e) => {
        e.preventDefault();
        try {
            const res = await API.post('/assessments/questions', questionData);
            setMessage(res.data.message);
            setQuestionData({
                question_text: '',
                option_a: '',
                option_b: '',
                option_c: '',
                option_d: '',
                correct_option: 'A',
                marks: 2
            });
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to add question');
        }
    };

    const handleDeleteQuestion = async (questionId) => {
        try {
            const res = await API.delete(`/assessments/questions/${questionId}`);
            setMessage(res.data.message);
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete question');
        }
    };

    const formatExternalUrl = (url) => {
        if (!url) return '';
        return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    };

    const getBadgeStyle = (status) => {
        if (status === 'SELECTED') return { background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' };
        if (status === 'REJECTED') return { background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' };
        return { background: '#dbeafe', color: '#1d4ed8', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' };
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1280px', margin: '0 auto' }}>
            <h2>Recruiter Management Control Panel</h2>
            <p>Welcome, <strong>{user.name}</strong> (Recruiter)</p>

            {/* KPI Summary Cards */}
            <div style={styles.kpiRow}>
                <div onClick={() => setActiveTab('pipeline')} style={{ ...styles.kpiCard, border: activeTab === 'pipeline' ? '3px solid #2563eb' : '3px solid transparent' }}>
                    <span style={styles.kpiLabel}>1. Scheduled Candidates</span>
                    <h2 style={styles.kpiValue}>{bookings.length}</h2>
                </div>
                <div onClick={() => setActiveTab('jobs_slots')} style={{ ...styles.kpiCard, border: activeTab === 'jobs_slots' ? '3px solid #2563eb' : '3px solid transparent' }}>
                    <span style={styles.kpiLabel}>2. Jobs & Open Slots</span>
                    <h2 style={styles.kpiValue}>{jobs.length} Jobs · {slots.length} Slots</h2>
                </div>
                <div onClick={() => setActiveTab('questions')} style={{ ...styles.kpiCard, border: activeTab === 'questions' ? '3px solid #2563eb' : '3px solid transparent' }}>
                    <span style={styles.kpiLabel}>3. Test Question Bank</span>
                    <h2 style={styles.kpiValue}>{questions.length} Questions</h2>
                </div>
            </div>

            {/* Workflow Tab Navigation */}
            <div style={styles.tabBar}>
                <button onClick={() => setActiveTab('pipeline')} style={activeTab === 'pipeline' ? styles.tabActive : styles.tabBtn}>
                    1. Candidate Pipeline & Calls ({bookings.length})
                </button>
                <button onClick={() => setActiveTab('jobs_slots')} style={activeTab === 'jobs_slots' ? styles.tabActive : styles.tabBtn}>
                    2. Post Jobs & Time Slots ({slots.length} Open)
                </button>
                <button onClick={() => setActiveTab('questions')} style={activeTab === 'questions' ? styles.tabActive : styles.tabBtn}>
                    3. Assessment Question Bank ({questions.length})
                </button>
            </div>

            {message && <div style={styles.alert}>{message}</div>}

            {/* Offer Letter Generator Modal */}
            {offerTarget && (
                <div style={styles.modalBackdrop}>
                    <div style={styles.modalBox}>
                        <h3 style={{ marginTop: 0 }}>Generate Official Offer Letter</h3>
                        <p style={{ fontSize: '0.9rem', color: '#475569' }}>
                            Candidate: <strong>{offerTarget.candidate_name}</strong><br />
                            Role: <strong>{offerTarget.job_title}</strong> at <strong>{offerTarget.company}</strong>
                        </p>
                        <form onSubmit={handleIssueOffer}>
                            <label style={styles.label}>Compensation Package (e.g. ₹12,50,000 LPA or $90,000/yr):</label>
                            <input
                                type="text"
                                placeholder="e.g. ₹12,50,000 LPA"
                                value={offerForm.offer_salary}
                                onChange={e => setOfferForm({ ...offerForm, offer_salary: e.target.value })}
                                required
                                style={styles.input}
                            />
                            <label style={styles.label}>Proposed Joining Date:</label>
                            <input
                                type="date"
                                value={offerForm.offer_start_date}
                                onChange={e => setOfferForm({ ...offerForm, offer_start_date: e.target.value })}
                                required
                                style={styles.input}
                            />
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button type="submit" style={styles.btnSuccess}>Issue Offer & Select</button>
                                <button type="button" onClick={() => setOfferTarget(null)} style={styles.btnCancelModal}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* TAB 1: CANDIDATE PIPELINE & VIDEO CALLS */}
            {activeTab === 'pipeline' && (
                <div style={styles.card}>
                    <h3>Scheduled Candidate Interviews, Skills & Logic Scores</h3>
                    {bookings.length === 0 ? (
                        <p style={{ color: '#64748b' }}>No candidates have booked slots yet. Go to <strong>Tab 2</strong> to post a job and open time slots.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={styles.table}>
                                <thead>
                                    <tr style={styles.thRow}>
                                        <th style={styles.th}>Candidate & Skills</th>
                                        <th style={styles.th}>Job Role</th>
                                        <th style={styles.th}>Interview Time</th>
                                        <th style={styles.th}>Logic Score</th>
                                        <th style={styles.th}>Links</th>
                                        <th style={styles.th}>Video Room</th>
                                        <th style={styles.th}>Status</th>
                                        <th style={styles.th}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map(b => (
                                        <tr key={b.application_id} style={styles.tr}>
                                            <td style={styles.td}>
                                                <strong>{b.candidate_name}</strong>
                                                {b.experience_years > 0 && <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 'bold' }}> · {b.experience_years}y exp</span>}
                                                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{b.candidate_email}</div>
                                                {b.candidate_skills && (
                                                    <div style={{ fontSize: '0.75rem', color: '#1d4ed8', marginTop: '3px' }}>
                                                        Skills: {b.candidate_skills}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={styles.td}>{b.job_title} ({b.company})</td>
                                            <td style={styles.td}>{new Date(b.start_time).toLocaleString()}</td>
                                            <td style={styles.td}><strong>{b.latest_score || 'Not Taken'}</strong></td>
                                            <td style={styles.td}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {b.resume_url && (
                                                        <a href={formatExternalUrl(b.resume_url)} target="_blank" rel="noreferrer" style={styles.resumeBadge}>
                                                            Resume
                                                        </a>
                                                    )}
                                                    {b.github_url && (
                                                        <a href={formatExternalUrl(b.github_url)} target="_blank" rel="noreferrer" style={styles.resumeBadge}>
                                                            GitHub
                                                        </a>
                                                    )}
                                                    {!b.resume_url && !b.github_url && (
                                                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>None</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={styles.td}>
                                                <a href={b.meeting_link} target="_blank" rel="noreferrer" style={styles.meetLink}>
                                                    Join Call
                                                </a>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={getBadgeStyle(b.status)}>{b.status}</span>
                                                {b.offer_issued_at && (
                                                    <div style={{ fontSize: '0.74rem', color: '#15803d', fontWeight: 'bold', marginTop: '4px' }}>
                                                        Offer Sent ({b.offer_salary})
                                                    </div>
                                                )}
                                            </td>
                                            <td style={styles.td}>
                                                <button onClick={() => openOfferModal(b)} style={styles.btnOffer}>
                                                    {b.offer_issued_at ? 'Edit Offer' : 'Issue Offer'}
                                                </button>
                                                <button onClick={() => handleStatusChange(b.application_id, 'REJECTED')} style={styles.btnReject}>Reject</button>
                                                <button onClick={() => handleDeleteApplication(b.application_id)} style={styles.btnRemoveRow}>Remove</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: POST JOBS & INTERVIEW SLOTS */}
            {activeTab === 'jobs_slots' && (
                <div>
                    <div style={styles.grid}>
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

                        <div style={styles.card}>
                            <h3>Publish Interview Time Slot</h3>
                            <form onSubmit={handleCreateSlot}>
                                <label style={styles.label}>Start Date & Time:</label>
                                <input type="datetime-local" onChange={e => setSlotData({...slotData, start_time: e.target.value.replace('T', ' ') + ':00'})} required style={styles.input} />
                                <label style={styles.label}>End Date & Time:</label>
                                <input type="datetime-local" onChange={e => setSlotData({...slotData, end_time: e.target.value.replace('T', ' ') + ':00'})} required style={styles.input} />
                                <button type="submit" style={styles.btnSuccess}>Publish Time Slot</button>
                            </form>
                        </div>
                    </div>

                    <div style={{ ...styles.grid, marginTop: '2rem' }}>
                        <div style={styles.card}>
                            <h3>Active Job Openings ({jobs.length})</h3>
                            {jobs.map(j => (
                                <div key={j.id} style={styles.slotItem}>
                                    <span><strong>{j.title}</strong> — {j.company} ({j.location})</span>
                                    <button onClick={() => handleDeleteJob(j.id)} style={styles.btnSmallDanger}>Delete</button>
                                </div>
                            ))}
                        </div>
                        <div style={styles.card}>
                            <h3>Available Interview Slots ({slots.length})</h3>
                            {slots.map(s => (
                                <div key={s.id} style={styles.slotItem}>
                                    <span>{new Date(s.start_time).toLocaleString()} to {new Date(s.end_time).toLocaleString()}</span>
                                    <button onClick={() => handleDeleteSlot(s.id)} style={styles.btnSmallDanger}>Remove</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: ASSESSMENT QUESTION BANK */}
            {activeTab === 'questions' && (
                <div style={styles.grid}>
                    <div style={styles.card}>
                        <h3>Add New Assessment Question</h3>
                        <form onSubmit={handleCreateQuestion}>
                            <textarea
                                placeholder="Enter Question (e.g. What does SQL stand for?)"
                                value={questionData.question_text}
                                onChange={e => setQuestionData({ ...questionData, question_text: e.target.value })}
                                required
                                style={{ ...styles.input, height: '65px' }}
                            />
                            <input type="text" placeholder="Option A" value={questionData.option_a} onChange={e => setQuestionData({ ...questionData, option_a: e.target.value })} required style={styles.input} />
                            <input type="text" placeholder="Option B" value={questionData.option_b} onChange={e => setQuestionData({ ...questionData, option_b: e.target.value })} required style={styles.input} />
                            <input type="text" placeholder="Option C" value={questionData.option_c} onChange={e => setQuestionData({ ...questionData, option_c: e.target.value })} required style={styles.input} />
                            <input type="text" placeholder="Option D" value={questionData.option_d} onChange={e => setQuestionData({ ...questionData, option_d: e.target.value })} required style={styles.input} />

                            <label style={styles.label}>Correct Answer:</label>
                            <select
                                value={questionData.correct_option}
                                onChange={e => setQuestionData({ ...questionData, correct_option: e.target.value })}
                                style={styles.input}
                            >
                                <option value="A">Option A</option>
                                <option value="B">Option B</option>
                                <option value="C">Option C</option>
                                <option value="D">Option D</option>
                            </select>

                            <label style={styles.label}>Marks for this Question:</label>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={questionData.marks}
                                onChange={e => setQuestionData({ ...questionData, marks: e.target.value })}
                                required
                                style={styles.input}
                            />
                            <button type="submit" style={styles.btnPrimary}>Add Question to Test</button>
                        </form>
                    </div>

                    <div style={styles.card}>
                        <h3>Active Test Questions ({questions.length})</h3>
                        {questions.length === 0 ? (
                            <p style={{ color: '#94a3b8' }}>No questions saved yet.</p>
                        ) : (
                            questions.map((q, idx) => (
                                <div key={q.id} style={styles.listItem}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <strong>Q{idx + 1}: {q.question_text}</strong>
                                        <button onClick={() => handleDeleteQuestion(q.id)} style={styles.btnSmallDanger}>Delete</button>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#475569', margin: '0.4rem 0' }}>
                                        A) {q.option_a} | B) {q.option_b} | C) {q.option_c} | D) {q.option_d}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#15803d' }}>
                                        Correct Answer: Option {q.correct_option} ({q.marks} Marks)
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', margin: '1.5rem 0' },
    kpiCard: { background: '#1e293b', color: '#fff', padding: '1.25rem', borderRadius: '8px', cursor: 'pointer' },
    kpiLabel: { fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase' },
    kpiValue: { margin: '0.5rem 0 0 0', fontSize: '1.6rem' },
    tabBar: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem' },
    tabBtn: { background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '0.65rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
    tabActive: { background: '#2563eb', color: '#fff', border: '1px solid #2563eb', padding: '0.65rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' },
    card: { background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '1rem', background: '#fff' },
    thRow: { background: '#e2e8f0', textAlign: 'left' },
    th: { padding: '0.75rem', fontSize: '0.82rem', color: '#334155' },
    tr: { borderBottom: '1px solid #e2e8f0' },
    td: { padding: '0.75rem', fontSize: '0.88rem' },
    resumeBadge: { display: 'inline-block', background: '#e2e8f0', color: '#1e293b', padding: '3px 8px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 'bold', textAlign: 'center' },
    meetLink: { background: '#0ea5e9', color: '#fff', padding: '4px 10px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 'bold' },
    btnOffer: { background: '#16a34a', color: '#fff', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', marginRight: '4px', fontSize: '0.75rem', fontWeight: 'bold' },
    btnReject: { background: '#dc2626', color: '#fff', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', marginRight: '4px', fontSize: '0.75rem' },
    btnRemoveRow: { background: '#64748b', color: '#fff', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' },
    btnSmallDanger: { background: '#ef4444', color: '#fff', border: 'none', padding: '4px 9px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' },
    slotItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '0.6rem 0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0', marginBottom: '0.5rem', fontSize: '0.85rem' },
    input: { width: '100%', padding: '0.65rem', margin: '0.4rem 0 1rem 0', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' },
    label: { fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' },
    btnPrimary: { width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    btnSuccess: { width: '100%', background: '#059669', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    btnCancelModal: { background: '#64748b', color: '#fff', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    modalBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalBox: { background: '#fff', padding: '2rem', borderRadius: '10px', width: '100%', maxWidth: '460px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' },
    alert: { background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem', fontWeight: 'bold' },
    listItem: { background: '#fff', padding: '0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0', marginBottom: '0.5rem' }
};

export default RecruiterDashboard;