import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Square, Loader2, Globe, BrainCircuit, Volume2, Play, RefreshCw, Type, Keyboard, Send, Copy, Check, ArrowRightLeft, Languages, MessageSquare, User, Bot, Sparkles, Image as ImageIcon, Upload, X, Coffee, ListOrdered, ChevronRight, LayoutDashboard, ThumbsUp, ThumbsDown, BookOpen, Target, Film, LogOut, LogIn, MapPin } from 'lucide-react';
import { transcribeAndAnalyzeEnToTh, translateThToEn, translateTextThToEn, translateText, generateSpeech, getConsultantResponse, analyzeImage, getDailyExecutiveBriefing, translateAndSpeak, translateTextAndSpeak, generateImage, editImage, analyzeText, analyzeTextStream, generateVideoFromImage, improvePrompt } from './services/geminiService';
import ReactMarkdown, { Components } from 'react-markdown';
import { auth, db, googleProvider } from './firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './utils/firestoreError';

const markdownComponents: Components = {
  img: ({node, ...props}) => <img {...props} src={props.src || undefined} />
};
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { AssessmentLab } from './components/AssessmentLab';
import { StrategyOS } from './components/StrategyOS';

interface ChatMessage {
  role: 'user' | 'bot' | 'model';
  content: string;
  createdAt?: any;
  userId?: string;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const translations = {
  TH: {
    appTitle: "GEM Y - i Friendship",
    appSubtitle: "ทำไม General Manager และ Gen Y ถึงต้องมี AI เป็นเพื่อน",
    tabs: {
      briefing: "Morning Briefing",
      listen: "Listen & Analyze",
      voice: "Executive Interpreter",
      text: "Text Hub",
      image: "Image Analysis",
      video: "Video Generation",
      consultant: "AI Consultant",
      assessment: "Assessment Lab",
      strategy: "Project OS"
    },
    briefing: {
      welcome: "สวัสดีครับ นี่คือโครงการ Global Issues Analysis",
      desc: "ตลอด 1 ปีที่ผ่านมา ผมได้ศึกษาเทคโนโลยี AI และนี่คือสิ่งที่ผมตั้งใจทำเพื่อสังคม: การรวบรวมปัญหาจากทั่วโลกมาวิเคราะห์ร่วมกับ Gemini 3 Pro เพื่อระดมสมองหาทางออก นี่เป็นโครงการส่วนตัว (Independent Project) ที่ไม่ได้สังกัดองค์กรใด เป็นความตั้งใจของผมที่จะใช้เทคโนโลยีช่วยแก้ปัญหาในช่วงที่กำลังมองหาโอกาสใหม่ๆ ครับ",
      countLabel: "จำนวนหัวข้อที่ต้องการ",
      startBtn: "เริ่มวิเคราะห์ปัญหาโลก",
      processing: "กำลังรวบรวมและวิเคราะห์ข้อมูล...",
      resultTitle: "บทวิเคราะห์และแนวทางแก้ไข",
      consultBtn: "ระดมสมองเพิ่มเติม",
      others: "อื่นๆ"
    },
    listen: {
      title: "Meeting & Media Analysis",
      desc: "Record English audio to get deep analysis and Thai translation.",
      startRecord: "Click to start recording English audio",
      recording: "Recording...",
      processing: "Processing & Analyzing..."
    },
    voice: {
      title: "ล่ามส่วนตัวอัจฉริยะ (Executive Interpreter)",
      desc: "พูดภาษาไทยเพื่อให้ AI แปลและพูดออกเสียงเป็นภาษาอังกฤษทันที สำหรับใช้สื่อสารในที่ประชุมระดับโลก",
      startRecord: "แตะเพื่อพูดภาษาไทย (AI จะพูดเป็นภาษาอังกฤษให้ครับ)",
      recording: "กำลังฟังเสียงภาษาไทย...",
      processing: "กำลังแปลและเตรียมพูดภาษาอังกฤษ...",
      replay: "ฟังซ้ำอีกครั้ง",
      feedbackLabel: "ความแม่นยำของคำแปล:",
      feedbackSuccess: "ขอบคุณสำหรับคำแนะนำครับ!",
      saveBtn: "บันทึกเพื่อการเรียนรู้",
      learningLog: "บันทึกการเรียนรู้ภาษา (Learning Log)",
      noSaved: "ยังไม่มีบันทึกการเรียนรู้",
      source: "ต้นฉบับ",
      translation: "คำแปล",
      toggleMic: "ใช้ไมโครโฟน",
      toggleText: "พิมพ์ข้อความ",
      textPlaceholder: "พิมพ์ข้อความภาษาไทยที่นี่...",
      translateBtn: "แปลและพูดออกเสียง",
      goodTranslation: "คำแปลถูกต้อง",
      badTranslation: "คำแปลไม่ถูกต้อง"
    },
    text: {
      enThTitle: "English → Thai",
      thEnTitle: "Thai → English",
      analysisTitle: "Strategic Text Analysis",
      enPlaceholder: "Type English text here...",
      thPlaceholder: "พิมพ์ข้อความภาษาไทยที่นี่...",
      analysisPlaceholder: "วางข้อความที่นี่เพื่อวิเคราะห์เชิงลึก (ความรู้สึก, ประเด็นหลัก, กลยุทธ์)...",
      translateBtnEn: "Translate to Thai",
      translateBtnTh: "Translate to English",
      analyzeBtn: "วิเคราะห์ข้อความ",
      resultPlaceholderEn: "Thai translation will appear here",
      resultPlaceholderTh: "English translation will appear here",
      analysisResultPlaceholder: "ผลการวิเคราะห์อย่างละเอียดจะแสดงที่นี่",
      selectLang: "เลือกภาษาของข้อความ"
    },
    image: {
      title: "Visual Strategic Hub",
      desc: "Analyze images or generate new visuals using Nano Banana Pro.",
      modeAnalyze: "วิเคราะห์รูปภาพ",
      modeGenerate: "สร้างรูปภาพ",
      modeEdit: "แก้ไขรูปภาพ",
      uploadLabel: "คลิกเพื่ออัปโหลดรูปภาพ",
      uploadDesc: "PNG, JPG หรือ WEBP (สูงสุด 10MB)",
      promptLabel: "คำสั่ง (Prompt)",
      promptPlaceholderAnalyze: "เช่น 'สรุปข้อมูลสำคัญจากรูปภาพเอกสารนี้' หรือ 'วิเคราะห์อารมณ์และองค์ประกอบของรูปภาพโฆษณานี้'...",
      promptPlaceholderGenerate: "บรรยายรูปภาพที่ต้องการสร้าง เช่น หุ่นยนต์กำลังถือสเก็ตบอร์ดสีแดง...",
      analyzeBtn: "วิเคราะห์รูปภาพ",
      generateBtn: "สร้างรูปภาพ",
      processing: "กำลังประมวลผล...",
      resultPlaceholder: "ผลลัพธ์จะแสดงที่นี่หลังจากประมวลผลเสร็จสิ้น",
      sizeLabel: "ขนาดรูปภาพ",
      aspectRatioLabel: "อัตราส่วนภาพ",
      styleLabel: "สไตล์",
      selectApiKey: "กรุณาเลือก API Key ก่อนใช้งานการสร้างรูปภาพ",
      apiKeyBtn: "เลือก API Key (Paid Project)",
      billingInfo: "ข้อมูลการเรียกเก็บเงิน"
    },
    consultant: {
      title: "Executive AI Consultant",
      desc: "Strategic Advice & Deep Insights",
      welcomeTitle: "ยินดีต้อนรับสู่ห้องปรึกษาเชิงกลยุทธ์",
      welcomeDesc: "คุณสามารถถามคำถามเกี่ยวกับบทวิเคราะห์ล่าสุด หรือขอคำแนะนำในประเด็นต่างๆ ที่คุณสนใจได้ทันทีครับ",
      inputPlaceholder: "พิมพ์คำถามหรือขอคำแนะนำที่นี่...",
      clearChat: "Clear Chat"
    }
  },
  EN: {
    appTitle: "GEM Y - i Friendship",
    appSubtitle: "Why General Managers and Gen Y need AI as a friend",
    tabs: {
      briefing: "Morning Briefing",
      listen: "Listen & Analyze",
      voice: "Executive Interpreter",
      text: "Text Hub",
      image: "Image Analysis",
      video: "Video Generation",
      consultant: "AI Consultant",
      assessment: "Assessment Lab",
      strategy: "Project OS"
    },
    briefing: {
      welcome: "Global Issues Analysis & Solutions Initiative",
      desc: "This is a personal project born from over a year of dedicated study in AI technology. My mission is to gather critical global issues and analyze them using the advanced capabilities of Gemini 3 Pro. Through internal brainstorming and deep analysis, we seek to identify potential solutions and offer new perspectives. This is an independent effort—unaffiliated with any organization—representing my contribution to society during a career transition. It is a humble attempt to use technology for the greater good.",
      countLabel: "Number of Topics",
      startBtn: "Start Global Analysis",
      processing: "Gathering & Analyzing...",
      resultTitle: "Analysis & Strategic Solutions",
      consultBtn: "Brainstorm Further",
      others: "Other"
    },
    listen: {
      title: "Meeting & Media Analysis",
      desc: "Record English audio to get deep analysis and Thai translation.",
      startRecord: "Click to start recording English audio",
      recording: "Recording...",
      processing: "Processing & Analyzing..."
    },
    voice: {
      title: "Executive Interpreter (TH → EN)",
      desc: "Speak Thai and have the AI translate and speak out in English instantly for international meetings.",
      startRecord: "Tap to speak Thai (AI will speak English for you)",
      recording: "Listening to Thai...",
      processing: "Translating & Speaking...",
      replay: "Replay Audio",
      feedbackLabel: "Translation Accuracy:",
      feedbackSuccess: "Thank you for your feedback!",
      saveBtn: "Save for Learning",
      learningLog: "Learning Log",
      noSaved: "No saved translations yet",
      source: "Source",
      translation: "Translation",
      toggleMic: "Use Microphone",
      toggleText: "Type Text",
      textPlaceholder: "Type Thai text here...",
      translateBtn: "Translate & Speak",
      goodTranslation: "Good Translation",
      badTranslation: "Bad Translation"
    },
    text: {
      enThTitle: "English → Thai",
      thEnTitle: "Thai → English",
      analysisTitle: "Strategic Text Analysis",
      enPlaceholder: "Type English text here...",
      thPlaceholder: "Type Thai text here...",
      analysisPlaceholder: "Paste text here for deep analysis (Sentiment, Themes, Strategy)...",
      translateBtnEn: "Translate to Thai",
      translateBtnTh: "Translate to English",
      analyzeBtn: "Analyze Text",
      resultPlaceholderEn: "Thai translation will appear here",
      resultPlaceholderTh: "English translation will appear here",
      analysisResultPlaceholder: "Detailed analysis will appear here",
      selectLang: "Select Text Language"
    },
    image: {
      title: "Visual Strategic Hub",
      desc: "Analyze images or generate new visuals using Nano Banana Pro.",
      modeAnalyze: "Analyze Image",
      modeGenerate: "Generate Image",
      modeEdit: "Edit Image",
      uploadLabel: "Click to upload image",
      uploadDesc: "PNG, JPG or WEBP (Max 10MB)",
      promptLabel: "Prompt / Instructions",
      promptPlaceholderAnalyze: "e.g., 'Summarize key information from this document image' or 'Analyze the sentiment and composition of this advertisement image'...",
      promptPlaceholderGenerate: "Describe the image you want to generate, e.g., a robot holding a red skateboard...",
      analyzeBtn: "Analyze Image",
      generateBtn: "Generate Image",
      processing: "Processing...",
      resultPlaceholder: "Results will appear here after processing.",
      sizeLabel: "Image Size",
      aspectRatioLabel: "Aspect Ratio",
      styleLabel: "Style",
      selectApiKey: "Please select an API Key before using image generation",
      apiKeyBtn: "Select API Key (Paid Project)",
      billingInfo: "Billing Info"
    },
    consultant: {
      title: "Executive AI Consultant",
      desc: "Strategic Advice & Deep Insights",
      welcomeTitle: "Welcome to Strategic Consulting",
      welcomeDesc: "You can ask questions about the latest analysis or request advice on various topics of interest immediately.",
      inputPlaceholder: "Type your question or request advice here...",
      clearChat: "Clear Chat"
    }
  }
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (currentUser) {
        try {
          await setDoc(doc(db, 'users', currentUser.uid), {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            createdAt: serverTimestamp()
          }, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'users');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const [lang, setLang] = useState<'TH' | 'EN'>('TH');
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'listen' | 'voice' | 'text' | 'consultant' | 'image' | 'video' | 'briefing' | 'assessment' | 'strategy'>('briefing');
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Listen Mode State
  const [listenResult, setListenResult] = useState('');
  const [isProcessingListen, setIsProcessingListen] = useState(false);

  // Voice Mode State
  const [speakResultEn, setSpeakResultEn] = useState('');
  const [isProcessingSpeak, setIsProcessingSpeak] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [voiceFeedback, setVoiceFeedback] = useState<'good' | 'bad' | null>(null);
  const [showFeedbackSuccess, setShowFeedbackSuccess] = useState(false);
  const [voiceInputMode, setVoiceInputMode] = useState<'mic' | 'text'>('mic');
  const [voiceManualText, setVoiceManualText] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio play error:", e));
    }
  }, [audioUrl]);

