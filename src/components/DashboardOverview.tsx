/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  Activity, Star, Clock, Phone, MapPin, Heart, ChevronRight, 
  Trash2, TrendingUp, AlertTriangle, MessageSquare, ShieldAlert,
  Loader2, Bot, Calendar, Eye, HeartPulse, Hospital as HospIcon, UserRound 
} from "lucide-react";
import { collection, query, where, orderBy, limit, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db, auth, OperationType, handleFirestoreError } from "../firebase";
import { ChatSession, SymptomCheckRecord, SavedDoctorRecord, SavedHospitalRecord } from "../types";

interface DashboardOverviewProps {
  onNavigateToView: (view: string, sessionId?: string | null) => void;
  selectedLanguage?: 'en' | 'hi' | 'te';
}

export default function DashboardOverview({ onNavigateToView, selectedLanguage = "en" }: DashboardOverviewProps) {
  const [symptomHistory, setSymptomHistory] = useState<SymptomCheckRecord[]>([]);
  const [savedDoctors, setSavedDoctors] = useState<SavedDoctorRecord[]>([]);
  const [savedHospitals, setSavedHospitals] = useState<SavedHospitalRecord[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch aggregate metrics from Firestore collections associated with current user
  useEffect(() => {
    const fetchDashboardTelemetry = async () => {
      if (!auth.currentUser) return;
      setIsLoading(true);

      const userId = auth.currentUser.uid;

      if ((auth.currentUser as any).isGuest) {
        // Load offline Guest states
        const localChecks = JSON.parse(localStorage.getItem("guest_symptom_checks") || "[]");
        const formattedChecks = localChecks.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt)
        })).sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 3);
        setSymptomHistory(formattedChecks);

        const localDocs = JSON.parse(localStorage.getItem("guest_savedDoctors") || "[]");
        setSavedDoctors(localDocs.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt)
        })));

        const localHosps = JSON.parse(localStorage.getItem("guest_savedHospitals") || "[]");
        setSavedHospitals(localHosps.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt)
        })));

        const localChats = JSON.parse(localStorage.getItem("guest_chats") || "[]");
        const formattedChats = localChats.map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt)
        })).sort((a: any, b: any) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 5);
        setChatHistory(formattedChats);

        setIsLoading(false);
        return;
      }
      
      try {
        // Query recent symptom checks
        const symptomsQ = query(
          collection(db, "symptomChecks"),
          where("userId", "==", userId),
          orderBy("createdAt", "desc"),
          limit(3)
        );
        const symptomsSnap = await getDocs(symptomsQ);
        const symptomsList: SymptomCheckRecord[] = [];
        symptomsSnap.forEach(doc => {
          const data = doc.data();
          symptomsList.push({
            id: doc.id,
            userId: data.userId,
            symptoms: data.symptoms || "",
            age: data.age || 0,
            gender: data.gender || "Other",
            duration: data.duration || "",
            severity: data.severity || "Mild",
            results: data.results || "",
            createdAt: data.createdAt?.toDate() || new Date()
          });
        });
        setSymptomHistory(symptomsList);

        // Query shortlisted doctors
        const docQ = query(
          collection(db, "savedDoctors"),
          where("userId", "==", userId)
        );
        const docSnap = await getDocs(docQ);
        const docList: SavedDoctorRecord[] = [];
        docSnap.forEach(doc => {
          const data = doc.data();
          docList.push({
            id: doc.id,
            userId: data.userId,
            doctorId: data.doctorId,
            doctorName: data.doctorName,
            specialization: data.specialization,
            experience: data.experience,
            rating: data.rating,
            hospitalAffiliation: data.hospitalAffiliation,
            availability: data.availability,
            consultationFee: data.consultationFee,
            createdAt: data.createdAt?.toDate() || new Date()
          });
        });
        setSavedDoctors(docList);

        // Query saved hospitals
        const hospQ = query(
          collection(db, "savedHospitals"),
          where("userId", "==", userId)
        );
        const hospSnap = await getDocs(hospQ);
        const hospList: SavedHospitalRecord[] = [];
        hospSnap.forEach(doc => {
          const data = doc.data();
          hospList.push({
            id: doc.id,
            userId: data.userId,
            hospitalId: data.hospitalId,
            name: data.name,
            rating: data.rating,
            address: data.address,
            phone: data.phone,
            website: data.website,
            createdAt: data.createdAt?.toDate() || new Date()
          });
        });
        setSavedHospitals(hospList);

        // Query historic chat sessions
        const chatQ = query(
          collection(db, "chats"),
          where("userId", "==", userId),
          orderBy("updatedAt", "desc"),
          limit(5)
        );
        const chatSnap = await getDocs(chatQ);
        const chatList: ChatSession[] = [];
        chatSnap.forEach(doc => {
          const data = doc.data();
          chatList.push({
            id: doc.id,
            userId: data.userId,
            title: data.title || "Consultation Thread",
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          });
        });
        setChatHistory(chatList);

      } catch (err) {
        console.error("Dashboard aggregated compilation failed: ", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardTelemetry();
  }, []);

  // Delete handlers to keep database tidy
  const handleDeleteSymptomCheck = async (id: string) => {
    if ((auth.currentUser as any)?.isGuest) {
      const stored = JSON.parse(localStorage.getItem("guest_symptom_checks") || "[]");
      const filtered = stored.filter((item: any) => item.id !== id);
      localStorage.setItem("guest_symptom_checks", JSON.stringify(filtered));
      setSymptomHistory(prev => prev.filter(item => item.id !== id));
      return;
    }
    try {
      await deleteDoc(doc(db, "symptomChecks", id));
      setSymptomHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `symptomChecks/${id}`);
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    if ((auth.currentUser as any)?.isGuest) {
      const stored = JSON.parse(localStorage.getItem("guest_savedDoctors") || "[]");
      const filtered = stored.filter((item: any) => item.id !== id);
      localStorage.setItem("guest_savedDoctors", JSON.stringify(filtered));
      setSavedDoctors(prev => prev.filter(item => item.id !== id));
      return;
    }
    try {
      await deleteDoc(doc(db, "savedDoctors", id));
      setSavedDoctors(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `savedDoctors/${id}`);
    }
  };

  const handleDeleteHospital = async (id: string) => {
    if ((auth.currentUser as any)?.isGuest) {
      const stored = JSON.parse(localStorage.getItem("guest_savedHospitals") || "[]");
      const filtered = stored.filter((item: any) => item.id !== id);
      localStorage.setItem("guest_savedHospitals", JSON.stringify(filtered));
      setSavedHospitals(prev => prev.filter(item => item.id !== id));
      return;
    }
    try {
      await deleteDoc(doc(db, "savedHospitals", id));
      setSavedHospitals(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `savedHospitals/${id}`);
    }
  };

  const labels: Record<string, any> = {
    en: {
      loadingText: "Aggregating secure Firestore medical profiles...",
      title: "Patient Wellness Command Dashboard",
      subtitle: "Review your automated symptom checker scores, stored practitioners registries, and live medical metrics.",
      connectionSecured: "Active Connection Secured",
      bpmTitle: "Heart Beats Index",
      bpmRange: "Normal Range",
      bpTitle: "Blood Pressure Limits",
      bpRange: "Optimal BP",
      sugarTitle: "Glucose Levels (Fasting)",
      sugarRange: "Normal",
      symptomTitle: "Recent diagnostic symptom checks",
      btnCheckNew: "+ Check New",
      noSymptom: "No symptom logs found. Check parameters to generate reports.",
      btnChatNew: "+ Start New",
      noChat: "No conversational consultations logged yet.",
      chatTitle: "Resume active virtual consultations",
      stCheck: "Symptom Checks",
      stCheckD: "Triage summaries compiled",
      stClinic: "Shortlisted Clinics",
      stClinicD: "Saved emergency hospitals",
      stPhysician: "Specialists Retained",
      stPhysicianD: "Shortlisted physician registries",
      stChat: "Total Chat Sessions",
      stChatD: "Virtual clinic threads logged",
      vitalsTitle: "Metabolic vitals Tracking",
      hospitalsTitle: "Shortlisted clinics & ERs",
      doctorsTitle: "Discoverable Medical Registry",
      noHospitals: "No clinics saved since session started.",
      noDoctors: "No clinical physicians shortlisted yet.",
      deleteBtn: "Delete",
    },
    hi: {
      loadingText: "सुरक्षित फ़ायरस्टोर मेडिकल प्रोफाइल को संकलित किया जा रहा है...",
      title: "रोगी कल्याण कमान डेशबोर्ड",
      subtitle: "अपने स्वचालित लक्षण विश्लेषक स्कोर, संग्रहीत चिकित्सकों की सूचियों और लाइव स्वास्थ्य संकेतकों की समीक्षा करें।",
      connectionSecured: "सक्रिय कनेक्शन सुरक्षित है",
      bpmTitle: "हृदय गति सूचकांक",
      bpmRange: "सामान्य सीमा",
      bpTitle: "रक्तचाप सीमाएं",
      bpRange: "इष्टतम बीपी",
      sugarTitle: "ग्लूकोज स्तर (उपवास)",
      sugarRange: "सामान्य",
      symptomTitle: "हाल ही के नैदानिक लक्षण परीक्षण",
      btnCheckNew: "+ नया जाँचें",
      noSymptom: "कोई लक्षण लॉग नहीं मिला। रिपोर्ट तैयार करने के लिए मापदंडों की जांच करें।",
      btnChatNew: "+ नया सूत्र",
      noChat: "अभी तक कोई संवादात्मक परामर्श लॉग नहीं किया गया है।",
      chatTitle: "सक्रिय वर्चुअल विचार-विमर्श फिर से शुरू करें",
      stCheck: "लक्षण जाँच",
      stCheckD: "संकलित ट्राइएज मूल्यांकन",
      stClinic: "पसंदीदा क्लीनिक",
      stClinicD: "सहेजे गए आपातकालीन अस्पताल",
      stPhysician: "विशेषज्ञ चिकित्सक",
      stPhysicianD: "चुने गए चिकित्सक रजिस्ट्रियां",
      stChat: "कुल चैट सत्र",
      stChatD: "वर्चुअल स्वास्थ्य संवाद लॉग",
      vitalsTitle: "चयापचय महत्वपूर्ण पैरामीटर",
      hospitalsTitle: "पसंदीदा क्लीनिक और अस्पताल",
      doctorsTitle: "शॉर्टलिस्ट किए गए चिकित्सक",
      noHospitals: "सत्र शुरू होने के बाद से कोई क्लीनिक सहेजा नहीं गया।",
      noDoctors: "अभी तक कोई विशेषज्ञ चिकित्सक शॉर्टलिस्ट नहीं किया गया है।",
      deleteBtn: "हटाएं",
    },
    te: {
      loadingText: "భద్రపరిచిన వైద్య ఖాతాలను క్రోడీకరిస్తోంది...",
      title: "పేషెంట్ వెల్‌నెస్ కమాండ్ డ్యాష్‌బోర్డ్",
      subtitle: "ఆటోమేటిక్ లక్షణాల నిర్ధారణలు, భద్రపరిచిన వైద్యుల వివరాలు మరియు ఆరోగ్య కొలతలను సమీక్షించండి.",
      connectionSecured: "కనెక్షన్ సురక్షితంగా ఉంది",
      bpmTitle: "గుండె కొట్టుకునే వేగం",
      bpmRange: "సాధారణం",
      bpTitle: "రక్తపోటు రీడింగులు",
      bpRange: "సరైన బీపీ",
      sugarTitle: "గ్లూకోజ్ స్థాయిలు (ఉపవాసం)",
      sugarRange: "సాధారణం",
      symptomTitle: "ఇటీవలి ఆరోగ్య పరీక్షల వివరాలు",
      btnCheckNew: "+ కొత్తగా పరీక్షించండి",
      noSymptom: "లక్షణాల రికార్డులు ఏవీ లేవు. నివేదికలను సృష్టించడానికి తనిఖీ చేయండి.",
      btnChatNew: "+ కొత్త సంభాషణ",
      noChat: "సంప్రదింపుల వివరాలేవీ లేవు.",
      chatTitle: "మీ వైద్య సంప్రదింపులను పునఃప్రారంభించండి",
      stCheck: "ఆరోగ్య పరీక్షలు",
      stCheckD: "పూర్తయిన అంచనాలు",
      stClinic: "ఖరారు చేసిన ఆసుపత్రులు",
      stClinicD: "అత్యవసర ఆసుపత్రులు",
      stPhysician: "వైద్యుల రిజిస్ట్రీ",
      stPhysicianD: "షార్ట్‌లిస్ట్ చేసిన వైద్యులు",
      stChat: "మొత్తం సంప్రదింపులు",
      stChatD: "వర్చువల్ క్లినిక్ సంభాషణలు",
      vitalsTitle: "మెటబాలిక్ వైటల్స్ ట్రాకింగ్",
      hospitalsTitle: "షార్ట్‌లిస్ట్ చేసిన క్లినిక్‌లు & ఈఆర్",
      doctorsTitle: "వైద్య నిపుణుల జాబితా",
      noHospitals: "బుక్‌మార్క్ చేసిన ఆసుపత్రులేవీ లేవు.",
      noDoctors: "వైద్యులెవరినీ షార్ట్‌లిస్ట్ చేయలేదు.",
      deleteBtn: "తొలగించు",
    }
  };

  const currentLabels = labels[selectedLanguage] || labels.en;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="p-4 bg-sky-50 rounded-2xl">
          <svg className="animate-spin h-8 w-8 text-sky-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <p className="text-xs text-slate-500 font-medium">{currentLabels.loadingText}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-8 font-sans">
      {/* 1. WELCOME BOARD */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 border-none m-0">{currentLabels.title}</h2>
          <p className="text-xs text-slate-500 mt-1">{currentLabels.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-lg border border-emerald-150 flex items-center gap-1.5 uppercase">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> {currentLabels.connectionSecured}
          </span>
        </div>
      </div>

      {/* 2. STATS PILLS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: currentLabels.stCheck, count: symptomHistory.length, desc: currentLabels.stCheckD, color: "text-teal-600" },
          { label: currentLabels.stClinic, count: savedHospitals.length, desc: currentLabels.stClinicD, color: "text-green-600" },
          { label: currentLabels.stPhysician, count: savedDoctors.length, desc: currentLabels.stPhysicianD, color: "text-sky-600" },
          { label: currentLabels.stChat, count: chatHistory.length, desc: currentLabels.stChatD, color: "text-indigo-600" }
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">{item.label}</p>
              <h3 className={`text-3xl font-extrabold mt-2 font-mono ${item.color}`}>{item.count}</h3>
            </div>
            <p className="text-[10px] text-slate-500 mt-3">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* 3. METABOLIC METRIC WIDGET - THE RECHARTS DIALS SIMULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Mock medical metric trackers */}
        <div className="lg:col-span-12 xl:col-span-4 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2 uppercase tracking-wide">
            <TrendingUp className="w-5 h-5 text-sky-500" /> {currentLabels.vitalsTitle}
          </h3>

          <div className="space-y-4">
            {/* Heart rates dial */}
            <div className="p-4 bg-red-50/50 rounded-xl border border-red-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-red-700 font-bold uppercase tracking-wider">{currentLabels.bpmTitle}</p>
                <p className="text-xl font-bold font-mono text-red-950 mt-1">74 <span className="text-xs font-semibold">BPM</span></p>
              </div>
              <span className="text-xs bg-red-100 text-red-800 font-bold p-1 px-2 rounded-lg">{currentLabels.bpmRange}</span>
            </div>

            {/* Blood Pressure dials */}
            <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-teal-700 font-bold uppercase tracking-wider">{currentLabels.bpTitle}</p>
                <p className="text-xl font-bold font-mono text-teal-950 mt-1">118 / 76 <span className="text-xs font-semibold">mmHg</span></p>
              </div>
              <span className="text-xs bg-teal-100 text-teal-800 font-bold p-1 px-2 rounded-lg">{currentLabels.bpRange}</span>
            </div>

            {/* Blood sugar details */}
            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">{currentLabels.sugarTitle}</p>
                <p className="text-xl font-bold font-mono text-amber-950 mt-1">94 <span className="text-xs font-semibold">mg/dL</span></p>
              </div>
              <span className="text-xs bg-amber-100 text-amber-800 font-bold p-1 px-2 rounded-lg">{currentLabels.sugarRange}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Tabular recent lists of symptom checks and stored providers */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-6">
          
          {/* SYMPTOM CHECKS ACTIVITY TIMELINE */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between uppercase tracking-wide mb-4 animate-none select-none">
              <span>{currentLabels.symptomTitle}</span>
              <button 
                onClick={() => onNavigateToView("symptoms")}
                className="text-[10px] text-sky-600 hover:text-sky-700 font-bold border-none bg-none cursor-pointer"
              >
                {currentLabels.btnCheckNew}
              </button>
            </h3>

            {symptomHistory.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-xs">{currentLabels.noSymptom}</p>
            ) : (
              <div className="space-y-4">
                {symptomHistory.map(item => (
                  <div key={item.id} className="p-4 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-100 flex justify-between items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 truncate block max-w-sm">
                          {selectedLanguage === "hi" ? "लक्षण: " : selectedLanguage === "te" ? "లక్షణాలు: " : "Symptoms: "} {item.symptoms.slice(0, 50)}...
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          item.severity === "Severe" ? "bg-red-50 text-red-600 border-red-100" :
                          item.severity === "Moderate" ? "bg-amber-50 text-amber-600 border-amber-100" :
                          "bg-green-50 text-green-600 border-green-100"
                        }`}>{item.severity}</span>
                      </div>
                      <p className="text-[10px] text-slate-450 font-medium">
                        {selectedLanguage === "hi" ? "उम्र: " : selectedLanguage === "te" ? "వయస్సు: " : "Age: "}{item.age} • 
                        {selectedLanguage === "hi" ? " लिंग: " : selectedLanguage === "te" ? " లింగం: " : " Gender: "}{item.gender} • 
                        {selectedLanguage === "hi" ? " जाँच की तारीख: " : selectedLanguage === "te" ? " తనిఖీ తేదీ: " : " Checked on: "}{new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleDeleteSymptomCheck(item.id)}
                        className="p-1 px-2 hover:bg-red-50 text-red-650 rounded text-xs cursor-pointer border-none bg-none font-bold"
                        title="Delete triage record"
                      >
                        {currentLabels.deleteBtn}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HISTORIC CONVERSATIONS TRACKER */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-between justify-between uppercase tracking-wide mb-4 select-none">
              <span>{currentLabels.chatTitle}</span>
              <button 
                onClick={() => onNavigateToView("chat")}
                className="text-[10px] text-indigo-650 hover:text-indigo-850 font-bold border-none bg-none cursor-pointer"
              >
                {currentLabels.btnChatNew}
              </button>
            </h3>

            {chatHistory.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-xs">{currentLabels.noChat}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chatHistory.map(chat => (
                  <div 
                    key={chat.id}
                    onClick={() => onNavigateToView("chat", chat.id)}
                    className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 cursor-pointer flex items-center justify-between gap-2 transition-all hover:translate-x-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-900 truncate block max-w-[210px]">{chat.title}</span>
                        <p className="text-[9px] text-slate-450 font-medium">
                          {selectedLanguage === "hi" ? "दर्ज किया गया: " : selectedLanguage === "te" ? "నమోదైనది: " : "Logged: "}{new Date(chat.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* STORED CLINICIANS AND HOSPITALS REGISTER */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-none">
            
            {/* Stored clinics */}
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
              <h4 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3 uppercase tracking-wider">{currentLabels.hospitalsTitle}</h4>
              {savedHospitals.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">{currentLabels.noHospitals}</p>
              ) : (
                <div className="space-y-3 max-h-[220px] overflow-y-auto no-scrollbar">
                  {savedHospitals.map(h => (
                    <div key={h.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-slate-950 truncate max-w-[150px]">{h.name}</p>
                        <p className="text-[9px] text-slate-400 font-semibold">{h.address.slice(0, 25)}...</p>
                      </div>
                      <button
                        onClick={() => handleDeleteHospital(h.id)}
                        className="p-1 px-2 border border-slate-200 text-[10px] rounded hover:bg-red-50 text-red-650 cursor-pointer bg-none"
                      >
                        {currentLabels.deleteBtn}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stored physician details */}
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm animate-none">
              <h4 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3 uppercase tracking-wider">{currentLabels.doctorsTitle}</h4>
              {savedDoctors.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">{currentLabels.noDoctors}</p>
              ) : (
                <div className="space-y-3 max-h-[220px] overflow-y-auto no-scrollbar">
                  {savedDoctors.map(d => (
                    <div key={d.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-slate-950">{d.doctorName}</p>
                        <p className="text-[9px] text-slate-400 font-semibold">{d.specialization} • {d.hospitalAffiliation.slice(0, 15)}...</p>
                      </div>
                      <button
                        onClick={() => handleDeleteDoctor(d.id)}
                        className="p-1 px-2 border border-slate-200 text-[10px] rounded hover:bg-red-50 text-red-650 cursor-pointer bg-none"
                      >
                        {currentLabels.deleteBtn}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
