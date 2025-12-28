import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './advancedanalysiscss.css';
import Nev from "./test.jsx";
import logo1 from './logo1.png';
// 🔒 SECURE: Key loaded from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyCpTpkRriy5TR8P4uldvomP2no9Zd-tCAg";

export default function Advancedanalysis() {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'Hello! I\'m Sympto, your medical symptom checker assistant. I\'m here to help you understand your symptoms better.\n\n⚠️ Important: I am not a doctor and cannot provide medical diagnoses. Always consult with a healthcare professional for medical advice.\n\nTo get started, please tell me:\n1. What symptoms are you experiencing?\n2. When did they start?\n3. How severe are they (mild, moderate, severe)?\n\nYou can also upload multiple images of visible symptoms using the camera button.' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // --- STATE FOR MENU ---
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // --- STATE FOR MULTIPLE IMAGES ---
  const [selectedImages, setSelectedImages] = useState([]); 

  // --- STATE FOR VOICE MODE ---
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  
  const isVoiceModeRef = useRef(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);
  
  // REF FOR PDF CAPTURE
  const chatContentRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    isVoiceModeRef.current = isVoiceMode;
  }, [isVoiceMode]);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) setAvailableVoices(voices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const SYSTEM_INSTRUCTION = `You are Sympto, a medical symptom checker assistant. Your role is to:
1. Ask relevant follow-up questions about symptoms.
2. Provide potential causes or conditions.
3. Offer general health guidance and self-care tips.
4. Determine urgency level.
5. Be empathetic and professional.

CRITICAL RULES:
- ALWAYS include a disclaimer that you're not a doctor and cannot diagnose
- NEVER claim to diagnose medical conditions
- If symptoms suggest emergency (chest pain, difficulty breathing, severe bleeding, stroke signs), IMMEDIATELY advise seeking emergency care
- Be thorough but not alarming
- Use clear, simple language
- Ask one or two questions at a time, not overwhelming lists`;

  const VOICE_SYSTEM_INSTRUCTION = `You are Sympto. 
  CRITICAL: Keep your response extremely short (1-2 sentences maximum). 
  Be conversational and helpful.`;

  // --- MENU ACTIONS ---
  const handleDownloadPDF = async () => {
    setShowMenu(false);
    const element = chatContentRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Sympto-Report-${new Date().toLocaleDateString()}.pdf`);
    } catch (err) {
      console.error("PDF Error:", err);
      alert("Could not generate PDF.");
    }
  };

  const handleShare = async () => {
    setShowMenu(false);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Sympto Check Result',
          text: 'Here is my symptom analysis from Sympto.',
          url: window.location.href
        });
      } catch (err) { console.log('Share failed:', err); }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleSave = async () => {
    setShowMenu(false);
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Please log in to save your session.");
        return;
    }
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    try {
        const response = await fetch(`${API_BASE_URL}/api/save-page`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: `Sympto Check - ${new Date().toLocaleString()}`,
                informationType: 'advanced-analysis',
                pageData: { messages: messages } 
            })
        });

        const data = await response.json();
        if (response.ok) alert("✅ Session saved successfully!");
        else alert(`❌ Error: ${data.message}`);
    } catch (err) {
        console.error(err);
        alert("❌ Failed to connect to server");
    }
  };

  // --- SPEECH & CHAT LOGIC ---
  const speakResponse = (text) => {
    if (!('speechSynthesis' in window) || isMuted) return;
    window.speechSynthesis.cancel();
    
    const cleanText = text.replace(/[*#_]/g, '').replace(/\n/g, '. ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("David") || v.name.includes("Daniel") || (v.name.toLowerCase().includes("male") && v.lang.startsWith("en"))) || voices[0];
    
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 1.0; utterance.pitch = 0.9; 

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (isVoiceModeRef.current && !isMuted) setTimeout(() => startListening(), 500);
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (isListening || isSpeaking) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      if (isVoiceModeRef.current) processVoiceMessage(transcript);
      else setInput(prev => prev + (prev ? ' ' : '') + transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const handleFooterMicClick = () => isListening ? stopListening() : startListening();

  const toggleVoiceMode = () => {
    if (isVoiceMode) {
      setIsVoiceMode(false);
      stopListening();
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      setIsVoiceMode(true);
      setTimeout(() => startListening(), 500);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      startListening();
    } else {
      setIsMuted(true);
      stopListening();
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const processVoiceMessage = async (voiceText) => {
    const userMessage = { role: 'user', content: voiceText };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: VOICE_SYSTEM_INSTRUCTION });
      const history = messages.slice(1).map(msg => ({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] }));
      const chat = model.startChat({ history: history });
      const result = await chat.sendMessage([{ text: voiceText }]);
      const text = result.response.text();
      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
      speakResponse(text);
    } catch (error) { speakResponse("Connection error."); } finally { setLoading(false); }
  };

  const sendMessage = async () => {
    if ((!input.trim() && selectedImages.length === 0) || loading) return;
    if (!API_KEY) { alert("API Key is missing!"); return; }

    const userMessageText = input.trim() || `I have uploaded ${selectedImages.length} image(s). Please analyze them.`;
    const imagePreviews = selectedImages.map(img => img.preview);
    setMessages(prev => [...prev, { role: 'user', content: userMessageText, images: imagePreviews }]);
    setInput('');
    setLoading(true);
    const currentImages = [...selectedImages]; 
    setSelectedImages([]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: SYSTEM_INSTRUCTION });
      const history = messages.slice(1).map(msg => ({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] }));
      const chat = model.startChat({ history: history });
      let messageParts = [{ text: userMessageText }];
      currentImages.forEach(img => { messageParts.push({ inlineData: { data: img.data, mimeType: img.type } }); });
      const result = await chat.sendMessage(messageParts);
      const text = result.response.text();
      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Error connecting to AI.' }]);
    } finally { setLoading(false); }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result.split(',')[1];
        setSelectedImages(prev => [...prev, { id: Date.now(), type: file.type, data: base64Data, preview: event.target.result }]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index) => setSelectedImages(prev => prev.filter((_, i) => i !== index));
  const handleQuickAction = (action) => setInput(action);
  const quickActions = ['I have a headache', 'I have a fever', 'I feel nauseous', 'I have chest pain', 'I\'m feeling dizzy'];

  return (
    <div className="new-sympto-container">
      
      {isVoiceMode && (
        <div className="new-voice-mode-overlay">
          <div className="new-voice-header">
            <span className="new-voice-badge">Voice Agent <span className="new-beta-tag">BETA</span></span>
            <button className="new-findings-btn" onClick={toggleVoiceMode}>Exit</button>
          </div>
          <div className="new-voice-visualizer">
            <div className={`new-orb ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}></div>
            <div className="new-voice-status-text">{isSpeaking ? "Sympto is speaking..." : isListening ? "Listening..." : loading ? "Thinking..." : "Tap mic to speak"}</div>
          </div>
          <div className="new-voice-controls">
            <button className={`new-control-btn new-mic-control ${isMuted ? 'muted' : ''}`} onClick={toggleMute}>{isMuted ? "🔇" : "🎙️"}</button>
            <button className="new-control-btn new-hangup-control" onClick={toggleVoiceMode}>📞</button>
          </div>
        </div>
      )}

      <Nev/>

      {/* --- CHAT AREA --- */}
      <div className="new-sympto-chat-area">
        <div className="new-chat-content" ref={chatContentRef}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`new-message-row ${msg.role === 'user' ? 'new-user-row' : 'new-assistant-row'}`}>
             <div className={`new-avatar ${msg.role === 'assistant' ? 'new-assistant-avatar' : 'new-user-avatar'}`}>
  {msg.role === 'assistant' ? (
    <img src={logo1} alt="Sympto" className="new-bot-logo" />
  ) : (
    '👤'
  )}
