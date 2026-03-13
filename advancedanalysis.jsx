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
const ALL_KEYS = [
  import.meta.env.VITE_GEMINI_API_KEY1,
  import.meta.env.VITE_GEMINI_API_KEY,
  import.meta.env.VITE_GEMINI_API_KEY2,
  import.meta.env.VITE_GEMINI_API_KEY3,
  import.meta.env.VITE_GEMINI_API_KEY4,
];

// Filter out undefined/empty keys first
const validKeys = ALL_KEYS.filter((key) => key && key.length > 0);

// --- ADD THIS ABOVE return () ---
  const isUrgentMessage = (text) => {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return lowerText.includes('emergency') || 
           lowerText.includes('immediate medical attention') || 
           lowerText.includes('call 112') ||
           lowerText.includes('seek urgent care');
  };

// Select a random key from the valid list
const API_KEY = validKeys[Math.floor(Math.random() * validKeys.length)];

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: 'Hello! I\'m Sympto, your medical symptom checker assistant. I\'m here to help you understand your symptoms better.\n\n⚠️ Important: I am not a doctor and cannot provide medical diagnoses. Always consult with a healthcare professional for medical advice.\n\nTo get started, please tell me:\n1. What symptoms are you experiencing?\n2. When did they start?\n3. How severe are they (mild, moderate, severe)?\n\nYou can also upload multiple images of visible symptoms using the camera button.'
};

