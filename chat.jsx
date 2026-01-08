import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, ChevronRight, ChevronLeft, ChevronDown, Send, Bot } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import "./chatcss.css";

// 1. SETUP GEMINI API
// -------------------
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY110 || import.meta.env.VITE_GEMINI_API_KEY9; ; 
// Note: If using Create React App, use process.env.REACT_APP_GEMINI_API_KEY

const genAI = new GoogleGenerativeAI(API_KEY);

// 2. THE "BRAIN" (System Context)
// -------------------------------
const SYMPTO_CONTEXT = `
You are the official AI Support Assistant for "Sympto" (SymptoCheck).
Your name is "SymptoBot".
Your Tone: Professional, Empathetic, Reassuring, and Concise.

DETAILS ABOUT THE WEBSITE:
- **Core Function**: An AI-powered health companion for symptom analysis.
- **Symptom Checker**: Users enter symptoms, AI provides differential diagnosis (NOT a formal medical diagnosis).
- **Profile**: Has "Medical History" (saved reports), "News History", and "Appointment History".
- **Doctors**: Users can find specialists and book appointments.
- **Privacy**: User data is encrypted.

RULES:
1. If asked for a medical diagnosis *here*, refuse politely: "I am the support bot. Please use the 'Start Checkup' tool on the home page."
2. Keep answers short (max 2-3 sentences) for the chat bubble.
3. If you don't know, ask them to email support@sympto.in.
`;

// 3. FAQ DATA
// -----------
const FAQ_DATA = [
  {
    id: 1,
    category: "Using the Symptom Checker",
    subtitle: "Basics & Privacy",
    items: [
      { q: "Is this a formal medical diagnosis?", a: "No. This tool provides information based on common clinical patterns, but it is not a diagnosis." },
      { q: "What if my symptoms aren't listed?", a: "The database covers common conditions. If symptoms are vague, please consult a doctor." },
      { q: "Is my health data private?", a: "Yes. Your inputs are encrypted and handled according to healthcare privacy standards." }
    ]
  },
  {
    id: 2,
    category: "Safety & Emergencies",
    subtitle: "When to seek urgent care",
    items: [
      { q: "When should I call 112?", a: "Seek immediate emergency care for severe chest pain, difficulty breathing, or uncontrolled bleeding." },
      { q: "Can I use this for my child?", a: "Yes, provided you have accurate information about their current condition." }
    ]
  },
  {
    id: 3,
    category: "Sample vs Advanced Analysis",
    subtitle: "How our matching works",
    items: [
      { q: "What is Sample Analysis?", a: "It uses basic 'If/Then' logic to match common symptoms to a static database." },
      { q: "How does Advanced Analysis work?", a: "It uses AI to look at the relationship between symptoms, age, and risk factors." },
      { q: "Why so many questions?", a: "To perform a 'Differential Diagnosis' and rule out dangerous conditions." }
    ]
  }
];

