import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, Navigation, Check, AlertTriangle, FileText, 
  ExternalLink, Stethoscope, User, Trash2, ArrowLeft
} from 'lucide-react'; 
import './savedpage.css';
import Nav from './test.jsx'; 

const SavedPages = () => {
  const [savedItems, setSavedItems] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [isDetailView, setIsDetailView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Filter State ---
  const [filterType, setFilterType] = useState("All");

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

  // --- RENDER CONTENT HELPER ---
  const renderItemContent = (item) => {
    const { content, informationType } = item;

    // 1. HOSPITAL / APPOINTMENT LOCATION
    if (informationType === 'hospital-location') {
        const address = content?.address || content?.vicinity || "Address unavailable";
        const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

        return (
            <div className="location-detail-card" style={{ padding: '25px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px'}}>
                   <div style={{background:'#eff6ff', padding:'12px', borderRadius:'12px', color:'#2563eb'}}>
                      <MapPin size={24} />
                   </div>
                   <div>
                      <h3 style={{ margin: 0, color: '#1e293b', fontSize:'1.25rem' }}>{content.name || item.title}</h3>
                      <span style={{color:'#64748b', fontSize:'0.9rem'}}>Healthcare Provider</span>
                   </div>
                </div>
                
                <div style={{ marginBottom:'25px', padding:'15px', background:'#f8fafc', borderRadius:'8px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#475569' }}>
                        <MapPin size={18} style={{marginTop:'3px'}} />
                        <span style={{ fontSize: '1.05rem', lineHeight:'1.5' }}>{address}</span>
                    </div>
                    {content.rating && (
                        <div style={{ marginTop: '12px', display:'flex', alignItems:'center', gap:'6px', fontWeight: '600', color: '#f59e0b' }}>
                            <span>Rating:</span>
                            <span style={{background:'#fffbeb', padding:'2px 8px', borderRadius:'4px', border:'1px solid #fcd34d'}}>{content.rating} ⭐</span>
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
                        padding: '14px 24px', background: '#2563eb', color: 'white', 
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
    if (informationType === 'medical news') {
        const news = typeof content === 'string' ? JSON.parse(content) : content;
        return (
             <div className="news-detail-view" style={{ padding: '0 10px' }}>
                 <div style={{ marginBottom: '20px' }}>
                     <span style={{ background: '#f3e8ff', color: '#7e22ce', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', textTransform:'uppercase' }}>
                        Medical Article
                     </span>
                 </div>
                 <h2 style={{ fontSize: '1.8rem', color: '#1e293b', marginBottom: '15px', lineHeight:'1.3' }}>
                    {news.title || item.title}
                 </h2>
                 {news.urlToImage && (
                    <img src={news.urlToImage} alt="News" style={{width:'100%', height:'250px', objectFit:'cover', borderRadius:'12px', marginBottom:'20px'}} />
                 )}
                 <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#475569', marginBottom: '25px' }}>
                    {news.description || news.content || "No summary available for this article."}
                 </p>
                 {news.url && (
                    <a href={news.url} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:'8px', textDecoration:'none', color:'#2563eb', fontWeight:'600', fontSize:'1.05rem' }}>
                        Read Full Article <ExternalLink size={16} />
                    </a>
                 )}
             </div>
        );
    }

    // 3. SIMPLE ANALYSIS -> PDF PAPER STYLE (DESIGN MATCHED TO PDF)
    if (informationType === 'simple-analysis') {
        const data = typeof content === 'string' ? JSON.parse(content) : content;

        return (
            <div className="analysis-paper" style={{ 
                background:'white', 
                maxWidth:'100%', 
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
            }}>
                
                {/* Header Badge */}
                <div style={{ display:'flex', justifyContent:'center', marginBottom:'25px' }}>
                    <span style={{ 
                        background:'#E0F2FE', color:'#0369A1', 
                        padding:'8px 20px', borderRadius:'6px', 
                        fontSize:'0.85rem', fontWeight:'700', letterSpacing:'1.5px', textTransform:'uppercase' 
                    }}>
                        AI ASSESSMENT
                    </span>
                </div>

                {/* Title Section */}
                <div style={{ textAlign:'center', marginBottom:'40px', paddingBottom: '20px', borderBottom: '2px solid #F1F5F9' }}>
                    <div style={{ 
                        width:'50px', height:'50px', background:'#F8FAFC', borderRadius:'50%', 
                        display:'flex', alignItems:'center', justifyContent:'center', 
                        margin:'0 auto 15px auto', color:'#334155' 
                    }}>
                        <FileText size={26} strokeWidth={1.5} />
                    </div>
                    <h1 style={{ fontSize: '2.2rem', color: '#0F172A', marginBottom: '10px', fontWeight: '800', lineHeight:'1.2' }}>
                        {data.condition || "Viral Infection"}
                    </h1>
                    <p style={{ color:'#64748B', fontSize:'1.1rem' }}>Based on your reported symptoms</p>
                </div>

                {/* Metrics Grid (Matched to PDF Layout) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                   <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '8px', border:'1px solid #E2E8F0', textAlign:'center' }}>
                      <span style={{ display:'block', fontSize:'0.8rem', color:'#64748B', fontWeight:'700', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'1px' }}>SEVERITY</span>
                      <span style={{ display:'block', fontSize:'1.4rem', fontWeight:'800', color: data.severity === 'High' ? '#EF4444' : '#0F172A' }}>
                        {data.severity || "Moderate"}
                      </span>
                   </div>
                   <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '8px', border:'1px solid #E2E8F0', textAlign:'center' }}>
                      <span style={{ display:'block', fontSize:'0.8rem', color:'#64748B', fontWeight:'700', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'1px' }}>AI CONFIDENCE</span>
                      <span style={{ display:'block', fontSize:'1.4rem', fontWeight:'800', color:'#2563EB' }}>
                        {data.confidence || "90%"}
                      </span>
                   </div>
                </div>

                {/* Content Sections */}
                <div style={{ marginBottom: '35px' }}>
                   <h3 style={{ fontSize:'1.2rem', fontWeight:'800', color:'#1E293B', marginBottom:'12px', borderLeft:'4px solid #2563EB', paddingLeft:'12px' }}>
                        About this condition
                   </h3>
                   <p style={{ lineHeight: '1.7', color: '#334155', fontSize:'1.05rem' }}>
                      {data.description || "A common viral infection characterized by symptoms such as fever, cough, and fatigue."}
                   </p>
                </div>

                <div style={{ marginBottom:'20px' }}>
                   <h3 style={{ fontSize:'1.2rem', fontWeight:'800', color:'#1E293B', marginBottom:'15px', borderLeft:'4px solid #2563EB', paddingLeft:'12px' }}>
                        Recommended Actions
                   </h3>
                   <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {data.actions && data.actions.length > 0 ? (
                          data.actions.map((action, idx) => (
                            <li key={idx} style={{ display: 'flex', gap: '15px', marginBottom: '15px', color: '#334155', alignItems:'flex-start' }}>
                                <div style={{ background:'#DCFCE7', color:'#166534', padding:'4px', borderRadius:'50%', flexShrink:0, marginTop:'2px' }}>
                                    <Check size={14} strokeWidth={4} />
                                </div>
                                <span style={{ lineHeight:'1.6', fontSize: '1rem' }}>{action}</span>
                            </li>
                          ))
                      ) : (
                          <li style={{ color:'#64748b', fontStyle:'italic' }}>No specific actions listed.</li>
                      )}
                   </ul>
                </div>
            </div>
        );
    }

    // 4. ADVANCED ANALYSIS -> CHAT INTERFACE STYLE (DESIGN MATCHED TO SYMPTO BOT)
    if (['advanced-analysis', 'medical-report'].includes(informationType)) {
        const data = typeof content === 'string' ? JSON.parse(content) : content;
        
        return (
            <div className="chat-interface" style={{ background: '#F3F4F6', padding: '30px', borderRadius: '16px', minHeight: '600px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                
                {/* Bot Message Row */}
                <div className="chat-row" style={{ display: 'flex', gap: '16px', marginBottom: '30px' }}>
                    {/* Bot Avatar - Blue Circle with Icon */}
                    <div style={{ width: '44px', height: '44px', background: '#2563EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)' }}>
                        <Stethoscope size={24} />
                    </div>
                    
                    {/* Bot Bubble */}
                    <div style={{ background: 'white', padding: '24px', borderRadius: '0 20px 20px 20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', flex: 1, maxWidth: '90%' }}>
                        
                        <p style={{ marginTop: 0, color: '#1F2937', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '20px' }}>
                            Hello! I'm Sympto, your medical symptom checker assistant. Based on the symptoms you provided, I have analyzed your condition.
                        </p>

                        {/* Yellow Disclaimer Box (Matched to Image 1) */}
                        <div style={{ display: 'flex', gap: '12px', background: '#FEF3C7', border: '1px solid #FCD34D', padding: '16px', borderRadius: '8px', alignItems:'flex-start', marginBottom: '24px' }}>
                            <AlertTriangle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ margin: 0, fontSize: '0.95rem', color: '#92400E', lineHeight: '1.5' }}>
                                <strong>Important:</strong> I am not a doctor and cannot provide medical diagnoses. Always consult with a healthcare professional for medical advice.
                            </p>
                        </div>

                        {/* Result Content */}
                        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '20px' }}>
                            <h3 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '1.4rem' }}>{data.condition || "Health Assessment"}</h3>
                            <p style={{ color: '#4B5563', marginBottom: '20px', lineHeight:'1.6' }}>
                                {data.description}
                            </p>
                            
                            <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#374151', marginBottom: '10px' }}>Recommended Actions:</h4>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:'10px' }}>
                                {data.actions && data.actions.map((action, i) => (
                                    <span key={i} style={{ background: '#EFF6FF', color: '#1E40AF', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '500' }}>
                                        {action}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Message Row (Right Aligned) */}
                <div className="chat-row user" style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginBottom: '30px' }}>
                    <div style={{ background: '#2563EB', color: 'white', padding: '16px 24px', borderRadius: '20px 20px 0 20px', boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)', maxWidth: '70%' }}>
                        <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.5' }}>
                            I have a headache and some fever.
                        </p>
                    </div>
                    <div style={{ width: '44px', height: '44px', background: '#E5E7EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', flexShrink: 0 }}>
                        <User size={24} />
                    </div>
                </div>

                {/* Final Bot Response / Summary */}
                <div className="chat-row" style={{ display: 'flex', gap: '16px' }}>
                     <div style={{ width: '44px', height: '44px', background: '#2563EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                        <Stethoscope size={24} />
                    </div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '0 20px 20px 20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                            <div style={{ height:'10px', width:'10px', background:'#10B981', borderRadius:'50%' }}></div>
                            <span style={{ color:'#374151', fontWeight:'500' }}>Analysis complete. Please see the details above.</span>
                        </div>
                    </div>
                </div>

            </div>
        );
    }

    // 5. FALLBACK
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
      <div className="saved-container">
        
        <Nav />

        {/* VIEW 1: GRID LIBRARY */}
        {!isDetailView ? (
          <div className="fade-in library-view">
            <header className="library-main-header">
              <div className="header-titles">
                <h1>My Saved Library</h1>
                <p>Manage and view your archived medical documents</p>
              </div>
              <span className="count-pill">{filteredItems.length} Result{filteredItems.length !== 1 && 's'}</span>
            </header>

            {/* --- FILTER CONTROL --- */}
            <div className="filter-controls-container" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <div className="filter-wrapper" style={{ minWidth: '200px' }}>
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 15px', borderRadius: '8px',
                    border: '1px solid #ddd', fontSize: '1rem', cursor: 'pointer',
                    backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                  }}
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
                <div className="empty-state">
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
                  >
                    {/* --- DELETE BUTTON --- */}
                    <button 
                      className="card-delete-btn"
                      onClick={(e) => handleDelete(e, item._id)}
                      title="Delete this page"
                    >
                      <Trash2 size={18} color="#ef4444" />
                    </button>

                    <div className="banner-overlay">
                      <div className="banner-info">
                        <span className="banner-icon">
                            {item.informationType === 'hospital-location' ? '🏥' : (item.informationType === 'medical news' ? '📰' : (item.informationType === 'advanced-analysis' ? '💬' : '📄'))}
                        </span>
                        <div className="banner-text-group">
                          <span className="banner-title">
                            {item.title || "Untitled Document"}
                          </span>
                          
                          {item.informationType && (
                            <span className="info-type-badge">
                              {item.informationType}
                            </span>
                          )}

                          <span className="banner-date">
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
            <nav className="detail-nav">
              <button className="back-btn-large" onClick={handleBackToLibrary}>
                <ArrowLeft size={18} style={{marginRight: '8px'}}/> Back to Library
              </button>
              <button 
                className="delete-text-btn" 
                onClick={(e) => handleDelete(e, activeItem._id)}
              >
                Delete Page
              </button>
            </nav>

            <div className="expanded-card full-screen-card">
              <aside className="card-sidebar">
                <div className="large-date-badge">
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
                      <label>Type</label>
                      <strong>{activeItem.informationType}</strong>
                    </div>
                  )}
              </aside>

              <main className="card-content-area">
                <header className="content-header">
                  <h2>{activeItem.title || "Untitled Document"}</h2>
                  <div className="timestamp">
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