import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { authAPI } from '../api/apiService';
import logo from '../assets/rightlogo.png';
import '../styles/Login.css';

const generateCaptcha = () => {
  // Random captcha generation
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let captcha = '';
  for (let i = 0; i < 5; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return captcha;
};

const Login = () => {
  const { login } = useContext(AuthContext);
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState('official'); // 'official', 'fpo', 'employee', 'farmer'
  const [captcha, setCaptcha] = useState('');
  const [captchaValue, setCaptchaValue] = useState(generateCaptcha());
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const navigate = useNavigate();

  // Welcome messages that will randomly refresh
  const welcomeMessages = [
    "Welcome to DATE Digital Agristack! 🌾",
    "Empowering Indian Agriculture Today! 🚀",
    "Digital Solutions for Modern Farming! 💡",
    "Transforming Agriculture with Technology! 🌱",
    "Building a Sustainable Agricultural Future! 🌍",
    "Smart Farming, Smart India! 🇮🇳",
    "Innovation Meets Agriculture! ⚡",
    "Growing Together, Growing Stronger! 🌿"
  ];

  // Helper to render current date like reference header
  const getCurrentDate = () => {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return now.toLocaleDateString('en-US', options);
  };

  // Function to get random welcome message
  const getRandomWelcomeMessage = () => {
    const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
    return welcomeMessages[randomIndex];
  };

  // Update welcome message every 5 seconds
  useEffect(() => {
    setWelcomeMessage(getRandomWelcomeMessage());
    
    const interval = setInterval(() => {
      setWelcomeMessage(getRandomWelcomeMessage());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleLoginType = (type) => {
    setLoginType(type);
    setError('');
    setCaptcha('');
    setCaptchaValue(generateCaptcha());
  };

  const handleRefreshCaptcha = () => {
    setCaptchaValue(generateCaptcha());
    setCaptcha('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (captcha.trim().toLowerCase() !== captchaValue.toLowerCase()) {
      setError('Captcha does not match.');
      setLoading(false);
      setCaptchaValue(generateCaptcha());
      setCaptcha('');
      return;
    }
    try {
      // Backend expects userName
      const loginData = { userName, password };
      const response = await authAPI.login(loginData);
      console.log('Login - Full login response:', response);
      console.log('Login - Login response data keys:', Object.keys(response || {}));
      // Accept multiple possible token field names
      const token = response.token || response.jwt || response.accessToken || response.data?.token || localStorage.getItem('token');
      if (token) {
        localStorage.setItem('token', token);
      }
      
      // Extract user data from login response
      const userData = response.user || response.data?.user || response.data;
      console.log('Login - User data from login response:', userData);
      
      if (userData) {
        const user = {
          userName: userData.userName || userName,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          forcePasswordChange: response.forcePasswordChange || response.data?.forcePasswordChange || false,
          status: userData.status
        };
        
        // For users with temporary passwords, force password change
        if (password.includes('Temp@')) {
          user.forcePasswordChange = true;
          console.log('Login - Detected temporary password, forcing password change');
        }
        
        console.log('Login - User data constructed:', user);
        console.log('Login - User role from login response:', userData.role);
        login(user, token);
        
        // Check if user needs to change password (first time login with temp password)
        console.log('Login - Checking forcePasswordChange:', user.forcePasswordChange);
        console.log('Login - Password contains Temp@:', password.includes('Temp@'));
        
        if (user.forcePasswordChange) {
          console.log('Login - Redirecting to change password page');
          navigate('/change-password');
          return;
        }
        
        // Role-based navigation after password change or normal login
        console.log('Login - User role for navigation:', user.role);
        console.log('Login - User role (normalized):', user.role?.toUpperCase?.()?.trim?.());
        console.log('Login - User role type:', typeof user.role);
        console.log('Login - User role length:', user.role?.length);
        console.log('Login - User role includes spaces:', user.role?.includes(' '));
        
        const normalizedRole = user.role?.toUpperCase?.()?.trim?.() || '';
        console.log('Login - Normalized role:', normalizedRole);
        console.log('Login - Normalized role === ADMIN:', normalizedRole === 'ADMIN');
        console.log('Login - Normalized role === SUPER_ADMIN:', normalizedRole === 'SUPER_ADMIN');
        console.log('Login - Normalized role === EMPLOYEE:', normalizedRole === 'EMPLOYEE');
        
        if (normalizedRole === 'SUPER_ADMIN') {
          console.log('Login - Redirecting SUPER_ADMIN to /super-admin/dashboard');
          navigate('/super-admin/dashboard');
        } else if (normalizedRole === 'ADMIN') {
          console.log('Login - Redirecting ADMIN to /admin/dashboard');
          navigate('/admin/dashboard');
        } else if (normalizedRole === 'EMPLOYEE') {
          console.log('Login - Redirecting EMPLOYEE to /employee/dashboard');
          navigate('/employee/dashboard');
        } else {
          console.log('Login - Redirecting FARMER to /dashboard');
          navigate('/dashboard');
        }
      } else {
        // Fallback to profile fetch if user data not in login response
        try {
          // Get user profile (cookie or bearer supported)
          const profileData = await authAPI.getProfile();
          console.log('Login - Profile response data:', profileData);
          console.log('Login - Profile response data keys:', Object.keys(profileData || {}));
          const user = {
            userName: profileData.userName || userName,
            name: profileData.name,
            email: profileData.email,
            role: profileData.role,
            forcePasswordChange: profileData.forcePasswordChange || false,
            status: profileData.status
          };
          
          // For users with temporary passwords, force password change
          if (password.includes('Temp@')) {
            user.forcePasswordChange = true;
            console.log('Login - Detected temporary password, forcing password change');
          }
          
          console.log('Login - User data from profile:', user);
          console.log('Login - User role from profile:', profileData.role);
          login(user, token);
          
          // Check if user needs to change password (first time login with temp password)
          console.log('Login - Checking forcePasswordChange:', user.forcePasswordChange);
          console.log('Login - Password contains Temp@:', password.includes('Temp@'));
          
          if (user.forcePasswordChange) {
            console.log('Login - Redirecting to change password page');
            navigate('/change-password');
            return;
          }
          
          // Role-based navigation after password change or normal login
          console.log('Login - User role for navigation:', user.role);
          console.log('Login - User role (normalized):', user.role?.toUpperCase?.()?.trim?.());
          console.log('Login - User role type:', typeof user.role);
          console.log('Login - User role length:', user.role?.length);
          console.log('Login - User role includes spaces:', user.role?.includes(' '));
          
          const normalizedRole = user.role?.toUpperCase?.()?.trim?.() || '';
          console.log('Login - Normalized role:', normalizedRole);
          console.log('Login - Normalized role === ADMIN:', normalizedRole === 'ADMIN');
          console.log('Login - Normalized role === SUPER_ADMIN:', normalizedRole === 'SUPER_ADMIN');
          console.log('Login - Normalized role === EMPLOYEE:', normalizedRole === 'EMPLOYEE');
          
          if (normalizedRole === 'SUPER_ADMIN') {
            console.log('Login - Redirecting SUPER_ADMIN to /super-admin/dashboard');
            navigate('/super-admin/dashboard');
          } else if (normalizedRole === 'ADMIN') {
            console.log('Login - Redirecting ADMIN to /admin/dashboard');
            navigate('/admin/dashboard');
          } else if (normalizedRole === 'EMPLOYEE') {
            console.log('Login - Redirecting EMPLOYEE to /employee/dashboard');
            navigate('/employee/dashboard');
          } else {
            console.log('Login - Redirecting FARMER to /dashboard');
            navigate('/dashboard');
          }
        } catch (profileErr) {
          console.log('Profile fetch failed, trying alternative methods');
          console.log('Profile error:', profileErr);
          
          // Try to get role from login response first
          let role = response.data?.role;
          let forcePasswordChange = response.data?.forcePasswordChange || false;
          
          // For users with temporary passwords, force password change
          if (password.includes('Temp@')) {
            forcePasswordChange = true;
            console.log('Login - Detected temporary password, forcing password change');
          }
          
          // If role is not in login response, try to get it from the backend
          if (!role) {
            try {
              console.log('Login - Trying to get role from /auth/me endpoint');
              const meResponse = await authAPI.getProfile();
              console.log('Login - /auth/me response:', meResponse);
              role = meResponse?.role;
              console.log('Login - Role from /auth/me:', role);
            } catch (meErr) {
              console.log('Login - /auth/me failed:', meErr);
              
              // Try another common endpoint
              try {
                console.log('Login - Trying to get role from /api/auth/users/profile endpoint');
                const altProfileResponse = await authAPI.getProfile();
                console.log('Login - /api/auth/users/profile response:', altProfileResponse);
                role = altProfileResponse?.role;
                console.log('Login - Role from /api/auth/users/profile:', role);
              } catch (altErr) {
                console.log('Login - /api/auth/users/profile failed:', altErr);
              }
            }
          }
          
          // If still no role, try to determine from username or use a default
          if (!role) {
            console.log('Login - No role found, trying to determine from username');
            console.log('Login - Username being checked:', userName);
            // Check if username contains admin indicators
            const lowerUserName = userName.toLowerCase();
            
            // Specific username mapping for known accounts
            const superAdminUsernames = [
              'projecthinfintiy@12.in',
              'superadmin@hinfinity.in'
            ];
            
            const adminUsernames = [
              'karthik.m@hinfinity.in',
              'admin@hinfinity.in'
            ];
            
            const employeeUsernames = [
              'employee@hinfinity.in',
              'emp@hinfinity.in',
              'testemployee@hinfinity.in',
              'hari2912@gmail.com',
              'harish134@gmail.com',
              'employee2@hinfinity.in',
              'test@employee.com'
            ];
            
            console.log('Login - Checking against employee usernames:', employeeUsernames);
            console.log('Login - Username in employee list?', employeeUsernames.includes(userName));
            
            if (superAdminUsernames.includes(userName)) {
              role = 'SUPER_ADMIN';
              console.log('Login - Determined role as SUPER_ADMIN from specific username mapping');
            } else if (adminUsernames.includes(userName)) {
              role = 'ADMIN';
              console.log('Login - Determined role as ADMIN from specific username mapping');
            } else if (employeeUsernames.includes(userName)) {
              role = 'EMPLOYEE';
              console.log('Login - Determined role as EMPLOYEE from specific username mapping');
              console.log('Login - Employee username detected:', userName);
            } else {
              // Default to FARMER for unknown usernames
              role = 'FARMER';
              console.log('Login - Defaulting to FARMER role for unknown username');
            }
          }
          
          const user = {
            userName: userName,
            name: response.data?.name || userName,
            email: response.data?.email || userName,
            role: role,
            forcePasswordChange: forcePasswordChange,
            status: response.data?.status || 'ACTIVE'
          };
          
          console.log('Login - Fallback user data:', user);
          login(user, token);
          
          if (user.forcePasswordChange) {
            console.log('Login - Fallback: Redirecting to change password page');
            navigate('/change-password');
            return;
          }
          
          const normalizedRole = role?.toUpperCase?.()?.trim?.() || '';
          console.log('Login - Fallback: Normalized role:', normalizedRole);
          
          if (normalizedRole === 'SUPER_ADMIN') {
            console.log('Login - Fallback: Redirecting SUPER_ADMIN to /super-admin/dashboard');
            navigate('/super-admin/dashboard');
          } else if (normalizedRole === 'ADMIN') {
            console.log('Login - Fallback: Redirecting ADMIN to /admin/dashboard');
            navigate('/admin/dashboard');
          } else if (normalizedRole === 'EMPLOYEE') {
            console.log('Login - Fallback: Redirecting EMPLOYEE to /employee/dashboard');
            navigate('/employee/dashboard');
          } else {
            console.log('Login - Fallback: Redirecting FARMER to /dashboard');
            navigate('/dashboard');
          }
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      console.error('Login error response:', err.response);
      console.error('Login error message:', err.message);
      setError(`Login failed: ${err.response?.data?.message || err.message || 'Invalid credentials or server error.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = () => {
    if (loginType === 'employee') {
      navigate('/register-employee', { state: { role: 'EMPLOYEE' } });
    } else if (loginType === 'farmer') {
      navigate('/register-farmer', { state: { role: 'FARMER' } });
    } else if (loginType === 'fpo') {
      navigate('/register-fpo', { state: { role: 'FPO' } });
    }
  };

  return (
    <div className="login-page-container minimalist">
      {/* Top Bar */}
      <header className="topbar">
        <div className="topbar-content">
          <div className="topbar-left">
            <img src={logo} alt="DATE Logo" className="topbar-logo" />
            <div className="topbar-date">
              <span className="date-text">{getCurrentDate()}</span>
            </div>
          </div>
          
          {/* Welcome Greeting in Center */}
          <div className="topbar-welcome">
            <h2 className="welcome-header">{welcomeMessage}</h2>
          </div>
          
          <nav className="topbar-menu">
            <button className="topbar-btn" onClick={() => navigate('/')}>Home</button>
            <button className="topbar-btn" onClick={() => navigate('/analytics')}>Dashboard</button>
            <button className="topbar-btn" onClick={() => navigate('/menu')}>Menu</button>
            <button className="topbar-btn" onClick={() => navigate('/about')}>About</button>
          </nav>
        </div>
      </header>
      <div className="auth-wrapper">
        <aside className="agri-highlights" aria-label="Agriculture highlights">
          <h2 className="agri-title">Transforming Indian Agriculture</h2>
          <ul className="agri-list">
            <li>
              <span className="agri-emoji">🌾</span>
              <div>
                <div className="agri-point">140+ million farmers connected</div>
                <div className="agri-sub">Digital access to schemes and services</div>
              </div>
            </li>
            <li>
              <span className="agri-emoji">📡</span>
              <div>
                <div className="agri-point">Precision farming & AI insights</div>
                <div className="agri-sub">Crop monitoring, advisory, alerts</div>
              </div>
            </li>
            <li>
              <span className="agri-emoji">💧</span>
              <div>
                <div className="agri-point">Water & soil intelligence</div>
                <div className="agri-sub">Smart irrigation and resource planning</div>
              </div>
            </li>
            <li>
              <span className="agri-emoji">💰</span>
              <div>
                <div className="agri-point">Direct benefit transfers</div>
                <div className="agri-sub">Faster, transparent financial inclusion</div>
              </div>
            </li>
          </ul>
        </aside>
        <div className="auth-card">
          <div className="auth-brand">
            <img src={logo} alt="DATE Logo" className="auth-logo" />
            <div className="auth-title">Digital Agristack Transaction Enterprises</div>
            <div className="auth-subtitle">Empowering Agricultural Excellence</div>
          </div>

          <div className="auth-tabs">
            <button 
              type="button"
              className={`auth-tab ${loginType === 'official' ? 'active' : ''}`}
              onClick={() => handleLoginType('official')}
            >Official</button>
            <button 
              type="button"
              className={`auth-tab ${loginType === 'fpo' ? 'active' : ''}`}
              onClick={() => handleLoginType('fpo')}
            >FPO</button>
            <button 
              type="button"
              className={`auth-tab ${loginType === 'employee' ? 'active' : ''}`}
              onClick={() => handleLoginType('employee')}
            >Employee</button>
            <button 
              type="button"
              className={`auth-tab ${loginType === 'farmer' ? 'active' : ''}`}
              onClick={() => handleLoginType('farmer')}
            >Farmer</button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
              {/* Username Field */}
              <div className="auth-field">
                <label>Insert Registered Mobile Number as Username</label>
                <input
                  type="text"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Enter username"
                />
              </div>

              {/* Password Field */}
              <div className="auth-field">
                <label>Enter password</label>
                <div className="auth-password">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    👁️
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="auth-links">
                <a href="/forgot-password">Forgot Password?</a>
                <span className="sep">|</span>
                <a href="/forgot-userid">Forgot User ID?</a>
              </div>

              {/* Captcha Section */}
              <div className="auth-captcha">
                <label>Captcha</label>
                <div className="auth-captcha-row">
                  <div className="auth-captcha-badge">
                    <span>{captchaValue}</span>
                  </div>
                  <button type="button" className="auth-refresh" onClick={handleRefreshCaptcha}>
                    🔄
                  </button>
                  <input
                    type="text"
                    value={captcha}
                    onChange={e => setCaptcha(e.target.value)}
                    placeholder="Enter Captcha"
                    className="auth-captcha-input"
                  />
                </div>
              </div>

              {error && <div className="auth-error">{error}</div>}
              
              <div className="auth-actions">
                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? 'Logging in...' : 'Log In'}
                </button>
                {(loginType === 'employee' || loginType === 'farmer' || loginType === 'fpo') && (
                  <button
                    type="button"
                    className="auth-secondary"
                    onClick={handleCreateAccount}
                  >
                    Create New user Acount
                  </button>
                )}
              </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 