  // Text Hub State (Two separate windows)
  const [enThInput, setEnThInput] = useState('');
  const [enThResult, setEnThResult] = useState('');
  const [isProcessingEnTh, setIsProcessingEnTh] = useState(false);

  const [thEnInput, setThEnInput] = useState('');
  const [thEnResult, setThEnResult] = useState('');
  const [isProcessingThEn, setIsProcessingThEn] = useState(false);

  // Text Analysis State
  const [textAnalysisInput, setTextAnalysisInput] = useState('');
  const [textAnalysisResult, setTextAnalysisResult] = useState('');
  const [isProcessingTextAnalysis, setIsProcessingTextAnalysis] = useState(false);
  const [textAnalysisLang, setTextAnalysisLang] = useState<'English' | 'Thai'>('English');
  const [useMapsGrounding, setUseMapsGrounding] = useState(false);

  // Consultant State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Consultant Preparation Modal State
  const [isConsultPrepModalOpen, setIsConsultPrepModalOpen] = useState(false);
  const [consultationContext, setConsultationContext] = useState('');

  // Image Analysis & Generation State
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageResult, setImageResult] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageMode, setImageMode] = useState<'analyze' | 'generate' | 'edit'>('analyze');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "3:4" | "4:3" | "9:16" | "16:9">("1:1");
  const [imageStyle, setImageStyle] = useState<string>("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [analysisMode, setAnalysisMode] = useState<'detailed' | 'concise'>('detailed');

  // Video Generation State
  const [videoImage, setVideoImage] = useState<File | null>(null);
  const [videoImagePreview, setVideoImagePreview] = useState<string | null>(null);
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [videoResultUrl, setVideoResultUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  const getCroppedImg = async (image: HTMLImageElement, crop: Crop): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg');
    });
  };
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkApiKey();
  }, [activeTab]);

  const openApiKeyDialog = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  // Briefing State
  const [briefingResult, setBriefingResult] = useState('');
  const [isProcessingBriefing, setIsProcessingBriefing] = useState(false);
  const [briefingCount, setBriefingCount] = useState(10);
  const [savedTranslations, setSavedTranslations] = useState<{
    id: string;
    source: string;
    target: string;
    direction: 'EN_TH' | 'TH_EN';
    feedback: 'good' | 'bad' | null;
    timestamp: number;
  }[]>([]);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isProcessingChat]);

  useEffect(() => {
    if (!user || !isAuthReady) return;

    const chatQuery = query(collection(db, `users/${user.uid}/chatMessages`), orderBy('createdAt', 'asc'));
    const unsubscribeChat = onSnapshot(chatQuery, (snapshot) => {
      const messages: (ChatMessage & { id?: string })[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as any);
      });
      setChatMessages(messages);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/chatMessages`);
    });

    const translationsQuery = query(collection(db, `users/${user.uid}/savedTranslations`), orderBy('createdAt', 'desc'));
    const unsubscribeTranslations = onSnapshot(translationsQuery, (snapshot) => {
      const translations: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        translations.push({
          id: doc.id,
          source: data.input,
          target: data.result,
          direction: data.type === 'en-th' ? 'EN_TH' : 'TH_EN',
          feedback: null, // Feedback not stored in this schema yet
          timestamp: data.createdAt?.toMillis() || Date.now()
        });
      });
      setSavedTranslations(translations);
    }, (error) => {
      console.error("Error fetching translations:", error);
    });

    return () => {
      unsubscribeChat();
      unsubscribeTranslations();
    };
  }, [user, isAuthReady]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = handleRecordingStop;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please ensure permissions are granted.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleRecordingStop = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    
    if (activeTab === 'listen') {
      await processListenAudio(audioBlob);
    } else if (activeTab === 'voice') {
      await processVoiceAudio(audioBlob);
    }
  };

  const processListenAudio = async (blob: Blob) => {
    setIsProcessingListen(true);
    setListenResult('');
    try {
      const stream = transcribeAndAnalyzeEnToTh(blob);
      for await (const chunk of stream) {
        setListenResult(prev => prev + chunk);
      }
    } catch (error) {
      console.error("Error processing listen audio:", error);
      setListenResult("Error processing audio. Please try again.");
    } finally {
      setIsProcessingListen(false);
    }
  };

  const processVoiceAudio = async (blob: Blob) => {
    setIsProcessingSpeak(true);
    setSpeakResultEn('');
    setAudioUrl(null);
    setVoiceFeedback(null);
    setShowFeedbackSuccess(false);
    try {
      const { text, audioUrl: speechUrl } = await translateAndSpeak(blob);
      setSpeakResultEn(text);
      
      if (speechUrl) {
        setAudioUrl(speechUrl);
      }
    } catch (error) {
      console.error("Error processing voice audio:", error);
      setSpeakResultEn("Error processing audio. Please try again.");
    } finally {
      setIsProcessingSpeak(false);
    }
  };

  const handleVoiceManualSubmit = async () => {
    if (!voiceManualText.trim()) return;
    setIsProcessingSpeak(true);
    setSpeakResultEn('');
    setAudioUrl(null);
    setVoiceFeedback(null);
    setShowFeedbackSuccess(false);
    try {
      const { text, audioUrl: speechUrl } = await translateTextAndSpeak(voiceManualText);
      setSpeakResultEn(text);
      setVoiceManualText('');
      
      if (speechUrl) {
        setAudioUrl(speechUrl);
      }
    } catch (error) {
      console.error("Error processing manual voice text:", error);
      setSpeakResultEn("Error processing text. Please try again.");
    } finally {
      setIsProcessingSpeak(false);
    }
  };

  const handleVoiceFeedback = (type: 'good' | 'bad') => {
    setVoiceFeedback(type);
    setShowFeedbackSuccess(true);
    setTimeout(() => setShowFeedbackSuccess(false), 3000);
    // In a real app, you would send this to a backend or analytics service
    console.log(`Voice translation feedback: ${type} for text: "${speakResultEn}"`);
  };

  const saveTranslation = async (source: string, target: string, direction: 'EN_TH' | 'TH_EN', feedback: 'good' | 'bad' | null = null) => {
    if (user) {
      try {
        const docData: any = {
          userId: user.uid,
          type: direction === 'EN_TH' ? 'en-th' : 'th-en',
          input: source,
          result: target,
          createdAt: serverTimestamp()
        };
        if (feedback) {
          docData.feedback = feedback;
        }
        await addDoc(collection(db, `users/${user.uid}/savedTranslations`), docData);
        setShowFeedbackSuccess(true);
        setTimeout(() => setShowFeedbackSuccess(false), 3000);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/savedTranslations`);
      }
    } else {
      // Fallback for unauthenticated users
      const newEntry = {
        id: Math.random().toString(36).substr(2, 9),
        source,
        target,
        direction,
        feedback,
        timestamp: Date.now()
      };
      setSavedTranslations(prev => [newEntry, ...prev]);
      setShowFeedbackSuccess(true);
      setTimeout(() => setShowFeedbackSuccess(false), 3000);
    }
  };

  const deleteSavedTranslation = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/savedTranslations`, id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/savedTranslations/${id}`);
      }
    } else {
      setSavedTranslations(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleEnThTranslate = async () => {
    if (!enThInput.trim()) return;
    setIsProcessingEnTh(true);
    setEnThResult('');
    try {
      const result = await translateText(enThInput, 'EN_TH');
      setEnThResult(result);
    } catch (error) {
      console.error("Error translating EN-TH:", error);
      setEnThResult("Error translating. Please try again.");
    } finally {
      setIsProcessingEnTh(false);
    }
  };

  const handleThEnTranslate = async () => {
    if (!thEnInput.trim()) return;
    setIsProcessingThEn(true);
    setThEnResult('');
    try {
      const result = await translateText(thEnInput, 'TH_EN');
      setThEnResult(result);
    } catch (error) {
      console.error("Error translating TH-EN:", error);
      setThEnResult("Error translating. Please try again.");
    } finally {
      setIsProcessingThEn(false);
    }
  };

  const handleTextAnalysis = async () => {
    if (!textAnalysisInput.trim() || isProcessingTextAnalysis) return;
    setIsProcessingTextAnalysis(true);
    setTextAnalysisResult('');
    try {
      const mode = useMapsGrounding ? 'maps' : 'search';
      const stream = analyzeTextStream(textAnalysisInput, textAnalysisLang, mode);
      let fullResult = "";
      for await (const chunk of stream) {
        fullResult += chunk;
        setTextAnalysisResult(fullResult);
      }
      
      // Auto-save logic is handled inside analyzeText, 
      // but since we are streaming here, let's call the non-streaming one 
      // or just ensure saving happens.
      // Actually, I'll just call analyzeText with the result to trigger the save if needed,
      // or just leave it since analyzeText was designed to be called separately.
      // Better: I'll manually handle the save here to avoid double API calls.
      if (user && fullResult && !fullResult.includes("ขออภัยครับ")) {
        try {
          await addDoc(collection(db, 'audit_logs'), {
            user_id: user.uid,
            input_text: textAnalysisInput,
            audit_result: fullResult,
            is_public: false,
            created_at: serverTimestamp()
          });
        } catch (e) {
          console.error("Failed to auto-save audit log:", e);
        }
      }
    } catch (error) {
      console.error("Error in text analysis:", error);
      setTextAnalysisResult("เกิดข้อผิดพลาดในการวิเคราะห์ข้อความ");
    } finally {
      setIsProcessingTextAnalysis(false);
    }
  };

  const handleChatSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isProcessingChat) return;

    const userMsg = chatInput;
    setChatInput('');
    
    // Optimistic update
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsProcessingChat(true);

    try {
      if (user) {
        await addDoc(collection(db, `users/${user.uid}/chatMessages`), {
          userId: user.uid,
          role: 'user',
          content: userMsg,
          createdAt: serverTimestamp()
        });
      }

      // Add a placeholder message for the model response
      setChatMessages(prev => [...prev, { role: 'model', content: '' }]);
      
      const stream = getConsultantResponse(userMsg, listenResult, chatMessages);
      let fullResponse = "";
      for await (const chunk of stream) {
        fullResponse += chunk;
        setChatMessages(prev => {
          const newMessages = [...prev];
          if (newMessages.length > 0) {
            newMessages[newMessages.length - 1] = { 
              ...newMessages[newMessages.length - 1], 
              content: fullResponse 
            };
          }
          return newMessages;
        });
      }
      
      if (user) {
        await addDoc(collection(db, `users/${user.uid}/chatMessages`), {
          userId: user.uid,
          role: 'model',
          content: fullResponse,
          createdAt: serverTimestamp()
        });
      } else {
        // Fallback for unauthenticated users is already handled by the stream loop
      }
    } catch (error) {
      if (user) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/chatMessages`);
      } else {
        console.error("Error in consultant chat:", error);
        setChatMessages(prev => [...prev, { role: 'bot', content: "ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อ" }]);
      }
    } finally {
      setIsProcessingChat(false);
    }
  };

  const clearChatHistory = async () => {
    if (user) {
      try {
        const chatQuery = query(collection(db, `users/${user.uid}/chatMessages`));
        const snapshot = await getDocs(chatQuery);
        const batch = writeBatch(db);
        snapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        setChatMessages([]);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/chatMessages`);
      }
    } else {
      setChatMessages([]);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageAnalysis = async () => {
    if (!selectedImage || isProcessingImage) return;
    setIsProcessingImage(true);
    setImageResult('');
    try {
      let blobToAnalyze: Blob = selectedImage;
      if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0 && imgRef.current) {
        blobToAnalyze = await getCroppedImg(imgRef.current, completedCrop);
      }
      const result = await analyzeImage(blobToAnalyze, imagePrompt, analysisMode);
      setImageResult(result);
    } catch (error: any) {
      console.error("Error analyzing image:", error);
      setImageResult(error.message || "เกิดข้อผิดพลาดในการวิเคราะห์รูปภาพ");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!hasApiKey) {
      openApiKeyDialog();
      return;
    }
    if (!imagePrompt.trim() || isProcessingImage) return;
    setIsProcessingImage(true);
    setImageResult('');
    try {
      const result = await generateImage(imagePrompt, imageSize, aspectRatio, imageStyle);
      if (result) {
        setImageResult(`![Generated Image](${result})`);
      } else {
        setImageResult("Failed to generate image.");
      }
    } catch (error: any) {
      console.error("Error generating image:", error);
      const errorStr = String(error);
      if (errorStr.includes("Requested entity was not found") || errorStr.includes("PERMISSION_DENIED") || errorStr.includes("403")) {
        setHasApiKey(false);
        setImageResult("API Key error or permission denied. Please re-select your API key from a paid Google Cloud project.");
      } else {
        setImageResult(error.message || "Error generating image. Please try again.");
      }
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleVideoImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setVideoResultUrl(null);
      setVideoError(null);
    }
  };

  const handleGenerateVideo = async () => {
    if (!hasApiKey) {
      openApiKeyDialog();
      return;
    }
    if (!videoImage || isProcessingVideo) return;
    
    setIsProcessingVideo(true);
    setVideoError(null);
    setVideoResultUrl(null);
    
    try {
      const resultUrl = await generateVideoFromImage(videoImage, videoPrompt, videoAspectRatio);
      if (resultUrl) {
        setVideoResultUrl(resultUrl);
      } else {
        setVideoError("Failed to generate video.");
      }
    } catch (error: any) {
      console.error("Error generating video:", error);
      const errorStr = String(error);
      if (errorStr.includes("Requested entity was not found") || errorStr.includes("PERMISSION_DENIED") || errorStr.includes("403")) {
        setHasApiKey(false);
        setVideoError("API Key error or permission denied. Please re-select your API key from a paid Google Cloud project.");
      } else {
        setVideoError(error.message || "Error generating video. Please try again.");
      }
    } finally {
      setIsProcessingVideo(false);
    }
  };

  const handleImageEdit = async () => {
    if (!selectedImage || !imagePrompt.trim() || isProcessingImage) return;
    setIsProcessingImage(true);
    setImageResult('');
    try {
      const result = await editImage(selectedImage, imagePrompt);
      if (result) {
        setImageResult(`![Edited Image](${result})`);
      } else {
        setImageResult("Failed to edit image.");
      }
    } catch (error: any) {
      console.error("Error editing image:", error);
      if (error.message?.includes("Requested entity was not found") || error.message?.includes("PERMISSION_DENIED") || error.message?.includes("403")) {
        setHasApiKey(false);
        setImageResult("API Key error. Please re-select your API key.");
      } else {
        setImageResult(error.message || "Error editing image. Please try again.");
      }
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleFetchBriefing = async () => {
    setIsProcessingBriefing(true);
    setBriefingResult('');
    try {
      let userLoc = undefined;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        userLoc = { lat: position.coords.latitude, lng: position.coords.longitude };
      } catch (geoError) {
        console.warn("Could not get geolocation:", geoError);
      }

      const result = await getDailyExecutiveBriefing(briefingCount, userLoc);
      setBriefingResult(result);
    } catch (error) {
      console.error("Error fetching briefing:", error);
      setBriefingResult("ขออภัยครับ ไม่สามารถดึงข้อมูลสรุปประจำวันได้ในขณะนี้");
    } finally {
      setIsProcessingBriefing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const resetListen = () => setListenResult('');
  const resetVoice = () => {
    setSpeakResultEn('');
    setAudioUrl(null);
    setVoiceManualText('');
  };
  const resetEnTh = () => { setEnThInput(''); setEnThResult(''); };
  const resetThEn = () => { setThEnInput(''); setThEnResult(''); };
  const resetTextAnalysis = () => { setTextAnalysisInput(''); setTextAnalysisResult(''); };
  const resetImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageResult('');
    setImagePrompt('');
    setImageMode('analyze');
  };
  const resetBriefing = () => {
    setBriefingResult('');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-gold-500/30">
      <audio ref={audioRef} className="hidden" src={audioUrl || null} />
      <header className="glass-panel sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-lg shadow-gold-500/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Globe className="w-7 h-7 text-white relative z-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-gold-200 to-gold-400 bg-clip-text text-transparent font-serif">
              {t.appTitle}
            </h1>
            <p className="text-[10px] text-gold-400 font-bold tracking-[0.2em] uppercase opacity-80">
              {t.appSubtitle}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {!hasApiKey && (
            <button 
              onClick={openApiKeyDialog}
              className="hidden md:flex px-3 py-1.5 rounded-lg text-xs font-bold bg-gold-500/10 text-gold-400 border border-gold-500/20 hover:bg-gold-500 hover:text-white transition-all items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
              Set API Key
            </button>
          )}
          
          {user ? (
            <div className="flex items-center gap-3 bg-white/5 pl-2 pr-4 py-1.5 rounded-xl border border-white/10">
              <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="User" className="w-6 h-6 rounded-full" />
              <span className="text-xs font-medium text-zinc-300 hidden sm:block">{user.displayName || user.email}</span>
              <button onClick={handleLogout} className="text-zinc-500 hover:text-red-400 transition-colors ml-2" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}

          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setLang('TH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === 'TH' ? 'bg-gold-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
            >
              TH
            </button>
            <button 
              onClick={() => setLang('EN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${lang === 'EN' ? 'bg-gold-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 pb-24">
        <div className="flex flex-wrap gap-2 mb-10 bg-white/5 p-1.5 rounded-2xl border border-white/10 shadow-2xl w-fit backdrop-blur-md">
          {[
            { id: 'briefing', icon: Coffee, label: t.tabs.briefing },
            { id: 'listen', icon: BrainCircuit, label: t.tabs.listen },
            { id: 'voice', icon: Volume2, label: lang === 'TH' ? 'Executive Interpreter' : 'Executive Interpreter' },
            { id: 'text', icon: Languages, label: t.tabs.text },
            { id: 'image', icon: ImageIcon, label: t.tabs.image },
            { id: 'video', icon: Film, label: t.tabs.video },
            { id: 'consultant', icon: Sparkles, label: t.tabs.consultant },
            { id: 'assessment', icon: Target, label: t.tabs.assessment },
            { id: 'strategy', icon: LayoutDashboard, label: t.tabs.strategy },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2.5 ${
                activeTab === tab.id 
                  ? 'bg-gold-500 text-white shadow-xl shadow-gold-500/20 scale-105' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'strategy' && <StrategyOS />}

        {activeTab === 'briefing' && (
          <div className="space-y-8">
            <div className="glass-panel rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden glow-gold border border-white/10">
              <div className="absolute top-0 right-0 p-12 opacity-5 transform translate-x-1/4 -translate-y-1/4">
                <Coffee className="w-96 h-96 text-gold-400" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gold-500/20 p-2.5 rounded-xl backdrop-blur-md border border-gold-500/30">
                    <Coffee className="w-6 h-6 text-gold-400" />
                  </div>
                  <span className="text-xs font-bold tracking-[0.3em] uppercase text-gold-400">{t.briefing.resultTitle}</span>
                </div>
                <h2 className="text-5xl font-bold mb-6 tracking-tight font-serif italic">
                  {t.briefing.welcome}
                </h2>
                <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed mb-10 font-light">
                  {t.briefing.desc}
                </p>
                
                <div className="flex flex-wrap items-center gap-8">
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gold-500/60">{t.briefing.countLabel}</span>
                    <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
                      {[10, 20, 50].map(num => (
                        <button
                          key={num}
                          onClick={() => setBriefingCount(num)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${briefingCount === num ? 'bg-gold-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                        >
                          {num}
                        </button>
                      ))}
                      <input 
                        type="number" 
                        value={briefingCount} 
                        onChange={(e) => setBriefingCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 bg-transparent border-l border-white/10 text-center focus:outline-none font-bold text-sm ml-1 text-gold-400"
                        placeholder={t.briefing.others}
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleFetchBriefing}
                    disabled={isProcessingBriefing}
                    className="gold-gradient text-white px-10 py-5 rounded-[2rem] font-bold text-xl hover:scale-105 transition-all shadow-2xl shadow-gold-600/30 flex items-center gap-4 active:scale-95 disabled:opacity-50 mt-auto"
                  >
                    {isProcessingBriefing ? <Loader2 className="w-7 h-7 animate-spin" /> : <Sparkles className="w-7 h-7" />}
                    {t.briefing.startBtn}
                  </button>
                </div>
                {briefingCount > 20 && (
                  <p className="text-[10px] text-gold-500/40 mt-6 italic tracking-wider uppercase">* Larger briefings may take a moment to synthesize.</p>
                )}
              </div>
            </div>

            {briefingResult && (
              <div className="glass-panel rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-gold-500/20 p-3 rounded-2xl text-gold-400 border border-gold-500/20">
                      <ListOrdered className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-xl tracking-tight font-serif italic text-gold-100">{t.briefing.resultTitle}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        setIsConsultPrepModalOpen(true);
                      }}
                      className="flex items-center gap-2.5 px-5 py-2.5 bg-gold-500/10 text-gold-400 rounded-xl text-sm font-bold hover:bg-gold-500/20 transition-all border border-gold-500/20"
                    >
                      <Sparkles className="w-4 h-4" />
                      {t.briefing.consultBtn}
                    </button>
                    <button onClick={() => copyToClipboard(briefingResult)} className="p-3 text-zinc-500 hover:text-gold-400 transition-all hover:bg-white/5 rounded-xl">
                      {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="p-10">
                  <div className="prose prose-invert prose-zinc max-w-none prose-h1:text-gold-100 prose-h2:text-gold-200 prose-h3:text-gold-300 prose-strong:text-gold-400 prose-p:text-zinc-400 prose-p:leading-relaxed prose-a:text-gold-400 hover:prose-a:text-gold-300">
                    <ReactMarkdown components={markdownComponents}>{briefingResult}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'listen' && (
          <div className="glass-panel rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-serif italic text-gold-100">{t.listen.title}</h2>
                <p className="text-sm text-zinc-500 mt-1 font-light">{t.listen.desc}</p>
              </div>
              <div className="flex items-center gap-3">
                {listenResult && (
                  <button 
                    onClick={() => {
                      setIsConsultPrepModalOpen(true);
                    }}
                    className="flex items-center gap-2.5 px-5 py-2.5 bg-gold-500/10 text-gold-400 rounded-xl text-sm font-bold hover:bg-gold-500/20 transition-all border border-gold-500/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    {t.briefing.consultBtn}
                  </button>
                )}
                <button onClick={resetListen} className="p-3 text-zinc-500 hover:text-gold-400 hover:bg-white/5 rounded-xl transition-all">
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-16 flex flex-col items-center justify-center border-b border-white/5 bg-gradient-to-b from-transparent to-white/[0.01]">
              <div className="relative">
                {isRecording && <div className="absolute -inset-8 bg-gold-500/20 rounded-full animate-ping opacity-75"></div>}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessingListen}
                  className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center transition-all shadow-2xl ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 text-white glow-red' 
                      : isProcessingListen 
                        ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                        : 'gold-gradient text-white hover:scale-110 glow-gold'
                  }`}
                >
                  {isRecording ? <Square className="w-10 h-10 fill-current" /> : <Mic className="w-10 h-10" />}
                </button>
              </div>
              <div className="mt-10 text-center">
                {isRecording ? (
                  <div className="flex flex-col items-center">
                    <span className="text-gold-400 font-bold tracking-widest uppercase text-xs animate-pulse flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-gold-500 shadow-[0_0_10px_rgba(201,141,58,1)]"></span> {t.listen.recording}
                    </span>
                    <span className="text-5xl font-mono mt-4 font-light tracking-tighter text-white">{formatTime(recordingTime)}</span>
                  </div>
                ) : isProcessingListen ? (
                  <div className="flex items-center gap-3 text-gold-400 font-bold tracking-wide">
                    <Loader2 className="w-6 h-6 animate-spin" /> {t.listen.processing}
                  </div>
                ) : <span className="text-zinc-500 font-medium tracking-wide">{t.listen.startRecord}</span>}
              </div>
            </div>

            {listenResult && (
              <div className="p-10 bg-white/[0.01] relative animate-in fade-in duration-500">
                <button 
                  onClick={() => copyToClipboard(listenResult)}
                  className="absolute top-8 right-8 p-3 bg-white/5 border border-white/10 rounded-xl text-zinc-500 hover:text-gold-400 shadow-xl transition-all backdrop-blur-md"
                  title="Copy to Clipboard"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                </button>
                <div className="prose prose-invert prose-zinc max-w-none prose-h3:text-gold-200 prose-h3:mt-10 prose-h3:mb-6 prose-p:text-zinc-400 prose-p:leading-relaxed prose-strong:text-gold-400">
                  <ReactMarkdown components={markdownComponents}>{listenResult}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'voice' && (
          <div className="glass-panel rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-serif italic text-gold-100">{t.voice.title}</h2>
                <p className="text-sm text-zinc-500 mt-1 font-light">{t.voice.desc}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                  <button 
                    onClick={() => setVoiceInputMode('mic')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${voiceInputMode === 'mic' ? 'bg-gold-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    {t.voice.toggleMic}
                  </button>
                  <button 
                    onClick={() => setVoiceInputMode('text')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${voiceInputMode === 'text' ? 'bg-gold-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                    {t.voice.toggleText}
                  </button>
                </div>
                <button onClick={resetVoice} className="p-3 text-zinc-500 hover:text-gold-400 hover:bg-white/5 rounded-xl transition-all">
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-16 flex flex-col items-center justify-center border-b border-white/5 bg-gradient-to-b from-transparent to-white/[0.01]">
              {voiceInputMode === 'mic' ? (
                <>
                  <div className="relative">
                    {isRecording && <div className="absolute -inset-8 bg-gold-500/20 rounded-full animate-ping opacity-75"></div>}
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isProcessingSpeak}
                      className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center transition-all shadow-2xl ${
                        isRecording 
                          ? 'bg-red-500 hover:bg-red-600 text-white glow-red' 
                          : isProcessingSpeak 
                            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                            : 'gold-gradient text-white hover:scale-110 glow-gold'
                      }`}
                    >
                      {isRecording ? <Square className="w-10 h-10 fill-current" /> : <Mic className="w-10 h-10" />}
                    </button>
                  </div>
                  <div className="mt-10 text-center">
                    {isRecording ? (
                      <div className="flex flex-col items-center">
                        <span className="text-gold-400 font-bold tracking-widest uppercase text-xs animate-pulse flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-gold-500 shadow-[0_0_10px_rgba(201,141,58,1)]"></span> {t.voice.recording}
                        </span>
                        <span className="text-5xl font-mono mt-4 font-light tracking-tighter text-white">{formatTime(recordingTime)}</span>
                      </div>
                    ) : isProcessingSpeak ? (
                      <div className="flex items-center gap-3 text-gold-400 font-bold tracking-wide">
                        <Loader2 className="w-6 h-6 animate-spin" /> {t.voice.processing}
                      </div>
                    ) : <span className="text-zinc-500 font-medium tracking-wide">{t.voice.startRecord}</span>}
                  </div>
                </>
              ) : (
                <div className="w-full max-w-2xl flex flex-col gap-6">
                  <div className="relative">
                    <textarea
                      value={voiceManualText}
                      onChange={(e) => setVoiceManualText(e.target.value)}
                      placeholder={t.voice.textPlaceholder}
                      className="w-full p-8 rounded-[2rem] border border-white/10 focus:ring-2 focus:ring-gold-500 focus:border-transparent resize-none bg-white/5 text-white placeholder:text-zinc-600 font-light leading-relaxed text-lg min-h-[150px]"
                    />
                    <div className="absolute bottom-6 right-6">
                      <button
                        onClick={handleVoiceManualSubmit}
                        disabled={isProcessingSpeak || !voiceManualText.trim()}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl ${
                          isProcessingSpeak || !voiceManualText.trim() 
                            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                            : 'gold-gradient text-white hover:scale-105 active:scale-95'
                        }`}
                      >
                        {isProcessingSpeak ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    {isProcessingSpeak && (
                      <div className="flex items-center gap-3 text-gold-400 font-bold tracking-wide animate-pulse">
                        <Loader2 className="w-5 h-5 animate-spin" /> {t.voice.processing}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {speakResultEn && (
              <div className="p-12 bg-white/[0.01] flex flex-col items-center text-center relative animate-in zoom-in duration-500">
                <button 
                  onClick={() => copyToClipboard(speakResultEn)}
                  className="absolute top-8 right-8 p-3 bg-white/5 border border-white/10 rounded-xl text-zinc-500 hover:text-gold-400 shadow-xl transition-all backdrop-blur-md"
                  title="Copy to Clipboard"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                </button>
                <div className="mb-10">
                  <p className="text-[10px] text-gold-500/60 uppercase tracking-[0.3em] font-bold mb-4">English Response</p>
                  <p className="text-3xl font-medium text-white leading-relaxed max-w-2xl font-serif italic">"{speakResultEn}"</p>
                </div>
                {audioUrl && (
                  <div className="flex flex-col items-center gap-6">
                    <div className="flex items-center gap-5 bg-white/5 px-8 py-4 rounded-full border border-white/10 shadow-2xl backdrop-blur-md group hover:border-gold-500/30 transition-all">
                      <button onClick={() => { if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play(); } }} className="w-12 h-12 rounded-full gold-gradient text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-gold-500/20">
                        <Play className="w-6 h-6 fill-current ml-1" />
                      </button>
                      <span className="text-sm font-bold text-zinc-300 tracking-wide">{t.voice.replay}</span>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      {showFeedbackSuccess ? (
                        <p className="text-emerald-400 text-sm font-bold animate-in fade-in slide-in-from-bottom-2 duration-300">
                          {t.voice.feedbackSuccess}
                        </p>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                            {t.voice.feedbackLabel}
                          </p>
                          <div className="flex items-center gap-6">
                            <div className="flex gap-3">
                              <button 
                                onClick={() => {
                                  handleVoiceFeedback('good');
                                  saveTranslation(voiceInputMode === 'mic' ? 'Voice Input' : voiceManualText, speakResultEn, 'TH_EN', 'good');
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-xs font-bold"
                              >
                                <ThumbsUp className="w-4 h-4" /> {t.voice.goodTranslation}
                              </button>
                              <button 
                                onClick={() => {
                                  handleVoiceFeedback('bad');
                                  saveTranslation(voiceInputMode === 'mic' ? 'Voice Input' : voiceManualText, speakResultEn, 'TH_EN', 'bad');
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-xs font-bold"
                              >
                                <ThumbsDown className="w-4 h-4" /> {t.voice.badTranslation}
                              </button>
                            </div>
                            <div className="w-px h-8 bg-white/10"></div>
                            <button 
                              onClick={() => saveTranslation(voiceInputMode === 'mic' ? 'Voice Input' : voiceManualText, speakResultEn, 'TH_EN')} 
                              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20 hover:bg-gold-500/20 transition-all text-xs font-bold"
                            >
                              <Sparkles className="w-4 h-4" /> {t.voice.saveBtn}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'text' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* English to Thai Window */}
            <div className="glass-panel rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[650px] glow-blue">
              <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-500/20 p-3 rounded-2xl text-blue-400 border border-blue-500/20">
                    <Languages className="w-6 h-6" />
                  </div>
                  <h2 className="font-bold text-lg font-serif italic text-gold-100">{t.text.enThTitle}</h2>
                </div>
                <button onClick={resetEnTh} className="p-2 text-zinc-500 hover:text-blue-400 transition-all"><RefreshCw className="w-5 h-5" /></button>
              </div>
              <div className="p-6 flex-1 flex flex-col gap-6 overflow-hidden">
                <textarea
                  value={enThInput}
                  onChange={(e) => setEnThInput(e.target.value)}
                  placeholder={t.text.enPlaceholder}
                  className="w-full h-1/2 p-6 rounded-3xl border border-white/10 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white/5 text-white placeholder:text-zinc-600 font-light leading-relaxed"
                />
                <div className="flex justify-center">
                  <button
                    onClick={handleEnThTranslate}
                    disabled={isProcessingEnTh || !enThInput.trim()}
                    className={`px-8 py-3 rounded-full font-bold flex items-center gap-3 transition-all shadow-xl ${
                      isProcessingEnTh || !enThInput.trim() 
                        ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95'
                    }`}
                  >
                    {isProcessingEnTh ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    {t.text.translateBtnEn}
                  </button>
                </div>
                <div className="flex-1 bg-white/[0.02] rounded-3xl p-6 border border-white/5 overflow-y-auto relative group">
                  {enThResult ? (
                    <div className="flex flex-col h-full">
                      <div className="flex-1">
                        <button onClick={() => copyToClipboard(enThResult)} className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"><Copy className="w-5 h-5" /></button>
                        <p className="text-zinc-300 leading-relaxed font-light">{enThResult}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-4">
                        {showFeedbackSuccess && (
                          <p className="text-emerald-400 text-[10px] font-bold animate-in fade-in slide-in-from-bottom-1 duration-300 text-center">
                            {t.voice.feedbackSuccess}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => saveTranslation(enThInput, enThResult, 'EN_TH', 'good')} 
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-[10px] font-bold"
                            >
                              <ThumbsUp className="w-3 h-3" /> {t.voice.goodTranslation}
                            </button>
                            <button 
                              onClick={() => saveTranslation(enThInput, enThResult, 'EN_TH', 'bad')} 
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-[10px] font-bold"
                            >
                              <ThumbsDown className="w-3 h-3" /> {t.voice.badTranslation}
                            </button>
                          </div>
                          <button onClick={() => saveTranslation(enThInput, enThResult, 'EN_TH')} className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> {t.voice.saveBtn}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : <p className="text-zinc-600 text-sm italic text-center mt-6 font-light">{t.text.resultPlaceholderEn}</p>}
                </div>
              </div>
            </div>

            {/* Thai to English Window */}
            <div className="glass-panel rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[650px] glow-gold">
              <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-gold-500/20 p-3 rounded-2xl text-gold-400 border border-gold-500/20">
                    <Languages className="w-6 h-6" />
                  </div>
                  <h2 className="font-bold text-lg font-serif italic text-gold-100">{t.text.thEnTitle}</h2>
                </div>
                <button onClick={resetThEn} className="p-2 text-zinc-500 hover:text-gold-400 transition-all"><RefreshCw className="w-5 h-5" /></button>
              </div>
              <div className="p-6 flex-1 flex flex-col gap-6 overflow-hidden">
                <textarea
                  value={thEnInput}
                  onChange={(e) => setThEnInput(e.target.value)}
                  placeholder={t.text.thPlaceholder}
                  className="w-full h-1/2 p-6 rounded-3xl border border-white/10 focus:ring-2 focus:ring-gold-500 focus:border-transparent resize-none bg-white/5 text-white placeholder:text-zinc-600 font-light leading-relaxed"
                />
                <div className="flex justify-center">
                  <button
                    onClick={handleThEnTranslate}
                    disabled={isProcessingThEn || !thEnInput.trim()}
                    className={`px-8 py-3 rounded-full font-bold flex items-center gap-3 transition-all shadow-xl ${
                      isProcessingThEn || !thEnInput.trim() 
                        ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                        : 'gold-gradient text-white hover:scale-105 active:scale-95'
                    }`}
                  >
                    {isProcessingThEn ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    {t.text.translateBtnTh}
                  </button>
                </div>
                <div className="flex-1 bg-white/[0.02] rounded-3xl p-6 border border-white/5 overflow-y-auto relative group">
                  {thEnResult ? (
                    <div className="flex flex-col h-full">
                      <div className="flex-1">
                        <button onClick={() => copyToClipboard(thEnResult)} className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-gold-400 opacity-0 group-hover:opacity-100 transition-all"><Copy className="w-5 h-5" /></button>
                        <p className="text-zinc-300 leading-relaxed font-light italic">"{thEnResult}"</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-4">
                        {showFeedbackSuccess && (
                          <p className="text-emerald-400 text-[10px] font-bold animate-in fade-in slide-in-from-bottom-1 duration-300 text-center">
                            {t.voice.feedbackSuccess}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => saveTranslation(thEnInput, thEnResult, 'TH_EN', 'good')} 
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-[10px] font-bold"
                            >
                              <ThumbsUp className="w-3 h-3" /> {t.voice.goodTranslation}
                            </button>
                            <button 
                              onClick={() => saveTranslation(thEnInput, thEnResult, 'TH_EN', 'bad')} 
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-[10px] font-bold"
                            >
                              <ThumbsDown className="w-3 h-3" /> {t.voice.badTranslation}
                            </button>
                          </div>
                          <button onClick={() => saveTranslation(thEnInput, thEnResult, 'TH_EN')} className="text-xs font-bold text-gold-400 hover:text-gold-300 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> {t.voice.saveBtn}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : <p className="text-zinc-600 text-sm italic text-center mt-6 font-light">{t.text.resultPlaceholderTh}</p>}
                </div>
              </div>
            </div>

            {/* Strategic Text Analysis Window */}
            <div className="glass-panel rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[750px] glow-emerald lg:col-span-2 mt-10">
              <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-500/20 p-3 rounded-2xl text-emerald-400 border border-emerald-500/20">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <h2 className="font-bold text-lg font-serif italic text-gold-100">{t.text.analysisTitle}</h2>
                </div>
                <button onClick={resetTextAnalysis} className="p-2 text-zinc-500 hover:text-emerald-400 transition-all"><RefreshCw className="w-5 h-5" /></button>
              </div>
              <div className="p-6 flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden">
                <div className="flex-1 flex flex-col gap-6">
                  <div className="flex items-center gap-4 mb-2">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{t.text.selectLang}</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setTextAnalysisLang('English')}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${textAnalysisLang === 'English' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-zinc-500 border border-white/10'}`}
                      >
                        English
                      </button>
                      <button 
                        onClick={() => setTextAnalysisLang('Thai')}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${textAnalysisLang === 'Thai' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-zinc-500 border border-white/10'}`}
                      >
                        Thai
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Data Source</p>
                    <button
                      onClick={() => setUseMapsGrounding(!useMapsGrounding)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-2 ${useMapsGrounding ? 'bg-emerald-500 text-white' : 'bg-white/5 text-zinc-500 border border-white/10'}`}
                    >
                      <MapPin className="w-3 h-3" />
                      Use Google Maps data
                    </button>
                  </div>
                  <textarea
                    value={textAnalysisInput}
                    onChange={(e) => setTextAnalysisInput(e.target.value)}
                    placeholder={t.text.analysisPlaceholder}
                    className="flex-1 p-6 rounded-3xl border border-white/10 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none bg-white/5 text-white placeholder:text-zinc-600 font-light leading-relaxed"
                  />
                  <div className="flex justify-center">
                    <button
                      onClick={handleTextAnalysis}
                      disabled={isProcessingTextAnalysis || !textAnalysisInput.trim()}
                      className={`px-10 py-4 rounded-full font-bold flex items-center gap-3 transition-all shadow-xl ${
                        isProcessingTextAnalysis || !textAnalysisInput.trim() 
                          ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 active:scale-95'
                      }`}
                    >
                      {isProcessingTextAnalysis ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
                      {t.text.analyzeBtn}
                    </button>
                  </div>
                </div>
                <div className="flex-1 bg-white/[0.02] rounded-3xl p-8 border border-white/5 overflow-y-auto relative group">
                  {isProcessingTextAnalysis ? (
                    <div className="h-full flex flex-col items-center justify-center text-emerald-400 gap-5">
                      <Loader2 className="w-12 h-12 animate-spin" />
                      <p className="font-bold tracking-widest uppercase text-xs animate-pulse">Analyzing Strategic Context...</p>
                    </div>
                  ) : textAnalysisResult ? (
                    <div className="prose prose-invert prose-zinc prose-sm max-w-none prose-p:text-zinc-400 prose-p:leading-relaxed prose-strong:text-emerald-400 prose-headings:text-gold-100 prose-headings:font-serif prose-headings:italic">
                      <button onClick={() => copyToClipboard(textAnalysisResult)} className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all"><Copy className="w-5 h-5" /></button>
                      <ReactMarkdown components={markdownComponents}>{textAnalysisResult}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center">
                      <Target className="w-16 h-16 mb-6 opacity-5" />
                      <p className="font-light">{t.text.analysisResultPlaceholder}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Learning Log Section */}
            <div className="mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-emerald-500/20 p-3 rounded-2xl text-emerald-400 border border-emerald-500/20">
                  <ListOrdered className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-serif italic text-white">{t.voice.learningLog}</h2>
                  <p className="text-zinc-500 text-sm">Review and organize your saved translations for language learning.</p>
                  <p className="text-[10px] text-emerald-500/60 mt-1 uppercase tracking-widest font-bold">Your feedback helps the platform gain strategic knowledge.</p>
                </div>
              </div>

              {savedTranslations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {savedTranslations.map((item) => (
                    <div key={item.id} className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-white/20 transition-all group relative">
                      <button 
                        onClick={() => deleteSavedTranslation(item.id)}
                        className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-2 mb-4">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${item.direction === 'EN_TH' ? 'bg-blue-500/10 text-blue-400' : 'bg-gold-500/10 text-gold-400'}`}>
                          {item.direction === 'EN_TH' ? 'EN → TH' : 'TH → EN'}
                        </span>
                        {item.feedback && (
                          <span className={`p-1 rounded-full ${item.feedback === 'good' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {item.feedback === 'good' ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-600 ml-auto">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">{t.voice.source}</p>
                          <p className="text-sm text-zinc-300 font-light">{item.source}</p>
                        </div>
                        <div className="pt-4 border-t border-white/5">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">{t.voice.translation}</p>
                          <p className="text-sm text-white font-medium italic">"{item.target}"</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-panel p-12 rounded-[2.5rem] border border-white/5 text-center">
                  <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-zinc-700" />
                  </div>
                  <p className="text-zinc-600 italic">{t.voice.noSaved}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'image' && (
          <div className="glass-panel rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-gold-500/20 p-3 rounded-2xl text-gold-400 border border-gold-500/20">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-serif italic text-gold-100">{t.image.title}</h2>
                  <p className="text-sm text-zinc-500 mt-1 font-light">{t.image.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                  <button 
                    onClick={() => setImageMode('analyze')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${imageMode === 'analyze' ? 'bg-gold-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <BrainCircuit className="w-3.5 h-3.5" />
                    {t.image.modeAnalyze}
                  </button>
                  <button 
                    onClick={() => setImageMode('generate')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${imageMode === 'generate' ? 'bg-gold-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    {t.image.modeGenerate}
                  </button>
                  <button 
                    onClick={() => setImageMode('edit')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${imageMode === 'edit' ? 'bg-gold-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {t.image.modeEdit || 'Edit'}
                  </button>
                </div>
                <button onClick={resetImage} className="p-3 text-zinc-500 hover:text-gold-400 hover:bg-white/5 rounded-xl transition-all">
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="flex flex-col gap-6">
                {imageMode === 'analyze' || imageMode === 'edit' ? (
                  <div className={`relative border-2 border-dashed rounded-[2rem] p-6 flex flex-col items-center justify-center min-h-[350px] transition-all ${imagePreview ? 'border-gold-500/30 bg-gold-500/5' : 'border-white/10 hover:border-gold-500/30 bg-white/[0.02]'}`}>
                    {imagePreview ? (
                      <div className="relative w-full h-full flex flex-col items-center">
                        {imageMode === 'analyze' ? (
                          <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            className="max-h-[400px]"
                          >
                            <img 
                              ref={imgRef}
                              src={imagePreview || null} 
                              alt="Preview" 
                              className="max-h-[400px] object-contain rounded-2xl shadow-2xl" 
                            />
                          </ReactCrop>
                        ) : (
                          <img src={imagePreview || null} alt="Preview" className="w-full h-full object-contain rounded-2xl shadow-2xl" />
                        )}
                        <button onClick={() => { setSelectedImage(null); setImagePreview(null); setCrop(undefined); setCompletedCrop(null); }} className="absolute -top-3 -right-3 p-2 bg-white text-zinc-900 rounded-full shadow-xl hover:bg-red-500 hover:text-white transition-all z-10">
                          <X className="w-5 h-5" />
                        </button>
                        {imageMode === 'analyze' && (
                          <p className="text-xs text-gold-500/80 mt-4 text-center">
                            Drag to select a specific area for targeted analysis, or leave unselected to analyze the whole image.
                          </p>
                        )}
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-5 group">
                        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 shadow-xl group-hover:scale-110 group-hover:text-gold-400 transition-all">
                          <Upload className="w-10 h-10" />
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-zinc-300 tracking-wide">{t.image.uploadLabel}</p>
                          <p className="text-xs text-zinc-500 mt-2 font-light">{t.image.uploadDesc}</p>
                        </div>
                        <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                      </label>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {!hasApiKey && (
                      <div className="bg-gold-500/10 border border-gold-500/20 rounded-2xl p-6 flex flex-col gap-4">
                        <p className="text-sm text-gold-200 font-medium">{t.image.selectApiKey}</p>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={openApiKeyDialog}
                            className="px-4 py-2 bg-gold-500 text-white rounded-lg text-xs font-bold hover:bg-gold-600 transition-all shadow-lg"
                          >
                            {t.image.apiKeyBtn}
                          </button>
                          <a 
                            href="https://ai.google.dev/gemini-api/docs/billing" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-zinc-500 hover:text-gold-400 underline"
                          >
                            {t.image.billingInfo}
                          </a>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-bold uppercase tracking-widest text-gold-500/60">{t.image.sizeLabel}</label>
                      <div className="flex gap-3">
                        {(['1K', '2K', '4K'] as const).map((size) => (
                          <button
                            key={size}
                            onClick={() => setImageSize(size)}
                            className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${imageSize === size ? 'bg-gold-500 border-gold-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-zinc-500 hover:border-gold-500/30'}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-bold uppercase tracking-widest text-gold-500/60">{t.image.aspectRatioLabel || 'Aspect Ratio'}</label>
                      <div className="flex gap-3 flex-wrap">
                        {(['1:1', '3:4', '4:3', '9:16', '16:9'] as const).map((ratio) => (
                          <button
                            key={ratio}
                            onClick={() => setAspectRatio(ratio)}
                            className={`flex-1 min-w-[60px] py-3 rounded-xl border font-bold text-sm transition-all ${aspectRatio === ratio ? 'bg-gold-500 border-gold-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-zinc-500 hover:border-gold-500/30'}`}
                          >
                            {ratio}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-bold uppercase tracking-widest text-gold-500/60">{t.image.styleLabel || 'Style'}</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['Photorealistic', 'Cinematic', 'Anime', 'Oil Painting', 'Watercolor', 'Cyberpunk', '3D Render', 'Sketch', 'Minimalist', 'Impressionistic', 'Surreal', 'Art Deco', 'Pixel Art', 'Abstract', 'Fantasy', 'Steampunk'].map((style) => (
                          <button
                            key={style}
                            onClick={() => setImageStyle(imageStyle === style ? '' : style)}
                            className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${imageStyle === style ? 'bg-gold-500 border-gold-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-zinc-400 hover:border-gold-500/30'}`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-gold-500/60">{t.image.promptLabel}</label>
                  
                  {imageMode === 'analyze' && (
                    <div className="flex gap-3 mb-2">
                      <button
                        onClick={() => setAnalysisMode('detailed')}
                        className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${analysisMode === 'detailed' ? 'bg-gold-500 border-gold-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-zinc-400 hover:border-gold-500/30'}`}
                      >
                        Detailed Analysis
                      </button>
                      <button
                        onClick={() => setAnalysisMode('concise')}
                        className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${analysisMode === 'concise' ? 'bg-gold-500 border-gold-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-zinc-400 hover:border-gold-500/30'}`}
                      >
                        Concise Summary
                      </button>
                    </div>
                  )}

                  <div className="relative">
                    <textarea
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder={imageMode === 'analyze' ? t.image.promptPlaceholderAnalyze : imageMode === 'edit' ? "Describe how to edit the image (e.g., 'Add a retro filter', 'Remove background')..." : t.image.promptPlaceholderGenerate}
                      className="w-full p-5 rounded-2xl border border-white/10 focus:ring-2 focus:ring-gold-500 focus:border-transparent resize-none bg-white/5 text-white placeholder:text-zinc-600 font-light"
                      rows={4}
                    />
                    {(imageMode === 'generate' || imageMode === 'edit') && (
                      <button
                        onClick={async () => {
                          if (!imagePrompt.trim()) return;
                          const improved = await improvePrompt(imagePrompt, 'image');
                          setImagePrompt(improved);
                        }}
                        disabled={!imagePrompt.trim()}
                        className="absolute bottom-4 right-4 p-2 rounded-xl bg-gold-500/20 text-gold-400 hover:bg-gold-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        title="Improve prompt with Gemini"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span className="absolute bottom-full right-0 mb-2 w-max px-2 py-1 bg-black/80 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          Improve prompt
                        </span>
                      </button>
                    )}
                  </div>
                  {imageMode === 'edit' && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['Add a retro filter', 'Remove the background', 'Change the image to black and white', 'Enhance the colors'].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setImagePrompt(suggestion)}
                          className="px-3 py-1.5 text-xs rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={imageMode === 'analyze' ? handleImageAnalysis : imageMode === 'edit' ? handleImageEdit : handleGenerateImage}
                  disabled={isProcessingImage || ((imageMode === 'analyze' || imageMode === 'edit') && !selectedImage) || ((imageMode === 'generate' || imageMode === 'edit') && !imagePrompt.trim())}
                  className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-2xl ${
                    isProcessingImage || ((imageMode === 'analyze' || imageMode === 'edit') && !selectedImage) || ((imageMode === 'generate' || imageMode === 'edit') && !imagePrompt.trim())
                      ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                      : 'gold-gradient text-white hover:scale-[1.02] active:scale-95'
                  }`}
                >
                  {isProcessingImage ? <Loader2 className="w-6 h-6 animate-spin" /> : imageMode === 'analyze' ? <BrainCircuit className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                  {imageMode === 'analyze' ? t.image.analyzeBtn : imageMode === 'edit' ? "Edit Image" : t.image.generateBtn}
                </button>
              </div>
 
              <div className="bg-white/[0.01] rounded-[2rem] p-8 border border-white/5 min-h-[450px] relative overflow-y-auto glow-gold">
                {isProcessingImage ? (
                  <div className="h-full flex flex-col items-center justify-center text-gold-400 gap-5">
                    <Loader2 className="w-12 h-12 animate-spin" />
                    <p className="font-bold tracking-widest uppercase text-xs">{t.image.processing}</p>
                  </div>
                ) : imageResult ? (
                  <div className="relative group">
                    <button onClick={() => copyToClipboard(imageResult)} className="absolute top-0 right-0 p-2 text-zinc-500 hover:text-gold-400 opacity-0 group-hover:opacity-100 transition-all"><Copy className="w-5 h-5" /></button>
                    <div className="prose prose-invert prose-zinc prose-sm max-w-none prose-p:text-zinc-400 prose-p:leading-relaxed prose-strong:text-gold-400">
                      <ReactMarkdown components={markdownComponents}>{imageResult}</ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center">
                    <ImageIcon className="w-16 h-16 mb-6 opacity-5" />
                    <p className="font-light">{t.image.resultPlaceholder}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'video' && (
          <div className="glass-panel rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-gold-500/20 p-3 rounded-2xl text-gold-400 border border-gold-500/20">
                  <Film className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-serif italic text-gold-100">{t.tabs.video}</h2>
                  <p className="text-sm text-zinc-500 mt-1 font-light">Generate videos from images using Veo 3.1 Lite.</p>
                </div>
              </div>
              {!hasApiKey && (
                <button
                  onClick={openApiKeyDialog}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-all text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  {t.image.selectApiKey}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="p-8 border-r border-white/5 space-y-6">
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-zinc-400">
                    {t.image.uploadLabel}
                  </label>
                  <div className="relative group">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleVideoImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${videoImagePreview ? 'border-gold-500/30 bg-gold-500/5' : 'border-white/10 bg-white/5 group-hover:border-gold-500/50 group-hover:bg-white/10'}`}>
                      {videoImagePreview ? (
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                          <img src={videoImagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-white font-medium flex items-center gap-2">
                              <Upload className="w-5 h-5" /> Change Image
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 group-hover:text-gold-400 group-hover:scale-110 transition-all duration-300">
                            <Upload className="w-8 h-8" />
                          </div>
                          <div>
                            <p className="text-zinc-300 font-medium">Click or drag to upload</p>
                            <p className="text-sm text-zinc-500 mt-1">PNG, JPG or WEBP</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-zinc-400">
                    {t.image.aspectRatioLabel}
                  </label>
                  <div className="flex gap-2">
                    {['16:9', '9:16'].map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setVideoAspectRatio(ratio as any)}
                        className={`flex-1 py-3 rounded-xl border transition-all text-sm font-medium ${videoAspectRatio === ratio ? 'bg-gold-500/20 border-gold-500/50 text-gold-300' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'}`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-zinc-400">
                      {t.image.promptLabel} (Optional)
                    </label>
                    <span className="text-xs text-zinc-500 italic">
                      Tip: Describe motion, camera movement, and lighting. (ใช้ Gemini ปรับปรุงข้อความเป็น prompt ได้)
                    </span>
                  </div>
                  <div className="relative">
                    <textarea
                      value={videoPrompt}
                      onChange={(e) => setVideoPrompt(e.target.value)}
                      placeholder="Describe how the image should be animated..."
                      className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-transparent resize-none transition-all"
                    />
                    <button
                      onClick={async () => {
                        if (!videoPrompt.trim()) return;
                        const improved = await improvePrompt(videoPrompt, 'video');
                        setVideoPrompt(improved);
                      }}
                      disabled={!videoPrompt.trim()}
                      className="absolute bottom-4 right-4 p-2 rounded-xl bg-gold-500/20 text-gold-400 hover:bg-gold-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                      title="Improve prompt with Gemini"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="absolute bottom-full right-0 mb-2 w-max px-2 py-1 bg-black/80 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Improve prompt
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleGenerateVideo}
                  disabled={isProcessingVideo || !videoImage}
                  className={`w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-3 transition-all duration-300 ${
                    isProcessingVideo || !videoImage
                      ? 'bg-white/5 text-zinc-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-gold-600 to-gold-500 text-black hover:shadow-lg hover:shadow-gold-500/25 hover:scale-[1.02]'
                  }`}
                >
                  {isProcessingVideo ? <Loader2 className="w-6 h-6 animate-spin" /> : <Film className="w-6 h-6" />}
                  {isProcessingVideo ? 'Generating Video...' : 'Generate Video'}
                </button>
              </div>

              <div className="p-8 bg-black/20 flex flex-col">
                <h3 className="text-lg font-medium text-zinc-300 mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-gold-500" />
                  Result
                </h3>
                
                {isProcessingVideo ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-gold-500/50" />
                    <p className="animate-pulse">Generating video... This may take a few minutes.</p>
                  </div>
                ) : videoError ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400 text-center max-w-md">
                      <p className="whitespace-pre-wrap">{videoError}</p>
                    </div>
                  </div>
                ) : videoResultUrl ? (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <video 
                      src={videoResultUrl} 
                      controls 
                      autoPlay 
                      loop 
                      className="w-full max-h-[500px] rounded-2xl border border-white/10 shadow-2xl"
                    />
                    <a 
                      href={videoResultUrl} 
                      download="generated-video.mp4"
                      className="mt-6 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4 rotate-180" />
                      Download Video
                    </a>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 text-center">
                    <Film className="w-16 h-16 mb-6 opacity-5" />
                    <p className="font-light">Generated video will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'consultant' && (
          <div className="glass-panel rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[750px] glow-gold">
            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-gold-500/20 p-3 rounded-2xl text-gold-400 border border-gold-500/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-serif italic text-gold-100">{t.consultant.title}</h2>
                  <p className="text-xs text-zinc-500 mt-1 font-light tracking-wider uppercase">{t.consultant.desc}</p>
                </div>
              </div>
              <button 
                onClick={clearChatHistory}
                className="p-3 text-zinc-500 hover:text-gold-400 hover:bg-white/5 rounded-xl transition-all"
                title={t.consultant.clearChat}
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
 
            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gradient-to-b from-transparent to-white/[0.01]">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-center max-w-md mx-auto">
                  <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 shadow-2xl">
                    <Bot className="w-12 h-12 text-gold-500/20" />
                  </div>
                  <p className="text-2xl font-bold mb-4 font-serif italic text-gold-100">{t.consultant.welcomeTitle}</p>
                  <p className="text-zinc-500 font-light leading-relaxed">{t.consultant.welcomeDesc}</p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                    <div className={`flex gap-5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xl ${msg.role === 'user' ? 'bg-gold-600 text-white' : 'bg-white/5 border border-white/10 text-gold-400 backdrop-blur-md'}`}>
                        {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                      </div>
                      <div className={`p-6 rounded-[2rem] shadow-2xl backdrop-blur-md border ${msg.role === 'user' ? 'bg-gold-600/10 border-gold-500/20 text-white rounded-tr-none' : 'bg-white/5 border-white/10 text-zinc-300 rounded-tl-none'}`}>
                        <div className="prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-strong:text-gold-400">
                          <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {isProcessingChat && (
                <div className="flex justify-start animate-in fade-in slide-in-from-left-4 duration-500">
                  <div className="flex gap-5 max-w-[85%] flex-row">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 text-gold-400 flex items-center justify-center shrink-0 shadow-xl backdrop-blur-md">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="p-6 rounded-[2rem] rounded-tl-none bg-white/5 border border-white/10 shadow-2xl backdrop-blur-md flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-gold-500/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-gold-500/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-gold-500/60 rounded-full animate-bounce"></div>
                      </div>
                      <span className="text-xs text-zinc-500 font-light tracking-wider uppercase ml-2">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
 
            <form onSubmit={handleChatSubmit} className="p-6 bg-white/[0.02] border-t border-white/5 flex gap-4">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={t.consultant.inputPlaceholder}
                className="flex-1 px-6 py-4 rounded-2xl border border-white/10 focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all bg-white/5 text-white placeholder:text-zinc-600 font-light"
                disabled={isProcessingChat}
              />
              <button
                type="submit"
                disabled={isProcessingChat || !chatInput.trim()}
                className={`p-4 rounded-2xl transition-all shadow-2xl ${
                  isProcessingChat || !chatInput.trim() 
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                    : 'gold-gradient text-white hover:scale-110 active:scale-95'
                }`}
              >
                <Send className="w-6 h-6" />
              </button>
            </form>
          </div>
        )}

        {activeTab === 'assessment' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <AssessmentLab />
          </div>
        )}
      </main>
      {/* Consultation Preparation Modal */}
      <AnimatePresence>
        {isConsultPrepModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="bg-zinc-900 border border-white/10 rounded-[3rem] p-8 md:p-12 max-w-2xl w-full relative shadow-[0_0_100px_rgba(201,141,58,0.1)]"
            >
              <button 
                onClick={() => setIsConsultPrepModalOpen(false)}
                className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h3 className="text-3xl font-black text-white mb-6 tracking-tighter">Consultation Preparation</h3>
              <p className="text-zinc-400 text-lg font-light leading-relaxed mb-8">
                What is the primary focus for this consultation? Providing context helps me give you more accurate and strategic advice.
              </p>

              <textarea 
                value={consultationContext}
                onChange={(e) => setConsultationContext(e.target.value)}
                placeholder="Type your focus or context here..."
                className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-6 text-white placeholder-zinc-600 focus:outline-none focus:border-gold-500 mb-8"
              />

              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => setIsConsultPrepModalOpen(false)}
                  className="px-8 py-3 bg-white/5 text-white rounded-full font-bold hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('consultant');
                    setChatMessages([{ role: 'bot', content: `สวัสดีครับ ผมพร้อมให้คำปรึกษาแล้วครับ\n\nหัวข้อการปรึกษา:\n${consultationContext || 'ไม่มีบริบทเพิ่มเติม'}\n\nมีส่วนไหนที่คุณต้องการให้ผมวิเคราะห์หรือแนะนำเป็นพิเศษไหมครับ?` }]);
                    setIsConsultPrepModalOpen(false);
                    setConsultationContext('');
                  }}
                  className="px-8 py-3 bg-gold-500 text-black rounded-full font-bold hover:bg-gold-400 transition-colors"
                >
                  Start Consultation
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}



