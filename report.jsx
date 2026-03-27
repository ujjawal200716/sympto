import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, AlertCircle, AlertTriangle, Info, ShieldAlert, 
  Plus, Activity, ShieldCheck, HeartPulse,
  Share2, Bookmark, Download 
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Nav from './test.jsx'; 
import './report.css';

const Report = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const resultCardRef = useRef(null);

  const [isSaved, setIsSaved] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { 
    assessmentResult = null, 
    activeCheckUp = "General Checkup", 
    userProfile = {}, 
    userAnswers = [] 
  } = location.state || {};

  if (!assessmentResult) {
    return (
      <div className="srpt-empty-state">
        <h2>No report data found.</h2>
        <p>Please complete a symptom check first.</p>
        <button className="srpt-btn-primary" onClick={() => navigate('/')}>
          Go Home
        </button>
      </div>
    );
  }

  const { 
    likelihood = "Low", 
    summary = "No summary provided.", 
    details = "", 
    immediate_actions = [], 
    medical_requirements = [], 
    lifestyle_changes = [], 
    preventive_measures = [] 
  } = assessmentResult;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Symptom Assessment',
          text: `I used Sympto to check for ${activeCheckUp}. Likelihood: ${likelihood}`,
        });
      } catch (err) { 
        console.log('Share failed or was cancelled:', err); 
      }
    } else {
      alert("Sharing is not supported on this browser.");
    }
  };

  // 🚀 SERVER-SIDE DATABASE SAVE
  const handleSave = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert("Please log in to save your assessment to your profile.");
      return;
    }
    
    if (isSaved) return;

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/save-page`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          title: `Checkup: ${activeCheckUp}`,
          informationType: 'quick analysis',
          pageData: { 
            type: 'quick-checker', 
            userProfile, 
            activeCheckUp, 
            userAnswers, 
            assessmentResult 
          }
        })
      });
      if (response.ok) {
        setIsSaved(true);
        alert("✅ Assessment saved to your profile!");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`❌ Failed to save assessment. ${errorData.message || 'Server error'}`);
      }
    } catch (err) {
      console.error("Save Error:", err);
      alert("❌ Network error. Please check if your backend server is running.");
    }
  };

  const handleDownload = async () => {
    const input = resultCardRef.current;
    if (!input) return;
    setIsDownloading(true);
    
    try {
      const isDarkMode = document.body.classList.contains('dark-theme');
      const pdfBg = isDarkMode ? '#1e293b' : '#ffffff'; 
      
      const originalHeight = input.scrollHeight;
      const originalWidth = input.scrollWidth;

      const canvas = await html2canvas(input, {
        scale: 2, 
        useCORS: true,
        allowTaint: true,
        backgroundColor: pdfBg,
        windowHeight: originalHeight + 100, 
        windowWidth: originalWidth,
        y: 0, 
        scrollY: 0,
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement('style');
          style.innerHTML = `* { transition: none !important; animation: none !important; opacity: 1 !important; visibility: visible !important; transform: none !important; }`;
          clonedDoc.body.appendChild(style);

          const card = clonedDoc.querySelector('.srpt-card');
          if (card) { 
            card.style.height = 'auto'; 
            card.style.maxHeight = 'none'; 
            card.style.overflow = 'visible'; 
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const pdf = new jsPDF({ 
        orientation: 'p', 
        unit: 'px', 
        format: [imgWidth, imgHeight] 
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Sympto-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
      
    } catch (err) {
      console.error("PDF Failed:", err);
      alert("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const getLikelihoodClass = (level) => {
    const l = (level || '').toLowerCase();
    if (l === 'high') return 'srpt-high';
    if (l === 'moderate') return 'srpt-moderate';
    return 'srpt-low';
  };

  const severityClass = getLikelihoodClass(likelihood);

  return (
    <div className="srpt-page-wrapper">
      <Nav />
      
      <div className="srpt-container">

        <div className="srpt-card" ref={resultCardRef}>
          <div className="srpt-card-top-gradient"></div>

          <div className="srpt-card-header-row">
            <span className="srpt-badge-analysis">
              ANALYSIS COMPLETE
            </span>
            
            <div className="srpt-card-actions" data-html2canvas-ignore="true">
              <button className="srpt-icon-btn" onClick={handleShare} title="Share">
                <Share2 size={20} color="#0f172a" strokeWidth={2.5} fill="none" />
              </button>
              
              <button 
                className={`srpt-icon-btn ${isSaved ? 'srpt-btn-saved' : ''}`} 
                onClick={handleSave} 
                disabled={isSaved} 
                title={isSaved ? "Saved to Profile" : "Save to Profile"}
              >
                {isSaved ? (
                  <CheckCircle size={20} color="#10b981" strokeWidth={2.5} fill="none" />
                ) : (
                  <Bookmark size={20} color="#0f172a" strokeWidth={2.5} fill="none" />
                )}
              </button>
              
              <button className="srpt-btn-solid-blue" onClick={handleDownload} disabled={isDownloading}>
                <Download size={18} color="#ffffff" strokeWidth={2.5} fill="none" /> 
                <span>{isDownloading ? 'Saving...' : 'Save Report'}</span>
              </button>
            </div>
          </div>

          <hr className="srpt-header-divider" />

          <div className="srpt-hero-section">
            <div className="srpt-medical-cross-box">
              <Plus size={40} strokeWidth={3} className="srpt-medical-cross-icon" />
            </div>
            
            <h1 className="srpt-hero-title">{activeCheckUp}</h1>
          </div>

          <div className="srpt-likelihood-center">
            <p className="srpt-likelihood-label">LIKELIHOOD</p>
            <h2 className={`srpt-likelihood-text ${severityClass}`}>{likelihood}</h2>
            <div className="srpt-bar-container">
              <div className={`srpt-bar-fill ${severityClass}`}></div>
            </div>
          </div>
          
          <div className={`srpt-summary-box ${severityClass}`}>
            <h4>{summary}</h4>
            <p className="srpt-full-width-text">{details}</p>
          </div>

          {immediate_actions && immediate_actions.length > 0 && (
            <div className="srpt-info-section">
              <div className="srpt-info-header srpt-header-danger">
                <AlertTriangle size={20} />
                <h3>Immediate Actions</h3>
              </div>
              <div className="srpt-content-box srpt-box-danger srpt-full-width-text">
                <ul className="srpt-list">
                  {immediate_actions.map((action, idx) => (
                    <li key={idx} className="srpt-list-item">
                      <AlertCircle size={18} className="srpt-icon-danger" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {medical_requirements && medical_requirements.length > 0 && (
            <div className="srpt-info-section">
              <div className="srpt-info-header srpt-header-blue">
                <Activity size={20} />
                <h3>Medical Requirements</h3>
              </div>
              <div className="srpt-content-box srpt-full-width-text">
                <ul className="srpt-list">
                  {medical_requirements.map((req, idx) => (
                    <li key={idx} className="srpt-list-item">
                      <Plus size={18} style={{ color: '#2563eb', marginRight: '8px', flexShrink: 0 }} />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {lifestyle_changes && lifestyle_changes.length > 0 && (
            <div className="srpt-info-section">
              <div className="srpt-info-header srpt-header-success">
                <HeartPulse size={20} />
                <h3>Lifestyle & Dietary Changes</h3>
              </div>
              <div className="srpt-content-box srpt-box-success srpt-full-width-text">
                <ul className="srpt-list">
                  {lifestyle_changes.map((change, idx) => (
                    <li key={idx} className="srpt-list-item">
                      <CheckCircle size={18} className="srpt-icon-success" />
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {preventive_measures && preventive_measures.length > 0 && (
            <div className="srpt-info-section">
              <div className="srpt-info-header" style={{ backgroundColor: 'rgba(147, 51, 234, 0.1)', color: '#9333ea' }}>
                <ShieldAlert size={20} />
                <h3>Preventive Measures</h3>
              </div>
              <div className="srpt-content-box srpt-full-width-text" style={{ borderColor: 'rgba(147, 51, 234, 0.3)' }}>
                <ul className="srpt-list">
                  {preventive_measures.map((measure, idx) => (
                    <li key={idx} className="srpt-list-item">
                      <ShieldCheck size={18} style={{ color: '#9333ea', marginRight: '8px', flexShrink: 0 }} />
                      <span>{measure}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="srpt-disclaimer-box srpt-full-width-text">
            <Info size={24} className="srpt-disclaimer-icon" />
            <p>
              <strong>Medical Disclaimer:</strong> This assessment is generated by an AI model based on the limited information provided. It does not constitute a medical diagnosis, professional advice, or a treatment plan. Always consult with a qualified healthcare provider. If you are experiencing a medical emergency, call your local emergency services immediately.
            </p>
          </div>

        </div>

        <div className="srpt-footer-actions" data-html2canvas-ignore="true">
          <button className="srpt-btn-back-large" onClick={() => navigate('/')}>
            &larr; Back to Home
          </button>
        </div>

      </div>
    </div>
  );
};

export default Report;
