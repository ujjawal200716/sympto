import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Phone, Search, AlertCircle, Stethoscope, Loader2, 
  Clock, Navigation, Accessibility, Building2 
} from 'lucide-react'; 
import './appointmentpage.css';
import Nav from './test.jsx'; 
import Chat from "./chat.jsx";

// --- GEOAPIFY CATEGORY MAPPER ---
const getCategoryFromSymptom = (text) => {
  if (!text) return 'healthcare.hospital,healthcare.clinic_or_praxis';
  const t = text.toLowerCase();
  
  if (t.includes('tooth') || t.includes('dental') || t.includes('mouth')) return 'healthcare.dentist';
  if (t.includes('medicine') || t.includes('pill') || t.includes('drug')) return 'healthcare.pharmacy';
  if (t.includes('eye') || t.includes('vision')) return 'healthcare.clinic_or_praxis.ophthalmology';
  if (t.includes('bone') || t.includes('fracture')) return 'healthcare.clinic_or_praxis.orthopaedics';
  
  return 'healthcare.hospital';
};

// --- SKELETON CARD COMPONENT ---
const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="sk-header">
      <div className="sk-badge-group">
        <div className="skeleton-box sk-badge"></div>
        <div className="skeleton-box sk-badge" style={{width: '60px'}}></div>
      </div>
      <div className="skeleton-box sk-title"></div>
      <div className="skeleton-box sk-address"></div>
    </div>
    <div className="sk-body">
      <div className="skeleton-box sk-row"></div>
      <div className="skeleton-box sk-row"></div>
      <div className="skeleton-box sk-row-short"></div>
    </div>
    <div className="sk-footer">
      <div className="skeleton-box sk-btn"></div>
      <div className="skeleton-box sk-btn"></div>
    </div>
  </div>
);

