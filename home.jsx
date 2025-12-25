import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { 
  ArrowRight, Activity, Cpu, Globe, Smartphone, 
  User, Users, Heart, ShieldCheck, 
  Baby, Dumbbell, GraduationCap, Briefcase, Lock,
  Dna, MessageSquare, BrainCircuit, FileText 
} from 'lucide-react'; 

// Components
import Nav from './test.jsx'; 
import Chat from "./chat.jsx";
// import Footer from "./footer.jsx"; // REMOVED per instruction

// Styles
import './homecss.css';

// --- PLACEHOLDER FOR LOGO (Update this path to your actual logo) ---
const logo = "https://via.placeholder.com/150"; 

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
                    style={{ transform: `translateY(-${index * 1.1}em)` }} 
                  >
                    {words.map((word) => (
                      <span key={word} className="scrolling-word">{word}</span>
                    ))}
                  </div>
                </div>
              </div>
            </h1>

            <div className="hero-checklist">
               <div className="check-item">✓ Analyze your symptoms</div>
               <div className="check-item">✓ Understand your health</div>
               <div className="check-item">✓ Get ready for your visit</div>
            </div>

            <div className="hero-actions">
              <Link to="/sampleanalysis" className="btn btn-secondary">
                Sample Analysis
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
      
     {/* --- INLINE FOOTER START --- */}
<footer className="site-footer">
  <div className="footer-wrapper">
    
    <div className="footer-primary-content">
      {/* Brand Section */}
      <div className="footer-identity">
        {/* UPDATED CLASS: footer-brand-logo */}
        <img src={logo} alt="Sympto Logo" className="footer-brand-logo" />
        <p>Empowering you with health insights.</p>
      </div>

      {/* Links Group 1 */}
      <div className="footer-nav-column">
        <h4>Company</h4>
        <ul>
          <li><a href="/about">About Us</a></li>
          <li><a href="/contact">Contact Support</a></li>
          <li><a href="/careers">Careers</a></li>
        </ul>
      </div>

      {/* Links Group 2 */}
      <div className="footer-nav-column">
        <h4>Legal</h4>
        <ul>
          <li><a href="/privacy">Privacy Policy</a></li>
          <li><a href="/terms">Terms of Service</a></li>
          <li><a href="/cookie-policy">Cookie Policy</a></li>
        </ul>
      </div>
    </div>

    {/* Disclaimer Section */}
    <div className="footer-notice-box">
      {/* UPDATED: Icon Span class */}
      <span className="notice-icon">!</span>
      <p>
        <strong>IMPORTANT:</strong> This application is for informational purposes only 
        and is not a substitute for professional medical advice, diagnosis, or treatment. 
        Always seek the advice of your physician or other qualified health provider with 
        any questions you may have regarding a medical condition. If you think you may 
        have a medical emergency, call your doctor or emergency services immediately.
      </p>
    </div>

    {/* Bottom Copyright Section */}
    <div className="footer-copyright">
      <p>&copy; {currentYear} Sympto.in All rights reserved.</p>
    </div>
    
  </div>
</footer>
{/* --- INLINE FOOTER END --- */}
      <Chat /> 

    </div>
  );
};

export default Home;