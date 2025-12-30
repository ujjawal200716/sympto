import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './advancedanalysiscss.css';
import Nev from "./test.jsx";
import logo1 from './logo1.png';
import logoLight from './logo.png'; 
import logoDark from './logodark.png';

// 🔒 SECURE: Key loaded from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY1 || import.meta.env.VITE_GEMINI_API_KEY2 ||import.meta.env.VITE_GEMINI_API_KEY3 || import.meta.env.VITE_GEMINI_API_KEY4 || import.meta.env.VITE_GEMINI_API_KEY5 || import.meta.env.VITE_GEMINI_API_KEY6 ||import.meta.env.VITE_GEMINI_API_KEY7 || import.meta.env.VITE_GEMINI_API_KEY8 || import.meta.env.VITE_GEMINI_API_KEY9;

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

  // --- NEW: TEXT TO SPEECH HIGHLIGHTING STATE ---
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState(null); // Tracks which message ID is speaking
  const [currentCharIndex, setCurrentCharIndex] = useState(-1); // Tracks character position for highlighting

  // --- NEW: USER DATA STATE ---
  const [userData, setUserData] = useState(null);
  
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

  // --- NEW: FETCH USER DATA (Same logic as Navbar) ---
  useEffect(() => {
    const fetchUserData = async () => {
        const token = localStorage.getItem('token');
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        // 1. Try LocalStorage first
        const storedUser = localStorage.getItem('userData');
        if (storedUser) {
            setUserData(JSON.parse(storedUser));
        }

        // 2. Fetch fresh data if token exists
        if (token) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/user-profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.fullName && !data.firstName) {
                        data.firstName = data.fullName.split(' ')[0];
                    }
                    setUserData(data);
                    localStorage.setItem('userData', JSON.stringify(data));
                }
            } catch (err) {
                console.error("Error fetching user data in chat", err);
            }
        }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) setAvailableVoices(voices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
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

 const handleDownloadPDF = async () => {
    setShowMenu(false);
    const element = chatContentRef.current;
    if (!element) return;

    try {
      // 1. SELECT CORRECT LOGO FOR PDF
      const logoSrc = logo1; 

      // 2. Clone the chat
      const clone = element.cloneNode(true);

      // 3. Force "Paper Mode" (White Background, Black Text)
      Object.assign(clone.style, {
        width: `${element.offsetWidth}px`,
        height: 'auto',
        maxHeight: 'none',
        overflow: 'visible',
        position: 'absolute',
        left: '-9999px',
        top: '0px',
        backgroundColor: '#ffffff',
        color: '#000000', // STRICT BLACK
        fontFamily: 'Arial, sans-serif'
      });

      // 4. INJECT HEADER with FULL SIZE LOGO (NO PADDING)
      const header = document.createElement('div');
      header.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding: 0px; 
        border-bottom: 2px solid #2563eb;
        margin-bottom: 20px;
        background: #ffffff;
        width: 100%;
      `;

      const logoStyle = `
        width: 100%;
        height: auto; 
        max-width: 100%;
        display: block;
        object-fit: contain;
        margin-bottom: 10px;
      `;

      header.innerHTML = `
        ${logoSrc ? `<img src="${logoSrc}" style="${logoStyle}" />` : ''}
        <div style="padding: 10px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 32px; font-weight: bold;">Sympto</h1>
          <p style="color: #000000; margin: 5px 0 0 0; font-size: 14px;">Medical Symptom Report</p>
          <p style="color: #666666; margin: 0; font-size: 12px;">Generated: ${new Date().toLocaleDateString()}</p>
        </div>
      `;

      clone.insertBefore(header, clone.firstChild);

      // 5. Text & Image Fixer
      const allElements = clone.querySelectorAll('*');
      allElements.forEach((el) => {
        // Color fix
        if (!el.classList.contains('new-spinner')) {
             el.style.color = '#000000';
             el.style.textShadow = 'none';
        }
        
        // Background fix
        const style = window.getComputedStyle(el);
        if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            el.style.backgroundColor = 'transparent'; 
        }
      });

      // --- SPECIFIC FIX: Force Chat Avatar Logos to be Full Size in PDF ---
      const botLogos = clone.querySelectorAll('.new-bot-logo');
      botLogos.forEach(img => {
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'cover';
          img.style.padding = '0';
          img.style.margin = '0';
          img.style.borderRadius = '50%';
          img.style.display = 'block';
      });
      
      const avatars = clone.querySelectorAll('.new-avatar');
      avatars.forEach(av => {
          av.style.padding = '0';
          av.style.display = 'flex';
          av.style.alignItems = 'center';
          av.style.justifyContent = 'center';
      });

      document.body.appendChild(clone);

      // 6. Capture
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      document.body.removeChild(clone);

      // 7. Save PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Sympto-Report.pdf`);

    } catch (err) {
      console.error("PDF Error:", err);
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
                content: { messages: messages } 
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            alert("✅ Session saved successfully!");
        } else {
            console.error("Backend Error:", data); 
            alert(`❌ Error: ${data.message || "Invalid Data"}`);
        }
    } catch (err) {
        console.error(err);
        alert("❌ Failed to connect to server");
    }
  };

  // --- SPEECH & CHAT LOGIC ---

  const handleSpeak = (text, index) => {
    if (!('speechSynthesis' in window)) return;

    // IF ALREADY SPEAKING THIS MESSAGE: STOP
    if (speakingMessageIndex === index) {
        window.speechSynthesis.cancel();
        setSpeakingMessageIndex(null);
        setCurrentCharIndex(-1);
        setIsSpeaking(false);
        return;
    }

    // IF SPEAKING SOMETHING ELSE: CANCEL PREVIOUS AND START NEW
    window.speechSynthesis.cancel();
    
    // We speak a cleaner version (no asterisks) but we need to match indices visually.
    // To keep simple word highlighting working, we will speak the text roughly as is.
    // Punctuation is usually handled by the browser.
    const cleanText = text.replace(/[*#_]/g, ''); 
    const utterance = new SpeechSynthesisUtterance(cleanText);

    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("David") || v.name.includes("Daniel") || (v.name.toLowerCase().includes("male") && v.lang.startsWith("en"))) || voices[0];
    
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 1.0; 
    utterance.pitch = 0.9; 

    // START EVENT
    utterance.onstart = () => {
        setSpeakingMessageIndex(index);
        setIsSpeaking(true);
        setCurrentCharIndex(0);
    };

    // BOUNDARY EVENT (The "Which word is it?" logic)
    utterance.onboundary = (event) => {
        // event.charIndex tells us the character index of the word currently being spoken
        setCurrentCharIndex(event.charIndex);
    };

    // END EVENT
    utterance.onend = () => {
        setSpeakingMessageIndex(null);
        setCurrentCharIndex(-1);
        setIsSpeaking(false);
        if (isVoiceModeRef.current && !isMuted) setTimeout(() => startListening(), 500);
    };

    utterance.onerror = () => {
        setSpeakingMessageIndex(null);
        setCurrentCharIndex(-1);
        setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // --- RENDER HELPER FOR HIGHLIGHTING WORDS ---
  const renderMessageContent = (msg, index) => {
    // If not speaking this message, just return content (formatted normal way)
    if (speakingMessageIndex !== index) {
        return <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>;
    }

    // If speaking, split by spaces to highlight current word
    // Note: This matches the "Clean Text" logic we sent to SpeechSynthesis
    const text = msg.content.replace(/[*#_]/g, ''); 
    const words = text.split(/(\s+)/); // Split by whitespace but keep delimiters to preserve spacing
    
    let charCount = 0;

    return (
        <div style={{ whiteSpace: 'pre-wrap' }}>
            {words.map((word, i) => {
                const start = charCount;
                const end = charCount + word.length;
                charCount += word.length;

                // Check if this word segment contains the currentCharIndex
                const isActive = currentCharIndex >= start && currentCharIndex < end;

                // Only highlight actual words, not just whitespace spaces
                const isWord = word.trim().length > 0;

                return (
                    <span 
                        key={i} 
                        style={{ 
                            backgroundColor: (isActive && isWord) ? '#fef08a' : 'transparent', // Yellow highlight
                            color: (isActive && isWord) ? '#000' : 'inherit',
                            transition: 'background-color 0.1s ease',
                            borderRadius: '2px'
                        }}
                    >
                        {word}
                    </span>
                );
            })}
        </div>
    );
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
      setSpeakingMessageIndex(null);
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
      setSpeakingMessageIndex(null);
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
      // Auto speak for voice mode - using last index approximation
      setTimeout(() => handleSpeak(text, messages.length + 1), 100); 
    } catch (error) { 
        const errText = "Connection error.";
        handleSpeak(errText, -1);
    } finally { setLoading(false); }
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
                /* --- Chat Interface Logo Fix --- */
                <img 
                  src={logo1} 
                  alt="Sympto" 
                  className="new-bot-logo" 
                  onClick={() => handleSpeak(msg.content, idx)} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', padding: 0, cursor: 'pointer' }} 
                />
              ) : (
                <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                }}>
                    {userData && userData.firstName 
                        ? userData.firstName.charAt(0).toUpperCase() 
                        : "U"}
                </div>
              )}
            </div>
              <div className={`new-message-bubble ${msg.role === 'user' ? 'new-user-bubble' : 'new-assistant-bubble'}`}>
                {msg.images?.length > 0 && (
                  <div className="new-chat-images-grid">
                    {msg.images.map((imgSrc, i) => <img key={i} src={imgSrc} alt="Symptom" className="new-chat-image-item" />)}
                  </div>
                )}
                {/* REPLACED PLAIN TEXT WITH HIGHLIGHTER HELPER */}
                {renderMessageContent(msg, idx)}
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#ffffff',
                  border: 'none',
                  borderRadius: '50%', 
                  width: '40px',       
                  height: '40px',      
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                  transition: 'all 0.2s ease',
                  color: 'gray',
                  padding: 0
                }}
              >
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