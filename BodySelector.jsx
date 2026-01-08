import React from 'react';
import './sample.css'; // Ensure this points to your CSS file

const BodySelector = ({ onSelect, selectedPart }) => {
  
  // Helper to handle click and pass data up
  const handleClick = (part) => {
    onSelect(part);
  };

  // Helper to determine color: Red if selected, Grey if not
  const getClass = (part) => {
    return selectedPart === part ? "body-part selected" : "body-part";
  };

  return (
    <div className="body-map-container">
      
      {/* Visual Instruction */}
      <div className="body-map-header">
         <span className="pulse-dot"></span>
         <p>Tap the affected area</p>
      </div>
      
      <svg viewBox="0 0 200 450" className="human-body-svg">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* HEAD */}
        <circle 
          cx="100" cy="35" r="25" 
          className={getClass('Head')} 
          onClick={() => handleClick('Head')} 
        />
        <text x="100" y="35" className="part-label">Head</text>
        
        {/* NECK */}
        <rect 
          x="90" y="60" width="20" height="15" 
          className={getClass('Neck')} 
          onClick={() => handleClick('Neck')} 
        />

        {/* CHEST / UPPER TORSO */}
        <path 
          d="M 60 80 L 140 80 L 130 150 L 70 150 Z" 
          className={getClass('Chest')} 
          onClick={() => handleClick('Chest')} 
        />
        <text x="100" y="115" className="part-label">Chest</text>

        {/* ABDOMEN */}
        <rect 
          x="70" y="152" width="60" height="60" 
          className={getClass('Abdomen')} 
          onClick={() => handleClick('Abdomen')} 
        />
        <text x="100" y="185" className="part-label">Stomach</text>

        {/* PELVIS */}
        <path 
          d="M 70 215 L 130 215 L 115 250 L 85 250 Z" 
          className={getClass('Pelvis')} 
          onClick={() => handleClick('Pelvis')} 
        />

        {/* LEFT ARM (Viewer's Left) */}
        <path 
          d="M 60 80 L 20 190 L 45 190 L 70 90 Z" 
          className={getClass('Right Arm')} 
          onClick={() => handleClick('Right Arm')} 
        />

        {/* RIGHT ARM (Viewer's Right) */}
        <path 
          d="M 140 80 L 180 190 L 155 190 L 130 90 Z" 
          className={getClass('Left Arm')} 
          onClick={() => handleClick('Left Arm')} 
        />

        {/* LEFT LEG */}
        <path 
          d="M 85 250 L 65 420 L 90 420 L 100 250 Z" 
          className={getClass('Right Leg')} 
          onClick={() => handleClick('Right Leg')} 
        />

        {/* RIGHT LEG */}
        <path 
          d="M 115 250 L 135 420 L 110 420 L 100 250 Z" 
          className={getClass('Left Leg')} 
          onClick={() => handleClick('Left Leg')} 
        />
      </svg>
      
      {selectedPart ? (
        <div className="selected-label active">
          Pain Location: <strong>{selectedPart}</strong>
        </div>
      ) : (
        <div className="selected-label">
           No area selected
        </div>
      )}
    </div>
  );
};

export default BodySelector;