import React, { useState, useRef } from 'react';
import { 
  FaSearch, FaPills, FaVirus, FaExclamationTriangle, 
  FaInfoCircle, FaVial, FaLungs, FaCheckSquare, 
  FaSave, FaFileDownload, FaShareAlt, FaShieldAlt, 
  FaExclamationCircle, FaPrescriptionBottleAlt,
  FaCommentSlash, FaCheckCircle, FaTimesCircle, FaQuestionCircle
} from 'react-icons/fa';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Nev from "./test.jsx"; // Your Navbar
import "./contactuscss.css";

// 🔒 API Key Logic 
// WARNING: Move this to import.meta.env.VITE_GROQ_API_KEY before deploying!
const ALL_KEYS = [
  import.meta.env.VITE_GROQ_KEY_2
];
const validKeys = ALL_KEYS.filter((key) => key && key.length > 0);
const API_KEY = validKeys.length > 0 ? validKeys[Math.floor(Math.random() * validKeys.length)] : "";

export default function MedicalDictionary() {
  const [activeTab, setActiveTab] = useState('medicine'); // 'medicine' | 'disease' | 'rumour'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // React ref for better DOM containment during PDF export
  const pdfExportRef = useRef(null);

  // --- GROQ API CALL ---
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setIsSaved(false); // Reset save state on new search

    if (!API_KEY) {
      setError("Groq API Key is missing. Please check your environment variables.");
      setLoading(false);
      return;
    }

    try {
      let systemPrompt = "";
      
      if (activeTab === 'medicine') {
        systemPrompt = `You are an expert, highly accurate medical pharmacist API. Provide medically verified information for the medicine: "${searchQuery}". 
        DO NOT hallucinate. If the medicine does not exist, return {"isValid": false}. 
        Return ONLY a valid JSON object matching this exact structure: 
        {"isValid": true, "name": "String", "type": "String", "composition": ["Array"], "purpose": "String", "uses": ["Array"], "sideEffects": ["Array"], "precautions": ["Array"], "mechanism": "String", "dosage": "String", "interactions": ["Array"]}`;
      } else if (activeTab === 'disease') {
        systemPrompt = `You are an expert, highly accurate medical diagnostic API. Provide medically verified information for the disease: "${searchQuery}". 
        DO NOT hallucinate. If the disease does not exist, return {"isValid": false}. 
        Return ONLY a valid JSON object matching this exact structure: 
        {"isValid": true, "name": "String", "overview": "String", "symptoms": ["Array"], "causes": ["Array"], "treatments": ["Array"], "riskFactors": ["Array"], "whenToSeeDoctor": "String", "prevention": ["Array"], "complications": ["Array"]}`;
      } else {
        systemPrompt = `You are an expert, highly accurate fact-checking API. Evaluate the rumour, myth, or claim: "${searchQuery}".
        If it is about health, use medical facts. If it is about general knowledge or famous personalities, use verified historical, scientific, and public records.
        Prioritize user safety. Do not promote harmful content. DO NOT hallucinate. Provide a safe, objective, and culturally aware response.
        Return ONLY a valid JSON object matching this exact structure: 
        {"isValid": true, "claim": "String", "verdict": "True, False, or Partially True", "explanation": "String", "facts": ["Array"], "originOfMyth": "String"}`;
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", 
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Provide the JSON data now. No markdown, no conversational text." }
          ],
          temperature: 0.1, 
          response_format: { type: "json_object" } 
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error?.message || "Groq API Error");

      // Safely parse JSON in case the model wraps it in markdown blocks
      let rawContent = data.choices[0].message.content;
      let parsedData;
      try {
        parsedData = JSON.parse(rawContent);
      } catch (parseErr) {
        const cleanedContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedData = JSON.parse(cleanedContent);
      }

      if (!parsedData.isValid) {
        setError(`Could not process data for "${searchQuery}". Please check the spelling or clarify your claim.`);
      } else {
        setResult(parsedData);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch accurate information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- SAVE TO DATABASE LOGIC ---
  const handleSave = async () => {
    const token = localStorage.getItem('token');
    
    // 1. Verify user is logged in
    if (!token) {
        alert("Please log in to save records to your profile.");
        return;
    }

    // 2. Prevent duplicate saves
    if (isSaved) {
        alert("This record is already saved.");
        return;
    }

    setIsSaving(true);
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    try {
      const response = await fetch(`${API_BASE_URL}/api/save-medical-record`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Added Token Header!
        },
        body: JSON.stringify({
          type: activeTab,
          query: searchQuery,
          data: result,
          savedAt: new Date().toISOString()
        })
      });
      
      const responseData = await response.json();

      if(response.ok) {
        setIsSaved(true);
        alert("✅ Data successfully saved to your profile!");
      } else {
        alert(`❌ Error: ${responseData.message}`);
      }
    } catch (err) {
      console.error("Save error", err);
      alert("❌ Failed to connect to server.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- DOWNLOAD PDF LOGIC ---
  const handleDownloadPDF = async () => {
    const input = pdfExportRef.current;
    if (!input || !result) return;
    setIsDownloading(true);
    
    try {
      const isDarkMode = document.body.classList.contains('dark-theme');
      const pdfBg = isDarkMode ? '#020617' : '#ffffff'; 
      
      // Get full scroll height to prevent cutting off content
      const originalHeight = input.scrollHeight;
      const originalWidth = input.scrollWidth;

      const canvas = await html2canvas(input, { 
        scale: 2, 
        useCORS: true,
        allowTaint: true,
        backgroundColor: pdfBg, 
        windowHeight: originalHeight + 500, 
        windowWidth: originalWidth,
        y: 0, 
        scrollY: 0,
        onclone: (clonedDoc) => {
          // 1. Force all elements to be visible and instantly stop animations
          const style = clonedDoc.createElement('style');
          style.innerHTML = `* { transition: none !important; animation: none !important; opacity: 1 !important; visibility: visible !important; transform: none !important; }`;
          clonedDoc.body.appendChild(style);
          
          // 2. Override hidden overflows so grids don't get cropped
          const exportContainer = clonedDoc.querySelector('.pdf-export-container');
          if (exportContainer) { 
            exportContainer.style.height = 'auto'; 
            exportContainer.style.overflow = 'visible'; 
            exportContainer.style.maxHeight = 'none'; 
          }
          
          const card = clonedDoc.querySelector('.dict-result-card');
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
      
      // 3. Create a dynamic-sized PDF so nothing gets clipped at the bottom
      const pdf = new jsPDF({ 
        orientation: 'p', 
        unit: 'px', 
        format: [imgWidth, imgHeight] 
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Determine file name based on tab
      let fileName = result.name ? result.name : "Fact-Check";
      pdf.save(`Sympto-${fileName.replace(/\s+/g, '-')}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Failed to generate PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  // --- SHARE LOGIC ---
  const handleShare = async () => {
    const titleName = result.name || result.claim;
    const shareText = `Check out this verified information about "${titleName}" on Sympto!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Sympto: ${titleName}`,
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing", err);
      }
    } else {
      navigator.clipboard.writeText(shareText + " " + window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="dictionary-container">
      <Nev />

      <div className="dictionary-wrapper">
        <div className="dict-header-section">
          <h1 className="dict-title">Sympto <span>Knowledge Base</span></h1>
          <p className="dict-subtitle">Search for medicines, explore diseases, or fact-check viral health and public claims.</p>

          <div className="dict-tab-container">
            <button 
              className={`dict-tab ${activeTab === 'medicine' ? 'active' : ''}`} 
              onClick={() => { setActiveTab('medicine'); setResult(null); setError(null); }}
            >
              <FaPills className="tab-icon" /> Medicine
            </button>
            <button 
              className={`dict-tab ${activeTab === 'disease' ? 'active' : ''}`} 
              onClick={() => { setActiveTab('disease'); setResult(null); setError(null); }}
            >
              <FaVirus className="tab-icon" /> Disease
            </button>
            <button 
              className={`dict-tab ${activeTab === 'rumour' ? 'active' : ''}`} 
              onClick={() => { setActiveTab('rumour'); setResult(null); setError(null); }}
            >
              <FaCommentSlash className="tab-icon" /> Fact-Check
            </button>
          </div>
        </div>

        <form className="dict-search-form" onSubmit={handleSearch}>
          <div className="dict-search-bar">
            <input 
              type="text" 
              placeholder={
                activeTab === 'medicine' ? "Search medicine (e.g., Paracetamol)..." : 
                activeTab === 'disease' ? "Search disease (e.g., Diabetes)..." :
                "Enter a claim to verify (e.g., 'Does papaya leaf cure dengue?')"
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !searchQuery.trim()} className="dict-search-btn">
              {loading ? <span className="loader-spinner">...</span> : 'Search'}
            </button>
          </div>
        </form>

        {error && (
          <div className="dict-error-box">
            <FaExclamationTriangle /> {error}
          </div>
        )}

        {result && !loading && (
          <div className="dict-result-card slide-up">
            
            {/* The Area that gets converted to PDF (Using React Ref) */}
            <div ref={pdfExportRef} className="pdf-export-container">
              
              <div className="medical-disclaimer">
                <FaExclamationTriangle />
                <p><strong>Disclaimer:</strong> This information is generated by AI for educational purposes only and should NOT be used for self-diagnosis or treatment. Always consult a qualified healthcare provider.</p>
              </div>

              {/* ✨ UPDATED HEADER WITH ACTION BUTTONS */}
              <div className="result-header" style={{ flexWrap: 'wrap', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.8rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <div className="result-icon-box" style={{ margin: 0 }}>
                    {activeTab === 'medicine' && <FaPills />}
                    {activeTab === 'disease' && <FaVirus />}
                    {activeTab === 'rumour' && <FaQuestionCircle />}
                  </div>
                  <div className="result-title-area">
                    <h2>{activeTab === 'rumour' ? "Claim Verified" : result.name}</h2>
                    {result.type && <span className="type-badge">{result.type}</span>}
                    {activeTab === 'rumour' && (
                      <span className={`type-badge verdict-badge ${result.verdict.toLowerCase().includes('true') ? 'true-verdict' : 'false-verdict'}`}>
                        {result.verdict}
                      </span>
                    )}
                  </div>
                </div>

                {/* --- NEW ACTION ROW --- */}
                <div className="action-row" data-html2canvas-ignore="true">
                  <button onClick={handleShare} className="icon-btn-custom" title="Share">
                    <FaShareAlt size={18} />
                  </button>
                  <button 
                    onClick={handleSave} 
                    className={`icon-btn-custom ${isSaved ? 'saved-active' : ''}`} 
                    disabled={isSaved || isSaving} 
                    title={isSaved ? "Saved" : "Save to Profile"}
                  >
                    {isSaved ? <FaCheckCircle size={18} /> : <FaSave size={18} />}
                  </button>
                  <button className="btn-primary-custom" onClick={handleDownloadPDF} disabled={isDownloading}>
                    {isDownloading ? 'Generating...' : <><FaFileDownload size={18} /> Save Report</>}
                  </button>
                </div>
              </div>
              
              {/* --- MEDICINE LAYOUT --- */}
              {activeTab === 'medicine' && (
                <div className="result-content-grid">
                  <div className="info-block full-width">
                    <h3><FaInfoCircle /> Purpose</h3>
                    <p>{result.purpose}</p>
                  </div>
                  
                  <div className="info-block">
                    <h3><FaPrescriptionBottleAlt className="icon-blue" /> General Dosage</h3>
                    <p>{result.dosage || "Consult a physician for specific dosage."}</p>
                  </div>
                  
                  <div className="info-block">
                    <h3><FaVial /> Composition</h3>
                    <ul className="modern-list">{result.composition?.map((item, i) => <li key={i}>{item}</li>)}</ul>
                  </div>

                  <div className="info-block">
                    <h3><FaCheckSquare className="icon-green" /> Uses</h3>
                    <ul className="modern-list check-list">{result.uses?.map((item, i) => <li key={i}>{item}</li>)}</ul>
                  </div>

                  <div className="info-block">
                    <h3><FaExclamationTriangle className="icon-yellow" /> Side Effects</h3>
                    <ul className="modern-list warning-list">{result.sideEffects?.map((item, i) => <li key={i}>{item}</li>)}</ul>
                  </div>

                  <div className="info-block">
                    <h3><FaExclamationCircle className="icon-purple" /> Drug Interactions</h3>
                    <ul className="modern-list">{result.interactions?.map((item, i) => <li key={i}>{item}</li>)}</ul>
                  </div>

                  <div className="info-block">
                    <h3><FaInfoCircle className="icon-red" /> Precautions</h3>
                    <ul className="modern-list alert-list">{result.precautions?.map((item, i) => <li key={i}>{item}</li>)}</ul>
                  </div>

                  <div className="info-block full-width highlight-block">
                    <h3>How it works (Mechanism)</h3>
                    <p>{result.mechanism}</p>
                  </div>
                </div>
              )}

              {/* --- DISEASE LAYOUT --- */}
              {activeTab === 'disease' && (
                 <div className="result-content-grid">
                 <div className="info-block full-width">
                   <h3><FaInfoCircle /> Overview</h3>
                   <p>{result.overview}</p>
                 </div>

                 <div className="info-block">
                   <h3><FaLungs className="icon-yellow" /> Symptoms</h3>
                   <ul className="modern-list warning-list">{result.symptoms?.map((item, i) => <li key={i}>{item}</li>)}</ul>
                 </div>

                 <div className="info-block">
                   <h3><FaVial /> Causes</h3>
                   <ul className="modern-list">{result.causes?.map((item, i) => <li key={i}>{item}</li>)}</ul>
                 </div>

                 <div className="info-block">
                   <h3><FaCheckSquare className="icon-green" /> Treatments / Management</h3>
                   <ul className="modern-list check-list">{result.treatments?.map((item, i) => <li key={i}>{item}</li>)}</ul>
                 </div>

                 <div className="info-block">
                   <h3><FaShieldAlt className="icon-blue" /> Prevention</h3>
                   <ul className="modern-list">{result.prevention?.map((item, i) => <li key={i}>{item}</li>)}</ul>
                 </div>

                 <div className="info-block">
                   <h3><FaExclamationCircle className="icon-purple" /> Complications</h3>
                   <ul className="modern-list">{result.complications?.map((item, i) => <li key={i}>{item}</li>)}</ul>
                 </div>

                 <div className="info-block">
                   <h3><FaExclamationTriangle className="icon-red" /> Risk Factors</h3>
                   <ul className="modern-list alert-list">{result.riskFactors?.map((item, i) => <li key={i}>{item}</li>)}</ul>
                 </div>

                 <div className="info-block full-width highlight-block red-highlight">
                   <h3>When to see a doctor</h3>
                   <p>{result.whenToSeeDoctor}</p>
                 </div>
               </div>
              )}

              {/* --- RUMOUR FACT-CHECK LAYOUT --- */}
              {activeTab === 'rumour' && (
                <div className="result-content-grid">
                  <div className="info-block full-width">
                    <h3><FaCommentSlash /> The Claim</h3>
                    <p className="claim-text">"{result.claim}"</p>
                  </div>

                  <div className="info-block full-width highlight-block">
                    <h3><FaInfoCircle /> Explanation</h3>
                    <p>{result.explanation}</p>
                  </div>

                  <div className="info-block">
                    <h3><FaCheckCircle className="icon-green" /> Verified Facts</h3>
                    <ul className="modern-list check-list">
                      {result.facts?.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>

                  <div className="info-block">
                    <h3><FaExclamationCircle className="icon-yellow" /> Origin / Context of Myth</h3>
                    <p>{result.originOfMyth}</p>
                  </div>
                </div>
              )}

            </div>

            {/* ✨ STYLES FOR THE NEW BUTTONS */}
            <style>{`
              .action-row { 
                display: flex; gap: 12px; align-items: center; margin-left: auto; flex-wrap: wrap; justify-content: center; 
              }
              .icon-btn-custom { 
                display: flex; align-items: center; justify-content: center; 
                width: 44px; height: 44px; border-radius: 50%; 
                background: var(--bg-tab-container); border: 1px solid var(--border-light); 
                color: var(--text-muted); font-size: 1.1rem; cursor: pointer; transition: all 0.3s ease; 
              }
              /* FIX: Force SVGs to render at the correct size */
              .icon-btn-custom svg {
                min-width: 18px;
                min-height: 18px;
                fill: currentColor;
              }
              .icon-btn-custom:hover { 
                background: var(--bg-card); color: var(--primary); transform: translateY(-3px); 
                box-shadow: var(--shadow-sm); border-color: var(--primary); 
              }
              .icon-btn-custom.saved-active { 
                color: var(--success-text); background: var(--success-bg); 
                border-color: rgba(16, 185, 129, 0.4); pointer-events: none; 
              }
              .btn-primary-custom { 
                display: flex; align-items: center; gap: 8px; padding: 0.8rem 1.5rem; 
                border-radius: 14px; background: var(--primary); color: #ffffff !important; 
                border: none; font-size: 0.95rem; font-weight: 700; cursor: pointer; 
                transition: all 0.3s ease; box-shadow: 0 4px 15px var(--primary-glow); 
              }
              .btn-primary-custom svg {
                min-width: 18px;
                min-height: 18px;
              }
              .btn-primary-custom:hover:not(:disabled) { 
                transform: translateY(-3px); box-shadow: 0 8px 25px var(--primary-glow); filter: brightness(1.1); 
              }
              .btn-primary-custom:disabled { opacity: 0.7; cursor: not-allowed; }
              
              @media (max-width: 768px) {
                 .action-row { margin-left: 0; margin-top: 15px; width: 100%; justify-content: center; }
                 .btn-primary-custom { flex: 1; justify-content: center; }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
}