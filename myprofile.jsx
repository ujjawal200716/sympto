import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, Mail, Save, Edit2, Trash2, LogOut, 
  Phone, MapPin, Camera, PlusCircle, Activity, 
  Clock, FileCheck, Calendar, ShieldCheck, FileText, AlertCircle
} from 'lucide-react'; 
import './profile.css'; 
import Nav from './test.jsx';

const UserProfile = () => {
  // --- 1. INITIALIZATION ---
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  
  // STATE
  const [user, setUser] = useState({ 
    name: stored.name || stored.fullName || '', 
    email: stored.email || '', 
    phone: '', address: '', gender: '', dob: '', profileImg: '' 
  });
  
  const [formData, setFormData] = useState({ ...user });
  const [selectedFile, setSelectedFile] = useState(null); 
  const [previewUrl, setPreviewUrl] = useState(null); 
  const [isEditing, setIsEditing] = useState(false);
  
  const [savedPages, setSavedPages] = useState([]); 
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };
  
  // 🔧 FIX: Use Environment Variable for Production
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'; 

  // --- 2. FETCH DATA ---
  useEffect(() => {
    if (!token) { setLoadingHistory(false); return; }
    fetchUserProfile();
    fetchHistory();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/user-profile`, config);
      const data = res.data;
      const u = {
        name: data.name || data.fullName,
        email: data.email,
        phone: data.phone || '',
        address: data.address || '',
        gender: data.gender || '',
        dob: data.dob || '',
        profileImg: data.profileImg || ''
      };
      setUser(u);
      setFormData(u); 
    } catch (err) { console.error(err); }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/my-saved-pages`, config);
      setSavedPages(res.data);
      setLoadingHistory(false);
    } catch (err) { setLoadingHistory(false); }
  };

  // --- 3. HANDLERS ---
  const handleStartEdit = () => { setIsEditing(true); setFormData({ ...user }); };
  const handleCancel = () => { setIsEditing(false); setPreviewUrl(null); setSelectedFile(null); };
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (selectedFile) data.append('profileImage', selectedFile);

    try {
      const res = await axios.put(`${BASE_URL}/api/update-profile`, data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setUser(res.data.user); setIsEditing(false); setMessage('✅ Profile updated!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { setMessage('❌ Failed to update.'); }
  };

  const handleDeleteItem = async (id) => {
    if(!window.confirm("Delete this record?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/my-saved-pages/${id}`, config);
      setSavedPages(savedPages.filter(item => item._id !== id));
    } catch (err) { alert("Error deleting item"); }
  };

  const handleLogout = () => { localStorage.clear(); window.location.href = '/login'; };

  const getAvatarSrc = () => {
    if (isEditing && previewUrl) return previewUrl; 
    if (user.profileImg) return `${BASE_URL}${user.profileImg}`; 
    return null; 
  };

  const getRelativeTime = (dateStr) => {
    const diff = new Date() - new Date(dateStr);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  return (
    <div className="up-container">
      
      <div style={{ marginBottom: '20px' }}><Nav /></div>

      {/* MAIN GRID */}
      <div className="up-grid">
        
        {/* --- LEFT COLUMN: PROFILE (40%) --- */}
        <aside className="up-card profile-section">
          
          {/* FLOATING EDIT BUTTON (Positioned by CSS .action-btn-circle) */}
          {!isEditing && (
             <button onClick={handleStartEdit} className="action-btn-circle" title="Edit Profile">
               <Edit2 size={16} />
             </button>
          )}

          {message && (
             <div style={{ padding: '10px', background: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center' }}>
               {message}
             </div>
          )}

          <div className="profile-content-wrapper">
            <div className="up-avatar-wrapper">
              <div className="up-avatar-placeholder">
                {getAvatarSrc() ? (
                  <img src={getAvatarSrc()} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    {user.name ? user.name.charAt(0).toUpperCase() : <User size={40}/>}
                  </span>
                )}
              </div>
              
              {isEditing && (
                <label className="up-upload-overlay">
                  <Camera size={14} />
                  <input type="file" accept="image/*" onChange={handleImageChange} className="up-hidden-input" />
                </label>
              )}
            </div>
            
            {!isEditing && (
              <div className="profile-identity">
                <h3 className="up-user-name">{user.name || "Guest User"}</h3>
                <span className="up-user-role"><Mail size={12} style={{marginRight:4}}/> {user.email}</span>
              </div>
            )}
          </div>

          {/* VIEW MODE */}
          {!isEditing ? (
            <div className="up-info-list">
              <div className="up-info-row">
                <div className="up-icon-box"><Phone size={18} /></div>
                <div className="up-info-text">
                  <label>Mobile Number</label>
                  <span>{user.phone || "No phone added"}</span>
                </div>
              </div>
              <div className="up-info-row">
                <div className="up-icon-box"><MapPin size={18} /></div>
                <div className="up-info-text">
                  <label>Address</label>
                  <span>{user.address || "No address added"}</span>
                </div>
              </div>
              <div className="up-info-row">
                <div className="up-icon-box"><User size={18} /></div>
                <div className="up-info-text">
                   <label>Gender</label>
                   <span>{user.gender || "Gender not set"}</span>
                </div>
              </div>
              <div className="up-info-row">
                <div className="up-icon-box"><Calendar size={18} /></div>
                <div className="up-info-text">
                   <label>Date of Birth</label>
                   <span>{user.dob || "DOB not set"}</span>
                </div>
              </div>
              
              <div className="up-badge-verified">
                <ShieldCheck size={16} /> Verified Patient
              </div>
            </div>
          ) : (
            /* EDIT MODE */
            <form onSubmit={handleUpdateProfile} className="up-edit-form">
              <div className="up-input-group">
                <label>Full Name</label>
                <input name="name" value={formData.name} onChange={handleChange} />
              </div>
              <div className="up-input-group">
                <label>Phone</label>
                <input name="phone" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="up-input-group">
                <label>Address</label>
                <input name="address" value={formData.address} onChange={handleChange} />
              </div>
              
              <div className="up-form-row">
                 <div className="up-input-group">
                    <label>Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                 </div>
                 <div className="up-input-group">
                    <label>DOB</label>
                    <input name="dob" type="date" value={formData.dob} onChange={handleChange} />
                 </div>
              </div>

              <div className="up-form-actions">
                <button type="button" onClick={handleCancel} className="up-btn-cancel">Cancel</button>
                <button type="submit" className="up-btn-save"><Save size={16} /> Save Changes</button>
              </div>
            </form>
          )}
        </aside>

        {/* --- RIGHT COLUMN: HISTORY (60%) --- */}
        <main className="up-card history-section">
          <div className="up-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
               <h2>Medical History</h2>
               <span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                 {savedPages.length} Records
               </span>
            </div>
            <button className="up-icon-btn" onClick={() => window.location.href = '/appointment'}>
               <PlusCircle size={20} />
            </button>
          </div>

          {/* ADDED INFO: PATIENT OVERVIEW */}
          <div className="up-medical-summary" style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '20px', border:'1px solid #e2e8f0' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px', color:'#334155', fontWeight:'600'}}>
              <FileText size={16} /> Patient Overview
            </div>
            <p style={{ fontSize:'0.9rem', color:'#64748b', lineHeight:'1.5', margin:0 }}>
              This section contains a comprehensive log of your symptom checks, AI assessments, and generated medical reports. 
              Regularly reviewing your history helps track health trends over time. 
              {savedPages.length > 0 ? " You have active records maintained in the system." : " Start a checkup to populate this data."}
            </p>
          </div>

          {/* STATS WIDGETS */}
          {savedPages.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
               <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow:'0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '6px', display:'flex', alignItems:'center', gap:'6px' }}>
                     <Activity size={14}/> Total Scans
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>{savedPages.length}</div>
               </div>
               <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow:'0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '6px', display:'flex', alignItems:'center', gap:'6px' }}>
                     <Clock size={14}/> Last Checkup
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>
                     {getRelativeTime(savedPages[0]?.savedAt)}
                  </div>
               </div>
            </div>
          )}

          {/* HISTORY LIST */}
          <div className="up-history-list">
            {loadingHistory ? (
               <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>Loading history...</p>
            ) : savedPages.length === 0 ? (
               
               /* --- FIXED EMPTY STATE --- */
               <div className="empty-state">
                  <div className="empty-icon-circle">
                    <AlertCircle size={40} />
                  </div>
                  <h3>No medical records yet</h3>
                  <p>
                    It looks like you haven't performed any health checks yet.
                  </p>
               </div>

            ) : (
               /* DATA LIST */
               savedPages.map((item) => (
                  <div key={item._id} className="up-history-item">
                     <div className="up-history-icon-box">
                        <FileCheck size={20} />
                     </div>
                     <div className="up-item-details">
                        <h4>{item.title || "Health Assessment"}</h4>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                           <span className="status-badge completed">{item.informationType || "General"}</span>
                           <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={12}/> {new Date(item.savedAt).toLocaleDateString()}
                           </span>
                        </div>
                     </div>
                     <button onClick={() => handleDeleteItem(item._id)} className="up-btn-delete">
                        <Trash2 size={16} />
                     </button>
                  </div>
               ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserProfile;