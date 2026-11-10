import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

function TakeAssessment() {
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(120); // 2-minute timer
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch questions from backend
        API.get('/assessments/questions')
            .then(res => setQuestions(res.data))
            .catch(err => setError('Failed to load questions'));
    }, []);

    // Countdown Timer Effect
    useEffect(() => {
        if (submitted || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(); // Auto-submit when time expires
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, submitted]);

    const handleOptionSelect = (questionId, option) => {
        setAnswers({ ...answers, [questionId]: option });
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (submitted) return;

        const payload = Object.keys(answers).map(qId => ({
            questionId: parseInt(qId),
            selectedOption: answers[qId]
        }));

        try {
            const res = await API.post('/assessments/submit', { answers: payload });
            setResult(res.data.result);
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Submission failed');
        }
    };

    if (result) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <h2 style={{ color: '#16a34a' }}>Assessment Completed!</h2>
                    <h3>Your Score: {result.score} / {result.totalMarks}</h3>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Percentage: {result.percentage}</p>
                    <button style={styles.button} onClick={() => navigate('/dashboard')}>
                        Return to Dashboard & Book Interview Slot
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.cardLarge}>
                <div style={styles.headerRow}>
                    <h2>Timed Logic & Aptitude Assessment</h2>
                    <div style={{ ...styles.timer, color: timeLeft < 30 ? '#ef4444' : '#2563eb' }}>
                        Time Remaining: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </div>
                </div>

                {error && <p style={{ color: '#ef4444' }}>{error}</p>}

                <form onSubmit={handleSubmit}>
                    {questions.map((q, idx) => (
                        <div key={q.id} style={styles.questionBox}>
                            <h4>{idx + 1}. {q.question_text} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>({q.marks} Marks)</span></h4>
                            {['A', 'B', 'C', 'D'].map(opt => {
                                const optionKey = `option_${opt.toLowerCase()}`;
                                return (
                                    <label key={opt} style={styles.optionLabel}>
                                        <input
                                            type="radio"
                                            name={`q_${q.id}`}
                                            value={opt}
                                            checked={answers[q.id] === opt}
                                            onChange={() => handleOptionSelect(q.id, opt)}
                                        />
                                        <span style={{ marginLeft: '8px' }}>{opt}) {q[optionKey]}</span>
                                    </label>
                                );
                            })}
                        </div>
                    ))}

                    <button type="submit" style={styles.button}>Submit Assessment</button>
                </form>
            </div>
        </div>
    );
}

const styles = {
    container: { display: 'flex', justifyContent: 'center', padding: '2rem' },
    card: { background: '#f8fafc', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px' },
    cardLarge: { background: '#f8fafc', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '700px' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' },
    timer: { fontSize: '1.2rem', fontWeight: 'bold' },
    questionBox: { background: '#fff', padding: '1rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1rem', textAlign: 'left' },
    optionLabel: { display: 'block', margin: '0.5rem 0', cursor: 'pointer' },
    button: { background: '#2563eb', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem', width: '100%', marginTop: '1rem' }
};

export default TakeAssessment;