</div>
              <div className={`new-message-bubble ${msg.role === 'user' ? 'new-user-bubble' : 'new-assistant-bubble'}`}>
                {msg.images?.length > 0 && (
                  <div className="new-chat-images-grid">
                    {msg.images.map((imgSrc, i) => <img key={i} src={imgSrc} alt="Symptom" className="new-chat-image-item" />)}
                  </div>
                )}
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              </div>
            </div>
          ))}
          {loading && !isVoiceMode && (
            <div className="new-message-row new-assistant-row">
              <div className="new-avatar new-assistant-avatar">🤖</div>
              <div className="new-message-bubble new-assistant-bubble new-loading-bubble"><span className="new-spinner">⌛</span><span>Analyzing...</span></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* --- FOOTER --- */}
      <div className="new-sympto-footer">
        <div className="new-footer-content">
          
          {messages.length === 1 && (
            <div className="new-quick-actions">
              {quickActions.map((action, idx) => (
                <button key={idx} onClick={() => handleQuickAction(action)} className="new-quick-action-btn">{action} <span>›</span></button>
              ))}
            </div>
          )}

          {selectedImages.length > 0 && (
            <div className="new-multi-image-preview">
              {selectedImages.map((img, idx) => (
                <div key={img.id} className="new-thumbnail-wrapper">
                  <img src={img.preview} alt="Preview" />
                  <button onClick={() => removeImage(idx)} className="new-thumbnail-remove-btn">×</button>
                </div>
              ))}
              <button onClick={() => fileInputRef.current?.click()} className="new-add-more-btn" title="Add another image">+</button>
            </div>
          )}

          {/* --- NEW FOOTER ROW (Layout for Robot + Input) --- */}
          <div className="new-footer-row">

            {/* 1. ROBOT MENU (Far Left, Independent) */}
            <div className="new-menu-wrapper" ref={menuRef}>
              <button 
                onClick={() => setShowMenu(!showMenu)} 
                className="new-robot-standalone-btn"
                title="Options"
                // --- UPDATED STYLES FOR BUTTON ---
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#ffffff',
                  border: 'none',
                  borderRadius: '50%', // Perfect circle
                  width: '40px',       // Fixed large size
                  height: '40px',      // Fixed large size
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                  transition: 'all 0.2s ease',
                  color: 'gray',
                  padding: 0
                }}
              >
               {/* ONLY THREE DOTS - FULL SIZE */}
               <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="5" r="2" fill="currentColor"/>
                  <circle cx="12" cy="12" r="2" fill="currentColor"/>
                  <circle cx="12" cy="19" r="2" fill="currentColor"/>
               </svg>
              </button>

              {/* DROP-UP MENU */}
              {showMenu && (
                <div className="new-dropup-menu">
                  <div className="new-dropdown-item" onClick={handleShare}>
                    <span>🔗</span> Share
                  </div>
                  <div className="new-dropdown-item" onClick={handleDownloadPDF}>
                    <span>⬇️</span> Download PDF
                  </div>
                  <div className="new-dropdown-item" onClick={handleSave}>
                    <span>💾</span> Save Chat
                  </div>
                </div>
              )}
            </div>

            {/* 2. INPUT BAR (Right Side) */}
            <div className="new-input-bar">
              
              <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" style={{ display: 'none' }} />
              
              <button onClick={() => fileInputRef.current?.click()} disabled={loading} className="new-icon-btn new-camera-btn" title="Upload Image">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" fill="currentColor">
                  <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/>
                </svg>
              </button>
              
              <button onClick={toggleVoiceMode} className="new-icon-btn new-voice-trigger-btn" title="Full Voice Mode">
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" width="24px" viewBox="0 -960 960 960" fill="currentColor">
                    <path d="M80-80v-80q46 0 91-6t88-22q-46-23-72.5-66.5T160-349v-91h160v-120h135L324-822l72-36 131 262q20 40-3 78t-68 38h-56v40q0 33-23.5 56.5T320-360h-80v11q0 35 21.5 61.5T316-252l12 3q40 10 45 50t-31 60q-60 33-126.5 46T80-80Zm572-114-57-56q21-21 33-48.5t12-59.5q0-32-12-59.5T595-466l57-57q32 32 50 74.5t18 90.5q0 48-18 90t-50 74ZM765-80l-57-57q43-43 67.5-99.5T800-358q0-66-24.5-122T708-579l57-57q54 54 84.5 125T880-358q0 81-30.5 152.5T765-80Z"/>
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
              </button>

              <div className="new-text-input-wrapper">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={isListening ? "Listening..." : (selectedImages.length > 0 ? "Add a caption..." : "Describe symptoms...")}
                  disabled={loading}
                  className="new-chat-input"
                />
              </div>

              {(!input.trim() && selectedImages.length === 0) ? (
                  <button onClick={handleFooterMicClick} className="new-icon-btn new-mic-btn" style={{ color: isListening ? '#ef4444' : 'inherit' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                        <path d="M480-400q-60 0-102-42t-42-102v-240q0-60 42-102t102-42q60 0 102 42t42 102v240q0 60-42 102t-102 42Zm0-80q26 0 43-17t17-43v-240q0-26-17-43t-43-17q-26 0-43 17t-17 43v240q0 26 17 43t43 17Zm0 320q-133 0-234.5-81.5T128-480h86q16 87 86.5 143.5T480-280q87 0 157.5-56.5T724-480h86q-16 124-117.5 205.5T480-160Zm0-480Z"/>
                      </svg>
                  </button>
              ) : (
                  <button onClick={sendMessage} disabled={loading} className="new-icon-btn new-send-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                  </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}