export default function Advancedanalysis() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
 
  // --- STATE FOR MENU ---
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // --- STATE FOR MULTIPLE IMAGES & FILES ---
  const [selectedImages, setSelectedImages] = useState([]);

  // --- STATE FOR VOICE MODE ---
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);

  // --- HIGHLIGHTING STATE ---
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState(null); 
  const [currentCharIndex, setCurrentCharIndex] = useState(-1); 

  // --- NEW: USER DATA STATE ---
  const [userData, setUserData] = useState(null);
 
  const isVoiceModeRef = useRef(false);
  const fileInputRef = useRef(null);
  const documentInputRef = useRef(null); // Ref for documents
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const chatContentRef = useRef(null);
  const textareaRef = useRef(null); // Ref for auto-expanding textarea

  // --- SPEECH QUEUE REFS ---
  const speechQueueRef = useRef([]); 
  const isSpeakingRef = useRef(false);
  const accumulatedLengthRef = useRef(0); // Tracks character count across sentences for highlighting

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    isVoiceModeRef.current = isVoiceMode;
    // Hard reset when leaving voice mode
    if (!isVoiceMode) {
        window.speechSynthesis.cancel();
        speechQueueRef.current = [];
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        setSpeakingMessageIndex(null);
        setCurrentCharIndex(-1);
        stopListening();
    }
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

  // --- FETCH USER DATA ---
  useEffect(() => {
    const fetchUserData = async () => {
        const token = localStorage.getItem('token');
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        const storedUser = localStorage.getItem('userData');
        if (storedUser) {
            setUserData(JSON.parse(storedUser));
        }

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
      if (recognitionRef.current) recognitionRef.current.stop();
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

  const VOICE_SYSTEM_INSTRUCTION = `You are Sympto, a medical symptom checker assistant. Your role is to:
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
ADDITIONAL FOR VOICE MODE: reply in 2-3 sentences max to keep the conversation flowing.
If the user uploads images or documents, acknowledge them and incorporate them into your analysis.
If the user is silent for a while, prompt them gently to provide more information or ask if they have any questions.
Always encourage the user to consult with a healthcare professional for medical advice.`;

  const handleClearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setShowMenu(false);
    window.speechSynthesis.cancel();
    setSpeakingMessageIndex(null);
    setInput('');
    setSelectedImages([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleDownloadPDF = async () => {
    setShowMenu(false);
    const element = chatContentRef.current;
    if (!element) return;

    // Visual feedback
    const originalCursor = document.body.style.cursor;
    document.body.style.cursor = 'wait';

    try {
      // 1. PREPARE THE CLONE
      const clone = element.cloneNode(true);
      const originalWidth = element.offsetWidth;
      
      // 2. APPLY "PAPER MODE" STYLES
      Object.assign(clone.style, {
        position: 'absolute',
        top: '-10000px',
        left: '0',
        width: `${originalWidth}px`,
        height: 'auto',      
        maxHeight: 'none',    
        overflow: 'visible',  
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        zIndex: '-1'
      });

      // 3. INJECT HEADER (Logo + Title)
      const header = document.createElement('div');
      header.style.cssText = `
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 20px;
        border-bottom: 2px solid #2563eb;
        margin-bottom: 20px;
        background: #ffffff;
        width: 100%;
        box-sizing: border-box;
      `;

      // Header Logo - Hardcoded sizing
      header.innerHTML = `
        <img
          src="${logo1}"
          style="width: 80px; height: 80px; min-width: 80px; margin-right: 20px; display: block;"
        />
        <div>
          <h1 style="color: #2563eb; margin: 0; font-size: 32px; font-weight: bold;">Sympto</h1>
          <p style="color: #444; margin: 5px 0 0 0; font-size: 14px;">Medical Symptom Report</p>
          <p style="color: #666; margin: 5px 0 0 0; font-size: 12px;">Generated: ${new Date().toLocaleString()}</p>
        </div>
      `;

      clone.insertBefore(header, clone.firstChild);

      // 4. CRITICAL: CSS INJECTION (THE FIX)
      const styleTag = document.createElement('style');
      styleTag.innerHTML = `
        * {
          print-color-adjust: exact !important;
          -webkit-print-color-adjust: exact !important;
        }
        
        .new-avatar {
             width: 50px !important;
             height: 50px !important;
             min-width: 50px !important;
             flex: 0 0 50px !important;
             margin-right: 15px !important;
             display: flex !important;
             align-items: center !important;
             justify-content: center !important;
        }

        .new-bot-logo, .new-avatar img {
             width: 100% !important;
             height: 100% !important;
             object-fit: contain !important;
             display: block !important;
             border-radius: 50% !important;
        }

        .new-message-bubble {
            color: #000000 !important;
            border: 1px solid #ccc !important;
            box-shadow: none !important;
        }

        .new-loading-bubble, .new-spinner { display: none !important; }
      `;
      clone.appendChild(styleTag);

      // 5. COLOR CORRECTION
      const allElements = clone.querySelectorAll('*');
      allElements.forEach((el) => {
        if (window.getComputedStyle(el).color !== 'rgba(0, 0, 0, 0)') {
             el.style.color = '#000000';
        }
        const bg = window.getComputedStyle(el).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            if (!el.style.backgroundColor?.includes('254') && !el.classList.contains('new-user-avatar')) {
               el.style.backgroundColor = 'transparent';
            }
        }
      });

      document.body.appendChild(clone);
      await new Promise(resolve => setTimeout(resolve, 250)); // Wait for render

      const cloneHeight = clone.scrollHeight;
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowHeight: cloneHeight + 2000,
        y: 0,
        scrollY: 0
      });

      document.body.removeChild(clone);
      document.body.style.cursor = originalCursor;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

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

      pdf.save(`Sympto-Report-${new Date().toISOString().slice(0,10)}.pdf`);

    } catch (err) {
      console.error("PDF Error:", err);
      document.body.style.cursor = originalCursor;
      alert("Could not generate PDF. Please try again.");
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

  // ==========================================
  // 🚀 QUEUE-BASED SPEECH ENGINE (NO BREAKING + HIGHLIGHT)
  // ==========================================

  const getVoiceForLang = (langCode) => {
    const voices = window.speechSynthesis.getVoices();
    // 1. Exact match
    let voice = voices.find(v => v.lang === langCode);
    // 2. Base match
    if (!voice) voice = voices.find(v => v.lang.startsWith(langCode.split('-')[0]));
    // 3. Fallback to default
    if (!voice) voice = voices.find(v => v.default);
    return voice;
  };

  const detectLanguage = (text) => {
    if (/[\u0900-\u097F]/.test(text)) return 'hi-IN'; // Hindi
    if (/[\u0980-\u09FF]/.test(text)) return 'mr-IN'; // Marathi 
    if (/[\u0600-\u06FF]/.test(text)) return 'ar-SA'; // Arabic
    if (/[\u4E00-\u9FFF]/.test(text)) return 'zh-CN'; // Chinese
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja-JP'; // Japanese
    if (/[\u0400-\u04FF]/.test(text)) return 'ru-RU'; // Russian
    return 'en-US'; // Default
  };

  const speakChunk = () => {
    if (speechQueueRef.current.length === 0) {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        setSpeakingMessageIndex(null);
        setCurrentCharIndex(-1);
        
        // Seamlessly start listening again
        if (isVoiceModeRef.current && !isMuted) {
             setTimeout(() => startListening(), 300);
        }
        return;
    }

    isSpeakingRef.current = true;
    setIsSpeaking(true);

    const text = speechQueueRef.current.shift(); // Dequeue next sentence
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Critical: Attach to window to prevent Garbage Collection bug in Chrome/Edge
    window.currentUtterance = utterance;

    const lang = detectLanguage(text);
    utterance.lang = lang;
    
    const voice = getVoiceForLang(lang);
    if (voice) utterance.voice = voice;

    utterance.rate = 1.0; 
    utterance.pitch = 1.0;

    // --- HIGHLIGHTING LOGIC ---
    // We capture the current accumulated length to calculate global position
    const startOffset = accumulatedLengthRef.current;
    
    utterance.onboundary = (event) => {
       // Update global index = start position of this chunk + current word position
       setCurrentCharIndex(startOffset + event.charIndex);
    };

    utterance.onend = () => {
        // Add length of this chunk to accumulator + 1 for space/punctuation
        accumulatedLengthRef.current += text.length; 
        speakChunk(); // Trigger next chunk
    };

    utterance.onerror = (e) => {
        console.error("Speech Error", e);
        speakChunk(); // Skip to next on error
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleSpeak = (fullText, index) => {
    if (!('speechSynthesis' in window)) return;
    
    // --- 1. TOGGLE STOP LOGIC ---
    // If clicking the same message that is currently speaking, STOP it.
    if (speakingMessageIndex === index) {
        window.speechSynthesis.cancel();
        setSpeakingMessageIndex(null);
        setCurrentCharIndex(-1);
        setIsSpeaking(false);
        speechQueueRef.current = [];
        isSpeakingRef.current = false;
        return;
    }

    // --- 2. START LOGIC ---
    // Hard stop previous
    window.speechSynthesis.cancel();
    speechQueueRef.current = [];
    accumulatedLengthRef.current = 0; // Reset highlighter tracker
    setSpeakingMessageIndex(index);
    
    // Clean text (remove markdown for speech engine)
    const cleanText = fullText
      .replace(/[*#_`~]/g, '') 
      .replace(/https?:\/\/\S+/g, '') 
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .trim();

    if (!cleanText) return;

    // Split into sentences/chunks to avoid "breaking"
    // We try to keep punctuation attached to the sentence
    const sentences = cleanText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleanText];
    
    sentences.forEach(s => {
        // We push the raw sentence chunk
        if (s.trim()) speechQueueRef.current.push(s); 
    });

    speakChunk();
  };

  // --- HIGHLIGHTER & MARKDOWN COMPONENT ---
  const renderMessageContent = (msg, index) => {
    // If not speaking this message, parse markdown (bold) and return text
    if (speakingMessageIndex !== index) {
        const formattedText = msg.content.split(/(\*\*.*?\*\*)/g).map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} style={{fontWeight: 'bold', color: '#1f2937'}}>{part.slice(2, -2)}</strong>;
            }
            return <span key={i}>{part}</span>;
        });
        return <div style={{ whiteSpace: 'pre-wrap' }}>{formattedText}</div>;
    }

    // Prepare text for highlighting (Must match speech cleaning roughly)
    const text = msg.content.replace(/[*#_`~]/g, '');
    const words = text.split(/(\s+)/); // Split by whitespace but keep delimiters
    
    let charCount = 0;

    return (
        <div style={{ whiteSpace: 'pre-wrap' }}>
            {words.map((word, i) => {
                const start = charCount;
                const end = charCount + word.length;
                charCount += word.length;

                // Check if the current highlighter index is within this word
                const isActive = currentCharIndex >= start && currentCharIndex < end;
                const isWord = word.trim().length > 0;

                return (
                    <span
                        key={i}
                        style={{
                            backgroundColor: (isActive && isWord) ? '#fef08a' : 'transparent', // Yellow Highlight
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
    if (isSpeakingRef.current) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e){}
    }

    const recognition = new SpeechRecognition();
    recognition.lang = navigator.language || 'en-US'; 
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (!transcript) return;

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

  const handleFooterMicClick = () => isListening ? stopListening() : startListening();

  const toggleVoiceMode = () => {
    if (isVoiceMode) {
      setIsVoiceMode(false);
      stopListening();
      window.speechSynthesis.cancel();
      speechQueueRef.current = [];
      isSpeakingRef.current = false;
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
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    }
  };

  const processVoiceMessage = async (voiceText) => {
    if (!voiceText.trim()) return;

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
      
      // Auto speak for voice mode
      handleSpeak(text, messages.length + 1);

    } catch (error) {
        const errText = "I'm having trouble connecting. Please try again.";
        setMessages(prev => [...prev, { role: 'assistant', content: errText }]);
        handleSpeak(errText, -1);
    } finally { 
        setLoading(false); 
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && selectedImages.length === 0) || loading) return;

    // --- NEW: CREATE IMAGE COMMAND ---
    if (input.trim().startsWith('/image ')) {
        const prompt = input.trim().replace('/image ', '');
        
        // Random seed to prevent browser caching issues
        const randomSeed = Math.floor(Math.random() * 1000000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=400&nologo=true&seed=${randomSeed}`;
        
        setMessages(prev => [
            ...prev, 
            { role: 'user', content: input }, 
            { role: 'assistant', content: `Here is the generated image for: "${prompt}"`, generatedImage: imageUrl }
        ]);
        
        setInput('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        return; // Skip Gemini AI call
    }

    if (!API_KEY) { alert("API Key is missing!"); return; }

    const userMessageText = input.trim() || `I have uploaded ${selectedImages.length} file(s). Please analyze them.`;
    
    // Pass object array instead of just strings so we know if it's a doc or image
    const imagePreviews = selectedImages.map(img => ({ src: img.preview, isDoc: img.isDoc }));
    
    setMessages(prev => [...prev, { role: 'user', content: userMessageText, images: imagePreviews }]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto'; // Reset text area height
    setLoading(true);
    
    const currentImages = [...selectedImages];
    setSelectedImages([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (documentInputRef.current) documentInputRef.current.value = '';

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: SYSTEM_INSTRUCTION });
      const history = messages.slice(1).map(msg => ({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] }));
      const chat = model.startChat({ history: history });
      
      let messageParts = [{ text: userMessageText }];
      currentImages.forEach(img => { 
          // Gemini 1.5 Flash supports both image and application/pdf via inlineData
          messageParts.push({ inlineData: { data: img.data, mimeType: img.type } }); 
      });
      
      const result = await chat.sendMessage(messageParts);
      const text = result.response.text();
      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
      
      // If we are in voice mode, speak the result
      if (isVoiceMode) {
          handleSpeak(text, messages.length + 1);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Error connecting to AI.' }]);
    } finally { setLoading(false); }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // --- UPDATED: HANDLE FILES & IMAGES ---
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result.split(',')[1];
        const isImage = file.type.startsWith('image/');
        
        setSelectedImages(prev => [...prev, { 
            id: Date.now(), 
            type: file.type, 
            data: base64Data, 
            preview: isImage ? event.target.result : file.name, // Show name for documents
            isDoc: !isImage
        }]);
        
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (documentInputRef.current) documentInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index) => setSelectedImages(prev => prev.filter((_, i) => i !== index));
  const handleQuickAction = (action) => setInput(action);
  
  // Quick Create Image Helper
  const handleCreateImageCommand = () => {
      setInput('/image ');
      textareaRef.current?.focus();
  };

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
          {messages.map((msg, idx) => {
            const isUrgent = msg.role === 'assistant' && isUrgentMessage(msg.content);
            
            return (
            <div key={idx} className={`new-message-row ${msg.role === 'user' ? 'new-user-row' : 'new-assistant-row'} animate-message`}>
             <div className={`new-avatar ${msg.role === 'assistant' ? 'new-assistant-avatar' : 'new-user-avatar'}`}>
              {msg.role === 'assistant' ? (
                <img
                  src={logo1}
                  alt="Sympto"
                  className="new-bot-logo"
                  onClick={() => handleSpeak(msg.content, idx)}
                  style={{ width: '80%', height: '80%', objectFit: 'cover', borderRadius: '50%', padding: 0, cursor: 'pointer' }}
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
              {/* URGENT BUBBLE DESIGN */}
              <div 
                className={`new-message-bubble ${msg.role === 'user' ? 'new-user-bubble' : 'new-assistant-bubble'} ${isUrgent ? 'urgent-message' : ''}`}
                style={isUrgent ? { 
                    backgroundColor: '#fff0f0', 
                    border: '2px solid #ffcccc', 
                    borderLeft: '6px solid #ef4444', 
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)' 
                } : {}}
              >
                {/* URGENT BANNER */}
                {isUrgent && (
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        color: '#b91c1c', 
                        fontWeight: 'bold', 
                        fontSize: '13px',
                        marginBottom: '10px', 
                        paddingBottom: '8px',
                        borderBottom: '1px solid #fecaca',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor" style={{ marginRight: '6px' }}>
                            <path d="M480-120q-33 0-56.5-23.5T400-200q0-33 23.5-56.5T480-280q33 0 56.5 23.5T560-200q0-33-23.5 56.5T480-120Zm-40-240v-440h80v440h-80Z"/>
                        </svg>
                        Action Required
                    </div>
                )}
                
                {/* --- RENDER ATTACHED IMAGES OR DOCS --- */}
                {msg.images?.length > 0 && (
                  <div className="new-chat-images-grid">
                    {msg.images.map((fileObj, i) => (
                      // Handle both new Object structure and old String structure
                      (fileObj.isDoc) ? (
                         <div key={i} style={{ padding: '8px 12px', background: '#f3f4f6', color: '#374151', borderRadius: '6px', fontSize: '13px', marginBottom: '8px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center' }}>
                             📄 {fileObj.src}
                         </div>
                      ) : (
                         <img key={i} src={fileObj.src || fileObj} alt="Symptom" className="new-chat-image-item" />
                      )
                    ))}
                  </div>
                )}
                
            {/* --- RENDER GENERATED IMAGE --- */}
                {msg.generatedImage && (
                    <div style={{ position: 'relative', width: '100%', maxWidth: '300px', marginTop: '10px' }}>
                        <img 
                          src={msg.generatedImage} 
                          alt="Generated Content" 
                          style={{
                              width: '100%', 
                              minHeight: '300px', 
                              backgroundColor: '#f3f4f6', 
                              borderRadius: '8px', 
                              border: '1px solid #e5e7eb',
                              objectFit: 'cover',
                              display: 'block'
                          }} 
                          onError={(e) => {
                              e.target.onerror = null; // Prevent infinite loop
                              // Bulletproof inline SVG fallback that cannot fail a network request
                              e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23f3f4f6%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20fill%3D%22%23ef4444%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3E%E2%9A%A0%EF%B8%8F%20AI%20Image%20Server%20Overloaded%3C%2Ftext%3E%3C%2Fsvg%3E";
                          }}
                        />
                        {/* Generating Text Placeholder */}
                        <div style={{
                            position: 'absolute', 
                            top: '50%', left: '50%', 
                            transform: 'translate(-50%, -50%)', 
                            color: '#9ca3af', fontSize: '12px', zIndex: -1
                        }}>
                            Generating...
                        </div>
                    </div>
                )}
                        {/* Little text to let the user know it's working */}
                        <div style={{
                            position: 'absolute', 
                            top: '50%', left: '50%', 
                            transform: 'translate(-50%, -50%)', 
                            color: '#9ca3af', fontSize: '12px', zIndex: -1
                        }}>
                            Generating...
                        </div>
                    </div>
                )}
                {/* TEXT CONTENT WITH HIGHLIGHTING AND MARKDOWN */}
                {renderMessageContent(msg, idx)}
              </div>
            </div>
            );
          })}
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

          {/* --- NEW: RENDER UPLOAD PREVIEWS (Image or Doc) --- */}
          {selectedImages.length > 0 && (
            <div className="new-multi-image-preview">
              {selectedImages.map((file, idx) => (
                <div key={file.id} className="new-thumbnail-wrapper">
                  {file.isDoc ? (
                      <div style={{ background: '#e5e7eb', width: '50px', height: '50px', padding: '5px', borderRadius: '8px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', color: '#4b5563' }}>
                          📄<br/>Doc
                      </div>
                  ) : (
                      <img src={file.preview} alt="Preview" />
                  )}
                  <button onClick={() => removeImage(idx)} className="new-thumbnail-remove-btn">×</button>
                </div>
              ))}
              <button onClick={() => fileInputRef.current?.click()} className="new-add-more-btn" title="Add another attachment">+</button>
            </div>
          )}

          {/* --- NEW FOOTER ROW (Layout for Robot + Input) --- */}
          <div className="new-footer-row">

            <div className="new-menu-wrapper" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="new-robot-standalone-btn"
                title="Options"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff',
                  border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)', transition: 'all 0.2s ease', color: 'gray', padding: 0
                }}
              >
               <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="5" r="2" fill="currentColor"/>
                  <circle cx="12" cy="12" r="2" fill="currentColor"/>
                  <circle cx="12" cy="19" r="2" fill="currentColor"/>
               </svg>
              </button>

              {showMenu && (
                <div className="new-dropup-menu">
                  <div className="new-dropdown-item" onClick={handleClearChat} style={{ color: '#ef4444' }}>
                    <span>🗑️</span> Clear Chat
                  </div>
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

            <div className="new-input-bar">
              
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" style={{ display: 'none' }} />
              {/* NEW: Input for Document Files (PDF, etc) */}
              <input type="file" ref={documentInputRef} onChange={handleFileSelect} accept="application/pdf,text/plain,.doc,.docx" style={{ display: 'none' }} />
              
              {/* IMAGE UPLOAD ICON */}
              <button onClick={() => fileInputRef.current?.click()} disabled={loading} className="new-icon-btn new-camera-btn" title="Upload Image">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" fill="currentColor">
                  <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/>
                </svg>
              </button>

              {/* NEW: FILE UPLOAD ICON (Paperclip) */}
              <button onClick={() => documentInputRef.current?.click()} disabled={loading} className="new-icon-btn" title="Upload Document (PDF/Text)" style={{ color: '#6b7280' }}>
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                  <path d="M720-330q0 104-73 177T470-80q-104 0-177-73t-73-177v-370q0-75 52.5-127.5T400-880q75 0 127.5 52.5T580-700v350q0 46-32 78t-78 32q-46 0-78-32t-32-78v-370h80v370q0 13 8.5 21.5T470-320q13 0 21.5-8.5T500-350v-350q-1-42-29.5-71T400-800q-42 0-71 29t-29 71v370q-1 71 49 120.5T470-160q70 0 119-49.5T640-330v-390h80v390Z"/>
                </svg>
              </button>

              {/* NEW: CREATE IMAGE ICON (Magic Wand) */}
              <button onClick={handleCreateImageCommand} disabled={loading} className="new-icon-btn" title="Generate AI Image" style={{ color: '#8b5cf6' }}>
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                  <path d="M480-80 346-214l-84-84-84-84q-23-23-23-56.5t23-56.5l346-346q23-23 56.5-23t56.5 23l169 169q23 23 23 56.5T806-360L480-80Zm-28-254 254-254-169-169-254 254 169 169Zm194-43q8-8 8-20t-8-20l-15-15q-8-8-20-8t-20 8l-15 15q-8 8-8 20t8 20l15 15q8 8 20 8t20-8ZM240-800q-33 0-56.5-23.5T160-880q0 33-23.5 56.5T80-800q33 0 56.5 23.5T160-720q0-33 23.5-56.5T240-800Z"/>
                </svg>
              </button>
              
              <button onClick={toggleVoiceMode} className="new-icon-btn new-voice-trigger-btn" title="Full Voice Mode">
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" width="24px" viewBox="0 -960 960 960" fill="currentColor">
                    <path d="M80-80v-80q46 0 91-6t88-22q-46-23-72.5-66.5T160-349v-91h160v-120h135L324-822l72-36 131 262q20 40-3 78t-68 38h-56v40q0 33-23.5 56.5T320-360h-80v11q0 35 21.5 61.5T316-252l12 3q40 10 45 50t-31 60q-60 33-126.5 46T80-80Zm572-114-57-56q21-21 33-48.5t12-59.5q0-32-12-59.5T595-466l57-57q32 32 50 74.5t18 90.5q0 48-18 90t-50 74ZM765-80l-57-57q43-43 67.5-99.5T800-358q0-66-24.5-122T708-579l57-57q54 54 84.5 125T880-358q0 81-30.5 152.5T765-80Z"/>
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
              </button>

              <div className="new-text-input-wrapper">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder={isListening ? "Listening..." : (selectedImages.length > 0 ? "Add a caption..." : "Describe symptoms...")}
                  disabled={loading}
                  className="new-chat-input"
                  rows={1}
                  style={{ 
                      resize: 'none', 
                      overflowY: 'auto', 
                      maxHeight: '120px',
                      paddingTop: '10px',
                      fontFamily: 'inherit'
                  }}
                />
              </div>

              {(!input.trim() && selectedImages.length === 0) ? (
                  <button onClick={handleFooterMicClick} className="new-icon-btn new-mic-btn" style={{ color: isListening ? '#ef4444' : 'inherit' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                        <path d="M480-400q-60 0-102-42t-42-102v-240q0-60 42-102t102-42q60 0 102 42t42 102v240q0 60-42 102t102-42q60 0 102 42t42 102v240q0 60-42 102t-102 42Zm0-80q26 0 43-17t17-43v-240q0-26-17-43t-43-17q-26 0-43 17t-17 43v240q0 26 17 43t43 17Zm0 320q-133 0-234.5-81.5T128-480h86q16 87 86.5 143.5T480-280q87 0 157.5-56.5T724-480h86q-16 124-117.5 205.5T480-160Zm0-480Z"/>
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