const AppointmentPage = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [sortBy, setSortBy] = useState('distance'); 
  const [visibleCount, setVisibleCount] = useState(10); 
  const observerTarget = useRef(null);

  const [searchParams, setSearchParams] = useState({ symptoms: '', location: '' });

  // 🔒 SECURE: Use Environment Variable
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY || "8f0118ac0b6c4f329988a6c4d7c5aba7"; 

  // --- INFINITE SCROLL OBSERVER ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 10);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [observerTarget, hospitals]);

  // --- GEOCODING ---
  const getCoordinatesForLocation = async (locationName, key) => {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(locationName)}&apiKey=${key}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      return {
        lat: data.features[0].properties.lat,
        lon: data.features[0].properties.lon
      };
    }
    throw new Error("Location not found");
  };

  // --- MAIN SEARCH ---
  const findNearbyHospitals = async (e) => {
    if(e) e.preventDefault();
    setLoading(true);
    setError(null);
    setHospitals([]); 
    setVisibleCount(10); 

    try {
      let lat, lon;

      if (searchParams.location && searchParams.location !== "Current Location Detected") {
        const coords = await getCoordinatesForLocation(searchParams.location, apiKey);
        lat = coords.lat;
        lon = coords.lon;
        fetchHospitalData(lat, lon, apiKey);
      } 
      else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setSearchParams(prev => ({ ...prev, location: "Current Location Detected" }));
            fetchHospitalData(position.coords.latitude, position.coords.longitude, apiKey);
          },
          (err) => {
            setError("Please allow location access or type a city name.");
            setLoading(false);
          }
        );
      } else {
        setError("Geolocation not supported. Please type a location.");
        setLoading(false);
      }

    } catch (err) {
      console.error(err);
      setError("Could not find that location. Please try again.");
      setLoading(false);
    }
  };

  const fetchHospitalData = async (lat, lon, key) => {
    const category = getCategoryFromSymptom(searchParams.symptoms);
    const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=circle:${lon},${lat},10000&bias=proximity:${lon},${lat}&limit=50&apiKey=${key}`;

    try {
      const response = await fetch(url);
      if (response.status === 401) throw new Error("Invalid API Key (401). Check Geoapify Dashboard.");

      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        setError("No facilities found nearby for these symptoms.");
      } else {
        const formattedResults = data.features.map((feature) => {
          const p = feature.properties;
          return {
            id: p.place_id,
            name: p.name || "Medical Center",
            address: p.address_line2 || p.formatted,
            distance: (p.distance / 1000).toFixed(1), 
            phone: p.contact?.phone || p.datasource?.raw?.phone || null,
            website: p.contact?.website || p.datasource?.raw?.website || null,
            isEmergency: p.categories.includes('healthcare.hospital'),
            type: p.categories[0].split('.').pop().replace(/_/g, ' '),
            opening_hours: p.opening_hours || null, 
            wheelchair: p.facilities?.wheelchair || p.datasource?.raw?.wheelchair || null,
            operator: p.operator || p.datasource?.raw?.operator || null,
            lat: p.lat,
            lon: p.lon
          };
        });
        
        setTimeout(() => {
             setHospitals(formattedResults);
             setLoading(false); 
        }, 800);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to connect to Geoapify.");
      setLoading(false);
    }
  };

  const sortedHospitals = [...hospitals].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return parseFloat(a.distance) - parseFloat(b.distance); 
  });

  const visibleHospitals = sortedHospitals.slice(0, visibleCount);

  return (
    <div className="ap-wrapper">
        <Nav />
        <Chat />
      
      {/* HERO */}
      <div className="ap-hero">
        <div className="ap-hero-content">
          <h1>Find Nearby Care</h1>
          <p>Locate the best hospitals, dentists, and clinics near you.</p>
          
          <div className="ap-search-container">
            <div className="ap-input-group border-right">
              <Search className="ap-icon" />
              <input 
                type="text" 
                placeholder="Describe symptoms (e.g. toothache)" 
                value={searchParams.symptoms}
                onChange={(e) => setSearchParams({...searchParams, symptoms: e.target.value})}
              />
            </div>
            
            <div className="ap-input-group">
              <MapPin className="ap-icon" />
              <input 
                type="text" 
                placeholder="City or Zip (Leave empty for GPS)" 
                value={searchParams.location}
                onChange={(e) => setSearchParams({...searchParams, location: e.target.value})} 
              />
            </div>

            <button onClick={findNearbyHospitals} disabled={loading} className="ap-search-btn">
              {loading ? <Loader2 className="ap-icon-spin" size={18} /> : "Search"}
            </button>
          </div>
        </div>
      </div>

      {/* RESULTS AREA */}
      <div className="ap-main">
        {error && (
          <div className="ap-error">
            <AlertCircle className="ap-icon-sm" /> {error}
          </div>
        )}

        {/* --- 1. SKELETON LOADING GRID --- */}
        {loading && (
           <div className="ap-grid">
             {[1, 2, 3, 4, 5, 6].map((n) => <SkeletonCard key={n} />)}
           </div>
        )}

        {/* --- 2. REAL RESULTS GRID --- */}
        {hospitals.length > 0 && !loading && (
          <>
            <div className="ap-filter-bar">
              <h2>Found <span className="ap-highlight">{hospitals.length}</span> Results</h2>
              
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <span className="ap-sort-label">Sort by:</span>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{padding:'5px 10px', borderRadius:'6px', border:'1px solid #ccc'}}
                >
                  <option value="distance">Distance</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>

            <div className="ap-grid">
              {visibleHospitals.map((hospital) => (
                <div key={hospital.id} className="ap-card">
                  <div className="ap-card-header">
                    <div>
                      <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                          <span style={{
                            fontSize:'12px', textTransform:'capitalize', background:'#e0f2fe', 
                            color:'#0369a1', padding:'2px 8px', borderRadius:'4px', marginBottom:'4px', display:'inline-block'
                          }}>
                            {hospital.type}
                          </span>
                          {hospital.wheelchair === 'yes' && (
                            <span style={{
                              fontSize:'12px', background:'#dcfce7', color:'#15803d', 
                              padding:'2px 8px', borderRadius:'4px', marginBottom:'4px', display:'flex', alignItems:'center', gap:'4px'
                            }}>
                              <Accessibility size={12} /> Accessible
                            </span>
                          )}
                      </div>
                      
                      <h3>{hospital.name}</h3>
                      <span className="ap-city">{hospital.address}</span>
                      
                      {hospital.operator && (
                        <div style={{fontSize:'0.85rem', color:'#64748b', marginTop:'4px', display:'flex', alignItems:'center', gap:'5px'}}>
                           <Building2 size={14} /> Operated by: {hospital.operator}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ap-card-body">
                    <div className="ap-info-row">
                      <MapPin className="ap-icon-blue" /> 
                      <strong>{hospital.distance} km</strong> away
                    </div>
                    
                    {hospital.opening_hours && (
                       <div className="ap-info-row">
                         <Clock className="ap-icon-orange" /> 
                         <span style={{fontSize:'0.9rem'}}>{hospital.opening_hours}</span>
                       </div>
                    )}

                    {hospital.website && (
                        <div className="ap-info-row">
                          <Search className="ap-icon-orange" /> 
                          <a href={hospital.website} target="_blank" rel="noreferrer" style={{textDecoration:'underline', color:'inherit'}}>
                              Visit Website
                          </a>
                        </div>
                    )}

                    {hospital.isEmergency && (
                      <div className="ap-badge-emergency">
                        <AlertCircle className="ap-icon-xs" /> Emergency Services
                      </div>
                    )}
                  </div>

                  <div className="ap-card-footer" style={{display:'grid', gridTemplateColumns: hospital.phone ? '1fr 1fr' : '1fr', gap:'10px'}}>
                    {hospital.phone ? (
                      <a href={`tel:${hospital.phone}`} className="ap-phone-btn" style={{background:'#eff6ff', color:'#1d4ed8', border:'1px solid #bfdbfe'}}>
                        <Phone className="ap-icon-sm" /> Call
                      </a>
                    ) : null}

                    {/* 🔧 FIXED: Google Maps Direction Link */}
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lon}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="ap-phone-btn" 
                      style={{background:'#2563eb', color:'white', textAlign:'center', justifyContent:'center'}}
                    >
                      <Navigation className="ap-icon-sm" /> Directions
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* --- 3. BOTTOM SPINNER (For infinite scroll) --- */}
            {visibleCount < hospitals.length && (
              <div ref={observerTarget} style={{height:'60px', display:'flex', justifyContent:'center', alignItems:'center', marginTop:'20px', color:'#64748b', gap:'10px'}}>
                <Loader2 className="ap-icon-spin" size={24} /> 
                <span>Loading more results...</span>
              </div>
            )}
          </>
        )}

        {/* --- 4. EMPTY STATE --- */}
        {hospitals.length === 0 && !loading && !error && (
          <div className="ap-empty-state">
            <div className="ap-empty-icon"><Stethoscope size={40} /></div>
            <p>Enter your symptoms to find the right specialist.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentPage;