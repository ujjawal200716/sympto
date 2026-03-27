import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { 
  MapPin, Navigation, Check, AlertTriangle, FileText, 
  ExternalLink, Stethoscope, User, Trash2, ArrowLeft, 
  Activity, ShieldAlert, Thermometer, X, Info,
  Download, MessageSquare, Pill, AlertCircle, CheckCircle, Bug
} from 'lucide-react'; 
import './savedpage.css';
import logo1 from './logo1.png';
import Nav from './test.jsx'; 

const SavedPages = () => {
  const [savedItems, setSavedItems] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [isDetailView, setIsDetailView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate(); 

  // --- Filter State ---
  const [filterType, setFilterType] = useState("All");

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // --- Dynamic CSS Variables for Theming ---
  const themeStyles = `
    /* Default (Light Mode) Variables */
    :root {
      --an-bg: #ffffff;
      --an-text: #1e293b;
      --an-subtext: #64748b;
      --an-card-bg: #ffffff;
      --an-card-border: #f1f5f9;
      --an-title: #0ea5e9;
      --an-heading: #0f172a;
      --an-action-bg: #ffffff;
      --an-action-border: #e2e8f0;
      
      --chat-bg: #ffffff;
      --chat-text: #1f2937;
      --chat-border: #e2e8f0;
      --chat-avatar-bg: #f3f4f6;
      
      --sidebar-bg: #f8fafc;
      --sidebar-text: inherit;
    }

    /* Dark Mode Overrides */
    .dark-theme, .dark-theme body, body.dark-theme {
      --an-bg: #0f172a;
      --an-text: #e2e8f0;
      --an-subtext: #94a3b8;
      --an-card-bg: #1e293b;
      --an-card-border: #334155;
      --an-title: #38bdf8;
      --an-heading: #f8fafc;
      --an-action-bg: #1e293b;
      --an-action-border: #334155;

      --chat-bg: #111827;
      --chat-text: #e5e7eb;
      --chat-border: #374151;
      --chat-avatar-bg: #1f2937;
      
      --sidebar-bg: #1e293b;
      --sidebar-text: #ffffff;
    }
  `;

  // --- Fetch Logic ---
  useEffect(() => {
    const fetchSavedPages = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError("You are not logged in.");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/my-saved-pages`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error('Failed to fetch data');

        const data = await response.json();
        setSavedItems(data);
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Could not load your saved pages.");
        setLoading(false);
      }
    };

    fetchSavedPages();
  }, [API_BASE_URL]);

  // --- Filtering Logic ---
  const uniqueTypes = useMemo(() => {
    const types = savedItems
      .map(item => item.informationType)
      .filter(type => type && type.trim() !== ""); 
    return ["All", ...new Set(types)];
  }, [savedItems]);

  const filteredItems = savedItems.filter(item => {
    return filterType === "All" || item.informationType === filterType;
  });

  // --- Handlers ---
  const handleViewDetail = (item) => {
    setActiveItem(item);
    setIsDetailView(true);
  };

  const handleBackToLibrary = () => {
    setIsDetailView(false);
    setActiveItem(null);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); 
    e.preventDefault(); 

    if (!window.confirm("Are you sure you want to delete this saved page?")) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/my-saved-pages/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        setSavedItems(prevItems => prevItems.filter(item => item._id !== id));
        if (activeItem && activeItem._id === id) {
          handleBackToLibrary();
        }
      } else {
        const errData = await response.json();
        alert(`Failed to delete: ${errData.message || response.statusText}`);
      }
    } catch (err) {
      console.error("Delete error", err);
      alert("Error contacting server to delete item.");
    }
  };

  // --- HELPER: Parse Data Safe ---
  const parseContentSafe = (content) => {
      let rawData = content;
      try {
          if (typeof rawData === 'string') rawData = JSON.parse(rawData);
          if (typeof rawData === 'string') rawData = JSON.parse(rawData); 
      } catch (e) { console.error("Parse error", e); }
      return rawData?.result || rawData?.data || rawData?.analysis || rawData || {};
  };

  // --- ACTION: Download Report ---
  const handleDownload = (item) => {
    const data = parseContentSafe(item.content);
    let htmlContent = '';
    const infoTypeSafe = String(item.informationType).toLowerCase();

    // CSS to embed in the HTML file so it looks like the report
    const styleBlock = `
      <style>
        body { font-family: 'Inter', sans-serif; color: #1e293b; background: #fff; padding: 40px; max-width: 900px; margin: 0 auto; }
        h1 { color: #0ea5e9; font-size: 2.5rem; text-align: center; margin-bottom: 10px; }
        .sub-header { text-align: center; color: #64748b; font-size: 1.1rem; margin-bottom: 40px; text-transform: uppercase; font-weight: bold; }
        .warning-box { background: #fff7ed; border-left: 5px solid #f97316; padding: 20px; border-radius: 8px; margin-bottom: 30px; color: #9a3412; }
        .metrics-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 40px; }
        .metric-card { border: 1px solid #e2e8f0; padding: 20px; text-align: center; border-radius: 12px; }
        .metric-label { font-weight: bold; color: #94a3b8; font-size: 0.8rem; text-transform: uppercase; display: block; margin-bottom: 5px; }
        .metric-value { font-size: 1.5rem; font-weight: 800; color: #0f172a; }
        .section-title { color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-top: 30px; margin-bottom: 20px; }
        .list-item { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin-bottom: 10px; border-radius: 8px; }
        
        /* Chat Styles */
        .chat-msg { margin-bottom: 15px; padding: 15px; border-radius: 12px; line-height: 1.5; }
        .user-msg { background: #eff6ff; color: #1e3a8a; text-align: right; border: 1px solid #bfdbfe; }
        .ai-msg { background: #f9fafb; color: #374151; border: 1px solid #e5e7eb; }
        .timestamp { text-align: center; color: #94a3b8; font-size: 0.8rem; margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px;}
      </style>
    `;

    const renderList = (arr) => Array.isArray(arr) ? arr.map(a => `<div class="list-item">• ${a}</div>`).join('') : `<div class="list-item">${arr || 'N/A'}</div>`;

    if (infoTypeSafe.includes('analysis') && !infoTypeSafe.includes('advanced')) {
        // Deep Flatten for Analysis Download
        let flatData = { ...data };
        if (data.pageData) flatData = { ...flatData, ...data.pageData };
        if (data.assessmentResult) flatData = { ...flatData, ...data.assessmentResult };
        if (flatData.pageData?.assessmentResult) flatData = { ...flatData, ...flatData.pageData.assessmentResult };

        const keys = Object.keys(flatData);
        const find = (arr) => { for(let k of arr) { const f = keys.find(key=>key.toLowerCase().includes(k)); if(f) return flatData[f]; } return null; };
        
        const condition = flatData.activeCheckUp || find(['condition','disease', 'prediction']) || item.title || "Health Assessment";
        const severity = flatData.likelihood || find(['severity','level', 'likelihood']) || "Unknown";
        const confidence = flatData.confidence || find(['confidence']) || "85%";
        const specialist = flatData.specialist || find(['specialist']) || "General Practitioner";
        const desc = flatData.details || flatData.summary || find(['description','summary', 'about']) || "";
        
        let rec = flatData.immediate_actions || find(['recommendation','advice']);
        if(Array.isArray(rec)) rec = rec.join(', ');

        let actions = [];
        if (flatData.medical_requirements) actions.push(...flatData.medical_requirements);
        if (flatData.lifestyle_changes) actions.push(...flatData.lifestyle_changes);
        if (actions.length === 0) actions = find(['recommendations','actions','steps']) || [];

        const precautions = flatData.preventive_measures || find(['precautions','avoid']) || [];

        htmlContent = `
          <html><head><title>Report - ${condition}</title>${styleBlock}</head><body>
            <h1>${condition}</h1>
            <div class="sub-header">Medical Analysis Report</div>
            <div class="warning-box"><strong>Recommendation:</strong> ${rec}</div>
            <div class="metrics-grid">
              <div class="metric-card"><span class="metric-label">Severity / Likelihood</span><span class="metric-value" style="color:${String(severity).toLowerCase().includes('high')?'#ef4444':'#0f172a'}">${severity}</span></div>
              <div class="metric-card"><span class="metric-label">Confidence</span><span class="metric-value">${confidence}</span></div>
              <div class="metric-card"><span class="metric-label">Specialist</span><span class="metric-value">${specialist}</span></div>
            </div>
            <h2 class="section-title">Description</h2><p>${desc}</p>
            <h2 class="section-title">Recommended Actions</h2>${renderList(actions)}
            <h2 class="section-title">Precautions</h2>${renderList(precautions)}
            <div class="timestamp">Generated by Sympto on ${new Date().toLocaleString()}</div>
          </body></html>
        `;
    } else if (['medicine', 'disease', 'rumour'].includes(infoTypeSafe)) {
        // Medical Dictionary HTML Construction
        let sections = '';
        if (infoTypeSafe === 'medicine') {
            sections = `
                <h2 class="section-title">Purpose</h2><p>${data.purpose}</p>
                <h2 class="section-title">Dosage</h2><p>${data.dosage}</p>
                <h2 class="section-title">Composition</h2>${renderList(data.composition)}
                <h2 class="section-title">Uses</h2>${renderList(data.uses)}
                <h2 class="section-title">Side Effects</h2>${renderList(data.sideEffects)}
                <h2 class="section-title">Interactions</h2>${renderList(data.interactions)}
                <h2 class="section-title">Precautions</h2>${renderList(data.precautions)}
                <h2 class="section-title">Mechanism</h2><p>${data.mechanism}</p>
            `;
        } else if (infoTypeSafe === 'disease') {
            sections = `
                <h2 class="section-title">Overview</h2><p>${data.overview}</p>
                <h2 class="section-title">Symptoms</h2>${renderList(data.symptoms)}
                <h2 class="section-title">Causes</h2>${renderList(data.causes)}
                <h2 class="section-title">Treatments</h2>${renderList(data.treatments)}
                <h2 class="section-title">Prevention</h2>${renderList(data.prevention)}
                <h2 class="section-title">Complications</h2>${renderList(data.complications)}
                <h2 class="section-title">Risk Factors</h2>${renderList(data.riskFactors)}
                <div class="warning-box"><strong>When to see a doctor:</strong> ${data.whenToSeeDoctor}</div>
            `;
        } else if (infoTypeSafe === 'rumour') {
            const isTrue = data.verdict?.toLowerCase().includes('true');
            sections = `
                <div class="warning-box" style="border-color:${isTrue ? '#10b981' : '#ef4444'}; color:${isTrue ? '#059669' : '#b91c1c'}; background:${isTrue ? '#ecfdf5' : '#fef2f2'}">
                  <strong>Verdict:</strong> ${data.verdict}
                </div>
                <h2 class="section-title">The Claim</h2><p style="font-size:1.2rem; font-style:italic">"${data.claim}"</p>
                <h2 class="section-title">Explanation</h2><p>${data.explanation}</p>
                <h2 class="section-title">Verified Facts</h2>${renderList(data.facts)}
                <h2 class="section-title">Origin of Myth</h2><p>${data.originOfMyth}</p>
            `;
        }

        htmlContent = `
          <html><head><title>Sympto - ${item.title}</title>${styleBlock}</head><body>
            <h1>${item.title}</h1>
            <div class="sub-header">${item.informationType} INFORMATION</div>
            ${sections}
            <div class="timestamp">Exported from Sympto Knowledge Base on ${new Date().toLocaleString()}</div>
          </body></html>
        `;
    } else {
        // Advanced Analysis (Chat) HTML Construction
        const messages = data.messages || (Array.isArray(data) ? data : []);
        htmlContent = `
          <html><head><title>Chat Export</title>${styleBlock}</head><body>
            <h1>Consultation Transcript</h1>
            <div class="sub-header">${item.title}</div>
            <div style="max-width: 800px; margin: 0 auto;">
              ${messages.map(m => `
                <div class="chat-msg ${m.role === 'user' ? 'user-msg' : 'ai-msg'}">
                  <strong>${m.role === 'user' ? 'You' : 'Sympto Assistant'}:</strong><br/>
                  ${m.content.replace(/\n/g, '<br/>')}
                </div>
              `).join('')}
            </div>
            <div class="timestamp">Exported from Sympto on ${new Date().toLocaleString()}</div>
          </body></html>
        `;
    }

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const element = document.createElement("a");
    element.href = URL.createObjectURL(blob);
    element.download = `${item.title.replace(/\s+/g, '_') || 'report'}.html`; 
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // --- ACTION: Load into Chat ---
  const handleLoadChat = (item) => {
      const data = parseContentSafe(item.content);
      const messages = data.messages || (Array.isArray(data) ? data : []);
      navigate('/advancedanalysis', { state: { importedMessages: messages } });
  };

  // --- RENDER CONTENT HELPER ---
  const renderItemContent = (item) => {
    const { content, informationType } = item;
    const infoTypeSafe = String(informationType).toLowerCase();

    // 1. HOSPITAL / APPOINTMENT LOCATION
    if (infoTypeSafe === 'hospital-location') {
        const address = content?.address || content?.vicinity || "Address unavailable";
        const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

        return (
            <div className="location-detail-card" style={{ padding: '25px', background: 'var(--an-card-bg)', borderRadius: '16px', border: '1px solid var(--an-card-border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px'}}>
                   <div style={{background:'rgba(37, 99, 235, 0.1)', padding:'12px', borderRadius:'12px', color:'var(--an-title)'}}>
                      <MapPin size={24} />
                   </div>
                   <div>
                      <h3 style={{ margin: 0, color: 'var(--an-heading)', fontSize:'1.25rem' }}>{content.name || item.title}</h3>
                      <span style={{color:'var(--an-subtext)', fontSize:'0.9rem'}}>Healthcare Provider</span>
                   </div>
                </div>
                
                <div style={{ marginBottom:'25px', padding:'15px', background:'var(--an-action-bg)', borderRadius:'8px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'var(--an-subtext)' }}>
                        <MapPin size={18} style={{marginTop:'3px'}} />
                        <span style={{ fontSize: '1.05rem', lineHeight:'1.5' }}>{address}</span>
                    </div>
                    {content.rating && (
                        <div style={{ marginTop: '12px', display:'flex', alignItems:'center', gap:'6px', fontWeight: '600', color: '#f59e0b' }}>
                            <span>Rating:</span>
                            <span style={{background:'rgba(245, 158, 11, 0.1)', padding:'2px 8px', borderRadius:'4px', border:'1px solid #fcd34d'}}>{content.rating} ⭐</span>
                        </div>
                    )}
                </div>

                <a 
                    href={mapLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-action btn-green"
                    style={{ 
                        display: 'flex', justifyContent:'center', alignItems: 'center', gap: '10px', 
                        padding: '14px 24px', background: 'var(--an-title)', color: 'white', 
                        textDecoration: 'none', borderRadius: '12px', fontWeight: '600',
                        transition: 'background 0.2s'
                    }}
                >
                    <Navigation size={18} />
                    Get Directions on Google Maps
                </a>
            </div>
        );
    }

    // 2. MEDICAL NEWS
    if (infoTypeSafe === 'medical news') {
        const news = typeof content === 'string' ? JSON.parse(content) : content;
        return (
             <div className="news-detail-view" style={{ padding: '0 10px' }}>
                 <div style={{ marginBottom: '20px' }}>
                     <span style={{ background: 'rgba(147, 51, 234, 0.1)', color: '#a855f7', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', textTransform:'uppercase' }}>
                       Medical Article
                     </span>
                 </div>
                 <h2 style={{ fontSize: '1.8rem', color: 'var(--an-heading)', marginBottom: '15px', lineHeight:'1.3' }}>
                    {news.title || item.title}
                 </h2>
                 {news.urlToImage && (
                    <img src={news.urlToImage} alt="News" style={{width:'100%', height:'250px', objectFit:'cover', borderRadius:'12px', marginBottom:'20px'}} />
                 )}
                 <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: 'var(--an-subtext)', marginBottom: '25px' }}>
                    {news.description || news.content || "No summary available for this article."}
                 </p>
                 {news.url && (
                    <a href={news.url} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:'8px', textDecoration:'none', color:'var(--an-title)', fontWeight:'600', fontSize:'1.05rem' }}>
                        Read Full Article <ExternalLink size={16} />
                    </a>
                 )}
             </div>
        );
    }

    // 3. MEDICAL DICTIONARY (Medicine, Disease, Rumour)
    if (['medicine', 'disease', 'rumour'].includes(infoTypeSafe)) {
        const data = parseContentSafe(content);

        const renderList = (items, type = 'default') => {
            if (!items || !Array.isArray(items) || items.length === 0) return <p style={{ color: 'var(--an-subtext)', fontStyle: 'italic' }}>None listed.</p>;
            return (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {items.map((item, i) => {
                        let icon = '•';
                        let badgeBg = 'var(--an-action-bg)';
                        let iconColor = 'var(--an-title)';
                        
                        if (type === 'check') { icon = '✓'; badgeBg = 'rgba(16, 185, 129, 0.15)'; iconColor = '#10b981'; }
                        if (type === 'warning') { icon = '!'; badgeBg = 'rgba(245, 158, 11, 0.15)'; iconColor = '#f59e0b'; }
                        if (type === 'alert') { icon = '✕'; badgeBg = 'rgba(239, 68, 68, 0.15)'; iconColor = '#ef4444'; }

                        return (
                            <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', color: 'var(--an-subtext)', lineHeight: '1.6' }}>
                                <span style={{ background: badgeBg, color: iconColor, padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', marginTop: '2px' }}>
                                    {icon}
                                </span>
                                <span>{item}</span>
                            </li>
                        )
                    })}
                </ul>
            );
        };

        const InfoBlock = ({ title, icon: Icon, children, fullWidth }) => (
            <div style={{
                background: 'var(--an-card-bg)',
                padding: '24px',
                borderRadius: '20px',
                border: '1px solid var(--an-card-border)',
                gridColumn: fullWidth ? '1 / -1' : 'auto',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
            }}>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--an-heading)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {Icon && <Icon size={22} color="var(--an-title)" />}
                    {title}
                </h3>
                <div style={{ color: 'var(--an-subtext)', lineHeight: '1.6', fontSize: '1.05rem' }}>{children}</div>
            </div>
        );

        return (
            <div className="medical-dict-saved">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ background: 'rgba(14, 165, 233, 0.15)', color: 'var(--an-title)', padding: '6px 14px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {informationType}
                        </span>
                        {data.verdict && (
                            <span style={{ 
                                background: data.verdict.toLowerCase().includes('true') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                                color: data.verdict.toLowerCase().includes('true') ? '#10b981' : '#ef4444', 
                                padding: '6px 14px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase' 
                            }}>
                                Verdict: {data.verdict}
                            </span>
                        )}
                    </div>
                    <button 
                        onClick={() => handleDownload(item)}
                        style={{
                            padding: '10px 20px', borderRadius: '8px', 
                            background: 'var(--an-title)', color: 'white', border: 'none',
                            cursor: 'pointer', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        <Download size={18} /> Download Report
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    {infoTypeSafe === 'medicine' && (
                        <>
                            <InfoBlock title="Purpose" icon={Info} fullWidth><p>{data.purpose}</p></InfoBlock>
                            <InfoBlock title="General Dosage" icon={Pill}><p>{data.dosage}</p></InfoBlock>
                            <InfoBlock title="Composition" icon={FileText}>{renderList(data.composition)}</InfoBlock>
                            <InfoBlock title="Uses" icon={CheckCircle}>{renderList(data.uses, 'check')}</InfoBlock>
                            <InfoBlock title="Side Effects" icon={AlertTriangle}>{renderList(data.sideEffects, 'warning')}</InfoBlock>
                            <InfoBlock title="Drug Interactions" icon={AlertCircle}>{renderList(data.interactions)}</InfoBlock>
                            <InfoBlock title="Precautions" icon={ShieldAlert}>{renderList(data.precautions, 'alert')}</InfoBlock>
                            <InfoBlock title="How it works (Mechanism)" icon={Activity} fullWidth><p>{data.mechanism}</p></InfoBlock>
                        </>
                    )}

                    {infoTypeSafe === 'disease' && (
                        <>
                            <InfoBlock title="Overview" icon={Info} fullWidth><p>{data.overview}</p></InfoBlock>
                            <InfoBlock title="Symptoms" icon={AlertTriangle}>{renderList(data.symptoms, 'warning')}</InfoBlock>
                            <InfoBlock title="Causes" icon={Bug}>{renderList(data.causes)}</InfoBlock>
                            <InfoBlock title="Treatments / Management" icon={CheckCircle}>{renderList(data.treatments, 'check')}</InfoBlock>
                            <InfoBlock title="Prevention" icon={ShieldAlert}>{renderList(data.prevention)}</InfoBlock>
                            <InfoBlock title="Complications" icon={AlertCircle}>{renderList(data.complications)}</InfoBlock>
                            <InfoBlock title="Risk Factors" icon={AlertTriangle}>{renderList(data.riskFactors, 'alert')}</InfoBlock>
                            <InfoBlock title="When to see a doctor" icon={Activity} fullWidth><p style={{ color: '#ef4444', fontWeight: '500' }}>{data.whenToSeeDoctor}</p></InfoBlock>
                        </>
                    )}

                    {infoTypeSafe === 'rumour' && (
                        <>
                            <InfoBlock title="The Claim" icon={MessageSquare} fullWidth>
                                <p style={{ fontSize: '1.2rem', fontStyle: 'italic', borderLeft: '4px solid var(--an-title)', paddingLeft: '15px' }}>"{data.claim}"</p>
                            </InfoBlock>
                            <InfoBlock title="Explanation" icon={Info} fullWidth><p>{data.explanation}</p></InfoBlock>
                            <InfoBlock title="Verified Facts" icon={CheckCircle}>{renderList(data.facts, 'check')}</InfoBlock>
                            <InfoBlock title="Origin / Context of Myth" icon={AlertCircle}><p>{data.originOfMyth}</p></InfoBlock>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // 4. ANALYSIS REPORT
    if (infoTypeSafe.includes('analysis') && !infoTypeSafe.includes('advanced')) {
        
        const data = parseContentSafe(content);
        
        // --- 🚀 NEW FIX: DEEP MERGE NESTED DATA --- 
        // This guarantees that no matter how nested the data is in the DB, we can find it.
        let flatData = { ...data };
        if (data.pageData) flatData = { ...flatData, ...data.pageData };
        if (data.assessmentResult) flatData = { ...flatData, ...data.assessmentResult };
        if (flatData.pageData && flatData.pageData.assessmentResult) flatData = { ...flatData, ...flatData.pageData.assessmentResult };

        // --- STEP 2: FLEXIBLE DATA FINDER ---
        const findData = (possibleKeys) => {
            if (!flatData) return null;
            const keys = Object.keys(flatData);
            for (let target of possibleKeys) {
                const found = keys.find(k => k.toLowerCase() === target.toLowerCase() || k.toLowerCase().includes(target.toLowerCase()));
                if (found && flatData[found]) return flatData[found];
            }
            return null;
        };

        // --- EXTRACT FIELDS ---
        const conditionName = flatData.activeCheckUp || findData(['condition', 'disease', 'prediction', 'activeCheckUp']) || item.title || "Health Assessment";
        const severityVal = flatData.likelihood || findData(['severity', 'level', 'likelihood']) || "Unknown";
        const confidenceVal = flatData.confidence || findData(['confidence', 'accuracy', 'probability']);
        const specialistVal = flatData.specialist || findData(['specialist', 'doctor']);
        
        const descriptionText = flatData.details || flatData.summary || findData(['description', 'summary', 'about', 'details']) || "No description available.";
        
        let recommendationText = flatData.immediate_actions || findData(['recommendation', 'advice', 'conclusion', 'immediate_actions']);
        if (Array.isArray(recommendationText) && recommendationText.length > 0) {
            recommendationText = recommendationText.join(', ');
        } else if (!recommendationText) {
            recommendationText = "Monitor symptoms closely.";
        }

        const parseList = (rawInput) => {
            if (!rawInput) return [];
            if (Array.isArray(rawInput)) return rawInput;
            if (typeof rawInput === 'string') {
                return rawInput.split(/\n|•|- |\d+\.\s/)
                    .map(s => s.trim())
                    .filter(s => s.length > 3);
            }
            return [];
        };

        let actionsList = [];
        if (flatData.medical_requirements) actionsList.push(...flatData.medical_requirements);
        if (flatData.lifestyle_changes) actionsList.push(...flatData.lifestyle_changes);
        
        if (actionsList.length === 0) {
            actionsList = parseList(findData(['recommendations', 'actions', 'recommendedActions', 'treatment', 'steps']));
        }
        
        const precautionsList = parseList(flatData.preventive_measures || findData(['precautions', 'warnings', 'avoid', 'preventive_measures']));

        // Colors
        const isHighSeverity = String(severityVal).toLowerCase().includes('high');
        const severityColor = isHighSeverity ? '#ef4444' : 'var(--an-heading)'; 

        return (
            <div className="analysis-paper" style={{ 
                background: 'var(--an-bg)', maxWidth:'100%', fontFamily: '"Inter", sans-serif', color: 'var(--an-text)',
                transition: 'background 0.3s, color 0.3s'
            }}>
                {/* Header Title */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--an-title)', marginBottom: '10px', lineHeight: '1.1' }}>
                        {conditionName}
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--an-subtext)', fontWeight: '500', marginBottom: '20px' }}>
                        Possible Condition Analysis
                    </p>

                    {/* --- BUTTON 1: DOWNLOAD REPORT (Simple Analysis) --- */}
                    <button 
                      onClick={() => handleDownload(item)}
                      style={{
                        padding: '10px 20px', borderRadius: '8px', 
                        background: 'var(--an-title)', color: 'white', border: 'none',
                        cursor: 'pointer', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px'
                      }}
                    >
                      <Download size={18} /> Download Report
                    </button>
                </div>

                {/* Recommendation Warning Box */}
                {recommendationText && (
                  <div style={{ 
                      background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.3)', borderLeft: '5px solid #f97316',
                      borderRadius: '8px', padding: '24px', marginBottom: '40px', display: 'flex', gap: '16px', alignItems: 'flex-start'
                  }}>
                      <div style={{ background: 'rgba(234, 88, 12, 0.2)', padding: '8px', borderRadius: '50%', color: '#ea580c', marginTop: '2px' }}>
                          <AlertTriangle size={24} />
                      </div>
                      <div>
                          <p style={{ margin: 0, color: '#ea580c', fontSize: '1.05rem', lineHeight: '1.6', fontWeight: '500' }}>
                              <strong>Recommendation:</strong> {Array.isArray(recommendationText) ? recommendationText.join(', ') : recommendationText}
                          </p>
                      </div>
                  </div>
                )}

                {/* About Section */}
                <div style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--an-heading)', marginBottom: '15px' }}>
                        About this condition
                    </h2>
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--an-subtext)' }}>
                        {descriptionText}
                    </p>
                </div>

                {/* --- METRICS GRID --- */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '20px', 
                    marginBottom: '40px',
                    width: '100%'
                }}>
                    {/* Severity */}
                    <div style={{ background: 'var(--an-card-bg)', padding: '30px 20px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid var(--an-card-border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <span style={{ display:'block', fontSize:'0.8rem', fontWeight:'700', color:'var(--an-subtext)', textTransform:'uppercase', marginBottom: '10px' }}>SEVERITY / LIKELIHOOD</span>
                        <h3 style={{ fontSize:'1.8rem', fontWeight:'800', color: severityColor, margin: 0 }}>{severityVal}</h3>
                    </div>
                    {/* Confidence */}
                    {confidenceVal && (
                      <div style={{ background: 'var(--an-card-bg)', padding: '30px 20px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid var(--an-card-border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <span style={{ display:'block', fontSize:'0.8rem', fontWeight:'700', color:'var(--an-subtext)', textTransform:'uppercase', marginBottom: '10px' }}>AI CONFIDENCE</span>
                          <h3 style={{ fontSize:'1.8rem', fontWeight:'800', color: 'var(--an-heading)', margin: 0 }}>{confidenceVal}</h3>
                      </div>
                    )}
                    {/* Specialist */}
                    {specialistVal && (
                      <div style={{ background: 'var(--an-card-bg)', padding: '30px 20px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid var(--an-card-border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <span style={{ display:'block', fontSize:'0.8rem', fontWeight:'700', color:'var(--an-subtext)', textTransform:'uppercase', marginBottom: '10px' }}>SPECIALIST</span>
                          <h3 style={{ fontSize:'1.4rem', fontWeight:'800', color: 'var(--an-heading)', margin: 0, lineHeight: '1.2' }}>{specialistVal}</h3>
                      </div>
                    )}
                </div>

                {/* Recommended Actions */}
                <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#10b981', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: 'rgba(16, 185, 129, 0.2)', width:'12px', height:'12px', borderRadius:'50%', display:'inline-block' }}></span>
                        Recommended Actions
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {actionsList.length > 0 ? (
                            actionsList.map((action, idx) => (
                                <div key={idx} style={{ background: 'var(--an-action-bg)', border: '1px solid var(--an-action-border)', borderRadius: '12px', padding: '20px', display: 'flex', gap: '20px', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1.1rem', flexShrink: 0 }}>
                                        {idx + 1}
                                    </div>
                                    <span style={{ fontSize: '1.05rem', color: 'var(--an-text)', fontWeight: '500', lineHeight: '1.5' }}>{action}</span>
                                </div>
                            ))
                        ) : (
                            <div style={{ color: 'var(--an-subtext)', fontStyle:'italic' }}>
                                No specific actions found.
                            </div>
                        )}
                    </div>
                </div>

                {/* Precautions */}
                <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ef4444', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: 'rgba(239, 68, 68, 0.2)', width:'12px', height:'12px', borderRadius:'50%', display:'inline-block' }}></span>
                        Precautions
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {precautionsList.length > 0 ? (
                            precautionsList.map((precaution, idx) => (
                                <div key={idx} style={{ background: 'var(--an-action-bg)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '20px', display: 'flex', gap: '20px', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <X size={20} strokeWidth={3} />
                                    </div>
                                    <span style={{ fontSize: '1.05rem', color: 'var(--an-text)', fontWeight: '500', lineHeight: '1.5' }}>{precaution}</span>
                                </div>
                            ))
                        ) : (
                             <div style={{ color: 'var(--an-subtext)', fontStyle:'italic' }}>No specific precautions listed.</div>
                        )}
                    </div>
                </div>

            </div>
        );
    }

    // 5. ADVANCED ANALYSIS (Chat Style)
   if (infoTypeSafe.includes('advanced-analysis')) {
       
       const data = parseContentSafe(content);
       const messages = data.messages || (Array.isArray(data) ? data : []);

       return (
           <div style={{ 
               background: 'var(--chat-bg)', 
               border: '1px solid var(--chat-border)',
               padding: '40px', 
               borderRadius: '16px', 
               minHeight: '600px', 
               fontFamily: 'Inter, sans-serif',
               transition: 'background 0.3s' 
            }}>
               
               {/* --- BUTTONS: DOWNLOAD & LOAD CHAT (Advanced) --- */}
               <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '20px' }}>
                  {/* Button 2: Download Advanced */}
                  <button 
                    onClick={() => handleDownload(item)}
                    style={{
                      padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--chat-border)',
                      background: 'var(--chat-bg)', color: 'var(--chat-text)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500'
                    }}
                  >
                    <Download size={16} /> Download Chat
                  </button>

                  {/* Button 3: Load into Chat */}
                  <button 
                    onClick={() => handleLoadChat(item)}
                    style={{
                      padding: '8px 16px', borderRadius: '8px', border: 'none',
                      background: '#2563eb', color: 'white', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500'
                    }}
                  >
                    <MessageSquare size={16} /> Continue in Chat
                  </button>
               </div>

               <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                   {messages.map((msg, idx) => {
                       const isUser = msg.role === 'user';
                       return (
                           <div key={idx} style={{ 
                               display: 'flex', 
                               justifyContent: isUser ? 'flex-end' : 'flex-start',
                               gap: '12px',
                               alignItems: 'flex-start'
                           }}>
                               {/* Assistant Avatar (Logo1) - Full Size */}
                               {!isUser && (
                                   <div style={{ 
                                       width: '45px', height: '45px', borderRadius: '50%', overflow:'hidden', flexShrink: 0,
                                       background: 'var(--chat-avatar-bg)'
                                   }}>
                                       <img src={logo1} alt="Sympto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                   </div>
                               )}

                               {/* Message Bubble */}
                               <div style={{ 
                                   background: isUser ? '#2563eb' : 'transparent', 
                                   color: isUser ? '#ffffff' : 'var(--chat-text)', 
                                   padding: '12px 16px', 
                                   borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                   maxWidth: '75%',
                                   fontSize: '1rem',
                                   lineHeight: '1.6',
                                   border: isUser ? 'none' : '1px solid var(--chat-border)'
                               }}>
                                   {/* Handle Newlines in text */}
                                   {msg.content.split('\n').map((line, i) => (
                                       <p key={i} style={{ margin: '0 0 6px 0', minHeight: '1em' }}>
                                           {/* Simple bold cleanup */}
                                           {line.replace(/\*\*/g, '')} 
                                       </p>
                                   ))}
                               </div>

                               {/* User Avatar */}
                               {isUser && (
                                   <div style={{ 
                                       width: '45px', height: '45px', borderRadius: '50%', 
                                       background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                       color: '#9ca3af', flexShrink: 0
                                   }}>
                                       <User size={24} />
                                   </div>
                               )}
                           </div>
                       );
                   })}
               </div>
           </div>
       );
   }
    // 6. FALLBACK
    return (
        <pre className="content-pre">
            {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
        </pre>
    );
  };

  if (loading) return <div className="page-loader">Loading Library...</div>;
  if (error) return <div className="page-error">{error}</div>;

  return (
    <div className="saved-page-wrapper full-screen-mode">
      {/* Inject CSS Variables */}
      <style>{themeStyles}</style>

      <div className="saved-container">
        
        <Nav />

        {/* VIEW 1: GRID LIBRARY */}
        {!isDetailView ? (
          <div className="fade-in library-view">
            <header className="library-main-header">
              <div className="header-titles">
                <h1 style={{color: 'var(--an-heading)'}}>My Saved Library</h1>
                <p style={{color: 'var(--an-subtext)'}}>Manage and view your archived medical documents</p>
              </div>
              <span className="count-pill">{filteredItems.length} Result{filteredItems.length !== 1 && 's'}</span>
            </header>

            <div className="filter-controls-container" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
              
              <div className="filter-wrapper" style={{ minWidth: '200px' }}>
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                  style={{background: 'var(--an-card-bg)', color: 'var(--an-text)', border: '1px solid var(--an-card-border)'}}
                >
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>
                      {type === "All" ? "Show All Types" : type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="banner-grid">
              {filteredItems.length === 0 ? (
                <div className="empty-state" style={{color: 'var(--an-subtext)'}}>
                  <p>
                    {savedItems.length === 0 
                      ? "Your library is currently empty." 
                      : "No items match the selected filter."}
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div 
                    key={item._id} 
                    className="full-banner-btn card-interactive"
                    onClick={() => handleViewDetail(item)}
                    role="button"
                    tabIndex={0}
                    style={{background: 'var(--an-card-bg)', border: '1px solid var(--an-card-border)'}}
                  >
                    

                    <div className="banner-overlay">
                      <div className="banner-info">
                        <span className="banner-icon">
                            {item.informationType === 'hospital-location' ? '🏥' : (item.informationType === 'medical news' ? '📰' : (String(item.informationType).includes('analysis') ? '💬' : '📄'))}
                        </span>
                        <div className="banner-text-group">
                          <span className="banner-title" style={{color: 'var(--an-heading)'}}>
                            {item.title || "Untitled Document"}
                          </span>
                          
                          {item.informationType && (
                            <span className="info-type-badge">
                              {item.informationType}
                            </span>
                          )}

                          <span className="banner-date" style={{color: 'var(--an-subtext)'}}>
                            Saved on {new Date(item.savedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <span className="view-link">View Details →</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* VIEW 2: DETAIL CARD */
          <div className="detail-view fade-in full-height-view">
            <nav className="detail-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button className="back-btn-large" onClick={handleBackToLibrary} style={{color: 'var(--an-text)'}}>
                  <ArrowLeft size={18} style={{marginRight: '8px'}}/> Back to Library
                </button>
                <button 
                  className="delete-text-btn" 
                  onClick={(e) => handleDelete(e, activeItem._id)}
                >
                  Delete Page
                </button>
              </div>
            </nav>

            <div className="expanded-card full-screen-card" style={{ background: 'var(--an-bg)', transition: 'background 0.3s' }}>
              <aside className="card-sidebar" style={{ background: 'var(--sidebar-bg)', color: 'var(--sidebar-text)' }}>
                <div className="large-date-badge" style={{ color: 'var(--sidebar-text)' }}>
                  <span className="d-day">
                    {new Date(activeItem.savedAt).getDate()}
                  </span>
                  <span className="d-month">
                    {new Date(activeItem.savedAt).toLocaleString('default', { month: 'long' })}
                  </span>
                  <span className="d-year">
                    {new Date(activeItem.savedAt).getFullYear()}
                  </span>
                </div>
                  <div className="status-indicator">Verified Record</div>
                  
                  {activeItem.informationType && (
                    <div className="sidebar-meta-item">
                      <label style={{ color: 'var(--an-subtext)' }}>Type</label>
                      <strong>{activeItem.informationType}</strong>
                    </div>
                  )}
              </aside>

              <main className="card-content-area" style={{ background: 'var(--an-bg)', color: 'var(--an-text)' }}>
                <header className="content-header">
                  <h2 style={{ color: 'var(--an-heading)' }}>{activeItem.title || "Untitled Document"}</h2>
                  <div className="timestamp" style={{ color: 'var(--an-subtext)' }}>
                    Archived at {new Date(activeItem.savedAt).toLocaleTimeString()}
                  </div>
                </header>
                
                <div className="content-body">
                  {renderItemContent(activeItem)}
                </div>
              </main>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedPages;
