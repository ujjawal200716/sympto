import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai"; 
import './advancedanalysiscss.css';
import Nev from "./test.jsx";

// 🔒 SECURE: Key is now loaded from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function Advancedanalysis() {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'Hello! I\'m Sympto, your medical symptom checker assistant. I\'m here to help you understand your symptoms better.\n\n⚠️ Important: I am not a doctor and cannot provide medical diagnoses. Always consult with a healthcare professional for medical advice.\n\nTo get started, please tell me:\n1. What symptoms are you experiencing?\n2. When did they start?\n3. How severe are they (mild, moderate, severe)?\n\nYou can also upload multiple images of visible symptoms using the camera button.' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // --- STATE FOR MULTIPLE IMAGES ---
  const [selectedImages, setSelectedImages] = useState([]); 

  // --- STATE FOR VOICE MODE ---
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  
  // 🔧 FIX: Use a Ref to track voice mode synchronously
  const isVoiceModeRef = useRef(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null); 

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 🔧 FIX: Keep Ref in sync with State
  useEffect(() => {
    isVoiceModeRef.current = isVoiceMode;
  }, [isVoiceMode]);

  // --- 1. ROBUST VOICE LOADING ---
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
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
- Ask one or two questions at a time, not overwhelming lists

Format your responses with:
- Clear sections when providing information
- Bullet points for potential causes or recommendations
- Urgency indicators (🚨 Urgent, ⚠️ Schedule Appointment, ℹ️ Monitor at Home)`;


  const VOICE_SYSTEM_INSTRUCTION = `You are Sympto. 
  CRITICAL: Keep your response extremely short (1-2 sentences maximum). 
  Be conversational and helpful. Do not use lists or markdown.`;

  // --- 2. FIXED SPEECH OUTPUT ---
  const speakResponse = (text) => {
    if (!('speechSynthesis' in window)) return;
    if (isMuted) return;

    window.speechSynthesis.cancel();
    
    const cleanText = text.replace(/[*#_]/g, '').replace(/\n/g, '. ');
    const utterance = new SpeechSynthesisUtterance(cleanText);

    let voices = availableVoices;
    if (voices.length === 0) voices = window.speechSynthesis.getVoices();

    let preferredVoice = voices.find(v => 
      v.name.includes("David") || 
      v.name.includes("Daniel") || 
      v.name.includes("Mark") || 
      (v.name.toLowerCase().includes("male") && v.lang.startsWith("en"))
    );

    if (!preferredVoice) {
      preferredVoice = voices.find(v => v.lang.startsWith("en"));
    }

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 0.9; 

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      // 🔧 FIX: Check the Ref here instead of state variable
      if (isVoiceModeRef.current && !isMuted) {
          setTimeout(() => startListening(), 500);
      }
    };
    
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // --- SPEECH TO TEXT ---
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
      
      if (isVoiceModeRef.current) {
        processVoiceMessage(transcript);
      } else {
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
      }
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

  // --- VOICE API HANDLER ---
  const processVoiceMessage = async (voiceText) => {
    const userMessage = { role: 'user', content: voiceText };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: VOICE_SYSTEM_INSTRUCTION });
      
      const history = messages.slice(1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const chat = model.startChat({ history: history });
      const result = await chat.sendMessage([{ text: voiceText }]);
      const text = result.response.text();

      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
      speakResponse(text);

    } catch (error) {
      console.error(error);
      speakResponse("I'm having trouble connecting.");
    } finally {
      setLoading(false);
    }
  };

  // --- STANDARD API HANDLER ---
  const sendMessage = async () => {
    if ((!input.trim() && selectedImages.length === 0) || loading) return;

    if (!API_KEY) {
      alert("API Key is missing! Please check your settings.");
      return;
    }

    const userMessageText = input.trim() || `I have uploaded ${selectedImages.length} image(s). Please analyze them.`;
    const imagePreviews = selectedImages.map(img => img.preview);

    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessageText,
      images: imagePreviews 
    }]);

    setInput('');
    setLoading(true);
    
    const currentImages = [...selectedImages]; 
    setSelectedImages([]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash", 
        systemInstruction: SYSTEM_INSTRUCTION
      });

      const history = messages.slice(1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const chat = model.startChat({ history: history });

      let messageParts = [{ text: userMessageText }];
      currentImages.forEach(img => {
        messageParts.push({
          inlineData: { data: img.data, mimeType: img.type }
        });
      });

      const result = await chat.sendMessage(messageParts);
      const response = await result.response;
      const text = response.text();

      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
      
    } catch (error) {
      console.error('Gemini API Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '⚠️ I apologize, but I encountered an error connecting to the AI. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // --- NEW: SAVE FUNCTION ---
  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Please log in to save your session.");
        return;
    }

    // 🔧 FIX: Use environment variable for the API URL
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
                pageData: { messages: messages } // Saves the chat history
            })
        });

        const data = await response.json();
        if (response.ok) {
            alert("✅ Session saved successfully!");
        } else {
            alert(`❌ Error: ${data.message}`);
        }
    } catch (err) {
        console.error(err);
        alert("❌ Failed to connect to server");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result.split(',')[1];
        const newImage = {
          id: Date.now(), 
          type: file.type,
          data: base64Data,
          preview: event.target.result
        };
        setSelectedImages(prev => [...prev, newImage]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (indexToRemove) => {
    setSelectedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleQuickAction = (action) => setInput(action);

  const quickActions = [
    'I have a headache', 'I have a fever', 'I feel nauseous', 'I have chest pain', 'I\'m feeling dizzy'
  ];

  return (
    <div className="new-sympto-container">
      
      {/* --- NEW: VOICE AGENT OVERLAY --- */}
      {isVoiceMode && (
        <div className="new-voice-mode-overlay">
          <div className="new-voice-header">
            <span className="new-voice-badge">Voice Agent <span className="new-beta-tag">BETA</span></span>
            <button className="new-findings-btn" onClick={toggleVoiceMode}>Exit</button>
          </div>

          <div className="new-voice-visualizer">
            <div className={`new-orb ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}></div>
            <div className="new-voice-status-text">
              {isSpeaking ? "Sympto is speaking..." : isListening ? "Listening..." : loading ? "Thinking..." : "Tap mic to speak"}
            </div>
          </div>

          <div className="new-voice-controls">
            <button className={`new-control-btn new-mic-control ${isMuted ? 'muted' : ''}`} onClick={toggleMute}>
               {isMuted ? "🔇" : "🎙️"}
            </button>
            <button className="new-control-btn new-hangup-control" onClick={toggleVoiceMode}>
              📞
            </button>
          </div>
        </div>
      )}

    <Nev/>

      {/* Chat Area */}
      <div className="new-sympto-chat-area">
        <div className="new-chat-content">
          {messages.map((msg, idx) => (
            <div key={idx} className={`new-message-row ${msg.role === 'user' ? 'new-user-row' : 'new-assistant-row'}`}>
              <div className={`new-avatar ${msg.role === 'assistant' ? 'new-assistant-avatar' : 'new-user-avatar'}`}>
                {msg.role === 'assistant' ? '🤖' : '👤'}
              </div>
              <div className={`new-message-bubble ${msg.role === 'user' ? 'new-user-bubble' : 'new-assistant-bubble'}`}>
                {msg.images && msg.images.length > 0 && (
                  <div className="new-chat-images-grid">
                    {msg.images.map((imgSrc, i) => (
                      <img key={i} src={imgSrc} alt="Symptom" className="new-chat-image-item" />
                    ))}
                  </div>
                )}
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              </div>
            </div>
          ))}
          
          {loading && !isVoiceMode && (
            <div className="new-message-row new-assistant-row">
              <div className="new-avatar new-assistant-avatar">🤖</div>
              <div className="new-message-bubble new-assistant-bubble new-loading-bubble">
                <span className="new-spinner">⌛</span>
                <span>Analyzing...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Footer */}
      <div className="new-sympto-footer">
        <div className="new-footer-content">
          
          {/* Quick Actions */}
          {messages.length === 1 && (
            <div className="new-quick-actions">
              {quickActions.map((action, idx) => (
                <button key={idx} onClick={() => handleQuickAction(action)} className="new-quick-action-btn">
                  {action} <span>›</span>
                </button>
              ))}
            </div>
          )}

          {/* MULTI IMAGE PREVIEW AREA */}
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

          {/* Input Bar */}
          <div className="new-input-bar">
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageSelect} 
              accept="image/*" 
              style={{ display: 'none' }} 
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={loading} 
              className="new-icon-btn new-camera-btn"
              title="Upload Image"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg 
  xmlns="http://www.w3.org/2000/svg" 
  width="24" 
  height="24" 
  viewBox="0 -960 960 960" 
  fill="currentColor"
  style={{ minWidth: '24px', minHeight: '24px' }}
