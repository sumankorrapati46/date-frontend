import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HomeScreen.css';

const HomeScreen = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getCurrentDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCurrentTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const features = [
    {
      icon: '🌾',
      title: 'Crop Management',
      description: 'Advanced tools for monitoring and managing agricultural crops with precision.',
      color: '#22c55e'
    },
    {
      icon: '🌱',
      title: 'Smart Farming',
      description: 'IoT-based solutions for intelligent farming practices and automation.',
      color: '#16a34a'
    },
    {
      icon: '📊',
      title: 'Analytics Dashboard',
      description: 'Comprehensive data analysis and insights for better decision making.',
      color: '#15803d'
    },
    {
      icon: '🤝',
      title: 'Community Support',
      description: 'Connect with fellow farmers and agricultural experts worldwide.',
      color: '#14532d'
    }
  ];

  const stats = [
    { number: '50K+', label: 'Farmers', icon: '👨‍🌾' },
    { number: '100K+', label: 'Acres', icon: '🌍' },
    { number: '95%', label: 'Success Rate', icon: '📈' },
    { number: '24/7', label: 'Support', icon: '🛟' }
  ];

  return (
    <div className={`home-screen ${isVisible ? 'visible' : ''}`}>
      {/* Animated Background */}
      <div className="home-background">
        <div className="floating-elements">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="floating-element"
              style={{
                '--delay': `${i * 0.5}s`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
            >
              {['🌾', '🌱', '🌿', '🍃', '🌺', '🌸', '🌼', '🌻'][i % 8]}
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="home-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-logo">
              <span>🌾</span>
              <span>DATE Agri Stack</span>
            </div>
          </div>
          <div className="header-center">
            <h1 className="welcome-header">Welcome to Smart Agriculture</h1>
          </div>
          <div className="header-right">
            <div className="header-calendar">
              <span className="calendar-icon">📅</span>
              <div className="calendar-info">
                <div className="calendar-date">{getCurrentDate()}</div>
                <div className="calendar-time">{getCurrentTime()}</div>
              </div>
            </div>
            <nav className="header-menu">
              <button className="header-btn active" onClick={() => navigate('/')}>Home</button>
              <button className="header-btn" onClick={() => navigate('/analytics')}>Dashboard</button>
              <button className="header-btn" onClick={() => navigate('/menu')}>Menu</button>
              <button className="header-btn" onClick={() => navigate('/about')}>About</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span>🌱</span>
              <span>Empowering Agriculture</span>
            </div>
            <h1 className="hero-title">
              Cultivating the Future of
              <span className="highlight"> Smart Agriculture</span>
            </h1>
            <p className="hero-subtitle">
              Join thousands of farmers in revolutionizing agriculture with cutting-edge technology, 
              data-driven insights, and sustainable farming practices.
            </p>
            <div className="hero-stats">
              {stats.map((stat, index) => (
                <div key={index} className="stat-item" style={{ '--delay': `${index * 0.2}s` }}>
                  <span className="stat-icon">{stat.icon}</span>
                  <span className="stat-number">{stat.number}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
            <div className="hero-buttons">
              <button 
                className="hero-btn primary"
                onClick={() => navigate('/farmer/registration')}
              >
                <span>Start Farming Smart</span>
                <span>→</span>
              </button>
              <button 
                className="hero-btn secondary"
                onClick={() => navigate('/analytics')}
              >
                <span>View Analytics</span>
                <span>📊</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose DATE Agri Stack?</h2>
            <p className="section-subtitle">
              Experience the perfect blend of traditional farming wisdom and modern technology
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="feature-card"
                style={{ 
                  '--delay': `${index * 0.2}s`,
                  '--color': feature.color 
                }}
              >
                <div className="feature-icon" style={{ backgroundColor: feature.color }}>
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <div className="feature-glow"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Peaceful Nature Section */}
      <section className="nature-section">
        <div className="container">
          <div className="nature-content">
            <div className="nature-text">
              <h2 className="nature-title">Find Peace in Agriculture</h2>
              <p className="nature-description">
                Agriculture is not just about growing crops; it's about nurturing life, 
                connecting with nature, and finding harmony in the rhythm of seasons. 
                Our platform helps you achieve this balance with technology that respects 
                the natural world.
              </p>
              <div className="nature-highlights">
                <div className="highlight-item">
                  <span className="highlight-icon">🌅</span>
                  <span>Sunrise to Sunset Monitoring</span>
                </div>
                <div className="highlight-item">
                  <span className="highlight-icon">🌧️</span>
                  <span>Weather-Responsive Systems</span>
                </div>
                <div className="highlight-item">
                  <span className="highlight-icon">🦋</span>
                  <span>Biodiversity Protection</span>
                </div>
              </div>
            </div>
            <div className="nature-visual">
              <div className="nature-scene">
                <div className="scene-element sun">☀️</div>
                <div className="scene-element cloud">☁️</div>
                <div className="scene-element tree">🌳</div>
                <div className="scene-element flower">🌸</div>
                <div className="scene-element bird">🦅</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Transform Your Farming?</h2>
            <p className="cta-text">
              Join the agricultural revolution and experience the perfect harmony of 
              technology and nature. Start your journey today.
            </p>
            <div className="cta-buttons">
              <button 
                className="cta-btn primary"
                onClick={() => navigate('/farmer/registration')}
              >
                <span>Begin Your Journey</span>
                <span>🌱</span>
              </button>
              <button 
                className="cta-btn secondary"
                onClick={() => navigate('/about')}
              >
                <span>Learn More</span>
                <span>📖</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <span className="footer-icon">🌾</span>
              <span className="footer-text">DATE Agri Stack</span>
            </div>
            <p className="footer-description">
              Empowering farmers with technology, one harvest at a time.
            </p>
            <div className="footer-links">
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
              <span>•</span>
              <span>Contact Us</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomeScreen;
