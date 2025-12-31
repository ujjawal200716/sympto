import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FaExclamationTriangle, FaCheckSquare, FaFileDownload, FaShareAlt, FaSave, FaUserMd } from 'react-icons/fa'; // NEW ICONS
import "./sample.css"; // Ensure this matches your CSS filename
import Nev from "./test.jsx";    // Ensure this matches your Navbar filename

// 🔒 SECURE: Key loaded from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY10 || import.meta.env.VITE_GEMINI_API_KEY11 ;

export default function SymptomChecker() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false); // New loading state for download
  
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

  // Updated labels to be more polite ("Please the user mode")
  const steps = [
    { label: 'Patient Age', field: 'age', type: 'input', question: 'Please enter the patient\'s age:' },
    { label: 'Gender', field: 'gender', type: 'select', question: 'Please select the gender:' },
    { label: 'Symptoms Description', field: 'otherSymptoms', type: 'textarea', question: 'Please describe what you are feeling:' }, 
    { label: 'Duration', field: 'duration', type: 'select', question: 'How long have the symptoms persisted?' },
    { label: 'Severity', field: 'severity', type: 'select', question: 'Please rate the symptom severity:' },
    { label: 'Temperature', field: 'temperature', type: 'select', question: 'Do you currently have a fever?' },
    { label: 'Medical History', field: 'medicalHistory', type: 'textarea', question: 'Please list any relevant medical history:' },
    { label: 'Medications', field: 'medications', type: 'textarea', question: 'Are you currently taking any medications?' },
    { label: 'Allergies', field: 'allergies', type: 'textarea', question: 'Please list any known allergies:' },
    { label: 'Common Symptoms', field: 'symptoms', type: 'multiselect', question: 'Please select any common symptoms applicable:' }, 
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

      // INCREASED INFORMATION: Added urgency, specialist, and precautions to the prompt
      const prompt = `
        Act as a compassionate and professional medical symptom checker API. 
        Analyze the following patient data:
        Age: ${formData.age}, Gender: ${formData.gender}, 
        Description: ${formData.otherSymptoms}, 
        Selected Symptoms: ${symptomNames}, 
        Severity: ${formData.severity}, Duration: ${formData.duration},
        Fever Status: ${formData.temperature},
        Medical History: ${formData.medicalHistory}, Medications: ${formData.medications}, Allergies: ${formData.allergies}.

        Return ONLY valid JSON with the following structure:
        { 
          "condition": "Name of the most likely condition", 
          "severity": "Low/Medium/High/Critical", 
          "confidence": "Percentage (e.g., 85%)", 
          "description": "A clear, simple explanation of the condition.", 
          "urgency": "A specific recommendation sentence (e.g., 'Consult a General Practitioner within 24-48 hours, especially if symptoms worsen.')",
          "specialist": "Type of doctor to see (e.g., Dermatologist, GP)",
          "recommendations": ["Action step 1", "Action step 2", "Action step 3"],
          "precautions": ["Thing to avoid 1", "Thing to avoid 2"] 
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const cleanJson = response.text().replace(/```json|```/g, '').trim();
      setResult(JSON.parse(cleanJson));
    } catch (err) {
      console.error("Gemini Error:", err);
      setError("Failed to analyze. Please check your connection and try again.");
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
// --- FIXED DOWNLOAD FUNCTION ---
 const handleDownload = async () => {
    const input = resultCardRef.current;
    if (!input || !result) return;
    
    setIsDownloading(true);

    try {
      // 1. Determine Theme Colors for PDF
      const isDarkMode = document.querySelector('.dark-theme') !== null || 
                         document.body.classList.contains('dark-theme');
      
      const pdfBg = isDarkMode ? '#0f172a' : '#ffffff'; 
      const pdfText = isDarkMode ? '#f1f5f9' : '#1e293b'; 

      // 2. Capture Setup
      // We calculate this just for the windowHeight buffer, not to restrict the canvas
      const originalHeight = input.scrollHeight;

      const canvas = await html2canvas(input, {
        scale: 2, 
        useCORS: true,
        allowTaint: true,
        backgroundColor: pdfBg,
        
        // --- FIX 1: REMOVE the 'height' property ---
        // Removing 'height' allows the canvas to grow if your onclone styles make the content taller.
        // height: scrollHeight,  <-- DELETED
        
        // --- FIX 2: ADD BUFFER to windowHeight ---
        // This ensures the virtual browser is tall enough to render hidden overflow content
        windowHeight: originalHeight + 2000, 
        
        y: 0,
        scrollY: 0, 

        onclone: (clonedDoc) => {
          
          // --- FIX 3: FORCE ELEMENTS VISIBLE (Fixes missing elements) ---
          // Creates a style tag to disable animations and force opacity
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            * {
              transition: none !important;
              animation: none !important;
              opacity: 1 !important;
              visibility: visible !important;
            }
          `;
          clonedDoc.body.appendChild(style);

          // A. Fix the Parent Wrapper 
          const wrapper = clonedDoc.querySelector('.results-wrapper');
          if (wrapper) {
             wrapper.style.height = 'auto';
             wrapper.style.overflow = 'visible';
             wrapper.style.maxHeight = 'none';
          }

          // B. Fix the Main Card Container
          const card = clonedDoc.querySelector('.result-card');
          if (card) {
            card.style.height = 'auto';      
            card.style.maxHeight = 'none';     
            card.style.overflow = 'visible';    
          }

          // C. Fix The Title
          const gradients = clonedDoc.querySelectorAll('.condition-name');
          gradients.forEach(el => {
             el.style.background = 'none';               
             el.style.webkitTextFillColor = 'initial';    
             el.style.color = pdfText;                    
          });

          // D. Force Text Visibility
          const textSelectors = [
            '.stat-value', '.stat-label', '.condition-meta', 
            '.about-text', 'li span', 'h1', 'h2', 'h3', 'p', 'div'
          ];
          
          textSelectors.forEach(selector => {
            clonedDoc.querySelectorAll(selector).forEach(el => {
              el.style.color = pdfText; 
            });
          });
        }
      });

      // 3. Generate PDF 
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF dimensions based on the ACTUAL generated canvas
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [imgWidth, imgHeight] 
      });

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`SymptoReport-${new Date().toISOString().slice(0,10)}.pdf`);

    } catch (err) {
      console.error("PDF Failed:", err);
      alert("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };
  const step = steps[currentStep];

  return (
    <div className="app-container">
      {!result ? (
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
            
            {/* Displaying the polite questions defined in the steps array */}
            <h2 className="question-text">
               {step?.question}
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
              <textarea value={formData[step.field]} onChange={(e) => updateFormData(step.field, e.target.value)} placeholder="Please type here..." className="text-area-input" />
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
                {loading ? 'Please wait...' : currentStep === steps.length - 1 ? 'Analyze Symptoms' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // --- UPGRADED RESULT PAGE (Matches Image + Fixes Download) ---
        <div className="results-wrapper">
            <Nev />
            
            {/* We attach the ref HERE so we capture this entire card */}
            <div className="result-card" ref={resultCardRef}>
              
              {/* 1. Header Area with Buttons */}
              <div className="result-header">
                 <span className="result-badge">Analysis Complete</span>
                 <div className="action-row" data-html2canvas-ignore="true">
                    
                    <button onClick={handleShare} className="icon-btn" title="Share">
                      <FaShareAlt />
                    </button>

                    <button 
                      onClick={handleSave} 
                      className={`icon-btn ${isSaved ? 'saved-active' : ''}`} 
                      disabled={isSaved}
                      title={isSaved ? "Saved" : "Save to Profile"}
                    >
                      <FaSave />
                    </button>

                    {/* Main Download Button */}
                    <button 
                      className="btn btn-primary" 
                      onClick={handleDownload}
                      disabled={isDownloading}
                      style={{ padding: '0.8rem 1.5rem', fontSize: '0.9rem' }}
                    >
                       {isDownloading ? 'Generating...' : <><FaFileDownload /> Save Report</>}
                    </button>
                 </div>
              </div>

              {/* 2. Diagnosis Title */}
              <div className="diagnosis-section">
                <div className="diagnosis-icon">
                    {/* Dynamic Icon based on generic or check */}
                   <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3C4.89543 3 4 3.89543 4 5V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V5C20 3.89543 19.1046 3 18 3H6ZM6 1H18C20.2091 1 22 2.79086 22 5V19C22 21.2091 20.2091 23 18 23H6C3.79086 23 2 21.2091 2 19V5C2 2.79086 3.79086 1 6 1Z" fillOpacity="0.5"/><path d="M11 7H13V10H16V12H13V15H11V12H8V10H11V7Z"/></svg>
                </div>
                <h1 className="condition-name">{result.condition}</h1>
                <p className="condition-meta">Possible Condition Analysis</p>
              </div>

              {/* 3. THE YELLOW WARNING BANNER (From Image) */}
              {result.urgency && (
                  <div className="warning-banner">
                    <FaExclamationTriangle className="warning-icon" />
                    <div>
                      <strong>Recommendation: </strong>
                      {result.urgency}
                    </div>
                  </div>
              )}

              {/* 4. ABOUT SECTION */}
              <div className="about-section">
                <h3 className="section-title">About this condition</h3>
                <p className="about-text">{result.description}</p>
              </div>

              {/* 5. STATS GRID (3 Columns) */}
              <div className="stats-grid">
                <div className={`stat-box severity-${result.severity?.toLowerCase() || 'medium'}`}>
                  <span className="stat-label">Severity</span>
                  <span className="stat-value">{result.severity}</span>
                </div>
                <div className="stat-box confidence-box">
                  <span className="stat-label">AI Confidence</span>
                  <span className="stat-value">{result.confidence}</span>
                </div>
                {result.specialist && (
                    <div className="stat-box specialist-box">
                        <span className="stat-label">Specialist</span>
                        <span className="stat-value" style={{fontSize: '1.3rem'}}>{result.specialist}</span>
                    </div>
                )}
              </div>

              {/* 6. RECOMMENDED ACTIONS HEADER (Green Check) */}
              <div className="actions-header">
                <FaCheckSquare className="check-icon-large" />
                <span>Recommended Actions</span>
              </div>

              {/* Recommended Actions List */}
              <ul className="rec-list-styled">
                {result.recommendations?.map((rec, idx) => (
                  <li key={idx} className="rec-item">
                     <div className="rec-icon-box">{idx + 1}</div>
                     <span>{rec}</span>
                  </li>
                ))}
              </ul>

              {/* 7. PRECAUTIONS (If any exist) */}
              {result.precautions && result.precautions.length > 0 && (
                <>
                  <div className="actions-header" style={{ marginTop: '2rem', color: '#dc2626' }}>
                     <FaExclamationTriangle className="check-icon-large" style={{ background: '#fef2f2', color: '#dc2626' }} />
                     <span>Precautions</span>
                  </div>
                  <ul className="rec-list-styled">
                    {result.precautions.map((item, idx) => (
                       <li key={idx} className="rec-item" style={{ borderLeft: '5px solid #ef4444' }}>
                          <div className="rec-icon-box" style={{ background: '#fef2f2', color: '#dc2626' }}>✕</div>
                          <span>{item}</span>
                       </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Restart Button */}
              <button onClick={resetQuiz} className="btn-restart" data-html2canvas-ignore="true">
                Start New Check
              </button>

            </div>
        </div>
      )}
    </div>
  );
}