>
  <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </button>

            {/* VOICE TRIGGER BUTTON */}
       <button 
  onClick={toggleVoiceMode} 
  className="new-icon-btn new-voice-trigger-btn"
  title="Start Voice Agent"
>
  {/* Standard 24px Text-to-Speech Icon - Guaranteed to appear */}
 <svg 
    xmlns="http://www.w3.org/2000/svg" 
    height="24px" 
    width="24px" 
    viewBox="0 -960 960 960" 
    fill="currentColor"
  >
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
                placeholder={selectedImages.length > 0 ? "Add a caption..." : "Describe symptoms..."}
                disabled={loading}
                className="new-chat-input"
              />
            </div>

            <button onClick={sendMessage} disabled={loading || (!input.trim() && selectedImages.length === 0)} className="new-icon-btn new-send-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>

            {/* --- NEW: SAVE BUTTON (ADDED TO THE RIGHT) --- */}
            <button 
                onClick={handleSave} 
                disabled={loading || messages.length <= 1} // Disabled if chat is empty
                className="new-icon-btn new-save-btn"
                title="Save Session"
                style={{ marginLeft: '8px' }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor">
                    <path d="M840-680v480q0 33-23.5 56.5T760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h480l160 160Zm-80 34L646-760H200v560h560v-446ZM480-240q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM240-560h360v-160H240v160Zm-40-86v446-560 114Z"/>
                </svg>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}