import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { FaHeartbeat, FaShieldAlt } from 'react-icons/fa';

// 1. REMOVE the import line. We will use the file path directly.
 import logo1 from './logo1.png'; 

const SocialCardGenerator = () => {
  const cardRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadCard = async () => {
    if (!cardRef.current) return;
    
    setIsGenerating(true);

    try {
      // 2. Capture the card
      const canvas = await html2canvas(cardRef.current, {
        scale: 1, 
        useCORS: true,       // ✅ REQUIRED: Allows loading local images
        allowTaint: false,   // ✅ FIXED: Must be FALSE to allow downloading
        backgroundColor: null 
      });

      // 3. Save as PNG
      const link = document.createElement('a');
      link.download = 'sympto-social-card.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Card generation failed:", err);
      alert("Error generating image: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-10 flex flex-col items-center gap-8 bg-gray-100 min-h-screen">
      
      <button 
        onClick={downloadCard}
        disabled={isGenerating}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? 'Generating...' : 'Download Social Card Image'}
      </button>

      <p className="text-gray-500 text-sm">Ensure 'logo1.png' is inside your <strong>public</strong> folder</p>

      {/* --- CARD DESIGN --- */}
      <div 
        ref={cardRef} 
        style={{ 
          width: '1200px', 
          height: '630px', 
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f766e 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          fontFamily: 'Inter, sans-serif',
          color: 'white'
        }}
      >
        {/* Background Circles */}
        <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '400px', height: '400px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '50%', filter: 'blur(60px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '500px', height: '500px', background: 'rgba(20, 184, 166, 0.1)', borderRadius: '50%', filter: 'blur(80px)' }}></div>

        {/* Content */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem', zIndex: 10 }}>
            
            {/* 4. FIXED IMAGE SOURCE: Pointing to public folder */}
            <img 
                src={logo1}
                alt="Sympto Logo" 
                crossOrigin="anonymous" 
                style={{ 
                    height: '140px', 
                    width: 'auto', 
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 0 20px rgba(45, 212, 191, 0.3))'
                }} 
            />
            
            <h1 style={{ fontSize: '8rem', fontWeight: '800', letterSpacing: '-2px', margin: 0, background: 'linear-gradient(to right, #fff, #ccfbf1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Sympto
            </h1>
        </div>

        <h2 style={{ fontSize: '3rem', fontWeight: '500', color: '#94a3b8', margin: '0 0 3rem 0', textAlign: 'center' }}>
            AI-Powered Symptom Checker
        </h2>

        <div style={{ display: 'flex', gap: '2rem', zIndex: 10 }}>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem 2rem', borderRadius: '50px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <FaHeartbeat style={{ color: '#f43f5e' }} /> Instant Analysis
            </span>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem 2rem', borderRadius: '50px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <FaShieldAlt style={{ color: '#3b82f6' }} /> Private & Secure
            </span>
        </div>

        <div style={{ position: 'absolute', bottom: '3rem', fontSize: '1.8rem', opacity: 0.6, letterSpacing: '2px', textTransform: 'uppercase' }}>
            www.sympto.in
        </div>

      </div>
    </div>
  );
};

export default SocialCardGenerator;