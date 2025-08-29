import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate, Link } from 'react-router-dom';
import "../styles/Login.css";
import logo from "../assets/rightlogo.png";
 
// ✅ Validation schema
const schema = Yup.object().shape({
  userInput: Yup.string()
    .required("Email / Phone / ID is required")
    .test(
      "is-valid",
      "Enter a valid Email (with '@' and '.'), 10-digit Phone number, or ID (min 6 characters)",
      (value = "") => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[0-9]{10}$/;
        return (
          emailRegex.test(value) ||
          phoneRegex.test(value) ||
          (value.length >= 6 && !emailRegex.test(value) && !phoneRegex.test(value))
        );
      }
    ),
});
 
const ForgotUserId = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });
 
  const [showPopup, setShowPopup] = useState(false);
  const [target, setTarget] = useState("");
  const navigate = useNavigate();
 
   const onSubmit = async (data) => {
    try {
       await axios.post("http://localhost:8080/api/auth/forgot-user-id", {
        emailOrPhone: data.userInput,
      }, {
        headers: { "Content-Type": "application/json" },
      });
 
      setTarget(data.userInput);
      setShowPopup(true); // Show success popup
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to send User ID. Please try again later.");
    }
  };
 
  const handlePopupClose = () => {
  setShowPopup(false);
  try {
    sessionStorage.setItem('otpFlow', JSON.stringify({ target, type: 'userId', otpVerified: false }));
  } catch (_) {}
  navigate('/otp-verification', { state: { target, type: 'userId' } });
};
 
  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="login-page-container minimalist">
      <div className="auth-wrapper">
        <aside className="agri-highlights" aria-label="Agriculture highlights">
          <h2 className="agri-title">Recover your User ID</h2>
          <ul className="agri-list">
            <li><span className="agri-emoji">📧</span><div><div className="agri-point">Email or phone supported</div><div className="agri-sub">We’ll send your User ID securely</div></div></li>
            <li><span className="agri-emoji">🛡️</span><div><div className="agri-point">Privacy-first process</div><div className="agri-sub">No credentials are exposed</div></div></li>
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
              <label>Email / Phone / ID <span className="required">*</span></label>
              <input {...register('userInput')} placeholder="Enter your Email or Phone or ID" className={errors.userInput ? 'error' : ''} />
              {errors.userInput && <div className="error">{errors.userInput.message}</div>}
            </div>
            <div className="auth-actions">
              <button type="submit" className="auth-submit">Reset User ID</button>
            </div>
          </form>

          {showPopup && (
            <div className="popup">
              <div className="popup-content">
                <h3>Success!</h3>
                <h4>Your User ID has been sent to <strong>{target}</strong></h4>
                <button onClick={handlePopupClose}>OK</button>
              </div>
            </div>
          )}

          <div className="auth-field" style={{ textAlign: 'center', marginTop: 10 }}>
            <h4>Back to <Link to="/login">Login</Link></h4>
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default ForgotUserId; 