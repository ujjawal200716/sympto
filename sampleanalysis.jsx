import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import "./sample.css"; // Ensure this matches your CSS filename
import Nev from "./test.jsx";    // Ensure this matches your Navbar filename

// 🔒 SECURE: Key loaded from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyCpTpkRriy5TR8P4uldvomP2no9Zd-tCAg";

export default function SymptomChecker() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    symptoms: [],      
    otherSymptoms: '', 
    duration: '',
    severity: '',
    temperature: '',
    medicalHistory: '',
    medications: '',
    allergies: ''
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const inputRef = useRef(null);
  const resultCardRef = useRef(null); // Ref for PDF generation

  const symptomsList = [
    { id: 1, name: 'Fever', icon: '🌡️' },
    { id: 2, name: 'Cough', icon: '😷' },
    { id: 3, name: 'Headache', icon: '🤕' },
    { id: 4, name: 'Fatigue', icon: '😴' },
    { id: 5, name: 'Sore Throat', icon: '👅' },
    { id: 6, name: 'Runny Nose', icon: '🤧' },
    { id: 7, name: 'Nausea', icon: '🤢' },
    { id: 8, name: 'Dizziness', icon: '🌀' },
    { id: 9, name: 'Chest Pain', icon: '💔' },
    { id: 10, name: 'Shortness of Breath', icon: '😮‍💨' },
    { id: 11, name: 'Joint Pain', icon: '🦵' },
    { id: 12, name: 'Rash', icon: '🔴' },
  ];

  const steps = [
    { label: 'Age', field: 'age', type: 'input' },
    { label: 'Gender', field: 'gender', type: 'select' },
    { label: 'Describe Your Symptoms', field: 'otherSymptoms', type: 'textarea' }, 
    { label: 'How long have you had symptoms?', field: 'duration', type: 'select' },
    { label: 'Symptom Severity', field: 'severity', type: 'select' },
    { label: 'Do you have a fever?', field: 'temperature', type: 'select' },
    { label: 'Any Medical History?', field: 'medicalHistory', type: 'textarea' },
    { label: 'Current Medications', field: 'medications', type: 'textarea' },
    { label: 'Known Allergies', field: 'allergies', type: 'textarea' },
    { label: 'Select Common Symptoms', field: 'symptoms', type: 'multiselect' }, 
  ];

  // --- SAVE FUNCTION ---
  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Please log in to save your assessment.");
        return;
    }

    if (isSaved) {
        alert("This report is already saved.");
        return;
    }

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    try {
        const response = await fetch(`${API_BASE_URL}/api/save-page`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: `Symptom Check: ${result.condition} - ${new Date().toLocaleDateString()}`,
                informationType: 'sample analysis', 
                pageData: { 
                    type: 'symptom-checker', 
                    formData: formData,      
                    result: result           
                } 
            })
        });

        const data = await response.json();

        if (response.ok) {
            setIsSaved(true); 
            alert("✅ Assessment saved to your profile!");
        } else {
            alert(`❌ Error: ${data.message}`);
        }
    } catch (err) {
        console.error("Save Error:", err);
        alert("❌ Failed to connect to server");
    }
  };

  const options = {
    gender: ['Male', 'Female', 'Other', 'Prefer not to say'],
    duration: ['Less than 1 day', '1-3 days', '4-7 days', 'More than a week'],
    severity: ['Mild', 'Moderate', 'Severe', 'Very Severe'],
    temperature: ['No fever', 'Low fever (37-38°C)', 'Moderate fever (38-39°C)', 'High fever (39°C+)'],
  };

  // --- FORM HANDLERS ---
  const handleContainerClick = () => { if (inputRef.current) inputRef.current.focus(); };

  const toggleSymptom = (id) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(id) ? prev.symptoms.filter(s => s !== id) : [...prev.symptoms, id]
    }));
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    const currentStepData = steps[currentStep];
    if (!currentStepData) return false;
    const currentField = currentStepData.field;
    if (currentField === 'symptoms') return true; 
    if (currentField === 'otherSymptoms') return formData.otherSymptoms.trim() !== '';
    if (['medicalHistory', 'medications', 'allergies'].includes(currentField)) return true; 
    return formData[currentField] !== '';
  };

  const handleNext = () => {
    if (canProceed() && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === steps.length - 1) {
      analyzeSymptoms();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // --- AI ANALYSIS ---
  const analyzeSymptoms = async () => {
    setLoading(true);
    setError(null);

    if (!API_KEY) {
      setError("Missing API Key. Please configure VITE_GEMINI_API_KEY.");
      setLoading(false);
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const symptomNames = formData.symptoms.map(id => symptomsList.find(s => s.id === id)?.name).join(', ');

      const prompt = `
        Act as a medical symptom checker API. Analyze: Age: ${formData.age}, Gender: ${formData.gender}, Description: ${formData.otherSymptoms}, Symptoms: ${symptomNames}, Severity: ${formData.severity}, Duration: ${formData.duration}.
        Return ONLY valid JSON:
        { "condition": "Condition Name", "severity": "Low/Medium/High", "confidence": "85%", "description": "Short explanation.", "recommendations": ["Action 1", "Action 2"] }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const cleanJson = response.text().replace(/```json|```/g, '').trim();
      setResult(JSON.parse(cleanJson));
    } catch (err) {
      console.error("Gemini Error:", err);
      setError("Failed to analyze. Check API Key.");
    } finally {
      setLoading(false);
    }
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setFormData({
      age: '', gender: '', duration: '', severity: '', symptoms: [],
      temperature: '', medicalHistory: '', medications: '', allergies: '', otherSymptoms: ''
    });
    setResult(null);
    setError(null);
    setIsSaved(false);
  };

  const handleShare = async () => {
    if (navigator.share && result) {
      try {
        await navigator.share({
          title: 'My Symptom Assessment',
          text: `I used SymptoCheck. Possible condition: ${result.condition} (${result.severity})`,
        });
      } catch (err) {
        console.log('Share failed', err);
      }
    } else {
      alert("Sharing is not supported on this browser.");
    }
  };

  // --- UPDATED PDF DOWNLOAD (FITS TO PAGE) ---
  const handleDownload = async () => {
    const input = resultCardRef.current;
    if (!input || !result) return;

    try {
      // 1. Force scroll to top to prevent white bars/cutoff
      window.scrollTo(0, 0);

      // 2. Capture the element
      const canvas = await html2canvas(input, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollY: -window.scrollY // Correction for scroll position
      });

      // 3. Initialize PDF (A4 size)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      // 4. Calculate Dimensions to FIT the page
      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate ratio to fit width first
      const ratio = pageWidth / imgWidth;
      
      // Determine final height based on width ratio
      let finalHeight = imgHeight * ratio;
      let finalWidth = pageWidth;

      // If the image is STILL too tall for one page, scale it down further to fit height
      if (finalHeight > pageHeight) {
         const heightRatio = pageHeight / finalHeight;
         finalHeight = pageHeight - 10; // -10 for padding
         finalWidth = finalWidth * heightRatio;
      }

      // 5. Center horizontally
      const xOffset = (pageWidth - finalWidth) / 2;
      
      pdf.addImage(imgData, 'PNG', xOffset, 10, finalWidth, finalHeight);
      pdf.save(`SymptoReport-${new Date().toISOString().slice(0,10)}.pdf`);

    } catch (err) {
      console.error("PDF Generation Error:", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const step = steps[currentStep];

  return (
    <div className="app-container">
      {!result ? (
        // ... (EXISTING FORM UI - UNCHANGED) ...
        <div className="content-wrapper">
          <div className="header-section">
            <div className="header-top">
              <div className="step-indicator">
                <span className="current-step">{currentStep + 1 < 10 ? `0${currentStep + 1}` : currentStep + 1}</span>
                <span className="total-steps">/{steps.length}</span>
              </div>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}></div>
            </div>
          </div>
          
          <Nev />

          <div className="main-card">
            <label className="field-label">{step?.label || "Information"}</label>
            <h2 className="question-text">
               {step?.field === 'symptoms' ? 'Select common symptoms:' : 
                step?.field === 'otherSymptoms' ? 'Describe what you feel:' :
                step?.field === 'age' ? 'How old is the patient?' :
                step?.field === 'severity' ? 'How intense is the pain?' : 'Provide details below.'}
            </h2>

            {step?.type === 'input' && (
              <div className="input-group" onClick={handleContainerClick}>
                <input ref={inputRef} type="number" className="medical-input" value={formData[step.field]} onChange={(e) => updateFormData(step.field, e.target.value)} placeholder="25" />
                <span className="unit">years</span>
              </div>
            )}

            {step?.type === 'select' && (
              <div className="options-grid">
                {options[step.field]?.map((option) => (
                  <button key={option} onClick={() => updateFormData(step.field, option)} className={`option-btn ${formData[step.field] === option ? 'selected' : ''}`}>
                    <span>{option}</span>
                    {formData[step.field] === option && <span className="check-mark">●</span>}
                  </button>
                ))}
              </div>
            )}

            {step?.type === 'textarea' && (
              <textarea value={formData[step.field]} onChange={(e) => updateFormData(step.field, e.target.value)} placeholder="Type here..." className="text-area-input" />
            )}

            {step?.type === 'multiselect' && (
              <div className="symptoms-grid">
                {symptomsList.map((symptom) => (
                  <button key={symptom.id} onClick={() => toggleSymptom(symptom.id)} className={`symptom-btn ${formData.symptoms.includes(symptom.id) ? 'selected' : ''}`}>
                    <div className="symptom-icon">{symptom.icon}</div>
                    <div className="symptom-name">{symptom.name}</div>
                  </button>
                ))}
              </div>
            )}

            {error && <div className="error-box"><p>{error}</p></div>}

            <div className="nav-area">
              <button onClick={handleBack} disabled={currentStep === 0} className="btn btn-back">Back</button>
              <button onClick={handleNext} disabled={!canProceed() || loading} className="btn btn-primary">
                {loading ? 'Processing...' : currentStep === steps.length - 1 ? 'Analyze' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // --- NEW DESIGNED RESULTS PAGE ---
        <div className="results-wrapper">
            <Nev />
            {/* ATTACH REF HERE FOR PDF GENERATION */}
            <div className="result-card" ref={resultCardRef}>
              
              {/* Header */}
              <div className="result-header">
                <span className="result-badge">AI Assessment</span>
                
                {/* ACTION BUTTONS WITH FIXED VISIBLE ICONS */}
                <div className="action-row" data-html2canvas-ignore="true">
                  {/* Share Button */}
                  <button onClick={handleShare} className="icon-btn" title="Share">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                      <polyline points="16 6 12 2 8 6"></polyline>
                      <line x1="12" y1="2" x2="12" y2="15"></line>
                    </svg>
                  </button>

                  {/* Download Button */}
                  <button onClick={handleDownload} className="icon-btn" title="Download PDF">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </button>

                  {/* Save Button (Changes color if saved) */}
                  <button 
                    onClick={handleSave} 
                    className={`icon-btn ${isSaved ? 'saved-active' : ''}`} 
                    title={isSaved ? "Saved" : "Save to Profile"}
                    disabled={isSaved}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={isSaved ? "#059669" : "none"} stroke={isSaved ? "#059669" : "#64748b"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Main Diagnosis */}
              <div className="diagnosis-section">
                {/* --- LARGE ICON --- */}
                <div className="diagnosis-icon">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 3C4.89543 3 4 3.89543 4 5V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V5C20 3.89543 19.1046 3 18 3H6ZM6 1H18C20.2091 1 22 2.79086 22 5V19C22 21.2091 20.2091 23 18 23H6C3.79086 23 2 21.2091 2 19V5C2 2.79086 3.79086 1 6 1Z" fillOpacity="0.5"/>
                    <path d="M11 7H13V10H16V12H13V15H11V12H8V10H11V7Z"/>
                  </svg>
                </div>

                <h1 className="condition-name">{result.condition}</h1>
                <p className="condition-meta">Based on your symptoms</p>
              </div>

              {/* Stats Grid */}
              <div className="stats-grid">
                <div className={`stat-box severity-${result.severity?.toLowerCase() || 'medium'}`}>
                  <span className="stat-label">Severity</span>
                  <span className="stat-value">{result.severity}</span>
                </div>
                <div className="stat-box confidence-box">
                  <span className="stat-label">AI Confidence</span>
                  <span className="stat-value">{result.confidence}</span>
                </div>
              </div>

              {/* Description */}
              <div className="info-block">
                <h3>About this condition</h3>
                <p>{result.description}</p>
              </div>

              {/* Recommendations */}
              <div className="rec-block">
                <h3>Recommended Actions</h3>
                <ul className="rec-list-styled">
                  {result.recommendations?.map((rec, idx) => (
                    <li key={idx}>
                      <span className="rec-icon">✓</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer Button - Ignored in PDF */}
              <button onClick={resetQuiz} className="btn-restart" data-html2canvas-ignore="true">
                Check Another Symptom
              </button>
            </div>
        </div>
      )}
    </div>
  );
}