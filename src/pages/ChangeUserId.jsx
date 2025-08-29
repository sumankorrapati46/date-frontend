import React, { useState } from 'react';
import { authAPI } from '../api/apiService';
import { useNavigate, Link } from 'react-router-dom';
import "../styles/Login.css";
import logo from "../assets/rightlogo.png";

 
const ChangeUserId = () => {
  const [newUserId, setNewUserId] = useState('');
  const [confirmUserId, setConfirmUserId] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

const handleChangeUserId = async () => {
  if (!newUserId || !confirmUserId) {
    setError('Both fields are required.'); 
    return;
  } else if (newUserId !== confirmUserId) {
    setError('User IDs do not match.');
    return;
  }

  setError('');

  try {
    await authAPI.changeUserId({ newUserName: newUserId, password: '' });

    alert(`User ID changed successfully to: ${newUserId}`);
    navigate('/login');
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      setError(error.response.data.message);
    } else {
      setError('Failed to change User ID. Please try again.');
    }
  }
};

  const getCurrentDate = () => new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="login-page-container minimalist">
      <div className="auth-wrapper">
        <aside className="agri-highlights" aria-label="Agriculture highlights">
          <h2 className="agri-title">Update your User ID</h2>
          <ul className="agri-list">
            <li><span className="agri-emoji">🆔</span><div><div className="agri-point">Unique and secure</div><div className="agri-sub">Choose a memorable identifier</div></div></li>
          </ul>
        </aside>
        <div className="auth-card">
          <div className="auth-brand">
            <img src={logo} alt="DATE Logo" className="auth-logo" />
            <div className="auth-title">Digital Agristack Transaction Enterprises</div>
            <div className="auth-subtitle">Empowering Agricultural Excellence</div>
          </div>
          <form className="auth-form" onSubmit={(e) => { e.preventDefault(); handleChangeUserId(); }}>
            <div className="auth-field">
              <label htmlFor="newUserId">New User ID</label>
              <input id="newUserId" type="text" value={newUserId} onChange={(e) => setNewUserId(e.target.value)} />
            </div>
            <div className="auth-field">
              <label htmlFor="confirmUserId">Confirm User ID</label>
              <input id="confirmUserId" type="text" value={confirmUserId} onChange={(e) => setConfirmUserId(e.target.value)} />
            </div>
            {error && <p className="error-text">{error}</p>}
            <div className="auth-actions">
              <button type="submit" className="auth-submit">Change User ID</button>
            </div>
          </form>

          <div className="auth-field" style={{ textAlign: 'center', marginTop: 10 }}>
            <h4>Done here? <Link to="/login">Back to Login</Link></h4>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeUserId; 