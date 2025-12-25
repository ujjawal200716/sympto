import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import "./sample.css"; 
import Nev from "./test.jsx";

// 🔒 SECURE: Key is now loaded from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function SymptomChecker() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaved, setIsSaved] = useState(false); // New state for Save button
  
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

  // ... (Existing helper lists: symptomsList, steps, options remain the same) ...
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

// --- NEW: SAVE TO SERVER FUNCTION ---
  const handleSave = async () => {
    // 1. Check for Authentication Token
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Please log in to save your assessment.");
        return;
    }

    // 2. Prevent saving if already saved
    if (isSaved) {
        alert("This report is already saved.");
        return;
    }

    // 🔧 FIX: Use environment variable for the API URL
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    try {
        const response = await fetch(`${API_BASE_URL}/api/save-page`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            // 3. Payload adapted for Symptom Checker Data
            body: JSON.stringify({
                title: `Symptom Check: ${result.condition} - ${new Date().toLocaleDateString()}`,
                informationType: 'sample analysis', // <--- NEW: Added Information Type
                pageData: { 
                    type: 'symptom-checker', // Tag to identify this specific layout
                    formData: formData,      // The inputs (Age, Symptoms, etc)
                    result: result           // The AI Output (Condition, Severity, etc)
                } 
            })
        });

        const data = await response.json();

        if (response.ok) {
            setIsSaved(true); // Turns the icon solid/green
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

  // ... (Existing handlers: handleContainerClick, toggleSymptom, updateFormData, canProceed, handleBack) ...
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

  const analyzeSymptoms = async () => {
    setLoading(true);
    setError(null);

    // 🔧 Check if API Key exists
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

  // --- NEW BUTTON HANDLERS ---
  
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

  const handleDownload = () => {
    if (!result) return;
    const textContent = `
=== SYMPTO CHECK REPORT ===
Date: ${new Date().toLocaleDateString()}

Patient Age: ${formData.age}
Reported Severity: ${formData.severity}

ASSESSMENT:
Condition: ${result.condition}
AI Confidence: ${result.confidence}
Severity Level: ${result.severity}

DESCRIPTION:
${result.description}

RECOMMENDATIONS:
${result.recommendations.map(r => `- ${r}`).join('\n')}

*Disclaimer: This is AI-generated advice. Consult a doctor.*
    `;
    
    const element = document.createElement("a");
    const file = new Blob([textContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "symptom-report.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
            <div className="result-card">
              
              {/* Header */}
              <div className="result-header">
                <span className="result-badge">AI Assessment</span>
                <div className="action-row">
                   <button onClick={handleShare} className="icon-btn" title="Share">
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                   </button>
                   <button onClick={handleDownload} className="icon-btn" title="Download Report">
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                   </button>
                 <button 
  onClick={handleSave} 
  className={`icon-btn ${isSaved ? 'saved-active' : ''}`} 
  title={isSaved ? "Saved" : "Save to Profile"}
  disabled={isSaved} // Optional: Prevents clicking again if already saved
>
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill={isSaved ? "currentColor" : "none"} 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
  </svg>
</button>
                </div>
              </div>

              {/* Main Diagnosis */}
              <div className="diagnosis-section">
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

              {/* Footer Button */}
              <button onClick={resetQuiz} className="btn-restart">
                Check Another Symptom
              </button>
            </div>
        </div>
      )}
    </div>
  );
}