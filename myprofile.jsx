import React, { useState, useEffect } from 'react';
import './profile.css';
import Nev from './test.jsx';
// 1. API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 2. State matches the Backend Schema
  const [userData, setUserData] = useState({
    firstName: "", // Mapped from fullName
    lastName: "",  // Mapped from fullName
    email: "",
    phone: "",
    dob: "",
    gender: "Male",
    bloodType: "",
    height: "",
    weight: "",
    allergies: "",
    conditions: "",
  });

  // 3. FETCH DATA from Server
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token'); // Assumes token is stored here
        if (!token) {
            console.error("No token found");
            setIsLoading(false);
            return;
        }

        const response = await fetch(`${API_BASE_URL}/api/user-profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          // Split fullName into First/Last for the UI
          const nameParts = data.fullName ? data.fullName.split(' ') : ["", ""];
          
          setUserData({
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(' ') || "",
            email: data.email || "",
            phone: data.phone || "",
            dob: data.dob || "",
            gender: data.gender || "Male",
            // Medical Data
            bloodType: data.bloodType || "",
            height: data.height || "",
            weight: data.weight || "",
            allergies: data.allergies || "",
            conditions: data.conditions || ""
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  // 4. SEND DATA to Server
  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Combine First+Last name back to fullName for backend
      const payload = {
        ...userData,
        fullName: `${userData.firstName} ${userData.lastName}`.trim()
      };

      const response = await fetch(`${API_BASE_URL}/api/update-profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("Profile updated successfully!");
        setIsEditing(false);
      } else {
        alert("Failed to update profile.");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      handleSave();
    } else {
      setIsEditing(true);
    }
  };

  if (isLoading) return <div className="loading-screen">Loading Profile...</div>;

  return (
    <div className="profile-container">
      <Nev/>
      {/* HEADER */}
      <header className="profile-header">
        <div className="header-content">
            <div className="avatar-placeholder">
                {userData.firstName ? userData.firstName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="identity-text">
                <h1>{userData.firstName} {userData.lastName}</h1>
                <span className="patient-id">Patient Profile</span>
            </div>
        </div>
        
        <button 
            className={`edit-btn ${isEditing ? 'save-mode' : ''}`} 
            onClick={toggleEdit}
        >
            {isEditing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </header>

      {/* MAIN GRID */}
      <main className="dashboard-grid">
        
        {/* LEFT CARD: Personal Info */}
        <div className="card">
          <h3>Personal Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>First Name</label>
              <input type="text" name="firstName" value={userData.firstName} onChange={handleInputChange} disabled={!isEditing} />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input type="text" name="lastName" value={userData.lastName} onChange={handleInputChange} disabled={!isEditing} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={userData.email} onChange={handleInputChange} disabled={!isEditing} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="text" name="phone" value={userData.phone} onChange={handleInputChange} disabled={!isEditing} />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" name="dob" value={userData.dob} onChange={handleInputChange} disabled={!isEditing} />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select name="gender" value={userData.gender} onChange={handleInputChange} disabled={!isEditing}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* RIGHT CARD: Medical Data */}
        <div className="card">
          <h3>Medical Data</h3>
          <div className="form-grid">
            
            {/* Row 1: Blood Type & Height (Balanced) */}
            
            <div className="form-group">
              <label>Height (cm)</label>
              <input type="number" name="height" value={userData.height} onChange={handleInputChange} disabled={!isEditing} />
            </div>

            {/* Row 2: Weight & Empty Spacer (or extend weight) */}
            <div className="form-group">
              <label>Weight (kg)</label>
              <input type="number" name="weight" value={userData.weight} onChange={handleInputChange} disabled={!isEditing} />
            </div>
             {/* Spacer div to keep grid aligned if needed, or leave blank */}
            <div className="form-group"></div>

            {/* Row 3: Allergies (Full Width) */}
            <div className="form-group full-width">
              <label>Allergies</label>
              <textarea name="allergies" rows="1" value={userData.allergies} onChange={handleInputChange} disabled={!isEditing} />
            </div>

            {/* Row 4: Conditions (Full Width) */}
            <div className="form-group full-width">
              <label>Chronic Conditions</label>
              <textarea name="conditions" rows="2" value={userData.conditions} onChange={handleInputChange} disabled={!isEditing} />
            </div>
            
          </div>
        </div>

      </main>
    </div>
  );
};

export default ProfilePage;