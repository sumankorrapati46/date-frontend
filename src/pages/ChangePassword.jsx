// This page is used for force password change on first login
import React, { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/apiService';

import '../styles/Login.css';
import logo from '../assets/rightlogo.png';

const ChangePassword = () => {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state || {};
  const [target, setTarget] = useState(routeState.target || '');
  const [form, setForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    // If accessed after OTP, we should have target from state or session
    if (!target) {
      try {
        const saved = JSON.parse(sessionStorage.getItem('otpFlow') || 'null');
        if (saved?.target && saved?.type === 'password' && saved?.otpVerified) {
          setTarget(saved.target);
        }
      } catch (_) {}
    }
  }, [target]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }
    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    
    // Check password requirements
    const hasUpperCase = /[A-Z]/.test(form.newPassword);
    const hasNumber = /\d/.test(form.newPassword);
    const hasAtSymbol = /@/.test(form.newPassword);
    
    if (!hasUpperCase || !hasNumber || !hasAtSymbol) {
      setError('Password must include an uppercase letter, a number, and an @ symbol.');
      return;
    }
    try {
      const emailOrPhone = (user?.email || user?.userName || target);
      console.log('Attempting to change password for:', emailOrPhone);

      // Use backend confirm endpoint for reset without OTP
      const response = await api.post('/auth/reset-password/confirm', {
        emailOrPhone,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword
      });
      console.log('Password change response:', response.data);
      
      setSuccess('Password changed successfully! Redirecting to login...');
      
      // Clear OTP flow if present
      try { sessionStorage.removeItem('otpFlow'); } catch (_) {}
      
      // After successful password change, redirect to login
      // The user will need to log in again with their new password
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    } catch (err) {
      console.error('Password change error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      // Provide more specific error messages
      if (err.response?.status === 400) {
        setError(err.response?.data?.message || 'Invalid password format. Please check the requirements.');
      } else if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else if (err.response?.status === 404) {
        setError('User not found. Please contact administrator.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to change password. Please try again.');
      }
    }
  };

  // If not logged in, allow reset via OTP target

  const getCurrentDate = () => new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="login-page-container minimalist">
      <div className="auth-wrapper">
        <aside className="agri-highlights" aria-label="Agriculture highlights">
          <h2 className="agri-title">Secure your account</h2>
          <ul className="agri-list">
            <li><span className="agri-emoji">🔒</span><div><div className="agri-point">Strong password rules</div><div className="agri-sub">Uppercase, number and @ required</div></div></li>
          </ul>
        </aside>
        <div className="auth-card">
          <div className="auth-brand">
            <img src={logo} alt="DATE Logo" className="auth-logo" />
            <div className="auth-title">Digital Agristack Transaction Enterprises</div>
            <div className="auth-subtitle">Empowering Agricultural Excellence</div>
          </div>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label>New Password</label>
              <input type="password" name="newPassword" value={form.newPassword} onChange={handleChange} required placeholder="Enter your new password" disabled={!!success} />
            </div>
            <div className="auth-field">
              <label>Confirm New Password</label>
              <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required placeholder="Confirm your new password" disabled={!!success} />
            </div>
            {error && <div className="error-text">{error}</div>}
            {success && <div className="success-text">{success}</div>}
            <div className="auth-actions">
              <button type="submit" className="auth-submit" disabled={!!success}>Change Password</button>
            </div>
          </form>

          <div className="auth-field" style={{ textAlign: 'center', marginTop: 10 }}>
            <h4>Back to <Link to="/login">Login</Link></h4>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword; 