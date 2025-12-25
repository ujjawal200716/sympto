import React, { useState } from 'react';
import { 
  Shield, Users, Zap, AlertCircle, CheckCircle, 
  ChevronDown, Activity, Heart, Clock, Lock,
  Star, Quote
} from 'lucide-react';
import logo from './logo.png';

// Component Imports
import "./aboutcss.css";
import Nev from "./test.jsx"; 
import Chat from "./chat.jsx"; 

/* --- Configuration / Static Data --- */
const FEATURES_DATA = [
  {
    icon: Shield,
    title: "Safe & Reliable",
    description: "Built on evidence-based medical information and regularly updated with the latest health guidelines."
  },
  {
    icon: Users,
    title: "Patient-Focused",
    description: "Designed specifically for patients with an intuitive interface that's easy to navigate and understand."
  },
  {
    icon: CheckCircle,
    title: "Actionable Insights",
    description: "Receive personalized recommendations on when to see a doctor and what information to bring to your appointment."
  }
];

const PROCESS_STEPS = [
  { step: "1", title: "Describe Symptoms", desc: "Tell us about what you're experiencing in detail." },
  { step: "2", title: "Answer Questions", desc: "Our AI asks relevant follow-ups to narrow down possibilities." },
  { step: "3", title: "Get Insights", desc: "Receive personalized information and clear next steps." },
  { step: "4", title: "Take Action", desc: "Decide confidently whether to see a doctor." }
];

const TESTIMONIALS_DATA = [
  {
    name: "Sarah Jenkins",
    location: "New York, NY",
    text: "Sympto gave me peace of mind when my toddler had a fever late at night. The guidance was clear and kept me calm.",
    rating: 5
  },
  {
    name: "David Chen",
    location: "San Francisco, CA",
    text: "I wasn't sure if my abdominal pain was serious. Sympto suggested I go to the ER, and it turned out to be appendicitis. It truly helped.",
    rating: 5
  },
  {
    name: "Elena Rodriguez",
    location: "Austin, TX",
    text: "Very easy to use. I love that it doesn't just give you a scary diagnosis but tells you exactly what steps to take next.",
    rating: 4
  }
];

const BENEFITS_DATA = [
  { icon: Clock, title: "24/7 Access", sub: "Guidance anytime." },
  { icon: Lock, title: "Privacy First", sub: "Your data is yours." },
  { icon: Activity, title: "Save Time", sub: "Know when to act." },
  { icon: Heart, title: "Peace of Mind", sub: "Understand symptoms." }
];

const FAQ_DATA = [
  {
    q: "Is Sympto a replacement for seeing a doctor?",
    a: "No, Sympto is designed to provide information and guidance, not replace professional medical advice."
  },
  {
    q: "How accurate is the symptom checker?",
    a: "Our AI is trained on millions of medical cases. However, always consult a professional for a diagnosis."
  },
  {
    q: "Is my health information secure?",
    a: "Yes, we use industry-standard encryption and comply with HIPAA regulations."
  },
  {
    q: "Can I use Sympto for emergency symptoms?",
    a: "No. For life-threatening emergencies, call emergency services immediately."
  }
];

