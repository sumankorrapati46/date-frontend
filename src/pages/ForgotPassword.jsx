import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { authAPI } from "../api/apiService";
import { useNavigate, Link } from 'react-router-dom';
import logo from "../assets/rightlogo.png";
import "../styles/Login.css";
 
// ✅ Schema validation
const schema = Yup.object().shape({
  userInput: Yup.string()
    .required("Email / Phone / ID is required")
    .test(
      "valid-userInput",
      "Enter a valid Email (with '@' and '.'), 10-digit Phone number, or ID (min 6 characters)",
      function (value) {
        if (!value) return false;
 
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[0-9]{10}$/;
 
        const isEmail = emailRegex.test(value);
        const isPhone = phoneRegex.test(value);
        const isId = !isEmail && !isPhone && value.length >= 6;
 
        return isEmail || isPhone || isId;
      }
    ),
});
 
const ForgotPassword = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });
 
  const [showPopup, setShowPopup] = useState(false);
  const [target, setTarget] = useState("");
 
   const navigate = useNavigate();
   const onSubmit = async (data) => {
    try {
      await authAPI.forgotPassword(data.userInput);
 
      setTarget(data.userInput);
      setShowPopup(true); // Show popup on success
    } catch (error) {
      console.error("Error sending reset request:", error);
      alert("Failed to send reset link. Please try again.");
    }
  };
 
     const handlePopupClose = () => {
  setShowPopup(false);
  try {
    // Persist OTP flow details so refresh/direct navigation still works
    sessionStorage.setItem('otpFlow', JSON.stringify({ target, type: 'password', otpVerified: false }));
  } catch (_) {}
  navigate('/otp-verification', { state: { target, type: 'password' } });
};
 
  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="login-page-container minimalist">
      <div className="auth-wrapper">
        <aside className="agri-highlights" aria-label="Agriculture highlights">
          <h2 className="agri-title">Reset access securely</h2>
          <ul className="agri-list">
            <li><span className="agri-emoji">🔐</span><div><div className="agri-point">Encrypted reset links</div><div className="agri-sub">Your account security is our priority</div></div></li>
            <li><span className="agri-emoji">📨</span><div><div className="agri-point">Email delivery tracking</div><div className="agri-sub">We confirm when your link is sent</div></div></li>
          </ul>
        </aside>
        <div className="auth-card">
          <div className="auth-brand">
            <img src={logo} alt="DATE Logo" className="auth-logo" />
            <div className="auth-title">Digital Agristack Transaction Enterprises</div>
            <div className="auth-subtitle">Empowering Agricultural Excellence</div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            <div className="auth-field">
              <label>Email<span className="required">*</span></label>
              <input {...register('userInput')} placeholder="Enter your Email" className={errors.userInput ? 'error' : ''} />
              {errors.userInput && <div className="error">{errors.userInput.message}</div>}
            </div>
            <div className="auth-actions">
              <button type="submit" className="auth-submit">Reset password</button>
            </div>
          </form>

          <div className="auth-field" style={{ textAlign: 'center', marginTop: 10 }}>
            <h4>Remembered your credentials? <Link to="/login">Back to Login</Link></h4>
          </div>

          {showPopup && (
            <div className="popup">
              <div className="popup-content">
                <h3>Success!</h3>
                <h4>A reset link has been sent to <strong>{target}</strong></h4>
                <button onClick={handlePopupClose}>OK</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
 
export default ForgotPassword; 