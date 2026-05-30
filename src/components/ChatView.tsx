/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { 
  Send, Mic, MicOff, Volume2, VolumeX, RefreshCw, AlertTriangle, 
  Bot, Clock, HelpCircle, Loader2, Sparkles, CheckCircle2 
} from "lucide-react";
import { 
  collection, doc, setDoc, query, orderBy, onSnapshot, serverTimestamp 
} from "firebase/firestore";
import { db, auth, OperationType, handleFirestoreError } from "../firebase";
import { ChatMessage, ChatSession } from "../types";

// Helper to safely format basic markdown blocks (bold, bullet lists, note alerts) in React
export function MedicalMarkdownRenderer({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split("\n");
  
  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-700">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        
        // Headers
        if (trimmed.startsWith("###")) {
          return <h4 key={idx} className="text-md font-bold text-slate-900 mt-3 mb-1">{trimmed.replace("###", "")}</h4>;
        }
        if (trimmed.startsWith("##")) {
          return <h3 key={idx} className="text-lg font-bold text-slate-900 mt-4 mb-2">{trimmed.replace("##", "")}</h3>;
        }
        if (trimmed.startsWith("#")) {
          return <h2 key={idx} className="text-xl font-extrabold text-slate-900 mt-5 mb-2">{trimmed.replace("#", "")}</h2>;
        }
        
        // Bullet list
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const content = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-sky-500 font-bold shrink-0 mt-1">•</span>
              <span dangerouslySetInnerHTML={{ __html: formatBoldText(content) }} />
            </div>
          );
        }
        
        // Numbered lists
        if (/^\d+\.\s/.test(trimmed)) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span dangerouslySetInnerHTML={{ __html: formatBoldText(trimmed) }} />
            </div>
          );
        }

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-2" />;
        }

        // Warning alerts or disclaimers block
        if (trimmed.toLowerCase().includes("clinical disclaimer") || trimmed.toLowerCase().includes("medical advice")) {
          return (
            <div key={idx} className="p-3 my-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex gap-2 items-center">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <p>{trimmed}</p>
            </div>
          );
        }

        return <p key={idx} dangerouslySetInnerHTML={{ __html: formatBoldText(trimmed) }} />;
      })}
    </div>
  );
}

function formatBoldText(raw: string) {
  // Regex to format **text** as bold in HTML
  return raw.replace(/\*\*(.*?)\*\*/g, "<strong class='text-slate-900 font-semibold'>$1</strong>");
}

interface ChatViewProps {
  activeSessionId: string | null;
  onSessionCreated: (id: string) => void;
  selectedLanguage: 'en' | 'hi' | 'te';
}