/* --- Main Component --- */
export default function About() {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const currentYear = new Date().getFullYear();

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <>
      <div style={{ position: 'relative', zIndex: 999 }}>
        <Nev />
      </div>
      
      <Chat />

      <div className="about-page">
        
        {/* 1. Hero Section */}
        <header className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">About Sympto</h1>
            <p className="hero-description">
              Empowering patients with knowledge about their health through intelligent symptom analysis and helpful guidance.
            </p>
          </div>
        </header>

        {/* 2. Mission Section */}
        <section className="mission-section">
          <div className="container">
            <div className="mission-grid">
              <div className="mission-text">
                <h2 className="section-title">Our Mission</h2>
                <p className="text-paragraph">
                  Sympto is dedicated to helping patients understand their symptoms and make informed decisions about their health. We believe that accessible, accurate health information is fundamental to better healthcare outcomes.
                </p>
                <p className="text-paragraph">
                  Our intelligent symptom checker combines medical knowledge with user-friendly technology to provide personalized insights and guidance on when to seek professional medical care.
                </p>
              </div>
              <div className="mission-image">
                <Zap className="mission-icon" />
              </div>
            </div>
          </div>
        </section>

        {/* 3. Key Features */}
        <section className="features-section">
          <div className="container">
            <div className="center-text">
              <h2 className="section-title">Why Choose Sympto?</h2>
              <p className="section-subtitle">We bridge the gap between uncertainty and medical clarity.</p>
            </div>
            
            <div className="features-grid">
              {FEATURES_DATA.map((feature, idx) => (
                <div key={idx} className="feature-card">
                  <div className="card-icon">
                    <feature.icon size={24} />
                  </div>
                  <h3 className="card-title">{feature.title}</h3>
                  <p className="card-description">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. How It Works */}
        <section className="process-section">
          <div className="container">
            <div className="center-text">
               <h2 className="section-title">How It Works</h2>
               <p className="section-subtitle">A simple path to better health understanding.</p>
            </div>
            
            <div className="process-list">
              {PROCESS_STEPS.map((item, idx) => (
                <div key={idx} className="process-step">
                  <div className="step-number-container">
                    <div className="step-number">{item.step}</div>
                  </div>
                  <div className="step-content">
                    <h3 className="step-title">{item.title}</h3>
                    <p className="step-description">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Disclaimer */}
        <div className="container-narrow">
          <div className="disclaimer-section">
            <div className="disclaimer-content">
              <AlertCircle className="disclaimer-icon" />
              <div>
                <h3 className="disclaimer-title">Important Medical Disclaimer</h3>
                <p className="disclaimer-text">
                  Sympto is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider before making any medical decisions. In case of emergency, please call your local emergency services immediately.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Testimonials Section (CLEANED UP) */}
        <section className="testimonials-section">
          <div className="container">
            <div className="center-text">
              <h2 className="section-title">What Our Users Say</h2>
              <p className="section-subtitle">Real stories from people who found clarity.</p>
            </div>
            <div className="testimonials-grid">
              {TESTIMONIALS_DATA.map((item, idx) => (
                <div key={idx} className="testimonial-card">
                  <Quote size={32} className="testimonial-quote-icon" />
                  <div style={{ position: 'relative', zIndex: 1, marginTop: '1rem' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '1rem' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={16} 
                          fill={i < item.rating ? "#fbbf24" : "none"} 
                          color={i < item.rating ? "#fbbf24" : "#cbd5e1"} 
                        />
                      ))}
                    </div>
                    <p className="testimonial-text">"{item.text}"</p>
                    <div>
                      <h4 className="testimonial-name">{item.name}</h4>
                      <p className="testimonial-location">{item.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Technology & Benefits */}
        <section className="technology-section">
          <div className="container">
            <div className="technology-grid">
              
              {/* Left Column */}
              <div>
                <h3 className="column-title">Technology & Safety</h3>
                <p className="text-paragraph">
                  Our symptom checker uses cutting-edge artificial intelligence trained on millions of medical cases and peer-reviewed research.
                </p>
                <ul className="check-list">
                  <li className="check-item">
                    <CheckCircle className="check-icon" />
                    <span>HIPAA-compliant data handling</span>
                  </li>
                  <li className="check-item">
                    <CheckCircle className="check-icon" />
                    <span>256-bit encryption for all data</span>
                  </li>
                  <li className="check-item">
                    <CheckCircle className="check-icon" />
                    <span>Regular medical audits</span>
                  </li>
                </ul>
              </div>

              {/* Right Column */}
              <div className="benefits-section">
                 <div className="benefits-grid">
                    {BENEFITS_DATA.map((benefit, idx) => (
                      <div key={idx} className="benefit-card">
                        <benefit.icon className="card-icon" style={{ width: 32, height: 32, marginBottom: 10 }} />
                        <h4 className="benefit-title">{benefit.title}</h4>
                        <p style={{ fontSize: '0.9rem' }}>{benefit.sub}</p>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. FAQ Section (CLEANED UP) */}
        <section className="faq-section" style={{ paddingBottom: '4rem' }}>
          <div className="container-narrow">
            <div className="center-text">
              <h2 className="section-title">Frequently Asked Questions</h2>
            </div>
            
            <div className="faq-list">
              {FAQ_DATA.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div 
                    key={idx} 
                    className={`faq-item ${isOpen ? 'active' : ''}`}
                    onClick={() => toggleFaq(idx)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 className="faq-question">
                        {item.q}
                      </h3>
                      <ChevronDown 
                        size={20} 
                        className="chevron-icon"
                        style={{
                          transition: 'transform 0.3s ease',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          flexShrink: 0,
                          marginLeft: '1rem',
                          color: '#64748b' /* Fallback color, overridden by CSS class */
                        }}
                      />
                    </div>
                    
                    {isOpen && (
                      <div className="faq-answer-wrapper">
                        <p className="faq-answer">{item.a}</p> 
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <footer className="sympto-footer">
          <div className="sympto-footer-container">
            <div className="sympto-footer-top">
              <div className="footer-brand">
                <img src={logo} alt="Sympto Logo" />
                <p>Empowering you with health insights.</p>
              </div>

              <div className="footer-links-group">
                <h4>Company</h4>
                <ul>
                  <li><a href="/about">About Us</a></li>
                  <li><a href="/contact">Contact Support</a></li>
                  <li><a href="/careers">Careers</a></li>
                </ul>
              </div>

              <div className="footer-links-group">
                <h4>Legal</h4>
                <ul>
                  <li><a href="/privacy">Privacy Policy</a></li>
                  <li><a href="/terms">Terms of Service</a></li>
                  <li><a href="/cookie-policy">Cookie Policy</a></li>
                </ul>
              </div>
            </div>

            <hr className="footer-divider" />

            <div className="footer-disclaimer">
              <p>
                <strong>IMPORTANT:</strong> This application is for informational purposes only 
                and is not a substitute for professional medical advice, diagnosis, or treatment. 
                Always seek the advice of your physician or other qualified health provider with 
                any questions you may have regarding a medical condition. If you think you may 
                have a medical emergency, call your doctor or emergency services immediately.
              </p>
            </div>

            <hr className="footer-divider" />

            <div className="footer-bottom">
              <p>&copy; {currentYear} Sympto.in All rights reserved.</p>
            </div>
          </div>
        </footer>

      </div> 
    </>
  );
}