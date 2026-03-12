import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, ChevronRight, ChevronLeft, ChevronDown, Send, Bot } from 'lucide-react';
import Groq from "groq-sdk";
import "./chatcss.css";

// 1. SETUP GROQ API
// -------------------
// 1. Define the pool of keys (update your .env to use Groq keys)
const ALL_KEYS = [
  import.meta.env.VITE_GROQ_KEY_1
];

// 2. Filter out any keys that are missing/empty in the .env file
const validKeys = ALL_KEYS.filter((key) => key && key.length > 0);

// 3. Select a random key from the valid ones
const API_KEY = validKeys.length > 0 
  ? validKeys[Math.floor(Math.random() * validKeys.length)] 
  : null;

if (!API_KEY) {
  console.error("❌ Critical Error: No valid Groq API keys found.");
}

// 4. Initialize Groq (dangerouslyAllowBrowser is required if calling directly from React frontend)
const groq = new Groq({ 
    apiKey: API_KEY,
    dangerouslyAllowBrowser: true 
});

// 2. THE "BRAIN" (System Context)
// -------------------------------
const SYMPTO_CONTEXT = `
You are "SymptoBot", the official AI Support Assistant ONLY for "https://sympto.in/" (Sympto - AI Symptom Checker & Patient Health App).
Your Tone: Professional, Empathetic, Reassuring, and Concise.

DETAILS ABOUT SYMPTO.IN:
- **Core Function**: An AI Health Companion for Adults and Women that analyzes symptoms, helps users understand their health, and prepares them for medical visits.
- **How it Works**: Users enter symptoms in plain language (like chatting with a friend). Sympto combines medical knowledge with advanced AI to provide a smart assessment and clear advice on next steps.
- **Features**: Offers "Simple Analysis" and "Advanced Check". The platform focuses on preventative, personalized, and proactive care, integrating Wearables & IoT, Telehealth, and Genetic Insights.
- **Privacy**: End-to-end security with state-of-the-art encryption ensures all personal health data is private and compliant.
- **Disclaimer**: Sympto is for informational purposes only and is NOT a substitute for professional medical advice, diagnosis, or treatment.

STRICT RULES:
1. YOU MUST ONLY ANSWER QUESTIONS RELATED TO https://sympto.in/ AND ITS FEATURES.
2. If a user asks a general knowledge question, a coding question, or anything unrelated to Sympto.in, politely refuse and say: "I am SymptoBot, and I can only answer questions related to the sympto.in platform and its services."
3. If asked for an actual medical diagnosis, refuse politely: "I am a support bot. Please use the 'Simple Analysis' or 'Advanced Check' tool on the sympto.in home page to analyze your symptoms."
4. Keep answers short (max 2-3 sentences) for the chat bubble.
5. If you don't know the answer regarding the platform, ask them to contact support via the website.
`;

// 3. FAQ DATA
// -----------
const FAQ_DATA = [
  {
    id: 1,
    category: "Using the Symptom Checker",
    subtitle: "Basics & Privacy",
    items: [
      { q: "Is this a formal medical diagnosis?", a: "No. Sympto is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment." },
      { q: "How does Sympto work?", a: "You enter your symptoms in plain language. Sympto then combines medical knowledge with advanced AI to guide you through a smart assessment and provide clear advice." },
      { q: "Is my health data private?", a: "Yes. Sympto uses end-to-end security and state-of-the-art encryption to ensure your personal health data remains private and compliant." }
    ]
  },
  {
    id: 2,
    category: "Analysis Types",
    subtitle: "Simple vs Advanced Check",
    items: [
      { q: "What is the Simple Analysis?", a: "It provides a quick, foundational risk assessment based on the symptoms you clearly describe to the AI." },
      { q: "What is the Advanced Check?", a: "It uses sophisticated AI and machine learning to analyze intricate patterns, offering a highly personalized assessment." },
      { q: "What do I get at the end?", a: "You will receive a detailed risk assessment and clear advice on what to do next to prepare for your doctor's visit." }
    ]
  },
  {
    id: 3,
    category: "Safety & Emergencies",
    subtitle: "When to seek urgent care",
    items: [
      { q: "When should I seek immediate help?", a: "Seek immediate emergency care for severe chest pain, difficulty breathing, uncontrolled bleeding, or any life-threatening symptoms." },
      { q: "Does this replace my doctor?", a: "Absolutely not. Sympto is designed to help you prepare for your visit and plan your next steps, not to replace a trained physician." }
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
    { role: 'model', text: "Hello! I'm SymptoBot. How can I help you with sympto.in today?" }
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

  // --- THE FRONTEND AI LOGIC (UPDATED FOR GROQ) ---
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
      // 2. Prepare History for Groq
      // Groq uses standard OpenAI message format: [{role: "system"|"user"|"assistant", content: "..."}]
      const apiMessages = [
        { role: "system", content: SYMPTO_CONTEXT },
        ...messages.map(msg => ({
            // Map our UI 'model' role to Groq's 'assistant' role
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.text
        })),
        { role: "user", content: userText } // Append the current message
      ];

      // 3. Send Message via Groq
      const chatCompletion = await groq.chat.completions.create({
        messages: apiMessages,
        model: "llama-3.3-70b-versatile", // You can change this to "mixtral-8x7b-32768" or other Groq models
        temperature: 0.2, // Kept low for factual, strict responses
      });

      // 4. Extract Response
      const botText = chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't process that.";
      
      // 5. Add Bot Response to UI
      setMessages(prev => [...prev, { role: 'model', text: botText }]);

    } catch (error) {
      console.error("Groq Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting to the server. Please check your internet or API key." }]);
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