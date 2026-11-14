import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

function AssessmentPage() {
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [tabSwitches, setTabSwitches] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Anti-cheat: Track tab switches / focus loss
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setTabSwitches(prev => {
                    const updated = prev + 1;
                    alert(`⚠️ Warning #${updated}: Tab switching or leaving the assessment window is monitored and recorded!`);
                    return updated;
                });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        API.get('/assessments/questions')
            .then(res => {
                setQuestions(res.data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const handleSelectOption = (questionId, optionKey) => {
        setAnswers({ ...answers, [questionId]: optionKey });
    };

    const handleSubmitTest = async () => {
        if (!window.confirm('Are you ready to submit your assessment?')) return;

        try {
            const res = await API.post('/assessments/submit', {
                answers,
                tab_switches: tabSwitches
            });
            setResult(res.data);
            setSubmitted(true);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to submit assessment');
        }
    };

    if (loading) {
        return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading proctored assessment...</div>;
    }

    if (submitted && result) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <h2>Assessment Submitted Successfully!</h2>
                    <div style={styles.scoreBox}>
                        <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Your Score:</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2563eb' }}>
                            {result.score} / {result.total_marks}
                        </div>
                        <p style={{ color: '#475569', marginTop: '0.75rem' }}>
                            Tab Switches Recorded: <strong>{result.tab_switches}</strong>
                        </p>
                    </div>
                    <button onClick={() => navigate('/candidate')} style={styles.btnPrimary}>
                        Return to Candidate Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
                <h3>No assessment questions available yet.</h3>
                <p style={{ color: '#64748b' }}>Please ask your recruiter to add questions in the Recruiter Control Panel.</p>
                <button onClick={() => navigate('/candidate')} style={{ ...styles.btnPrimary, width: 'auto', marginTop: '1rem' }}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const currentQ = questions[currentIndex];

    return (
        <div style={styles.container}>
            <div style={styles.assessmentCard}>
                <div style={styles.topBar}>
                    <h3 style={{ margin: 0 }}>Proctored Technical & Logic Assessment</h3>
                    <span style={styles.warningBadge}>⚠️ Tab Switches: {tabSwitches}</span>
                </div>

                <div style={styles.progressText}>
                    Question {currentIndex + 1} of {questions.length}
                </div>

                <div style={styles.questionBox}>
                    <p style={styles.questionText}><strong>Q{currentIndex + 1}:</strong> {currentQ.question_text}</p>
                    
                    {['A', 'B', 'C', 'D'].map(opt => {
                        const optText = currentQ[`option_${opt.toLowerCase()}`];
                        if (!optText) return null;
                        const isSelected = answers[currentQ.id] === opt;
                        return (
                            <div
                                key={opt}
                                onClick={() => handleSelectOption(currentQ.id, opt)}
                                style={{ ...styles.optionCard, background: isSelected ? '#eff6ff' : '#fff', borderColor: isSelected ? '#2563eb' : '#cbd5e1' }}
                            >
                                <strong>{opt})</strong> {optText}
                            </div>
                        );
                    })}
                </div>

                <div style={styles.navRow}>
                    <button
                        disabled={currentIndex === 0}
                        onClick={() => setCurrentIndex(currentIndex - 1)}
                        style={{ ...styles.btnSecondary, opacity: currentIndex === 0 ? 0.5 : 1 }}
                    >
                        Previous
                    </button>

                    {currentIndex < questions.length - 1 ? (
                        <button onClick={() => setCurrentIndex(currentIndex + 1)} style={styles.btnPrimary}>
                            Next Question
                        </button>
                    ) : (
                        <button onClick={handleSubmitTest} style={styles.btnSuccess}>
                            Submit Final Assessment
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: { minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', padding: '1.5rem' },
    card: { background: '#fff', padding: '2.5rem', borderRadius: '10px', textAlign: 'center', maxWidth: '480px', width: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' },
    assessmentCard: { background: '#fff', padding: '2rem', borderRadius: '10px', width: '100%', maxWidth: '680px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' },
    topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' },
    warningBadge: { background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' },
    progressText: { fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold', marginBottom: '1rem' },
    questionBox: { marginBottom: '1.5rem' },
    questionText: { fontSize: '1.05rem', color: '#0f172a', lineHeight: '1.5', marginBottom: '1rem' },
    optionCard: { padding: '0.85rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '0.75rem', cursor: 'pointer', fontSize: '0.95rem' },
    navRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' },
    scoreBox: { background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', margin: '1.5rem 0' },
    btnPrimary: { background: '#2563eb', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    btnSecondary: { background: '#64748b', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    btnSuccess: { background: '#16a34a', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
};

export default AssessmentPage;