const ChatWidget = () => {
  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); 
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  
  // Chat Logic State
  const [messages, setMessages] = useState([
    { role: 'model', text: "Hello! I'm SymptoBot. How can I help you with the app today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab]);

  // Toggles & Navigation
  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setTimeout(() => {
        setActiveTab('home');
        setSelectedCategory(null);
      }, 300);
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setActiveTab('faq-details');
    setExpandedQuestion(null);
  };

  const toggleQuestion = (index) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  // --- THE FRONTEND AI LOGIC (FIXED) ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. Add User Message to UI instantly
    const userText = input;
    const newUserMsg = { role: 'user', text: userText };
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // 2. Prepare History for Gemini (THE FIX)
      // Remove the first message (Welcome message) because Gemini API requires
      // the first history item to be from the 'user', not the 'model'.
      const historyForApi = messages
        .slice(1) // Skips index 0 (The Welcome Message)
        .map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

      // 3. Initialize Model
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash", // Use 1.5-flash or 2.0-flash-exp
        systemInstruction: SYMPTO_CONTEXT 
      });

      // 4. Start Chat Session with History
      const chat = model.startChat({
        history: historyForApi,
      });

      // 5. Send Message
      const result = await chat.sendMessage(userText);
      const response = await result.response;
      const botText = response.text();
      
      // 6. Add Bot Response to UI
      setMessages(prev => [...prev, { role: 'model', text: botText }]);

    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting. Please check your internet or API key." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cw-widget-wrapper">
      
      {/* POPUP CONTAINER */}
      <div className={`cw-popup ${isOpen ? 'cw-visible' : 'cw-hidden'}`}>
        
        {/* Header */}
        <div className="cw-header-area">
            <h3>Sympto Support</h3>
            <div className="cw-tabs">
                <button 
                    className={`cw-tab-btn ${activeTab === 'chat' ? '' : 'active'}`}
                    onClick={() => setActiveTab('home')}
                >
                    FAQ
                </button>
                <button 
                    className={`cw-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                    onClick={() => setActiveTab('chat')}
                >
                    Live Chat
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="cw-content">
          
          {/* TAB 1: FAQ HOME */}
          {activeTab === 'home' && (
            <ul className="cw-list">
              {FAQ_DATA.map((item) => (
                <li 
                  key={item.id} 
                  className="cw-list-item" 
                  onClick={() => handleCategoryClick(item)}
                  data-id={item.id}
                >
                  <div>
                    <h4>{item.category}</h4>
                    <p>{item.subtitle}</p>
                  </div>
                  <ChevronRight className="cw-icon-arrow" />
                </li>
              ))}
              <li className="cw-list-item cw-chat-cta" onClick={() => setActiveTab('chat')}>
                 <div>
                    <h4>Still need help?</h4>
                    <p>Ask our AI Assistant specifically about Sympto.</p>
                 </div>
                 <MessageCircle className="cw-icon-arrow" size={18}/>
              </li>
            </ul>
          )}

          {/* TAB 2: FAQ DETAILS */}
          {activeTab === 'faq-details' && selectedCategory && (
            <div className="cw-qa-container">
              <div className="cw-qa-header">
                <button onClick={() => setActiveTab('home')} className="cw-back-btn">
                  <ChevronLeft size={20} /> Back
                </button>
                <h4>{selectedCategory.category}</h4>
              </div>

              <ul className="cw-list cw-qa-list">
                {selectedCategory.items.map((qa, index) => (
                  <li key={index} className="cw-qa-item">
                    <button className="cw-question-btn" onClick={() => toggleQuestion(index)}>
                      <span>{qa.q}</span>
                      <ChevronDown size={16} className={`cw-chevron ${expandedQuestion === index ? 'cw-rotate' : ''}`} />
                    </button>
                    <div className={`cw-answer ${expandedQuestion === index ? 'cw-answer-open' : ''}`}>
                      <p>{qa.a}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* TAB 3: LIVE CHAT */}
          {activeTab === 'chat' && (
              <div className="cw-chat-view">
                  <div className="cw-messages-area">
                      {messages.map((msg, idx) => (
                          <div key={idx} className={`cw-msg-bubble ${msg.role === 'user' ? 'cw-msg-user' : 'cw-msg-bot'}`}>
                              {msg.role === 'model' && <Bot size={16} className="cw-msg-icon" />}
                              <p>{msg.text}</p>
                          </div>
                      ))}
                      {isLoading && <div className="cw-msg-bubble cw-msg-bot"><p>Thinking...</p></div>}
                      <div ref={messagesEndRef} />
                  </div>

                  <form className="cw-chat-input-area" onSubmit={handleSendMessage}>
                      <input 
                        type="text" 
                        placeholder="Ask about Sympto..." 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                      />
                      <button type="submit" disabled={isLoading || !input.trim()}>
                        <Send size={18} />
                      </button>
                  </form>
              </div>
          )}

        </div>
      </div>

      {/* FAB BUTTON */}
      <button onClick={toggleOpen} className={`cw-fab ${isOpen ? 'cw-fab-open' : ''}`}>
        {isOpen ? <X className="cw-icon-fab" /> : <MessageCircle className="cw-icon-fab" />}
      </button>

    </div>
  );
};

export default ChatWidget;