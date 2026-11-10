import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import CandidateDashboard from './pages/CandidateDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import TakeAssessment from './pages/TakeAssessment';

function MainDashboard() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'RECRUITER' || user.role === 'ADMIN') {
        return <RecruiterDashboard />;
    }
    return <CandidateDashboard />;
}

function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<MainDashboard />} />
                <Route path="/assessment" element={<TakeAssessment />} />
            </Routes>
        </Router>
    );
}

export default App;