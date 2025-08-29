// src/pages/OtpVerification.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/apiService';
import '../styles/Login.css';
import logo from '../assets/rightlogo.png';
 
const OtpVerification = () => {
  /* ───────── STATE ───────── */
  const [otp,         setOtp]         = useState('');
  const [timer,       setTimer]       = useState(30);  // 30‑second cooldown
  const [canResend,   setCanResend]   = useState(false);
 
  const navigate  = useNavigate();
  const location  = useLocation();
  let { target, type } = location.state || {};        // { target, type: "userId" | "password" }
  // Fallback to sessionStorage so refresh/direct visit still works
  if (!target || !type) {
    try {
      const saved = JSON.parse(sessionStorage.getItem('otpFlow') || 'null');
      if (saved?.target && saved?.type) {
        target = saved.target; // eslint-disable-line prefer-const
        type = saved.type;     // eslint-disable-line prefer-const
      }
    } catch (_) {}
  }
 
  /* ───────── GUARD ───────── */
  useEffect(() => {
    if (!target || !type) {
      alert('Invalid navigation – redirecting.');
      navigate('/forgot-password');
    }
  }, [target, type, navigate]);
 
  /* ───────── TIMER ───────── */
  useEffect(() => {
    if (timer === 0) { setCanResend(true); return; }
    const id = setInterval(() => setTimer(t => t - 1), 1_000);
    return () => clearInterval(id);
  }, [timer]);
 
  /* ───────── VERIFY ───────── */
  const handleVerify = async () => {
    if (otp.length !== 6) { alert('Enter a 6‑digit OTP'); return; }
    try {
      // Backend expects emailOrPhone
      await authAPI.verifyOTP({ email: target, otp });
      alert('OTP verified ✔️');
      try {
        sessionStorage.setItem('otpFlow', JSON.stringify({ target, type, otpVerified: true }));
      } catch (_) {}
      if (type === 'userId') {
        navigate('/change-userid', { state: { target } });
      } else {
        navigate('/change-password', { state: { target } });
      }
    } catch (err) {
      console.error(err);
      alert('Invalid or expired OTP.');
    }
  };
 
  /* ───────── RESEND ───────── */
  const handleResend = async () => {
    if (!canResend) return;
    try {
      await authAPI.resendOTP(target);
      alert('OTP resent!');
      setTimer(30);
      setCanResend(false);
      setOtp('');
    } catch (err) {
      console.error(err);
      alert('Could not resend OTP.');
    }
  };
 
  /* ───────── UI ───────── */
  const getCurrentDate = () => new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="login-page-container minimalist">
      <div className="auth-wrapper">
        <aside className="agri-highlights" aria-label="Agriculture highlights">
          <h2 className="agri-title">Verify your identity</h2>
          <ul className="agri-list">
            <li><span className="agri-emoji">✉️</span><div><div className="agri-point">6‑digit code sent</div><div className="agri-sub">To: {target}</div></div></li>
          </ul>
        </aside>
        <div className="auth-card">
          <div className="auth-brand">
            <img src={logo} alt="DATE Logo" className="auth-logo" />
            <div className="auth-title">Digital Agristack Transaction Enterprises</div>
            <div className="auth-subtitle">Empowering Agricultural Excellence</div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="auth-form">
            <div className="auth-field">
              <label htmlFor="otpInput">Enter OTP</label>
              <input id="otpInput" className="otp-input" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} />
            </div>
            <div className="resend-otp">
              {canResend ? (
                <button type="button" onClick={handleResend} className="resend-btn">Resend OTP</button>
              ) : (
                <span className="resend-timer">Resend in {timer}s</span>
              )}
            </div>
            <div className="auth-actions">
              <button type="submit" className="auth-submit">Verify</button>
              <button type="button" className="auth-secondary" onClick={() => navigate(-1)}>Back</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
 
export default OtpVerification; 