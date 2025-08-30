import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AboutScreen.css';

const AboutScreen = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll('.animate-on-scroll');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const coreValues = [
    {
      icon: '🚀',
      title: 'Innovation in Agriculture',
      description: 'Leveraging cutting-edge technology to revolutionize farming practices and increase productivity.',
      color: '#22c55e',
      bgColor: 'rgba(147, 197, 253, 0.3)',
      borderColor: 'rgba(147, 197, 253, 0.4)'
    },
    {
      icon: '👨‍🌾',
      title: 'Farmer-Centric Solutions',
      description: 'Designing solutions that prioritize the needs and challenges of Indian farmers.',
      color: '#16a34a',
      bgColor: 'rgba(168, 85, 247, 0.3)',
      borderColor: 'rgba(168, 85, 247, 0.4)'
    },
    {
      icon: '🌱',
      title: 'Sustainability & Climate-Smart Farming',
      description: 'Promoting eco-friendly practices and climate-resilient agricultural methods.',
      color: '#84cc16',
      bgColor: 'rgba(34, 197, 94, 0.3)',
      borderColor: 'rgba(34, 197, 94, 0.4)'
    },
    {
      icon: '💰',
      title: 'Financial Inclusion',
      description: 'Ensuring every farmer has access to digital payments and financial services.',
      color: '#f59e0b',
      bgColor: 'rgba(251, 191, 36, 0.3)',
      borderColor: 'rgba(251, 191, 36, 0.4)'
    }
  ];

  const timeline = [
    {
      year: '2020',
      title: 'Project Inception',
      description: 'DATE Agri Stack was conceptualized as a comprehensive digital platform for Indian agriculture.',
      icon: '🌱',
      bgColor: 'rgba(147, 197, 253, 0.3)',
      borderColor: 'rgba(147, 197, 253, 0.4)',
      iconBg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
    },
    {
      year: '2021',
      title: 'Pilot Launch',
      description: 'Successfully launched pilot programs in select districts with 10,000+ farmers.',
      icon: '🚀',
      bgColor: 'rgba(168, 85, 247, 0.3)',
      borderColor: 'rgba(168, 85, 247, 0.4)',
      iconBg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
    },
    {
      year: '2022',
      title: 'National Expansion',
      description: 'Expanded to 25+ states with 1 million+ registered farmers.',
      icon: '📈',
      bgColor: 'rgba(34, 197, 94, 0.3)',
      borderColor: 'rgba(34, 197, 94, 0.4)',
      iconBg: 'linear-gradient(135deg, #22c55e, #16a34a)'
    },
    {
      year: '2023',
      title: 'Advanced Features',
      description: 'Introduced AI-powered crop monitoring and precision agriculture tools.',
      icon: '🤖',
      bgColor: 'rgba(251, 191, 36, 0.3)',
      borderColor: 'rgba(251, 191, 36, 0.4)',
      iconBg: 'linear-gradient(135deg, #f59e0b, #d97706)'
    },
    {
      year: '2024',
      title: 'Future Vision',
      description: 'Aiming to connect 140+ million farmers with comprehensive digital solutions.',
      icon: '🎯',
      bgColor: 'rgba(239, 68, 68, 0.3)',
      borderColor: 'rgba(239, 68, 68, 0.4)',
      iconBg: 'linear-gradient(135deg, #ef4444, #dc2626)'
    }
  ];

  const partners = [
    { 
      name: 'Ministry of Agriculture', 
      logo: '🏛️',
      bgColor: 'rgba(147, 197, 253, 0.3)',
      borderColor: 'rgba(147, 197, 253, 0.4)',
      iconBg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
    },
    { 
      name: 'NITI Aayog', 
      logo: '📋',
      bgColor: 'rgba(168, 85, 247, 0.3)',
      borderColor: 'rgba(168, 85, 247, 0.4)',
      iconBg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
    },
    { 
      name: 'State Governments', 
      logo: '🏛️',
      bgColor: 'rgba(34, 197, 94, 0.3)',
      borderColor: 'rgba(34, 197, 94, 0.4)',
      iconBg: 'linear-gradient(135deg, #22c55e, #16a34a)'
    },
    { 
      name: 'Agricultural Universities', 
      logo: '🎓',
      bgColor: 'rgba(251, 191, 36, 0.3)',
      borderColor: 'rgba(251, 191, 36, 0.4)',
      iconBg: 'linear-gradient(135deg, #f59e0b, #d97706)'
    },
    { 
      name: 'Technology Partners', 
      logo: '💻',
      bgColor: 'rgba(239, 68, 68, 0.3)',
      borderColor: 'rgba(239, 68, 68, 0.4)',
      iconBg: 'linear-gradient(135deg, #ef4444, #dc2626)'
    },
    { 
      name: 'Financial Institutions', 
      logo: '🏦',
      bgColor: 'rgba(6, 182, 212, 0.3)',
      borderColor: 'rgba(6, 182, 212, 0.4)',
      iconBg: 'linear-gradient(135deg, #06b6d4, #0891b2)'
    }
  ];

  return (
    <div className={`about-screen ${isVisible ? 'visible' : ''}`}>
      {/* Background with animated elements */}
      <div className="about-background">
        <div className="floating-elements">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="floating-element" style={{ '--delay': `${i * 0.3}s` }}>
              {['🌾', '🌱', '🍃', '🌿', '🌺'][i % 5]}
            </div>
          ))}
        </div>
      </div>

                    {/* Header */}
        <div className="about-header">
          <div className="about-header-content">
            <div className="about-header-left">
              <div className="about-header-logo">
                <span>🌾</span>
                <span>DATE Agri Stack</span>
              </div>
            </div>
            <div className="about-header-center">
              <h2 className="welcome-header">Empowering Indian Agriculture Today!</h2>
            </div>
            <div className="about-header-right">
              <nav className="about-header-menu">
                <button className="about-header-btn" onClick={() => navigate('/login')}>Home</button>
                <button className="about-header-btn" onClick={() => navigate('/analytics')}>Dashboard</button>
                <button className="about-header-btn" onClick={() => navigate('/menu')}>Menu</button>
                <button className="about-header-btn active">About</button>
              </nav>
            </div>
          </div>
        </div>

      {/* Hero Section */}
      <section className="hero-section animate-on-scroll">
        <div className="about-hero-content">
          <div className="hero-badge">
            <span className="badge-icon">🌾</span>
            <span className="badge-text">Empowering Agriculture</span>
          </div>
          <h1 className="hero-title">About DATE Agri Stack</h1>
          <p className="hero-subtitle">
            Empowering Agriculture Through Technology
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">140M+</span>
              <span className="stat-label">Farmers</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">25+</span>
              <span className="stat-label">States</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">100%</span>
              <span className="stat-label">Digital</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="mission-section animate-on-scroll">
        <div className="container">
          <div className="mission-content">
            <div className="mission-icon">🎯</div>
            <h2 className="section-title">Our Mission</h2>
            <p className="mission-text">
              Our mission is to connect 140+ million farmers with cutting-edge digital solutions 
              for sustainable farming, ensuring food security and economic prosperity for India's 
              agricultural community.
            </p>
            <div className="mission-highlights">
              <div className="highlight-item">
                <span className="highlight-icon">🌍</span>
                <span className="highlight-text">National Impact</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">💡</span>
                <span className="highlight-text">Innovation Driven</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🤝</span>
                <span className="highlight-text">Farmer First</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="values-section animate-on-scroll">
        <div className="container">
          <h2 className="section-title">Core Values</h2>
          <div className="values-grid">
            {coreValues.map((value, index) => (
              <div 
                key={index}
                className="value-card"
                style={{ 
                  '--delay': `${index * 0.2}s`,
                  background: value.bgColor,
                  borderColor: value.borderColor
                }}
              >
                <div className="value-icon" style={{ backgroundColor: value.color }}>
                  <span>{value.icon}</span>
                </div>
                <h3 className="value-title">{value.title}</h3>
                <p className="value-description">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="timeline-section animate-on-scroll">
        <div className="container">
          <h2 className="section-title">Our Journey</h2>
          <div className="timeline">
            {timeline.map((item, index) => (
              <div 
                key={index}
                className={`timeline-item ${index % 2 === 0 ? 'left' : 'right'}`}
                style={{ '--delay': `${index * 0.3}s` }}
              >
                <div 
                  className="timeline-content"
                  style={{
                    background: item.bgColor,
                    borderColor: item.borderColor
                  }}
                >
                  <div 
                    className="timeline-icon"
                    style={{ background: item.iconBg }}
                  >
                    <span>{item.icon}</span>
                  </div>
                  <div className="timeline-info">
                    <div className="timeline-year">{item.year}</div>
                    <h3 className="timeline-title">{item.title}</h3>
                    <p className="timeline-description">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="partners-section animate-on-scroll">
        <div className="container">
          <h2 className="section-title">Our Partners</h2>
          <p className="partners-subtitle">
            Working together with government bodies, institutions, and technology partners 
            to transform Indian agriculture.
          </p>
          <div className="partners-grid">
            {partners.map((partner, index) => (
              <div 
                key={index}
                className="partner-card"
                style={{ 
                  '--delay': `${index * 0.1}s`,
                  background: partner.bgColor,
                  borderColor: partner.borderColor
                }}
              >
                <div 
                  className="partner-logo"
                  style={{ background: partner.iconBg }}
                >
                  <span>{partner.logo}</span>
                </div>
                <h3 className="partner-name">{partner.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section animate-on-scroll">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Join the Agricultural Revolution</h2>
            <p className="cta-text">
              Be part of India's digital agricultural transformation. 
              Together, we can build a sustainable and prosperous future for farming.
            </p>
            <div className="cta-buttons">
              <button 
                className="cta-btn primary"
                onClick={() => navigate('/farmer/registration')}
              >
                <span>Register Now</span>
                <span>→</span>
              </button>
              <button 
                className="cta-btn secondary"
                onClick={() => navigate('/analytics')}
              >
                <span>View Analytics</span>
                <span>📊</span>
              </button>
              <button 
                className="cta-btn secondary"
                onClick={() => navigate('/login')}
              >
                <span>Back to Login</span>
                <span>🔑</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="about-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <span className="footer-icon">🌾</span>
              <span className="footer-text">DATE Agri Stack</span>
            </div>
            <p className="footer-description">
              Empowering Indian Agriculture Through Digital Innovation
            </p>
            <div className="footer-links">
              <span>© 2024 DATE Agri Stack</span>
              <span>•</span>
              <span>Government of India Initiative</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutScreen;
