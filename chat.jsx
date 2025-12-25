import React, { useState } from 'react';
import { MessageCircle, X, ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react';
import "./chatcss.css";

// 1. DATA: Symptom Checker FAQ Data Structure
const FAQ_DATA = [
  {
    id: 1,
    category: "Using the Symptom Checker",
    subtitle: "Basics & Privacy",
    items: [
      { 
        q: "Is this a formal medical diagnosis?", 
        a: "No. This tool provides information based on common clinical patterns, but it is not a diagnosis. Only a licensed healthcare professional can provide a formal medical diagnosis." 
      },
      { 
        q: "What if my symptoms aren't listed?", 
        a: "The database covers the most common conditions. If you can't find your specific symptom, or if your symptoms are vague, please consult a doctor for a professional evaluation." 
      },
      { 
        q: "Is my health data private?", 
        a: "Yes. Your inputs are encrypted and handled according to healthcare privacy standards. We do not sell your personal health information to third parties." 
      }
    ]
  },
  {
    id: 2,
    category: "Safety & Emergencies",
    subtitle: "When to seek urgent care",
    items: [
      { 
        q: "When should I call 911 instead of using this?", 
        a: "Seek immediate emergency care for severe chest pain, difficulty breathing, sudden confusion, slurred speech, or uncontrolled bleeding. Do not wait for a digital assessment." 
      },
      { 
        q: "Can I use this for my child or a dependent?", 
        a: "Yes, you can input symptoms for a child, provided you have accurate information about their current condition and medical history." 
      }
    ]
  },
  {
    id: 3,
    category: "Sample vs Advanced Analysis",
    subtitle: "How our matching works",
    items: [
      { 
        q: "What is Sample Analysis?", 
        a: "Sample analysis uses basic 'If/Then' logic to match common symptoms to a static database. It's best for quick, general educational information." 
      },
      { 
        q: "How does Advanced Analysis work?", 
        a: "Advanced analysis uses AI and Pattern Recognition to look at the relationship between symptoms, your age, and risk factors, acting more like a digital triage assistant." 
      },
      { 
        q: "Why does Advanced Analysis ask so many questions?", 
        a: "It performs a 'Differential Diagnosis' process, asking specific questions to 'rule out' dangerous conditions and provide a more personalized result." 
      }
    ]
  }
];

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setTimeout(() => {
        setSelectedCategory(null);
        setExpandedQuestion(null);
      }, 300);
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setExpandedQuestion(null);
  };

  const handleBackClick = () => {
    setSelectedCategory(null);
  };

  const toggleQuestion = (index) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  return (
    <div className="cw-widget-wrapper">
      
      {/* --- POPUP MENU CONTAINER --- */}
      <div className={`cw-popup ${isOpen ? 'cw-visible' : 'cw-hidden'}`}>
        
        {/* Content Area */}
        <div className="cw-content">
          
          {/* VIEW 1: CATEGORY LIST (Default) */}
          {!selectedCategory && (
            <ul className="cw-list">
              <li className="cw-header-item">
                <div>
                  <h3>Hi there! 👋</h3>
                  <p>How can we help you today?</p>
                </div>
              </li>

              {FAQ_DATA.map((item) => (
                <li 
                  key={item.id} 
                  className="cw-list-item group" 
                  onClick={() => handleCategoryClick(item)}
                  // Added data-id for specific styling (Emergency Red)
                  data-id={item.id}
                >
                  <div>
                    <h4>{item.category}</h4>
                    <p>{item.subtitle}</p>
                  </div>
                  <ChevronRight className="cw-icon-arrow" />
                </li>
              ))}
            </ul>
          )}

          {/* VIEW 2: QUESTIONS & ANSWERS (Drill Down) */}
          {selectedCategory && (
            <div className="cw-qa-container">
              {/* Header with Back Button */}
              <div className="cw-qa-header">
                <button onClick={handleBackClick} className="cw-back-btn">
                  <ChevronLeft size={20} /> Back
                </button>
                <h4>{selectedCategory.category}</h4>
              </div>

              {/* Questions List */}
              <ul className="cw-list cw-qa-list">
                {selectedCategory.items.map((qa, index) => (
                  <li key={index} className="cw-qa-item">
                    <button 
                      className="cw-question-btn" 
                      onClick={() => toggleQuestion(index)}
                    >
                      <span>{qa.q}</span>
                      <ChevronDown 
                        size={16} 
                        className={`cw-chevron ${expandedQuestion === index ? 'cw-rotate' : ''}`} 
                      />
                    </button>
                    
                    {/* The Answer */}
                    <div className={`cw-answer ${expandedQuestion === index ? 'cw-answer-open' : ''}`}>
                      <p>{qa.a}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>

      {/* --- FLOATING TOGGLE BUTTON --- */}
      <button
        onClick={toggleOpen}
        className={`cw-fab ${isOpen ? 'cw-fab-open' : ''}`}
      >
        {isOpen ? (
          <X className="cw-icon-fab" />
        ) : (
          <MessageCircle className="cw-icon-fab" />
        )}
      </button>

    </div>
  );
};

export default ChatWidget;