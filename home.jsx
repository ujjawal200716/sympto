import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { 
  ArrowRight, Activity, Cpu, Globe, Smartphone, 
  User, Users, Heart, ShieldCheck, 
  Baby, Dumbbell, GraduationCap, Briefcase, Lock,
  Dna, MessageSquare, BrainCircuit, FileText 
} from 'lucide-react'; 
import logoLight from './logo.png';
import logoDark from './logodark.png';
// Components
import Nav from './test.jsx'; 
import Chat from "./chat.jsx";

// Styles
import './homecss.css';

// --- MODAL CONTENT DATA ---
const modalData = {
  about: {
    title: "About Sympto",
    content: (
      <>
        <p><strong>Bridging the gap between symptoms and clarity.</strong></p>
        <p>At Sympto, we believe everyone deserves access to clear, understandable health information. Our AI-driven platform helps users track symptoms and understand potential health patterns before they visit a doctor.</p>
        <h3>Our Mission</h3>
        <p>To empower individuals to take control of their health data securely and efficiently.</p>
      </>
    )
  },
  contact: {
    title: "Contact Support",
    content: (
      <>
        <p>Have questions about the app? We're here to help.</p>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
          <li><strong>Email:</strong> support@sympto.in</li>
          <li><strong>Phone:</strong> +91 000 000 0000</li>
          <li><strong>HQ:</strong> Thane, Maharashtra, India</li>
        </ul>
        <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>Support hours: Mon-Fri, 9am - 6pm IST.</p>
      </>
    )
  },
  careers: {
    title: "Join the Team",
    content: (
      <>
        <p>We are looking for passionate individuals to help us revolutionize personal health tracking.</p>
        <h3>Open Positions</h3>
        <ul>
          <li>Frontend Developer (React) - Remote</li>
          <li>Medical Data Analyst - Thane</li>
        </ul>
        <p>Send your CV to <strong>jobs@sympto.in</strong></p>
      </>
    )
  },
  privacy: {
    title: "Privacy Policy",
    content: (
      <>
        <p>Last Updated: December 2025</p>
        <h3>1. Data Collection</h3>
        <p>We collect data you provide directly to us, such as when you create an account. We DO NOT share your personal health data with third-party advertisers.</p>
        <h3>2. Security</h3>
        <p>We use industry-standard encryption to protect your medical insights.</p>
      </>
    )
  },
  terms: {
    title: "Terms of Service",
    content: (
      <>
        <p>By accessing Sympto.in, you agree to be bound by these Terms.</p>
        <h3>Medical Disclaimer</h3>
        <p>Sympto is <strong>not</strong> a medical device. The content provided is for informational purposes only. Always consult a doctor for medical advice.</p>
      </>
    )
  },
  cookies: {
    title: "Cookie Policy",
    content: (
      <>
        <p>We use cookies to ensure you get the best experience on our website.</p>
        <ul>
          <li><strong>Essential Cookies:</strong> Required for login sessions.</li>
          <li><strong>Analytics:</strong> Used to improve our features.</li>
        </ul>
      </>
    )
  }
};

const words = ["Men", "Women", "Adults", "Parents", "Seniors", "You"];
 
// --- PROFILE DATA ---
const profiles = [
  { id: 1, label: "Parents", tagline: " pediatric triage 24/7", icon: <Users size={32} /> },
  { id: 2, label: "Seniors", tagline: "Monitor chronic risks", icon: <Heart size={32} /> },
  { id: 3, label: "Adults", tagline: "General health checks", icon: <User size={32} /> },
  { id: 4, label: "Doctors", tagline: "Clinical decision support", icon: <Activity size={32} /> },
  { id: 5, label: "Children", tagline: "Symptom tracking", icon: <Baby size={32} /> },
  { id: 6, label: "Athletes", tagline: "Recovery & injury", icon: <Dumbbell size={32} /> },
  { id: 7, label: "Students", tagline: "Mental & physical aid", icon: <GraduationCap size={32} /> },
  { id: 8, label: "Workers", tagline: "Occupational health", icon: <Briefcase size={32} /> },
];

