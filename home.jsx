// Home.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowRight, Activity, Cpu, Globe, Smartphone, 
  User, Users, Heart, ShieldCheck, 
  Baby, Dumbbell, GraduationCap, Briefcase, Lock,
  Dna, MessageSquare, BrainCircuit, FileText, Loader2, AlertCircle, Search,
  CheckCircle, AlertTriangle, Info,
  Thermometer, Wind, Droplets, HeartPulse, Brain, Zap, Moon, Frown, Flame,
  ShieldAlert 
} from 'lucide-react';
import logoLight from './logo.png';
import logoDark from './logodark.png';
// Components
import Nav from './test.jsx'; 
import Chat from "./chat.jsx";

// Styles
import './homecss.css';

// --- NEW TYPING EFFECT COMPONENT ---
const TypingEffect = () => {
  const words = ["Men", "Women", "Adults", "Parents", "Seniors", "You"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const typeSpeed = 100;
    const deleteSpeed = 50;
    const pauseTime = 1500;

    const handleTyping = () => {
      const fullWord = words[currentWordIndex];

      if (!isDeleting) {
        setCurrentText(fullWord.substring(0, currentText.length + 1));
        if (currentText === fullWord) {
          setTimeout(() => setIsDeleting(true), pauseTime);
        }
      } else {
        setCurrentText(fullWord.substring(0, currentText.length - 1));
        if (currentText === '') {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    };

    const timer = setTimeout(handleTyping, isDeleting ? deleteSpeed : typeSpeed);
    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentWordIndex]);

  return (
    <span style={{ display: 'inline-block', minWidth: '150px', textAlign: 'left' }}>
      <style>
        {`
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        `}
      </style>
      <span style={{ color: '#0ea5e9', fontWeight: 800 }}>{currentText}</span>
      <span style={{ color: '#0ea5e9', fontWeight: 400, marginLeft: '2px', animation: 'blink 1s step-end infinite' }}>|</span>
    </span>
  );
};

// --- MODAL CONTENT DATA ---
const modalData = {
  about: {
    title: "About Sympto",
    content: (
      <>
        <p><strong>Bridging the gap between symptoms and clarity.</strong></p>
        <p>At Sympto, we believe everyone deserves access to clear, understandable health information. Our AI-driven platform helps users track symptoms and understand potential health patterns before they visit a doctor.</p>
        <h3>Our Mission</h3>
        <p>To empower individuals to take control of their health data securely and efficiently.</p>
      </>
    )
  },
  contact: {
    title: "Contact Support",
    content: (
      <>
        <p>Have questions about the app? We're here to help.</p>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
          <li><strong>Email:</strong> support@sympto.in</li>
          <li><strong>Phone:</strong> +91 000 000 0000</li>
          <li><strong>HQ:</strong> Thane, Maharashtra, India</li>
        </ul>
        <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>Support hours: Mon-Fri, 9am - 6pm IST.</p>
      </>
    )
  },
  careers: {
    title: "Join the Team",
    content: (
      <>
        <p>We are looking for passionate individuals to help us revolutionize personal health tracking.</p>
        <h3>Open Positions</h3>
        <ul>
          <li>Frontend Developer (React) - Remote</li>
          <li>Medical Data Analyst - Thane</li>
        </ul>
        <p>Send your CV to <strong>jobs@sympto.in</strong></p>
      </>
    )
  },
  privacy: {
    title: "Privacy Policy",
    content: (
      <>
        <p>Last Updated: December 2025</p>
        <h3>1. Data Collection</h3>
        <p>We collect data you provide directly to us, such as when you create an account. We DO NOT share your personal health data with third-party advertisers.</p>
        <h3>2. Security</h3>
        <p>We use industry-standard encryption to protect your medical insights.</p>
      </>
    )
  },
  terms: {
    title: "Terms of Service",
    content: (
      <>
        <p>By accessing Sympto.in, you agree to be bound by these Terms.</p>
        <h3>Medical Disclaimer</h3>
        <p>Sympto is <strong>not</strong> a medical device. The content provided is for informational purposes only. Always consult a doctor for medical advice.</p>
      </>
    )
  },
  cookies: {
    title: "Cookie Policy",
    content: (
      <>
        <p>We use cookies to ensure you get the best experience on our website.</p>
        <ul>
          <li><strong>Essential Cookies:</strong> Required for login sessions.</li>
          <li><strong>Analytics:</strong> Used to improve our features.</li>
        </ul>
      </>
    )
  },
  parents: {
    title: "Healthcare for Parents",
    content: (
      <>
        <h3>Peace of mind for your family</h3>
        <p>When your child wakes up with a fever at 2 AM, Sympto is here to help. Our pediatric triage system guides you through symptom checking to determine if you need immediate care, a doctor's visit, or home rest.</p>
        <ul>
          <li>24/7 symptom analysis</li>
          <li>Guidance on pediatric red flags</li>
          <li>Easy tracking for multiple children</li>
        </ul>
      </>
    )
  },
  seniors: {
    title: "Healthcare for Seniors",
    content: (
      <>
        <h3>Proactive aging and chronic care</h3>
        <p>Sympto makes it easy for seniors to monitor chronic risks and understand new symptoms without getting overwhelmed by confusing medical jargon on the internet.</p>
        <ul>
          <li>Track recurring symptoms easily</li>
          <li>Understand medication side-effect overlaps</li>
          <li>Clear, large-text reports to share with caregivers</li>
        </ul>
      </>
    )
  },
  adults: {
    title: "Healthcare for Adults",
    content: (
      <>
        <h3>Your personal health baseline</h3>
        <p>Keep track of your general health, from unexplained fatigue to seasonal allergies. Catch potential issues early before they disrupt your busy life.</p>
      </>
    )
  },
  doctors: {
    title: "Support for Doctors",
    content: (
      <>
        <h3>Streamlined clinical decision support</h3>
        <p>Sympto helps patients arrive at your clinic better prepared, with organized symptom histories that save consultation time and improve diagnostic accuracy.</p>
      </>
    )
  },
  children: {
    title: "Healthcare for Children",
    content: (
      <>
        <h3>Child-focused symptom tracking</h3>
        <p>Clear, age-appropriate symptom tracking that helps parents understand the severity of common childhood illnesses.</p>
      </>
    )
  },
  athletes: {
    title: "Healthcare for Athletes",
    content: (
      <>
        <h3>Optimize recovery and track injuries</h3>
        <p>Monitor physical strain, joint pain, and recovery metrics. Differentiate between normal training soreness and potential injuries requiring medical attention.</p>
      </>
    )
  },
  students: {
    title: "Healthcare for Students",
    content: (
      <>
        <h3>Mental and physical aid</h3>
        <p>Balancing studies takes a toll. Sympto helps students track stress-related physical symptoms, sleep issues, and general wellness away from home.</p>
      </>
    )
  },
  workers: {
    title: "Healthcare for Workers",
    content: (
      <>
        <h3>Occupational health monitoring</h3>
        <p>Keep track of repetitive strain injuries, posture-related issues, or stress burnout symptoms directly linked to your work environment.</p>
      </>
    )
  }
};

// --- PROFILE DATA ---
const profiles = [
  { id: 1, label: "Parents", tagline: " pediatric triage 24/7", icon: <Users size={32} /> },
  { id: 2, label: "Seniors", tagline: "Monitor chronic risks", icon: <Heart size={32} /> },
  { id: 3, label: "Adults", tagline: "General health checks", icon: <User size={32} /> },
  { id: 4, label: "Doctors", tagline: "Clinical decision support", icon: <Activity size={32} /> },
  { id: 5, label: "Children", tagline: "Symptom tracking", icon: <Baby size={32} /> },
  { id: 6, label: "Athletes", tagline: "Recovery & injury", icon: <Dumbbell size={32} /> },
  { id: 7, label: "Students", tagline: "Mental & physical aid", icon: <GraduationCap size={32} /> },
  { id: 8, label: "Workers", tagline: "Occupational health", icon: <Briefcase size={32} /> },
];

// --- FEATURES DATA ---
const futureFeatures = [
  {
    title: "AI & Machine Learning",
    desc: "Sophisticated AI analyzes massive datasets to uncover intricate patterns and predict health outcomes.",
    icon: <Cpu size={32} />
  },
  {
    title: "Wearables & IoT",
    desc: "Continuous, real-time tracking of vital signs outside clinical settings empowers patient self-management.",
    icon: <Activity size={32} />
  },
  {
    title: "Telehealth Evolution",
    desc: "Dismantling geographical barriers to access, enabling effective remote monitoring and virtual care.",
    icon: <Smartphone size={32} />
  },
  {
    title: "Big Data Interoperability",
    desc: "Seamlessly storing and securely sharing patient information across disparate medical systems.",
    icon: <Globe size={32} />
  },
  {
    title: "End-to-End Security",
    desc: "State-of-the-art encryption ensures your personal health data remains private and compliant.",
    icon: <Lock size={32} />
  },
  {
    title: "Genetic Insights",
    desc: "Integrating genomic data to provide hyper-personalized risk assessments and preventative care plans.",
    icon: <Dna size={32} />
  }
];

// --- EXPANDED DISEASE CATEGORIES ---
const diseaseCategories = [
  {
    title: "Common Illnesses",
    diseases: [
      { name: "Common Cold", desc: "Mild viral infection of the nose and throat.", icon: <Thermometer size={24} /> },
      { name: "Influenza (Flu)", desc: "Respiratory illness with fever and aches.", icon: <Wind size={24} /> },
      { name: "COVID-19", desc: "Contagious respiratory illness caused by a virus.", icon: <ShieldAlert size={24} /> },
      { name: "Strep Throat", desc: "Bacterial infection causing a severe sore throat.", icon: <AlertCircle size={24} /> },
      { name: "Gastroenteritis", desc: "Intestinal infection marked by stomach cramps.", icon: <Droplets size={24} /> },
      { name: "Allergic Rhinitis", desc: "Allergic response causing itchy, watery eyes and sneezing.", icon: <Wind size={24} /> },
      { name: "Bronchitis", desc: "Inflammation of the lining of your bronchial tubes.", icon: <Activity size={24} /> },
      { name: "Sinusitis", desc: "Condition in which the cavities around the nasal passages become inflamed.", icon: <AlertCircle size={24} /> },
      { name: "Ear Infection", desc: "Inflammation of the middle ear, usually caused by bacteria.", icon: <Zap size={24} /> },
      { name: "Conjunctivitis", desc: "Inflammation or infection of the outer membrane of the eyeball.", icon: <Activity size={24} /> },
      { name: "Urinary Tract Infection", desc: "An infection in any part of the urinary system.", icon: <Droplets size={24} /> },
      { name: "Food Poisoning", desc: "Illness caused by eating contaminated food.", icon: <AlertCircle size={24} /> },
      { name: "Tonsillitis", desc: "Inflammation of the two oval-shaped pads of tissue at the back of the throat.", icon: <Thermometer size={24} /> },
      { name: "Pneumonia", desc: "Infection that inflames air sacs in one or both lungs.", icon: <Wind size={24} /> },
      { name: "Chickenpox", desc: "Highly contagious viral infection causing an itchy, blister-like rash.", icon: <Activity size={24} /> }
    ]
  },
  {
    title: "Chronic Conditions",
    diseases: [
      { name: "Asthma", desc: "Condition where your airways narrow and swell.", icon: <Wind size={24} /> },
      { name: "Type 2 Diabetes", desc: "Affects how your body processes blood sugar.", icon: <Activity size={24} /> },
      { name: "Hypertension", desc: "Consistently high blood pressure in arteries.", icon: <HeartPulse size={24} /> },
      { name: "Migraine", desc: "Headache causing severe throbbing or pulsing pain.", icon: <Brain size={24} /> },
      { name: "Arthritis", desc: "Swelling and tenderness of one or more joints.", icon: <Activity size={24} /> },
      { name: "Osteoarthritis", desc: "Degeneration of joint cartilage and the underlying bone.", icon: <Activity size={24} /> },
      { name: "COPD", desc: "Chronic inflammatory lung disease that causes obstructed airflow.", icon: <Wind size={24} /> },
      { name: "Alzheimer's Disease", desc: "Progressive disease that destroys memory and other mental functions.", icon: <Brain size={24} /> },
      { name: "Parkinson's Disease", desc: "Disorder of the central nervous system that affects movement.", icon: <Brain size={24} /> },
      { name: "Multiple Sclerosis", desc: "Disease in which the immune system eats away at the protective covering of nerves.", icon: <Activity size={24} /> },
      { name: "Chronic Kidney Disease", desc: "Longstanding disease of the kidneys leading to renal failure.", icon: <Droplets size={24} /> },
      { name: "Coronary Artery Disease", desc: "Damage or disease in the heart's major blood vessels.", icon: <HeartPulse size={24} /> },
      { name: "Endometriosis", desc: "Disorder in which tissue similar to the lining of your uterus grows outside it.", icon: <Activity size={24} /> },
      { name: "Rheumatoid Arthritis", desc: "Chronic inflammatory disorder affecting many joints.", icon: <Activity size={24} /> },
      { name: "Hypothyroidism", desc: "Condition in which the thyroid gland doesn't produce enough crucial hormones.", icon: <Zap size={24} /> }
    ]
  },
  {
    title: "Mental Wellness",
    diseases: [
      { name: "Anxiety", desc: "Intense, excessive, and persistent worry and fear.", icon: <Zap size={24} /> },
      { name: "Depression", desc: "Persistent feeling of sadness and loss of interest.", icon: <Frown size={24} /> },
      { name: "Insomnia", desc: "Sleep disorder making it hard to fall or stay asleep.", icon: <Moon size={24} /> },
      { name: "Chronic Stress", desc: "Prolonged and constant feeling of stress.", icon: <Activity size={24} /> },
      { name: "Burnout", desc: "State of emotional, physical, and mental exhaustion.", icon: <Flame size={24} /> },
      { name: "Panic Disorder", desc: "Sudden episodes of intense fear or anxiety and physical symptoms.", icon: <Zap size={24} /> },
      { name: "PTSD", desc: "Mental health condition triggered by a terrifying event.", icon: <Brain size={24} /> },
      { name: "OCD", desc: "Excessive thoughts (obsessions) that lead to repetitive behaviors (compulsions).", icon: <Activity size={24} /> },
      { name: "ADHD", desc: "Chronic condition including attention difficulty, hyperactivity, and impulsiveness.", icon: <Brain size={24} /> },
      { name: "Social Anxiety", desc: "Chronic mental health condition in which social interactions cause irrational anxiety.", icon: <Frown size={24} /> },
      { name: "SAD", desc: "Depression associated with late autumn and winter and thought to be caused by a lack of light.", icon: <Moon size={24} /> },
      { name: "Phobias", desc: "Extreme or irrational fear of or aversion to something.", icon: <AlertCircle size={24} /> },
      { name: "Generalized Anxiety", desc: "Severe, ongoing anxiety that interferes with daily activities.", icon: <Zap size={24} /> },
      { name: "Bipolar Disorder", desc: "Disorder associated with episodes of mood swings ranging from depressive lows to manic highs.", icon: <Activity size={24} /> },
      { name: "Sleep Apnea", desc: "Potentially serious sleep disorder in which breathing repeatedly stops and starts.", icon: <Moon size={24} /> }
    ]
  }
];

const Home = () => {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null);
  const closeModal = () => setActiveModal(null);

  const [isSearching, setIsSearching] = useState(false);
  const [activeCheckUp, setActiveCheckUp] = useState(null); 
  const [currentStep, setCurrentStep] = useState(0); 
  const [userProfile, setUserProfile] = useState({ age: "", gender: "" }); 
  const [checkUpQuestions, setCheckUpQuestions] = useState([]); 
  const [userAnswers, setUserAnswers] = useState([]); 
  const [isEvaluating, setIsEvaluating] = useState(false);

  const apiKey = import.meta.env.VITE_GROQ_KEY_3 ; 

  const closeCheckUpModal = () => {
    setActiveCheckUp(null);
    setCheckUpQuestions([]);
    setCurrentStep(0);
    setUserProfile({ age: "", gender: "" });
    setUserAnswers([]);
    setIsEvaluating(false);
  };

  const handleDiseaseClick = (diseaseName) => {
    setActiveCheckUp(diseaseName); 
  };

  const fetchQuestionsFromAI = async () => {
    setIsSearching(true);
    setCurrentStep(2); 

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: "You are a medical AI assistant. Generate exactly 5 multiple-choice diagnostic questions to help screen for the provided disease. Tailor the questions appropriately for the patient's age and gender. Each question should have exactly 4 specific options (e.g., severity, frequency, specific symptoms). Output ONLY a valid JSON array of objects. Do NOT include markdown formatting, backticks, or any other text. Example format: [{\"question\": \"How often do you experience this symptom?\", \"options\": [\"Never\", \"Rarely\", \"Often\", \"Constantly\"]}]"
            },
            {
              role: "user",
              content: `Patient Profile: Age ${userProfile.age}, Gender ${userProfile.gender}. Condition to check: ${activeCheckUp}`
            }
          ],
          temperature: 0.3, 
          max_tokens: 400
        })
      });

      if (!response.ok) throw new Error("Failed to fetch from Groq API");

      const data = await response.json();
      let rawContent = data.choices[0].message.content.trim();
      rawContent = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
      const questionsArray = JSON.parse(rawContent);

      if (Array.isArray(questionsArray) && questionsArray.length === 5 && questionsArray[0].question && questionsArray[0].options) {
        setCheckUpQuestions(questionsArray);
      } else {
        throw new Error("Invalid format received from AI");
      }

    } catch (error) {
      console.error("Groq API Search Error:", error);
      alert("Sorry, we couldn't generate a check-up right now. Please try again.");
      closeCheckUpModal();
    } finally {
      setIsSearching(false);
    }
  };

  const handleProfileSubmit = (field, value) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
    if (field === 'age') {
      setCurrentStep(1); 
    } else if (field === 'gender') {
      fetchQuestionsFromAI();
    }
  };

  const handleSymptomAnswer = async (answer) => {
    const questionIndex = currentStep - 2; 
    const currentQuestionObj = checkUpQuestions[questionIndex];
    const updatedAnswers = [...userAnswers, { question: currentQuestionObj.question, answer: answer }];
    setUserAnswers(updatedAnswers);

    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(7); 
      await evaluateFinalResults(updatedAnswers);
    }
  };

  const evaluateFinalResults = async (finalAnswers) => {
    setIsEvaluating(true);
    
    const promptAnswers = finalAnswers.map((item, i) => `Q${i+1}: ${item.question} | Answer: ${item.answer}`).join("\n");

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: `You are a helpful, professional medical AI assistant for Sympto. Based on the patient's profile and their multiple-choice answers to 5 symptom questions, provide a highly detailed final assessment. Output ONLY a valid JSON object. Do NOT include markdown, backticks, or other text. 
              The JSON must contain exactly these 7 keys: 
              "likelihood" (String: strictly exactly "High", "Moderate", or "Low"), 
              "summary" (String: A 1-sentence verdict), 
              "details" (String: 2-3 sentences explaining the disease, the user's symptoms, and their risk), 
              "immediate_actions" (Array of strings: 2-4 steps the user should take right now to solve or manage this),
              "medical_requirements" (Array of strings: 2-3 medical tests, specialist visits, or medications they might need),
              "lifestyle_changes" (Array of strings: 2-3 habit or diet changes required for long-term management),
              "preventive_measures" (Array of strings: 2-3 steps to avoid this in the future).`
            },
            {
              role: "user",
              content: `Patient: ${userProfile.age} year old ${userProfile.gender}.\nCondition checked: ${activeCheckUp}\n\nUser Responses:\n${promptAnswers}\n\nPlease provide the final assessment JSON.`
            }
          ],
          temperature: 0.4,
          max_tokens: 600
        })
      });

      if (!response.ok) throw new Error("Failed to evaluate results");

      const data = await response.json();
      let rawContent = data.choices[0].message.content.trim();
      rawContent = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsedResult = JSON.parse(rawContent);

      closeCheckUpModal();
      navigate('/report', { state: { assessmentResult: parsedResult, activeCheckUp, userProfile, userAnswers } });

    } catch (error) {
      console.error("Groq Final Evaluation Error:", error);
      const fallbackResult = {
        likelihood: "Moderate",
        summary: "We experienced an error evaluating your specific results.",
        details: "There was a network error while computing your final assessment. However, your recorded symptoms should be taken seriously.",
        immediate_actions: [
            "Rest and closely monitor your symptoms for the next 24 hours.", 
            "Stay hydrated and avoid strenuous activities."
        ],
        medical_requirements: [
            "Consult a general physician for a formal diagnosis.",
            "Consider standard blood tests if symptoms worsen."
        ],
        lifestyle_changes: [
            "Maintain a balanced diet rich in essential vitamins.",
            "Ensure you are getting adequate, uninterrupted sleep."
        ],
        preventive_measures: [
            "Practice good personal hygiene.",
            "Avoid close contact with individuals showing similar symptoms."
        ]
      };
      closeCheckUpModal();
      navigate('/report', { state: { assessmentResult: fallbackResult, activeCheckUp, userProfile, userAnswers } });
    } finally {
      setIsEvaluating(false);
    }
  };

  const currentYear = new Date().getFullYear();

  const getProgressPercentage = () => {
    if (isEvaluating) return 100;
    return ((currentStep) / 7) * 100;
  };

  return (
    <div className="home-container">
      <Nav />
      
      {/* --- HERO SECTION --- */}
      <section className="hero-section">
        <div className="hero-bg-gradient"></div>

        <div className="hero-content">
          <div className="hero-text-wrapper">
            <h1>
              <span className="hero-pre-title">Hi, I'm Sympto.</span>
              <div className="hero-main-title" style={{ marginTop: '12px', lineHeight: '1.2' }}>
                Your AI Health <br className="hide-on-mobile" />
                Companion for&nbsp;<TypingEffect />
              </div>
            </h1>

            <div className="hero-checklist">
               <div className="check-item"> Analyze your symptoms</div>
               <div className="check-item"> Understand your health</div>
               <div className="check-item"> Get ready for your visit</div>
               <div className="check-item">Plan your next steps</div>
            </div>

            <div className="hero-actions">
              <Link to="/sampleanalysis" className="btn btn-secondary">
                Simple Analysis
              </Link>
              <Link to="/advancedanalysis" className="btn btn-primary">
                Start Advanced Check <ArrowRight size={18} style={{marginLeft: '8px'}}/>
              </Link>
            </div>
          </div>

          <div className="hero-visual hide-on-mobile">
            <div className="floating-card card-1">
                <ShieldCheck size={40} color="#2563eb" />
                <p>Secure</p>
            </div>
            <div className="floating-card card-2">
                <Activity size={40} color="#ec4899" />
                <p>Fast Analysis</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS SECTION --- */}
      <section className="info-section">
        <div className="container">
          <div className="info-grid">
            <div className="info-visual hide-on-mobile">
               <div className="big-icon-circle">
                 <Cpu size={80} color="white" />
                 <div className="orbit-dot"></div>
               </div>
            </div>
            
            <div className="info-text">
              <h2 className="section-header">How Sympto Works</h2>
              <p className="lead-text">
                Sympto combines medical knowledge with advanced AI to guide you through a smart assessment.
              </p>
              <div className="steps-list">
                <div className="step-card">
                    <div className="step-icon-box">
                      <MessageSquare size={24} />
                    </div>
                    <div className="step-content">
                      <h4>Describe Symptoms</h4>
                      <p>Enter your symptoms in plain language, just like chatting with a friend.</p>
                    </div>
                </div>
                <div className="step-card">
                    <div className="step-icon-box box-blue">
                      <BrainCircuit size={24} />
                    </div>
                    <div className="step-content">
                      <h4>AI Analysis</h4>
                      <p>Our AI engine asks adaptive follow-up questions to gather clinical details.</p>
                    </div>
                </div>
                <div className="step-card">
                    <div className="step-icon-box box-purple">
                      <FileText size={24} />
                    </div>
                    <div className="step-content">
                      <h4>Get Report</h4>
                      <p>Receive a risk assessment and clear advice on what to do next.</p>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CAROUSEL SECTION --- */}
     <section className="carousel-section">
      <h2 className="section-title">Healthcare for Everyone</h2>
      <div className="carousel-wrapper">
        <div className="carousel-track">
          {[...profiles, ...profiles].map((profile, idx) => (
            <div 
              key={`${profile.id}-${idx}`} 
              className="carousel-card"
              onClick={() => setActiveModal(profile.label.toLowerCase())}
              style={{ cursor: 'pointer' }}
            >
              <div className="profile-icon-box">{profile.icon}</div>
              <h3>{profile.label}</h3>
              <p className="profile-tagline">{profile.tagline}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* --- UPGRADED BROWSE CONDITIONS SECTION --- */}
    <section className="checkup-section">
      <div className="container">
        <div className="section-intro">
            <h2>Browse Conditions</h2>
            <p>Select a condition below to start a personalized AI screening.</p>
        </div>
        
        <div className="disease-categories-container">
          {diseaseCategories.map((category, index) => (
            <div key={index} className="disease-category-wrapper">
              <div className="disease-category-header">
                <h3>{category.title}</h3>
                {/* Search More button removed from here */}
              </div>
              
              {/* Scrollable Row */}
              <div 
                className="disease-row hide-scrollbar" 
                role="region" 
                aria-label={`${category.title} conditions`}
              >
                {category.diseases.map((diseaseObj, dIndex) => (
                  <div 
                    key={dIndex} 
                    className="disease-card"
                    onClick={() => handleDiseaseClick(diseaseObj.name)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Start screening for ${diseaseObj.name}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleDiseaseClick(diseaseObj.name);
                      }
                    }}
                  >
                    <div className="disease-card-icon" aria-hidden="true">
                      {diseaseObj.icon}
                    </div>
                    <div className="disease-card-content">
                      <h4>{diseaseObj.name}</h4>
                      <p>{diseaseObj.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

      {/* --- FUTURE SECTION --- */}
      <section className="future-section">
        <div className="container">
          <div className="section-intro">
              <h2>The Future of Health Assessment</h2>
              <p>We are shifting the paradigm toward systems that are preventative, personalized, and proactive.</p>
          </div>
          
          <div className="features-grid">
            {futureFeatures.map((feature, i) => (
                <div className="feature-card" key={i}>
                    <div className="feature-icon">{feature.icon}</div>
                    <h3>{feature.title}</h3>
                    <p>{feature.desc}</p>
                </div>
            ))}
          </div>
          
          <div className="cta-banner">
              <h3>Ready to check your symptoms?</h3>
              <div className="bottom-links">
                 <Link to="/sampleanalysis" className="link-text">Simple Analysis</Link>
                 <Link to="/advancedanalysis" className="link-text highlight">Advanced Analysis</Link>
              </div>
          </div>
        </div>
      </section>
      
      {/* --- POPUP ENABLED FOOTER --- */}
      <footer className="site-footer">
        <div className="footer-wrapper">
          
         <div className="footer-primary-content">
            <div className="footer-identity">
               <img src={logoLight} alt="Sympto Logo" className="footer-brand-logo logo-light" />
               <img src={logoDark} alt="Sympto Logo" className="footer-brand-logo logo-dark" />
            </div>
            
            <div className="footer-nav-column">
              <h4>Company</h4>
              <ul>
                <li><button onClick={() => setActiveModal('about')}>About Us</button></li>
                <li><button onClick={() => setActiveModal('contact')}>Contact Support</button></li>
                <li><button onClick={() => setActiveModal('careers')}>Careers</button></li>
              </ul>
            </div>

            <div className="footer-nav-column">
              <h4>Legal</h4>
              <ul>
                <li><button onClick={() => setActiveModal('privacy')}>Privacy Policy</button></li>
                <li><button onClick={() => setActiveModal('terms')}>Terms of Service</button></li>
                <li><button onClick={() => setActiveModal('cookies')}>Cookie Policy</button></li>
              </ul>
            </div>
          </div>

          <div className="footer-notice-box">
            <span className="notice-icon">!</span>
            <p>
              <strong>IMPORTANT:</strong> This application is for informational purposes only 
              and is not a substitute for professional medical advice, diagnosis, or treatment. 
              Always seek the advice of your physician or other qualified health provider with 
              any questions you may have regarding a medical condition.
            </p>
          </div>

          <div className="footer-copyright">
            <p>&copy; {currentYear} Sympto.in All rights reserved.</p>
          </div>
          
        </div>
      </footer>

      {/* --- STATIC MODAL / POPUP COMPONENT --- */}
      {activeModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalData[activeModal].title}</h2>
              <button className="your-custom-class" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              {modalData[activeModal].content}
            </div>
          </div>
        </div>
      )}

      {/* --- INTERACTIVE DYNAMIC CHECK-UP MODAL (BEAUTIFUL UI) --- */}
      {activeCheckUp && (
        <div className="modal-overlay" onClick={closeCheckUpModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: '0' }}>
              <h2 style={{ fontSize: '1.1rem', color: '#64748b' }}>Screening: <span style={{ color: '#2563eb' }}>{activeCheckUp}</span></h2>
              <button className="your-custom-class" onClick={closeCheckUpModal}>&times;</button>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '4px', background: '#e2e8f0', marginTop: '16px' }}>
              <div style={{ 
                height: '100%', 
                background: '#2563eb', 
                width: `${getProgressPercentage()}%`, 
                transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
              }}></div>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ textAlign: 'center', padding: '40px 30px', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              
              {/* STEP 0: Ask Age */}
              {currentStep === 0 && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <p style={{ color: '#64748b', marginBottom: '8px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Question 1 of 7</p>
                  <h3 style={{ fontSize: '1.6rem', marginBottom: '30px', color: '#0f172a' }}>What is your age?</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <input 
                      type="number" 
                      min="1" max="120"
                      value={userProfile.age}
                      onChange={(e) => setUserProfile({...userProfile, age: e.target.value})}
                      placeholder="e.g. 25"
                      style={{ 
                        padding: '16px', borderRadius: '12px', border: '2px solid #cbd5e1', 
                        fontSize: '1.5rem', width: '150px', textAlign: 'center',
                        outline: 'none', transition: 'border-color 0.2s',
                        color: '#0f172a'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                      onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                    />
                    <button 
                      className="your-custom-class" 
                      onClick={() => handleProfileSubmit('age', userProfile.age)}
                      disabled={!userProfile.age}
                      style={{ width: '100%', maxWidth: '300px', padding: '14px', fontSize: '1.1rem' }}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 1: Ask Gender */}
              {currentStep === 1 && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <p style={{ color: '#64748b', marginBottom: '8px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Question 2 of 7</p>
                  <h3 style={{ fontSize: '1.6rem', marginBottom: '30px', color: '#0f172a' }}>What is your biological sex?</h3>
                  <div style={{ display: 'grid', gap: '16px', maxWidth: '400px', margin: '0 auto' }}>
                    {['Male', 'Female', 'Other'].map(g => (
                      <button 
                        key={g}
                        className="your-custom-class" 
                        onClick={() => handleProfileSubmit('gender', g)}
                        style={{ padding: '16px', fontSize: '1.1rem', borderRadius: '12px', border: '2px solid #e2e8f0', background: 'white', color: '#334155' }}
                        onMouseOver={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.color = '#2563eb'; }}
                        onMouseOut={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.color = '#334155'; }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2-6 (Multiple Choice Rendering) */}
              {currentStep >= 2 && currentStep <= 6 && (
                <>
                  {isSearching ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn 0.3s ease' }}>
                      <Loader2 size={48} className="spin-animation" style={{ color: '#2563eb', marginBottom: '20px' }} />
                      <h3 style={{ color: '#0f172a', fontSize: '1.3rem', marginBottom: '8px' }}>Analyzing condition...</h3>
                      <p style={{ color: '#64748b', fontSize: '1rem' }}>Generating personalized questions for {activeCheckUp}.</p>
                    </div>
                  ) : checkUpQuestions.length > 0 ? (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                      <p style={{ color: '#64748b', marginBottom: '8px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Question {currentStep + 1} of 7
                      </p>
                      
                      <h3 style={{ fontSize: '1.4rem', marginBottom: '40px', color: '#0f172a', lineHeight: '1.5' }}>
                        {checkUpQuestions[currentStep - 2].question}
                      </h3>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
                        {checkUpQuestions[currentStep - 2].options.map((optionText, idx) => (
                          <button 
                            key={idx}
                            className="your-custom-class"
                            onClick={() => handleSymptomAnswer(optionText)}
                            style={{ 
                              padding: '16px 12px', 
                              fontSize: '1rem', 
                              borderRadius: '12px', 
                              border: '2px solid #e2e8f0', 
                              background: '#f8fafc', 
                              color: '#0f172a', 
                              fontWeight: '600', 
                              cursor: 'pointer', 
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minHeight: '60px'
                            }}
                            onMouseOver={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.background = '#eff6ff'; }}
                            onMouseOut={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                          >
                            {optionText}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              )}

              {/* FINAL STEP: Evaluating Loading State */}
              {currentStep > 6 && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Loader2 size={48} className="spin-animation" style={{ color: '#2563eb', marginBottom: '20px' }} />
                    <h3 style={{ color: '#0f172a', fontSize: '1.3rem', marginBottom: '8px' }}>Evaluating Responses...</h3>
                    <p style={{ color: '#64748b', fontSize: '1rem' }}>Our AI is computing your risk likelihood.</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      <Chat /> 

    </div>
  );
};

export default Home;