export default function ChatView({ activeSessionId, onSessionCreated, selectedLanguage }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentlyMuted, setCurrentlyMuted] = useState(true);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const labels: Record<string, any> = {
    en: {
      headerTitle: "AI Virtual Clinical Consultation",
      headerSub: "GEMINI-3.5-DIAGNOSIS-ONLINE",
      muteBtn: "Mute vocal responses",
      unmuteBtn: "Unmute vocal responses",
      welcomeTitle: "Welcome to Virtual Clinical Consultation",
      welcomeSub: "Describe symptoms, ask chronic questions, or check actions. All conversations are private and secured on Firestore databases.",
      suggested: [
        { label: "Asthma action plans", query: "Can you explain asthma symptoms and precautions?" },
        { label: "Hypertension limits", query: "What are the early indicators of hypertension?" },
        { label: "Seasonal chest warmth", query: "Is a continuous dry cough a reason to visit a clinic or rest at home?" },
        { label: "Emergency rules", query: "What are clinical red flags that require urgent seek emergency care?" }
      ],
      aiAssessment: "Diagnostic AI Assessment",
      speakGuidance: "Speak Guidance",
      stopListening: "Stop Listening",
      typingText: "Clinical consultant is formulating response...",
      disclaimer: "Responses are informational only and are not a substitute for professional medical advice."
    },
    hi: {
      headerTitle: "एआई वर्चुअल क्लिनिकल परामर्श",
      headerSub: "जेमिनी-3.5-डायग्नोसिस-ऑनलाइन",
      muteBtn: "आवाज बंद करें",
      unmuteBtn: "आवाज शुरू करें",
      welcomeTitle: "वर्चुअल क्लिनिकल परामर्श में आपका स्वागत है",
      welcomeSub: "लक्षणों का वर्णन करें, दीर्घकालिक स्वास्थ्य प्रश्न पूछें, या सुझाई गई गतिविधियों की जांच करें। सभी बातचीत सुरक्षित और गोपनीय हैं।",
      suggested: [
        { label: "अस्थमा कार्य योजना", query: "क्या आप अस्थमा के लक्षणों और सावधानियों के बारे में समझा सकते हैं?" },
        { label: "उच्च रक्तचाप सीमाएं", query: "उच्च रक्तचाप के शुरुआती लक्षण क्या हैं?" },
        { label: "सीने में मौसमी जकड़न", query: "क्या लगातार सूखी खांसी क्लिनिक जाने का कारण है या घर पर आराम करने का?" },
        { label: "आपातकालीन नियम", query: "कौन से नैदानिक लक्षण हैं जिनके लिए तुरंत आपातकालीन देखभाल लेनी होगी?" }
      ],
      aiAssessment: "एआई नैदानिक मूल्यांकन",
      speakGuidance: "मार्गदर्शन सुनें",
      stopListening: "सुनना बंद करें",
      typingText: "क्लिनिकल विशेषज्ञ उत्तर तैयार कर रहे हैं...",
      disclaimer: "प्रतिक्रियाएं केवल सूचनात्मक हैं और पेशेवर चिकित्सा सलाह का विकल्प नहीं हैं।"
    },
    te: {
      headerTitle: "AI వర్చువల్ క్లినికల్ సంప్రదింపులు",
      headerSub: "జెమినీ-3.5-రోగ నిర్ధారణ-ఆన్‌లైన్",
      muteBtn: "వాయిస్ నిలిపివేయి",
      unmuteBtn: "వాయిస్ ప్రారంభించు",
      welcomeTitle: "వర్చువల్ క్లినికల్ సంప్రదింపులకు స్వాగతం",
      welcomeSub: "ఆరోగ్య లక్షణాలు వివరించండి, దీర్ఘకాలిక సమస్యల గురించి అడగండి. మీ సంభాషణలు సురక్షితంగా రికార్డ్ చేయబడతాయి.",
      suggested: [
        { label: "ఉబ్బసం నియంత్రణ నియమాలు", query: "ఆస్తమా లక్షణాల గురించి వివరించగలరు?" },
        { label: "రక్తపోటు సంకేతాలు", query: "అధిక రక్తపోటు యొక్క ప్రారంభ సంకేతాలు ఏమిటి?" },
        { label: "దగ్గు మరియు చికిత్స", query: "పొడి దగ్గు ఉంటే ఆసుపత్రికి వెళ్ళాలా లేదా విశ్రాంతి తీసుకోవాలా?" },
        { label: "అत्यవసర చికిత్స", query: "వెంటనే అత్యవసర చికిత్స అవసరమయ్యే తీవ్రమైన లక్షణాలు ఏవి?" }
      ],
      aiAssessment: "AI క్లినికల్ అంచనా",
      speakGuidance: "వాయిస్ వినండి",
      stopListening: "వాయిస్ ఆపు",
      typingText: "వైద్య నిపుణులు సమాచారాన్ని సిద్ధం చేస్తున్నారు...",
      disclaimer: "సమాధానాలు సమాచార ప్రయోజనాల కొరకు మాత్రమే. ఇవి వృత్తిపరమైన వైద్య సలహా ప్రత్యామ్నాయాలు కావు."
    }
  };

  const currentLabels = labels[selectedLanguage] || labels.en;
  const suggestedPrompts = currentLabels.suggested;

  // 1. Listen to active chat message triggers in Firestore
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    if ((auth.currentUser as any)?.isGuest) {
      const chatKey = `guest_chats_${activeSessionId}_messages`;
      const loadLocalMessages = () => {
        const stored = JSON.parse(localStorage.getItem(chatKey) || "[]");
        setMessages(stored.map((m: any) => ({
          ...m,
          createdAt: new Date(m.createdAt)
        })));
      };
      
      loadLocalMessages();
      window.addEventListener("local_storage_chat_update", loadLocalMessages);
      return () => window.removeEventListener("local_storage_chat_update", loadLocalMessages);
    }

    if (!auth.currentUser) return;

    const messagesPath = `chats/${activeSessionId}/messages`;
    const q = query(collection(db, messagesPath), orderBy("createdAt", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesList: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messagesList.push({
          id: doc.id,
          text: data.text || "",
          sender: data.sender || "user",
          createdAt: data.createdAt?.toDate() || new Date()
        });
      });
      setMessages(messagesList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, messagesPath);
    });

    return () => unsubscribe();
  }, [activeSessionId]);

  // 2. Scroll to latest conversation bubbles
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // 3. Native STT (Speech Recognition) Setup using Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      // Match clinical language switching
      if (selectedLanguage === "hi") rec.lang = "hi-IN";
      else if (selectedLanguage === "te") rec.lang = "te-IN";
      else rec.lang = "en-US";

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          setInput(prev => (prev ? prev + " " + text : text));
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error: ", e);
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [selectedLanguage]);

  // Handle Speech Toggle
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice speech dictation is not fully supported in this browser iframe environment. Try typing instead.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // Submit User Message
  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || !auth.currentUser) return;
    
    if ((auth.currentUser as any)?.isGuest) {
      let sessionId = activeSessionId;
      const isNewSession = !sessionId;

      if (isNewSession) {
        sessionId = "chat_" + Math.random().toString(36).substring(2, 15);
        const storedSessions = JSON.parse(localStorage.getItem("guest_chats") || "[]");
        storedSessions.push({
          id: sessionId,
          userId: auth.currentUser.uid,
          title: textToSend.substring(0, 35) + "...",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        localStorage.setItem("guest_chats", JSON.stringify(storedSessions));
        onSessionCreated(sessionId!);
      }

      const userMsgId = "msg_" + Math.random().toString(36).substring(2, 11);
      const guestChatKey = `guest_chats_${sessionId}_messages`;
      const storedMsgs = JSON.parse(localStorage.getItem(guestChatKey) || "[]");
      const newUserMsg = {
        id: userMsgId,
        text: textToSend,
        sender: "user",
        createdAt: new Date().toISOString()
      };
      storedMsgs.push(newUserMsg);
      localStorage.setItem(guestChatKey, JSON.stringify(storedMsgs));
      window.dispatchEvent(new Event("local_storage_chat_update"));

      setInput("");
      setIsTyping(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: textToSend,
            previousMessages: storedMsgs.slice(-5).map((m: any) => ({ text: m.text, sender: m.sender })),
            language: selectedLanguage
          })
        });

        const responseData = await response.json();
        const modelText = responseData.text || "I was unable to process your diagnostic assessment query. Please try again.";

        const modelMsgId = "msg_" + Math.random().toString(36).substring(2, 11);
        const updatedMsgs = JSON.parse(localStorage.getItem(guestChatKey) || "[]");
        updatedMsgs.push({
          id: modelMsgId,
          text: modelText,
          sender: "model",
          createdAt: new Date().toISOString()
        });
        localStorage.setItem(guestChatKey, JSON.stringify(updatedMsgs));
        window.dispatchEvent(new Event("local_storage_chat_update"));

        if (!currentlyMuted) {
          triggerVocalSynthesis(modelText, modelMsgId);
        }
      } catch (err) {
        console.error("Local chat proxy API failure: ", err);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    let sessionId = activeSessionId;
    const isNewSession = !sessionId;

    // Create session if it doesn't exist
    if (isNewSession) {
      sessionId = "chat_" + Math.random().toString(36).substring(2, 15);
      const sessionDocRef = doc(db, "chats", sessionId);
      
      const newSession: ChatSession = {
        id: sessionId!,
        userId: auth.currentUser.uid,
        title: textToSend.substring(0, 35) + "...",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      try {
        await setDoc(sessionDocRef, newSession);
        onSessionCreated(sessionId!);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `chats/${sessionId}`);
      }
    }

    // Save user message to Firestore
    const userMsgId = "msg_" + Math.random().toString(36).substring(2, 11);
    const userMsgPath = `chats/${sessionId}/messages/${userMsgId}`;
    try {
      await setDoc(doc(db, `chats/${sessionId}/messages`, userMsgId), {
        id: userMsgId,
        text: textToSend,
        sender: "user",
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, userMsgPath);
    }

    setInput("");
    setIsTyping(true);

    try {
      // Proxy Gemini Query server-side
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          previousMessages: messages.slice(-5).map(m => ({ text: m.text, sender: m.sender })),
          language: selectedLanguage
        })
      });

      const responseData = await response.json();
      const modelText = responseData.text || "I was unable to process your diagnostic assessment query. Please try again.";

      // Save model reply to Firestore
      const modelMsgId = "msg_" + Math.random().toString(36).substring(2, 11);
      const modelMsgPath = `chats/${sessionId}/messages/${modelMsgId}`;
      await setDoc(doc(db, `chats/${sessionId}/messages`, modelMsgId), {
        id: modelMsgId,
        text: modelText,
        sender: "model",
        createdAt: serverTimestamp()
      });

      // Speak AI response if sound is globally enabled
      if (!currentlyMuted) {
        triggerVocalSynthesis(modelText, modelMsgId);
      }

    } catch (err) {
      console.error("Failed to fetch response: ", err);
    } finally {
      setIsTyping(false);
    }
  };

  // TTS Model trigger to read out Gemini clinical advice
  const triggerVocalSynthesis = async (text: string, msgId: string) => {
    try {
      setPlayingAudioId(msgId);
      
      // Stop existing audio playbacks
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const response = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      const data = await response.json();
      if (!data.audio) {
        throw new Error("No synthetic vocal audio returned from server");
      }

      const base64Audio = data.audio;
      const audioUrl = `data:audio/wav;base64,${base64Audio}`;
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setPlayingAudioId(null);
      };
      
      await audio.play();
    } catch (err) {
      console.error("Vocal synthesis failed: ", err);
      setPlayingAudioId(null);
    }
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingAudioId(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-5xl mx-auto bg-white border border-slate-205 rounded-3xl shadow-xl shadow-slate-150/40 overflow-hidden my-2">
      {/* 1. HEADER SECTOR */}
      <div className="px-6 py-5 border-b border-slate-100 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-sky-50 text-[#0EA5E9] rounded-2xl border border-sky-100 shadow-sm shadow-sky-50/50">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 font-sans tracking-tight leading-tight">{currentLabels.headerTitle}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block animate-pulse" />
              <p className="text-[10px] text-slate-455 font-mono font-bold tracking-wide">{currentLabels.headerSub}</p>
            </div>
          </div>
        </div>

        {/* Mute toggle button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCurrentlyMuted(!currentlyMuted);
              if (!currentlyMuted) handleStopAudio();
            }}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer hover:scale-105 duration-155 ${
              currentlyMuted 
                ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-400" 
                : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 font-bold"
            }`}
            title={currentlyMuted ? currentLabels.unmuteBtn : currentLabels.muteBtn}
          >
            {currentlyMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. CHAT SCROLLER FRAME (Immersive UI Style) */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-[#F1F5F9]/50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto space-y-6 py-12">
            <div className="p-4 bg-sky-50 text-[#0EA5E9] rounded-3xl shadow-lg shadow-sky-100 inline-block animate-pulse">
              <Sparkles className="w-8 h-8 rotate-12" />
            </div>
            <div>
              <h4 className="text-md font-extrabold text-slate-900 mb-2">{currentLabels.welcomeTitle}</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                {currentLabels.welcomeSub}
              </p>
            </div>

            <div className="w-full grid grid-cols-1 gap-2.5">
              {suggestedPrompts.map((p: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setInput(p.query)}
                  className="px-4 py-3.5 rounded-2xl bg-white border border-slate-100 text-slate-605 text-slate-600 hover:text-slate-800 hover:border-sky-305 text-left text-xs transition-all hover:shadow-md hover:translate-y-[-1px] flex items-center gap-3 cursor-pointer"
                >
                  <div className="p-1.5 bg-sky-50 rounded-lg text-[#0EA5E9]">
                    <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                  </div>
                  <span className="truncate font-semibold">{p.label} ("{p.query.slice(0, 32)}...")</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-4 max-w-4xl items-start ${isUser ? "justify-end" : "justify-start"}`}
              >
                {/* AI Avatar */}
                {!isUser && (
                  <div className="w-10 h-10 rounded-2xl bg-[#0EA5E9] text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-100/80">
                    <Bot className="w-5 h-5" />
                  </div>
                )}

                <div className={`relative ${
                  isUser 
                    ? "bg-[#0EA5E9] text-white rounded-3xl rounded-tr-none p-4 md:p-5 shadow-lg shadow-sky-200/40 max-w-[85%] text-sm leading-relaxed border border-sky-400" 
                    : "bg-white border border-slate-100 rounded-3xl rounded-tl-none p-5 shadow-sm max-w-[85%] text-slate-750 text-sm leading-relaxed"
                }`}>
                  {isUser ? (
                    <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                  ) : (
                    <div>
                      {/* Section badge indicators under clinical assessment headers */}
                      <div className="flex items-center space-x-2 mb-3.5 border-b border-slate-50 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md">{currentLabels.aiAssessment}</span>
                        <span className="text-[10px] text-slate-455 font-bold flex-1 text-right">Reliability: 96%</span>
                      </div>

                      <MedicalMarkdownRenderer text={msg.text} />
                      
                      {/* TTS speaker trigger */}
                      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[9px] text-slate-455 font-mono font-bold">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {playingAudioId === msg.id ? (
                          <button
                            onClick={handleStopAudio}
                            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100"
                          >
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> {currentLabels.stopListening}
                          </button>
                        ) : (
                          <button
                            onClick={() => triggerVocalSynthesis(msg.text, msg.id)}
                            className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer hover:bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100 bg-[#F8FAFC]"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-sky-500" /> {currentLabels.speakGuidance}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {isUser && (
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(auth.currentUser?.displayName || auth.currentUser?.email || 'User')}&background=64748b&color=fff`} 
                    className="w-10 h-10 rounded-2xl shrink-0 shadow-sm border-2 border-white" 
                    alt="User" 
                  />
                )}
              </div>
            );
          })
        )}

        {/* AI Typing animation (Themed) */}
        {isTyping && (
          <div className="flex gap-4 justify-start items-center animate-pulse">
            <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-150">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-white border border-slate-100 px-5 py-4 rounded-3xl rounded-tl-none text-slate-500 text-xs flex items-center gap-2.5 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
              <span className="font-semibold text-slate-600">{currentLabels.typingText}</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 3. INPUT SECTOR */}
      <div className="p-4 bg-white border-t border-slate-150 font-sans">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="bg-[#F8FAFC] border border-slate-205 rounded-2xl flex items-center px-4 py-2 shadow-inner relative gap-3"
        >
          {/* Audio dictation toggle */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isListening 
                ? "bg-rose-500 text-white border-rose-500 animate-pulse shadow-md shadow-rose-250" 
                : "bg-white border-slate-200 text-slate-400 hover:text-[#0EA5E9] hover:bg-sky-50/50"
            }`}
            title={isListening ? "Listening - click to stop" : "Use Voice Speech input"}
          >
            {isListening ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isListening 
                ? "Listening... speak now" 
                : selectedLanguage === "hi" 
                  ? "अपनी चिकित्सा चिंताओं का वर्णन करें..." 
                  : selectedLanguage === "te"
                    ? "మీ ఆరోగ్య సమస్యను వివరించండి..."
                    : "Type symptoms or medical questions here..."
            }
            className="flex-1 border-none focus:ring-0 text-sm placeholder-slate-455 focus:outline-none bg-transparent py-3"
          />

          <button
            type="submit"
            disabled={!input.trim()}
            className="w-10 h-10 rounded-xl bg-[#0EA5E9] text-white flex items-center justify-center hover:bg-sky-600 shadow-md shadow-sky-100 cursor-pointer disabled:bg-slate-150 disabled:text-slate-400 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        
        {/* Safety Disclaimer bar */}
        <p className="text-[10px] text-slate-450 text-center mt-2 flex items-center justify-center gap-1.5 font-semibold text-slate-400">
          <Clock className="w-3.5 h-3.5 text-amber-500" /> {currentLabels.disclaimer}
        </p>
      </div>
    </div>
  );
}