// --- FEATURES DATA ---
const futureFeatures = [
  {
    title: "AI & Machine Learning",
    desc: "Sophisticated AI analyzes massive datasets to uncover intricate patterns and predict health outcomes.",
    icon: <Cpu size={32} />
  },
  {
    title: "Wearables & IoT",
    desc: "Continuous, real-time tracking of vital signs outside clinical settings empowers patient self-management.",
    icon: <Activity size={32} />
  },
  {
    title: "Telehealth Evolution",
    desc: "Dismantling geographical barriers to access, enabling effective remote monitoring and virtual care.",
    icon: <Smartphone size={32} />
  },
  {
    title: "Big Data Interoperability",
    desc: "Seamlessly storing and securely sharing patient information across disparate medical systems.",
    icon: <Globe size={32} />
  },
  {
    title: "End-to-End Security",
    desc: "State-of-the-art encryption ensures your personal health data remains private and compliant.",
    icon: <Lock size={32} />
  },
  {
    title: "Genetic Insights",
    desc: "Integrating genomic data to provide hyper-personalized risk assessments and preventative care plans.",
    icon: <Dna size={32} />
  }
];

const Home = () => {
  const [index, setIndex] = useState(0);
  
  // --- MODAL STATE ---
  const [activeModal, setActiveModal] = useState(null);
  const closeModal = () => setActiveModal(null);

  // Get current year for footer
  const currentYear = new Date().getFullYear();

  // Rotating Text Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % words.length);
        }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-container">
      <Nav />

      {/* --- HERO SECTION --- */}
      <section className="hero-section">
        <div className="hero-bg-gradient"></div>

        <div className="hero-content">
          <div className="hero-text-wrapper">
            <h1>
              <span className="hero-pre-title">Hi, I'm Sympto.</span>
              <div className="hero-main-title">
                <span>Your AI Health Companion for&nbsp;</span>
                <div className="scrolling-words-container">
                  <div 
                    className="scrolling-words-wrapper"
                    style={{ transform: `translateY(-${index * 1.12}em)` }} 
                  >
                    {words.map((word) => (
                      <span key={word} className="scrolling-word">{word}</span>
                    ))}
                  </div>
                </div>
              </div>
            </h1>

            <div className="hero-checklist">
               <div className="check-item"> Analyze your symptoms</div>
               <div className="check-item"> Understand your health</div>
               <div className="check-item"> Get ready for your visit</div>
               <div className="check-item">Plan your next steps</div>
            </div>

            <div className="hero-actions">
              <Link to="/sampleanalysis" className="btn btn-secondary">
                Simple Analysis
              </Link>
              <Link to="/advancedanalysis" className="btn btn-primary">
                Start Advanced Check <ArrowRight size={18} style={{marginLeft: '8px'}}/>
              </Link>
            </div>
          </div>

          <div className="hero-visual hide-on-mobile">
            <div className="floating-card card-1">
                <ShieldCheck size={40} color="#2563eb" />
                <p>Secure</p>
            </div>
            <div className="floating-card card-2">
                <Activity size={40} color="#ec4899" />
                <p>Fast Analysis</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS SECTION --- */}
      <section className="info-section">
        <div className="container">
          <div className="info-grid">
            <div className="info-visual hide-on-mobile">
               <div className="big-icon-circle">
                 <Cpu size={80} color="white" />
                 <div className="orbit-dot"></div>
               </div>
            </div>
            
            <div className="info-text">
              <h2 className="section-header">How Sympto Works</h2>
              <p className="lead-text">
                Sympto combines medical knowledge with advanced AI to guide you through a smart assessment.
              </p>
              <div className="steps-list">
                <div className="step-card">
                    <div className="step-icon-box">
                      <MessageSquare size={24} />
                    </div>
                    <div className="step-content">
                      <h4>Describe Symptoms</h4>
                      <p>Enter your symptoms in plain language, just like chatting with a friend.</p>
                    </div>
                </div>
                <div className="step-card">
                    <div className="step-icon-box box-blue">
                      <BrainCircuit size={24} />
                    </div>
                    <div className="step-content">
                      <h4>AI Analysis</h4>
                      <p>Our AI engine asks adaptive follow-up questions to gather clinical details.</p>
                    </div>
                </div>
                <div className="step-card">
                    <div className="step-icon-box box-purple">
                      <FileText size={24} />
                    </div>
                    <div className="step-content">
                      <h4>Get Report</h4>
                      <p>Receive a risk assessment and clear advice on what to do next.</p>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CAROUSEL SECTION --- */}
     <section className="carousel-section">
      <h2 className="section-title">Healthcare for Everyone</h2>
      <div className="carousel-wrapper">
        <div className="carousel-track">
          {[...profiles, ...profiles].map((profile, idx) => (
            <div key={`${profile.id}-${idx}`} className="carousel-card">
              <div className="profile-icon-box">{profile.icon}</div>
              <h3>{profile.label}</h3>
              <p className="profile-tagline">{profile.tagline}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

      {/* --- FUTURE SECTION --- */}
      <section className="future-section">
        <div className="container">
          <div className="section-intro">
              <h2>The Future of Health Assessment</h2>
              <p>We are shifting the paradigm toward systems that are preventative, personalized, and proactive.</p>
          </div>
          
          <div className="features-grid">
            {futureFeatures.map((feature, i) => (
                <div className="feature-card" key={i}>
                    <div className="feature-icon">{feature.icon}</div>
                    <h3>{feature.title}</h3>
                    <p>{feature.desc}</p>
                </div>
            ))}
          </div>
          
          <div className="cta-banner">
              <h3>Ready to check your symptoms?</h3>
              <div className="bottom-links">
                 <Link to="/sampleanalysis" className="link-text">Simple Analysis</Link>
                 <Link to="/advancedanalysis" className="link-text highlight">Advanced Analysis</Link>
              </div>
          </div>
        </div>
      </section>
      
      {/* --- POPUP ENABLED FOOTER --- */}
      <footer className="site-footer">
        <div className="footer-wrapper">
          
         <div className="footer-primary-content">
            {/* Brand Section - UPDATED FOR DUAL LOGOS */}
            <div className="footer-identity">
               {/* Both logos are rendered, CSS handles the toggling */}
               <img src={logoLight} alt="Sympto Logo" className="footer-brand-logo logo-light" />
               <img src={logoDark} alt="Sympto Logo" className="footer-brand-logo logo-dark" />
               
              
            </div>
            {/* Links Group 1 - Now using buttons for Popups */}
            <div className="footer-nav-column">
              <h4>Company</h4>
              <ul>
                <li><button onClick={() => setActiveModal('about')}>About Us</button></li>
                <li><button onClick={() => setActiveModal('contact')}>Contact Support</button></li>
                <li><button onClick={() => setActiveModal('careers')}>Careers</button></li>
              </ul>
            </div>

            {/* Links Group 2 - Now using buttons for Popups */}
            <div className="footer-nav-column">
              <h4>Legal</h4>
              <ul>
                <li><button onClick={() => setActiveModal('privacy')}>Privacy Policy</button></li>
                <li><button onClick={() => setActiveModal('terms')}>Terms of Service</button></li>
                <li><button onClick={() => setActiveModal('cookies')}>Cookie Policy</button></li>
              </ul>
            </div>
          </div>

          {/* Disclaimer Section */}
          <div className="footer-notice-box">
            <span className="notice-icon">!</span>
            <p>
              <strong>IMPORTANT:</strong> This application is for informational purposes only 
              and is not a substitute for professional medical advice, diagnosis, or treatment. 
              Always seek the advice of your physician or other qualified health provider with 
              any questions you may have regarding a medical condition.
            </p>
          </div>

          {/* Bottom Copyright Section */}
          <div className="footer-copyright">
            <p>&copy; {currentYear} Sympto.in All rights reserved.</p>
          </div>
          
        </div>
      </footer>

      {/* --- MODAL / POPUP COMPONENT --- */}
      {activeModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalData[activeModal].title}</h2>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              {modalData[activeModal].content}
            </div>
          </div>
        </div>
      )}

      <Chat /> 

    </div>
  );
};

export default Home;