import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FaExclamationTriangle, FaCheckSquare, FaFileDownload, FaShareAlt, FaSave, FaUndo, FaCheck } from 'react-icons/fa'; 
import "./sample.css"; 
import Nev from "./test.jsx"; 

// 🔒 SECURE: Key loaded from environment variables
// 1. Define the pool of keys
const ALL_KEYS = [
  import.meta.env.VITE_GEMINI_API_KEY8,  // New addition
  import.meta.env.VITE_GEMINI_API_KEY11, // New addition
];

// 2. Filter out any keys that are missing/empty in the .env file
const validKeys = ALL_KEYS.filter((key) => key && key.length > 0);

// 3. Select a random key from the valid ones
const API_KEY = validKeys.length > 0 
  ? validKeys[Math.floor(Math.random() * validKeys.length)] 
  : null;

// 4. Safety check (optional but recommended)
if (!API_KEY) {
  console.error("❌ Critical Error: No valid Gemini API keys found.");
} else {
  console.log("✅ Using Key Index:", ALL_KEYS.indexOf(API_KEY));
}

// --- COMPONENT: CLEAN PROGRESS STEPPER (No Titles) ---
const ProgressStepper = ({ steps, currentStep }) => {
  const progressPercentage = (currentStep / (steps.length - 1)) * 100;

  return (
    <div className="stepper-wrapper">
      <div className="stepper-line-bg">
        <div 
          className="stepper-line-fill" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const letter = step.label ? step.label.charAt(0).toUpperCase() : (index + 1);

        return (
          <div 
            key={index} 
            className={`step-bubble ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
            title={step.label} 
          >
            {isCompleted ? <FaCheck size={12} /> : letter}
          </div>
        );
      })}

      <style>{`
        .stepper-wrapper {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 0 10px;
          margin-top: 10px;
        }
        .stepper-line-bg {
          position: absolute;
          top: 50%;
          left: 0;
          width: 100%;
          height: 4px;
          background: #e2e8f0;
          z-index: 0;
          transform: translateY(-50%);
          border-radius: 2px;
        }
        .stepper-line-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #2563eb);
          transition: width 0.4s ease;
          border-radius: 2px;
        }
        .step-bubble {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
          font-weight: 800;
          color: #94a3b8;
          font-size: 16px;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .step-bubble.active {
          border-color: #3b82f6;
          background: #3b82f6;
          color: white;
          transform: scale(1.15);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
        }
        .step-bubble.completed {
          border-color: #3b82f6;
          background: #3b82f6;
          color: white;
        }
      `}</style>
    </div>
  );
};

// --- COMPONENT: REALISTIC HUMAN BODY MAP ---
const InteractiveBodyMap = ({ onSelect, selectedPart }) => {
  const [zoomLevel, setZoomLevel] = useState('default'); 
  const [showSideSelection, setShowSideSelection] = useState(false);
  const [pendingPart, setPendingPart] = useState(null);

  const handlePartClick = (part, zoomArea) => {
    if (['Arms', 'Legs'].includes(part)) {
      setZoomLevel(zoomArea);
      setPendingPart(part);
      setShowSideSelection(true);
    } else {
      onSelect(part);
      setZoomLevel('default');
      setShowSideSelection(false);
    }
  };

  const handleSideSelect = (side) => {
    const finalLocation = `${side} ${pendingPart}`; 
    onSelect(finalLocation);
    setShowSideSelection(false);
    setTimeout(() => setZoomLevel('default'), 300);
  };

  const resetView = (e) => {
    e.stopPropagation();
    setZoomLevel('default');
    setShowSideSelection(false);
  };

  return (
    <div className={`body-map-wrapper zoom-${zoomLevel}`}>
      {zoomLevel !== 'default' && (
        <button onClick={resetView} className="zoom-reset-btn"><FaUndo /> Reset View</button>
      )}
      
      <div className="svg-container">
        {/* Human Body SVG - Realistic Silhouette with Breathing Animation */}
        <svg viewBox="0 0 260 500" className="human-body-svg">
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Head & Neck */}
          <path 
            className={`body-part ${selectedPart === 'Head' ? 'selected' : ''}`}
            onClick={() => handlePartClick('Head', 'upper')}
            d="M130,20 C110,20 100,40 100,65 C100,85 110,95 120,98 L120,110 L140,110 L140,98 C150,95 160,85 160,65 C160,40 150,20 130,20 Z" 
          />

          {/* Torso */}
          <path 
            className={`body-part ${selectedPart === 'Torso' ? 'selected' : ''}`}
            onClick={() => handlePartClick('Torso', 'default')}
            d="M95,115 C80,125 70,130 70,150 L75,240 C75,260 80,280 85,290 L175,290 C180,280 185,260 185,240 L190,150 C190,130 180,125 165,115 L95,115 Z" 
          />

          {/* Arms */}
          <path 
            className={`body-part ${selectedPart && selectedPart.includes('Arm') ? 'selected' : ''}`}
            onClick={() => handlePartClick('Arms', 'arms')}
            d="M70,150 C60,150 40,160 35,180 L30,250 C30,260 35,270 45,270 L55,270 C65,270 70,260 70,250 L75,180 C78,160 85,150 95,145 L70,150 Z 
               M190,150 C200,150 220,160 225,180 L230,250 C230,260 225,270 215,270 L205,270 C195,270 190,260 190,250 L185,180 C182,160 175,150 165,145 L190,150 Z" 
          />

          {/* Legs */}
          <path 
            className={`body-part ${selectedPart && selectedPart.includes('Leg') ? 'selected' : ''}`}
            onClick={() => handlePartClick('Legs', 'lower')}
            d="M85,290 L90,400 C90,420 80,450 70,460 L110,460 C105,450 115,420 115,400 L120,290 L85,290 Z 
               M175,290 L170,400 C170,420 180,450 190,460 L150,460 C155,450 145,420 145,400 L140,290 L175,290 Z" 
          />
        </svg>

        {showSideSelection && (
          <div className="side-selector-overlay">
            <p>Which side?</p>
            <div className="side-buttons">
              <button onClick={() => handleSideSelect('Left')}>Left</button>
              <button onClick={() => handleSideSelect('Right')}>Right</button>
              <button onClick={() => handleSideSelect('Both')}>Both</button>
            </div>
          </div>
        )}
      </div>
      
      <p className="selected-text">
        {selectedPart ? `Selected: ${selectedPart}` : 'Tap the affected area'}
      </p>

      <style>{`
        /* Breathing Animation Keyframes */
        @keyframes breathe {
          0% { transform: scale(1); filter: drop-shadow(0 5px 15px rgba(14, 165, 233, 0.2)); }
          50% { transform: scale(1.005); filter: drop-shadow(0 5px 20px rgba(14, 165, 233, 0.35)); }
          100% { transform: scale(1); filter: drop-shadow(0 5px 15px rgba(14, 165, 233, 0.2)); }
        }

        .body-map-wrapper { 
          position: relative; width: 100%; height: 480px; display: flex; flex-direction: column; align-items: center; overflow: hidden; transition: all 0.5s ease;
        }
        .svg-container {
          width: 100%; height: 100%; display: flex; justify-content: center; transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        /* ZOOM STATES */
        .zoom-upper .svg-container { transform: scale(1.8) translateY(120px); }
        .zoom-lower .svg-container { transform: scale(1.6) translateY(-120px); }
        .zoom-arms .svg-container { transform: scale(1.3) translateY(20px); }

        .human-body-svg { 
          height: 100%; 
          animation: breathe 4s ease-in-out infinite; 
          overflow: visible;
        }
        
        .body-part { 
          fill: #f1f5f9; stroke: #94a3b8; stroke-width: 1.5; transition: all 0.3s ease; cursor: pointer; stroke-linejoin: round; stroke-linecap: round;
        }
        .body-part:hover { fill: #dbeafe; stroke: #3b82f6; filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.6)); }
        .body-part.selected { fill: #ef4444; stroke: #b91c1c; filter: url(#glow); }
        
        .side-selector-overlay {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          background: rgba(255, 255, 255, 0.95); padding: 24px; border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); text-align: center;
          animation: popIn 0.3s ease; z-index: 20; backdrop-filter: blur(8px); border: 1px solid #e2e8f0;
        }
        .side-buttons { display: flex; gap: 10px; margin-top: 10px; }
        .side-buttons button {
          padding: 10px 20px; border: none; background: #3b82f6; color: white;
          border-radius: 8px; cursor: pointer; font-weight: 600; transition: 0.2s;
        }
        .side-buttons button:hover { background: #2563eb; transform: translateY(-2px); }
        .selected-text { margin-top: 10px; color: #64748b; font-weight: 600; }
        .zoom-reset-btn {
          position: absolute; top: 10px; right: 10px; z-index: 10;
          background: white; border: 1px solid #cbd5e1; padding: 6px 12px;
          border-radius: 20px; cursor: pointer; display: flex; align-items: center; gap: 6px;
          font-size: 0.85rem; color: #64748b; box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        @keyframes popIn { from { opacity: 0; transform: translate(-50%, -40%); } to { opacity: 1; transform: translate(-50%, -50%); } }
      `}</style>
    </div>
  );
};

export default function SymptomChecker() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const initialSteps = [
    { label: 'Age', field: 'age', type: 'input', question: 'Please enter the patient\'s age:' },
    { label: 'Gender', field: 'gender', type: 'select', question: 'Please select the gender:' },
    { label: 'Symptom', field: 'otherSymptoms', type: 'textarea', question: 'Please describe your main symptom in detail:' }, 
  ];

  const [steps, setSteps] = useState(initialSteps);

  const [formData, setFormData] = useState({
    age: '', gender: '', symptoms: [], otherSymptoms: '', 
    hasPain: false, painLocation: '', 
    dynamicAnswers: {}, 
    duration: '', severity: '', temperature: '', medicalHistory: '', medications: '', allergies: ''
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const inputRef = useRef(null);
  const resultCardRef = useRef(null); 
  const mainCardRef = useRef(null); 

  const symptomsList = [
    { id: 1, name: 'Fever', icon: '🌡️' }, { id: 2, name: 'Cough', icon: '😷' },
    { id: 3, name: 'Headache', icon: '🤕' }, { id: 4, name: 'Fatigue', icon: '😴' },
    { id: 5, name: 'Sore Throat', icon: '👅' }, { id: 6, name: 'Runny Nose', icon: '🤧' },
    { id: 7, name: 'Nausea', icon: '🤢' }, { id: 8, name: 'Dizziness', icon: '🌀' },
    { id: 9, name: 'Chest Pain', icon: '💔' }, { id: 10, name: 'Breath', icon: '😮‍💨' },
    { id: 11, name: 'Joint Pain', icon: '🦵' }, { id: 12, name: 'Rash', icon: '🔴' },
  ];

  useEffect(() => {
    if (mainCardRef.current) mainCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentStep]);

  // --- ADDED: Handle Share Function ---
  const handleShare = async () => {
    if (navigator.share && result) {
      try {
        await navigator.share({
          title: 'My Symptom Assessment',
          text: `I used SymptoCheck. Possible condition: ${result.condition} (${result.severity})`,
        });
      } catch (err) { console.log('Share failed', err); }
    } else { 
        alert("Sharing is not supported on this browser or context."); 
    }
  };

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
                pageData: { type: 'symptom-checker', formData: formData, result: result } 
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
  };

  const handleContainerClick = () => { if (inputRef.current) inputRef.current.focus(); };

  // --- HANDLE MULTI-SELECT FOR DYNAMIC QUESTIONS ---
  const toggleDynamicOption = (field, option) => {
    setFormData(prev => {
        const currentAnswers = prev.dynamicAnswers[field] || [];
        const answerArray = Array.isArray(currentAnswers) ? currentAnswers : [currentAnswers].filter(Boolean);
        
        let newAnswers;
        if (answerArray.includes(option)) {
            newAnswers = answerArray.filter(a => a !== option);
        } else {
            newAnswers = [...answerArray, option];
        }
        return {
            ...prev,
            dynamicAnswers: { ...prev.dynamicAnswers, [field]: newAnswers }
        };
    });
  };

  const toggleSymptom = (id) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(id) ? prev.symptoms.filter(s => s !== id) : [...prev.symptoms, id]
    }));
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- NEW: AUTO-NAVIGATE ON PAIN CHECKBOX ---
  const handlePainCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    setFormData(prev => ({ ...prev, hasPain: isChecked }));

    if (isChecked) {
        // Automatically inject body map and move next
        const bodyMapStep = { 
            label: 'Pain', 
            field: 'painLocation', 
            type: 'bodyMap', 
            question: 'Tap the specific area where it hurts:' 
        };

        setSteps(prevSteps => {
            // Prevent duplication
            if (prevSteps.some(s => s.field === 'painLocation')) return prevSteps;
            const newSteps = [...prevSteps];
            newSteps.splice(currentStep + 1, 0, bodyMapStep);
            return newSteps;
        });

        // Smooth delay to show the checkmark briefly
        setTimeout(() => {
            setCurrentStep(prev => prev + 1);
        }, 300);
    }
  };

  const canProceed = () => {
    const currentStepData = steps[currentStep];
    if (!currentStepData) return false;
    const currentField = currentStepData.field;
    
    if (currentField.startsWith('dynamic_')) {
        const answer = formData.dynamicAnswers[currentField];
        if (Array.isArray(answer)) return answer.length > 0;
        return answer && answer !== '';
    }
    if (currentField === 'symptoms') return true; 
    if (currentField === 'otherSymptoms') return formData.otherSymptoms.trim() !== '';
    if (currentField === 'painLocation') return formData.painLocation !== ''; 
    return formData[currentField] !== '';
  };

  // --- AI QUESTION GENERATOR ---
  const generateFollowUpQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `
        The patient is a ${formData.age} year old ${formData.gender}.
        Primary Symptom: "${formData.otherSymptoms}".
        ${formData.hasPain ? `Pain Location: ${formData.painLocation}.` : 'Patient reported NO specific body pain.'}
        
        Generate 4-5 relevant follow-up questions.
        IMPORTANT:
        1. If a question allows multiple answers (e.g., "Which of these describe the pain?"), set "type" to "multiselect".
        2. If a question allows only one answer, set "type" to "select".
        
        Return JSON array:
        [
          { 
            "label": "Brief Label", 
            "question": "Question text?", 
            "type": "select" OR "multiselect", 
            "options": ["Option A", "Option B"] 
          }
        ]
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const cleanJson = text.substring(text.indexOf('['), text.lastIndexOf(']') + 1);
      const newQuestions = JSON.parse(cleanJson);

      const formattedQuestions = newQuestions.map((q, index) => ({
        label: q.label || `Q${index + 1}`,
        field: `dynamic_q_${index}`, 
        type: q.type || 'select',
        question: q.question,
        options: q.options 
      }));

      const currentStepsBefore = steps.slice(0, currentStep + 1);
      setSteps([...currentStepsBefore, ...formattedQuestions]);
      setCurrentStep(currentStep + 1);

    } catch (err) {
      console.error("AI Question Error", err);
      setSteps(prev => [...prev, { label: 'Details', field: 'dynamic_fallback', type: 'textarea', question: 'Please describe any other details:' }]);
      setCurrentStep(currentStep + 1);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleNext = () => {
    const currentField = steps[currentStep].field;

    // 1. Description Step - Fallback manual navigation
    if (currentField === 'otherSymptoms') {
        if (formData.hasPain) {
            // Logic handled by checkbox usually, but safe fallback
            const bodyMapStep = { label: 'Pain', field: 'painLocation', type: 'bodyMap', question: 'Point to where it hurts:' };
            setSteps(prev => {
                if (prev.some(s => s.field === 'painLocation')) return prev;
                const ns = [...prev]; ns.splice(currentStep + 1, 0, bodyMapStep); return ns;
            });
            setCurrentStep(currentStep + 1);
        } else {
            generateFollowUpQuestions();
        }
        return;
    }

    if (currentField === 'painLocation') {
        generateFollowUpQuestions();
        return;
    }

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
    if (!API_KEY) { setError("Missing API Key."); setLoading(false); return; }

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const symptomNames = formData.symptoms.map(id => symptomsList.find(s => s.id === id)?.name).join(', ');

      const dynamicQA = Object.entries(formData.dynamicAnswers).map(([key, value]) => {
         const questionObj = steps.find(s => s.field === key);
         const answerStr = Array.isArray(value) ? value.join(', ') : value;
         return `Question: ${questionObj?.question} Answer: ${answerStr}`;
      }).join('\n');

      const prompt = `
        Act as a compassionate doctor.
        PATIENT: ${formData.age}yo ${formData.gender}
        COMPLAINT: ${formData.otherSymptoms}
        PAIN LOC: ${formData.hasPain ? formData.painLocation : 'None'}
        
        ANSWERS:
        ${dynamicQA}
        
        SELECTED ICONS: ${symptomNames}

        Analyze. Return JSON:
        { 
          "condition": "Name", 
          "severity": "Low/Medium/High", 
          "confidence": "90%", 
          "description": "Patient-friendly explanation using 'You'.", 
          "urgency": "Advice", 
          "specialist": "Doctor Type", 
          "recommendations": ["Rec 1", "Rec 2"], 
          "precautions": ["Avoid 1", "Avoid 2"] 
        }
      `;

      const result = await model.generateContent(prompt);
      const cleanJson = result.response.text().substring(result.response.text().indexOf('{'), result.response.text().lastIndexOf('}') + 1);
      setResult(JSON.parse(cleanJson));
    } catch (err) {
      setError("Failed to analyze.");
    } finally {
      setLoading(false);
    }
  };

  const resetQuiz = () => {
    setCurrentStep(0); setSteps(initialSteps);
    setFormData({ age: '', gender: '', symptoms: [], otherSymptoms: '', hasPain: false, painLocation: '', dynamicAnswers: {} });
    setResult(null); setError(null); setIsSaved(false);
  };

  const handleDownload = async () => {
    const input = resultCardRef.current;
    if (!input || !result) return;
    setIsDownloading(true);
    try {
      const isDarkMode = document.querySelector('.dark-theme') !== null || document.body.classList.contains('dark-theme');
      const pdfBg = isDarkMode ? '#0f172a' : '#ffffff'; 
      const pdfText = isDarkMode ? '#f1f5f9' : '#1e293b'; 
      const originalHeight = input.scrollHeight;
      const canvas = await html2canvas(input, {
        scale: 2, useCORS: true, allowTaint: true, backgroundColor: pdfBg, windowHeight: originalHeight + 2000, y: 0, scrollY: 0, 
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement('style');
          style.innerHTML = `* { transition: none !important; animation: none !important; opacity: 1 !important; visibility: visible !important; }`;
          clonedDoc.body.appendChild(style);
          const wrapper = clonedDoc.querySelector('.results-wrapper');
          if (wrapper) { wrapper.style.height = 'auto'; wrapper.style.overflow = 'visible'; wrapper.style.maxHeight = 'none'; }
          const card = clonedDoc.querySelector('.result-card');
          if (card) { card.style.height = 'auto'; card.style.maxHeight = 'none'; card.style.overflow = 'visible'; }
          const gradients = clonedDoc.querySelectorAll('.condition-name');
          gradients.forEach(el => { el.style.background = 'none'; el.style.webkitTextFillColor = 'initial'; el.style.color = pdfText; });
          const textSelectors = ['.stat-value', '.stat-label', '.condition-meta', '.about-text', 'li span', 'h1', 'h2', 'h3', 'p', 'div'];
          textSelectors.forEach(selector => { clonedDoc.querySelectorAll(selector).forEach(el => { el.style.color = pdfText; }); });
        }
      });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: [imgWidth, imgHeight] });
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`SymptoReport-${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) { console.error("PDF Failed:", err); alert("Download failed. Please try again."); } finally { setIsDownloading(false); }
  };

  const step = steps[currentStep];

  return (
    <div className="app-container">
      {!result ? (
        <div className="content-wrapper">
          <Nev />
          <div className="main-card" ref={mainCardRef}>
            <ProgressStepper steps={steps} currentStep={currentStep} />

            <div className="step-content-animated">
                <label className="field-label">{step?.label || "Information"}</label>
                <h2 className="question-text">{step?.question}</h2>

                {step?.type === 'bodyMap' && (
                   <InteractiveBodyMap selectedPart={formData.painLocation} onSelect={(part) => updateFormData('painLocation', part)} />
                )}

                {step?.type === 'input' && (
                  <div className="input-group" onClick={handleContainerClick}>
                    <input ref={inputRef} type="number" className="medical-input" value={formData[step.field]} onChange={(e) => updateFormData(step.field, e.target.value)} placeholder="25" />
                    <span className="unit">years</span>
                  </div>
                )}

                {/* SINGLE SELECT */}
                {step?.type === 'select' && (
                  <div className="options-grid">
                    {(step.options || options[step.field])?.map((option) => (
                      <button 
                        key={option} 
                        onClick={() => {
                            if (step.field.startsWith('dynamic_')) {
                                setFormData(prev => ({ ...prev, dynamicAnswers: { ...prev.dynamicAnswers, [step.field]: option } }));
                            } else {
                                updateFormData(step.field, option);
                            }
                        }} 
                        className={`option-btn ${
                            (step.field.startsWith('dynamic_') ? formData.dynamicAnswers[step.field] : formData[step.field]) === option 
                            ? 'selected' : ''
                        }`}
                      >
                        <span>{option}</span>
                        {(step.field.startsWith('dynamic_') ? formData.dynamicAnswers[step.field] : formData[step.field]) === option && <span className="check-mark">●</span>}
                      </button>
                    ))}
                  </div>
                )}

                {/* MULTI SELECT (Dynamic Questions) */}
                {step?.type === 'multiselect' && !step.field.startsWith('symptoms') && (
                  <div className="options-grid">
                    {step.options?.map((option) => {
                        const currentAnswers = formData.dynamicAnswers[step.field] || [];
                        const isSelected = Array.isArray(currentAnswers) && currentAnswers.includes(option);
                        return (
                          <button 
                            key={option} 
                            onClick={() => toggleDynamicOption(step.field, option)} 
                            className={`option-btn ${isSelected ? 'selected' : ''}`}
                          >
                            <span>{option}</span>
                            {isSelected && <span className="check-mark"><FaCheck /></span>}
                          </button>
                        );
                    })}
                  </div>
                )}

                {step?.type === 'textarea' && (
                  <div className="textarea-container">
                      <textarea 
                        value={formData[step.field]} 
                        onChange={(e) => updateFormData(step.field, e.target.value)} 
                        placeholder="Please type here..." 
                        className="text-area-input" 
                      />
                      {step.field === 'otherSymptoms' && (
                          <div className="pain-toggle-wrapper" style={{ marginTop: '1.2rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
                              <input 
                                type="checkbox" 
                                id="pain-checkbox" 
                                checked={formData.hasPain} 
                                onChange={handlePainCheckboxChange} // NEW: AUTO-NAVIGATE HANDLER
                                style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#ef4444' }} 
                              />
                              <label htmlFor="pain-checkbox" style={{ fontSize: '1.05rem', color: '#334155', cursor: 'pointer', fontWeight: '500' }}>
                                 I have physical pain in a specific area.
                              </label>
                          </div>
                      )}
                  </div>
                )}

                {/* Common Symptoms Grid */}
                {step?.type === 'multiselect' && step.field === 'symptoms' && (
                  <div className="symptoms-grid">
                    {symptomsList.map((symptom) => (
                      <button key={symptom.id} onClick={() => toggleSymptom(symptom.id)} className={`symptom-btn ${formData.symptoms.includes(symptom.id) ? 'selected' : ''}`}>
                        <div className="symptom-icon">{symptom.icon}</div>
                        <div className="symptom-name">{symptom.name}</div>
                      </button>
                    ))}
                  </div>
                )}
            </div>

            {error && <div className="error-box"><p>{error}</p></div>}

            <div className="nav-area">
              <button onClick={handleBack} disabled={currentStep === 0} className="btn btn-back">Back</button>
              <button onClick={handleNext} disabled={!canProceed() || loading || loadingQuestions} className="btn btn-primary">
                {loadingQuestions ? 'Generating Questions...' : loading ? 'Analyzing...' : currentStep === steps.length - 1 ? 'Analyze Symptoms' : 'Continue'}
              </button>
            </div>
          </div>
          <style>{`
            .main-card { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border-radius: 24px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.08); max-width: 600px; width: 100%; margin: 0 auto; }
            .step-content-animated { animation: fadeUp 0.5s ease; }
            @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            .btn-primary { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); border: none; }
            .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4); }
          `}</style>
        </div>
      ) : (
        <div className="results-wrapper">
            <Nev />
            <div className="result-card" ref={resultCardRef}>
              <div className="result-header">
                  <span className="result-badge">Analysis Complete</span>
                  <div className="action-row" data-html2canvas-ignore="true">
                    <button onClick={handleShare} className="icon-btn" title="Share"><FaShareAlt /></button>
                    <button onClick={handleSave} className={`icon-btn ${isSaved ? 'saved-active' : ''}`} disabled={isSaved} title={isSaved ? "Saved" : "Save to Profile"}><FaSave /></button>
                    <button className="btn btn-primary" onClick={handleDownload} disabled={isDownloading} style={{ padding: '0.8rem 1.5rem', fontSize: '0.9rem' }}>{isDownloading ? 'Generating...' : <><FaFileDownload /> Save Report</>}</button>
                  </div>
              </div>
              <div className="diagnosis-section">
                <div className="diagnosis-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3C4.89543 3 4 3.89543 4 5V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V5C20 3.89543 19.1046 3 18 3H6ZM6 1H18C20.2091 1 22 2.79086 22 5V19C22 21.2091 20.2091 23 18 23H6C3.79086 23 2 21.2091 2 19V5C2 2.79086 3.79086 1 6 1Z" fillOpacity="0.5"/><path d="M11 7H13V10H16V12H13V15H11V12H8V10H11V7Z"/></svg>
                </div>
                <h1 className="condition-name">{result.condition}</h1>
                <p className="condition-meta">Possible Condition Analysis</p>
              </div>
              {result.urgency && (<div className="warning-banner"><FaExclamationTriangle className="warning-icon" /><div><strong>Recommendation: </strong>{result.urgency}</div></div>)}
              <div className="about-section"><h3 className="section-title">About this condition</h3><p className="about-text">{result.description}</p></div>
              <div className="stats-grid">
                <div className={`stat-box severity-${result.severity?.toLowerCase() || 'medium'}`}><span className="stat-label">Severity</span><span className="stat-value">{result.severity}</span></div>
                <div className="stat-box confidence-box"><span className="stat-label">AI Confidence</span><span className="stat-value">{result.confidence}</span></div>
                {result.specialist && (<div className="stat-box specialist-box"><span className="stat-label">Specialist</span><span className="stat-value" style={{fontSize: '1.3rem'}}>{result.specialist}</span></div>)}
              </div>
              <div className="actions-header"><FaCheckSquare className="check-icon-large" /><span>Recommended Actions</span></div>
              <ul className="rec-list-styled">{result.recommendations?.map((rec, idx) => (<li key={idx} className="rec-item"><div className="rec-icon-box">{idx + 1}</div><span>{rec}</span></li>))}</ul>
              {result.precautions && result.precautions.length > 0 && (<><div className="actions-header" style={{ marginTop: '2rem', color: '#dc2626' }}><FaExclamationTriangle className="check-icon-large" style={{ background: '#fef2f2', color: '#dc2626' }} /><span>Precautions</span></div><ul className="rec-list-styled">{result.precautions.map((item, idx) => (<li key={idx} className="rec-item" style={{ borderLeft: '5px solid #ef4444' }}><div className="rec-icon-box" style={{ background: '#fef2f2', color: '#dc2626' }}>✕</div><span>{item}</span></li>))}</ul></>)}
              <button onClick={resetQuiz} className="btn-restart" data-html2canvas-ignore="true">Start New Check</button>
            </div>
        </div>
      )}
    </div>
  );
}