import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authAPI } from '../api/apiService';
import { Link, useLocation } from 'react-router-dom';
// Using shared minimalist styles from Login.css
import '../styles/Registration.css';
import logo from '../assets/rightlogo.png';

// Update Yup schema for password validation
const schema = yup.object().shape({
  name: yup.string().required('Name is required'),
  dateOfBirth: yup
    .string()
    .required('Date of Birth is required')
    .test('age-range', 'Age must be between 18 and 90 years', function (value) {
      if (!value) return false;
      const dob = new Date(value);
      const today = new Date();
      const ageDifMs = today - dob;
      const ageDate = new Date(ageDifMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      return age >= 18 && age <= 90;
    }),
  gender: yup.string().required('Gender is required'),
  email: yup.string()
    .required('Email is required')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email must include @ and be valid'),
  phoneNumber: yup
    .string()
    .matches(/^\d{10}$/, 'Enter a valid 10-digit phone number')
    .required('Phone number is required'),
  role: yup.string().required('Role is required'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]/, 'Password must contain at least one special character'),
});

const RegistrationForm = () => {
  const location = useLocation();
  const initialRole = location.state?.role || '';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { role: initialRole },
  });

  const [emailValue, setEmailValue] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (!resendTimer) return;
    const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleSendOTP = async () => {
    if (!emailValue.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      alert('Enter a valid email first');
      return;
    }
    
    // First check if backend is accessible
    try {
      console.log('Checking backend connectivity...');
      await fetch('http://localhost:8080/api/auth/test', { 
        method: 'GET',
        timeout: 5000 
      });
      console.log('Backend is accessible');
    } catch (connectivityError) {
      console.error('Backend connectivity error:', connectivityError);
      alert('Cannot connect to the server. Please check if the backend is running and try again.');
      return;
    }
    
    try {
      console.log('Sending OTP to:', emailValue);
      const response = await authAPI.sendOTP(emailValue);
      console.log('OTP send response:', response);
      setOtpSent(true);
      setResendTimer(30);
      alert('OTP sent successfully! Please check your email.');
    } catch (e) {
      console.error('OTP send error:', e);
      console.error('OTP send error response:', e.response);
      console.error('OTP send error data:', e.response?.data);
      
      // Check if OTP was actually sent despite the error
      if (e.response?.status === 200 || e.response?.data?.message?.includes('sent')) {
        // OTP was sent successfully, just show success
        setOtpSent(true);
        setResendTimer(30);
        alert('OTP sent successfully! Please check your email.');
      } else {
        // Real error occurred
        const errorMessage = e.response?.data?.message || e.message || 'Failed to send OTP';
        alert(`OTP Error: ${errorMessage}`);
      }
    }
  };
   
  // ✅ Handle Verify OTP
  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }
    
    try {
      console.log('Verifying OTP for:', emailValue);
      console.log('OTP entered:', otp);
      const response = await authAPI.verifyOTP({
        email: emailValue,
        otp: otp,
      });
      console.log('OTP verification response:', response);
      alert("Email verified successfully!");
      setEmailVerified(true);
    } catch (error) {
      console.error('OTP verification error:', error);
      console.error('OTP verification error response:', error.response);
      console.error('OTP verification error data:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.message || 'OTP verification failed';
      alert(`OTP Verification Error: ${errorMessage}`);
    }
  };

  // ✅ Final Registration Submission to backend
  const onSubmit = async (data) => {
    if (!emailVerified) {
      alert('Please verify your email before submitting.');
      return;
    }

    try {
      console.log('Submitting registration data:', data);
      const response = await authAPI.register(data);
      console.log('Registration successful:', response);
      
      // Show success message with approval notice
      alert('Registration successful! Please wait for admin approval. You will receive an email with login credentials once approved.');
      
      // Reset form
      reset();
      setEmailVerified(false);
      setOtpSent(false);
      setEmailValue('');
      setOtp('');
      
      // Don't navigate to login - user needs to wait for approval
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <div className="login-page-container minimalist">
      <div className="auth-wrapper">
        <aside className="agri-highlights" aria-label="Agriculture highlights">
          <h2 className="agri-title">Register to get started</h2>
          <ul className="agri-list">
            <li><span className="agri-emoji">✅</span><div><div className="agri-point">Simple onboarding</div><div className="agri-sub">Verify email with OTP in seconds</div></div></li>
            <li><span className="agri-emoji">🛡️</span><div><div className="agri-point">Secure data</div><div className="agri-sub">Encrypted storage & verification</div></div></li>
          </ul>
        </aside>

        <div className="auth-card">
          <div className="auth-brand">
            <img src={logo} alt="DATE Logo" className="auth-logo" />
            <div className="auth-title">Digital Agristack Transaction Enterprises</div>
            <div className="auth-subtitle">Empowering Agricultural Excellence</div>
          </div>

          <div className="auth-field" style={{ marginTop: 6 }}>
            <h2 style={{ margin: 0 }}>Registration Form</h2>
            <p style={{ color: '#6b7280', margin: '6px 0 0' }}>Enter your details to get started</p>
          </div>

          <input type="hidden" {...register('role')} value={initialRole} />
          {initialRole && (
            <div className="auth-field">
              <label>Role</label>
              <input type="text" value={initialRole} readOnly />
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            <div className="form-grid-2">
              <div className="auth-field">
                <label>Name <span className="required">*</span></label>
                <input type="text" {...register('name')} className={errors.name ? 'error' : ''} placeholder="Enter your first name" />
                {errors.name && <div className="error">{errors.name.message}</div>}
              </div>

              <div className="auth-field">
                <label>Gender <span className="required">*</span></label>
                <select {...register('gender')} className={errors.gender ? 'error' : ''}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <div className="error">{errors.gender.message}</div>}
              </div>

              <div className="auth-field grid-span-2">
                <label>Date of Birth <span className="required">*</span></label>
                <input type="date" {...register('dateOfBirth')} className={errors.dateOfBirth ? 'error' : ''} />
                {errors.dateOfBirth && <div className="error">{errors.dateOfBirth.message}</div>}
              </div>

              <div className="auth-field">
                <label>Phone Number <span className="required">*</span></label>
                <input type="text" {...register('phoneNumber')} className={errors.phoneNumber ? 'error' : ''} placeholder="Enter 10-digit number" />
                {errors.phoneNumber && <div className="error">{errors.phoneNumber.message}</div>}
              </div>

              <div className="auth-field">
                <label>Email Address <span className="required">*</span></label>
                <input type="email" {...register('email')} value={emailValue} onChange={(e) => { setEmailValue(e.target.value); setOtpSent(false); setEmailVerified(false); }} className={errors.email ? 'error' : ''} placeholder="Enter your email" />
                {errors.email && <div className="error">{errors.email.message}</div>}
              </div>

              <div className="auth-field grid-span-2">
                <label>Password <span className="required">*</span></label>
                <input type="password" {...register('password')} className={errors.password ? 'error' : ''} placeholder="Enter a strong password" autoComplete="new-password" />
                {errors.password && <div className="error">{errors.password.message}</div>}
              </div>
            </div>

            {/* Email Verification */}
            {!otpSent && !emailVerified && (
              <div className="auth-actions"><button type="button" onClick={handleSendOTP} className="auth-submit">Send OTP</button></div>
            )}
            {(otpSent && !emailVerified) && (
              <div className="auth-field">
                <label>Enter OTP</label>
                <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
                <div className="auth-actions" style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={handleSendOTP} className="auth-secondary" disabled={resendTimer > 0}>
                    {resendTimer > 0 ? `Resend (${resendTimer}s)` : 'Resend'}
                  </button>
                  <button type="button" onClick={handleVerifyOTP} className="auth-submit">Verify</button>
                </div>
              </div>
            )}
            {emailVerified && (
              <div className="auth-field" style={{ color: '#166f3e', fontWeight: 700 }}>✓ Email Verified</div>
            )}

            <div className="auth-actions">
              <button type="submit" className="auth-submit">Register Now ...</button>
            </div>
            <div className="auth-field" style={{ textAlign: 'center' }}>
              <h4>Already have an account? <Link to="/login">Sign In</Link></h4>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm; 