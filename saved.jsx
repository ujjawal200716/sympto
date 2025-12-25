import React, { useState, useEffect, useMemo } from 'react';
import './savedpage.css';
import Nav from './test.jsx'; 

const SavedPages = () => {
  const [savedItems, setSavedItems] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [isDetailView, setIsDetailView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Filter State (Search removed) ---
  const [filterType, setFilterType] = useState("All");

  // 🔧 FIX: Use Environment Variable for API URL
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

  // --- Filtering Logic (Dropdown Only) ---
  
  // 1. Get unique categories for the dropdown
  const uniqueTypes = useMemo(() => {
    const types = savedItems
      .map(item => item.informationType)
      .filter(type => type && type.trim() !== ""); // Remove empty/null types
    return ["All", ...new Set(types)];
  }, [savedItems]);

  // 2. Filter the items based ONLY on Dropdown selection
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

            {/* --- FILTER CONTROL (Dropdown Only) --- */}
            <div className="filter-controls-container" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              
              {/* Category Dropdown */}
              <div className="filter-wrapper" style={{ minWidth: '200px' }}>
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    backgroundColor: '#fff',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
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
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="18" 
                        height="18" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="#ef4444" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        style={{ display: 'block' }} 
                      >
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>

                    <div className="banner-overlay">
                      <div className="banner-info">
                        <span className="banner-icon">📄</span>
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
                ← Back to Library
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
                  <label>Document Content</label>
                  <pre className="content-pre">
                    {typeof activeItem.content === 'string' 
                      ? activeItem.content 
                      : JSON.stringify(activeItem.content, null, 2)}
                  </pre>
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