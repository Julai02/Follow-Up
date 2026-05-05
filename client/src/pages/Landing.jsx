import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Landing.css';

const Landing = () => {
  return (
    <div className="landing-container">
      {/* Header Navigation */}
      <header className="landing-header">
        <div className="header-content">
          <div className="logo">
            <h1>📚 Follow-Up</h1>
          </div>
          <nav className="nav-links">
            <a href="#about">About</a>
            <a href="#cbc">CBC & Quality</a>
            <a href="#sdg">SDG Impact</a>
            <a href="#features">Features</a>
            <Link to="/login" className="login-btn">Login</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Bridging Education & Community</h1>
          <p>Follow-Up connects teachers, parents, and students to improve learning outcomes through real-time communication and academic excellence.</p>
          <div className="hero-buttons">
            <Link to="/login" className="btn btn-primary">Get Started</Link>
            <a href="#about" className="btn btn-secondary">Learn More</a>
          </div>
        </div>
        <div className="hero-image">
          <div className="illustration">📊</div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="container">
          <h2>About Follow-Up</h2>
          <div className="about-content">
            <div className="about-text">
              <p>
                Follow-Up is a comprehensive educational communication platform designed specifically for Kenyan schools
                implementing the Competency-Based Curriculum (CBC). Our mission is to strengthen the partnership between
                teachers, parents, and students to ensure every child reaches their full potential.
              </p>
              <p>
                In today's education landscape, effective communication is critical. Follow-Up provides a secure, user-friendly
                space where:
              </p>
              <ul>
                <li><strong>Teachers</strong> can share assignments, progress updates, and grade space announcements</li>
                <li><strong>Parents</strong> can stay informed about their child's academic journey and communicate with teachers</li>
                <li><strong>Students</strong> receive feedback and stay engaged with their learning</li>
                <li><strong>Administrators</strong> can manage school operations and onboard faculty efficiently</li>
              </ul>
            </div>
            <div className="about-stats">
              <div className="stat-card">
                <div className="stat-number">100%</div>
                <div className="stat-label">Free & Accessible</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Communication</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">Real-time</div>
                <div className="stat-label">Updates</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CBC Alignment Section */}
      <section id="cbc" className="cbc-section">
        <div className="container">
          <h2>Aligning with CBC for Quality Education</h2>
          <div className="cbc-content">
            <p>
              The Competency-Based Curriculum (CBC) emphasizes the development of competencies in learners. Follow-Up supports
              this vision by enabling educators to:
            </p>
            <div className="cbc-features">
              <div className="feature-card">
                <div className="feature-icon">🎯</div>
                <h3>Competency Tracking</h3>
                <p>Monitor student progress across different competency areas and provide targeted feedback for improvement.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📈</div>
                <h3>Holistic Assessment</h3>
                <p>Record detailed academic performance data using Kenya's 1-100 grading scale to evaluate student growth.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">👨‍👩‍👧‍👦</div>
                <h3>Parent Engagement</h3>
                <p>Keep parents actively involved in their child's learning journey through transparent communication.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🤝</div>
                <h3>Collaborative Learning</h3>
                <p>Facilitate teacher collaboration and peer learning through grade-specific communication spaces.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SDG Impact Section */}
      <section id="sdg" className="sdg-section">
        <div className="container">
          <h2>Contributing to Sustainable Development Goals</h2>
          <p className="section-subtitle">Follow-Up aligns with the United Nations' SDGs to improve education quality and ensure inclusive learning.</p>
          <div className="sdg-grid">
            <div className="sdg-card">
              <div className="sdg-number">4</div>
              <h3>Quality Education</h3>
              <p>
                By improving communication between educators and families, Follow-Up directly supports SDG 4: ensuring inclusive
                and equitable quality education for all children.
              </p>
            </div>
            <div className="sdg-card">
              <div className="sdg-number">5</div>
              <h3>Gender Equality</h3>
              <p>
                Our platform promotes equal educational opportunities for all students regardless of gender, supporting SDG 5
                by ensuring no child is left behind.
              </p>
            </div>
            <div className="sdg-card">
              <div className="sdg-number">10</div>
              <h3>Reduced Inequalities</h3>
              <p>
                Follow-Up is accessible to all, bridging the digital divide and ensuring every school, community, and family
                can benefit from quality educational tools.
              </p>
            </div>
            <div className="sdg-card">
              <div className="sdg-number">17</div>
              <h3>Partnerships</h3>
              <p>
                We foster partnerships between schools, teachers, parents, and communities to create a collaborative ecosystem
                for educational excellence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <h2>Key Features</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon-large">💬</div>
              <h3>Real-time Messaging</h3>
              <p>Instant communication between teachers and parents with typing indicators and message notifications.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon-large">📊</div>
              <h3>Academic Reports</h3>
              <p>Download term reports with detailed student performance data organized by academic terms.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon-large">📢</div>
              <h3>Grade Spaces</h3>
              <p>Dedicated communication spaces for each grade where teachers share updates and parents engage.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon-large">👤</div>
              <h3>Profile Management</h3>
              <p>Personalized profiles with pictures, secure password management, and detailed information display.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon-large">📱</div>
              <h3>Mobile Optimized</h3>
              <p>Fully responsive design that works seamlessly on smartphones, tablets, and desktops.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon-large">🔐</div>
              <h3>Secure & Private</h3>
              <p>Enterprise-grade security to protect student data and ensure privacy for all users.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Improve Your School's Communication?</h2>
          <p>Join hundreds of schools transforming education through better communication and engagement.</p>
          <Link to="/login" className="btn btn-large">Login to Follow-Up</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>About Follow-Up</h4>
            <p>An educational platform designed for Kenyan schools to improve communication and learning outcomes.</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#about">About</a></li>
              <li><a href="#cbc">CBC</a></li>
              <li><a href="#sdg">SDG</a></li>
              <li><Link to="/login">Login</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>Email: info@followup.co.ke</p>
            <p>Phone: +254 (0) 723 456 789</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Follow-Up. All rights reserved. | Empowering Education in Kenya</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
