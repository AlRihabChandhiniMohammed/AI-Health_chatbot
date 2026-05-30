/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Activity, Sparkles, ShieldAlert, Cpu, HeartPulse, CheckSquare, 
  ArrowRight, FileText, Loader2, Calendar, ClipboardList,
  MapPin, Phone, Globe, Compass, Star, Navigation, MapIcon, User, Heart
} from "lucide-react";
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { db, auth, OperationType, handleFirestoreError } from "../firebase";
import { MedicalMarkdownRenderer } from "./ChatView";
import { CLINICAL_DOCTORS } from "./DoctorFinder";
import { SIMULATED_PLACES, generateSimulatedPlaces } from "./HospitalFinder";
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== undefined && API_KEY !== "";

// Google Maps Connector within Symptom Checker
function MapPlacesConnector({ coords, queryText, detectedCity, onResultsFound }: { coords: { lat: number, lng: number }, queryText: string, detectedCity: string, onResultsFound: (res: any[]) => void }) {
  const map = useMap();
  const placesLib = useMapsLibrary("places");

  useEffect(() => {
    if (!placesLib || !map || !coords) return;

    const refinedQuery = `${queryText} in ${detectedCity || "your area"}`;

    placesLib.Place.searchByText({
      textQuery: refinedQuery,
      fields: ["id", "displayName", "location", "formattedAddress", "rating", "nationalPhoneNumber", "websiteURI"],
      locationBias: coords,
      maxResultCount: 5,
    }).then(({ places: rawPlaces }) => {
      if (rawPlaces && rawPlaces.length > 0) {
        const formatted = rawPlaces.map((p, idx) => ({
          placeId: p.id,
          name: p.displayName || "Unknown Clinical Facility",
          rating: p.rating || 4.2,
          address: p.formattedAddress || `${detectedCity || "your area"}, India`,
          phone: p.nationalPhoneNumber || "+1 555-MAPS-INFO",
          website: (p as any).websiteURI || undefined,
          distance: Number((0.8 + idx * 0.5).toFixed(1)),
          latitude: p.location?.lat() || coords.lat,
          longitude: p.location?.lng() || coords.lng
        }));
        onResultsFound(formatted);
      } else {
        const fallback = generateSimulatedPlaces(queryText, detectedCity || "your area", coords);
        onResultsFound(fallback.slice(0, 4));
      }
    }).catch(err => {
      console.error("SymptomChecker MapPlacesConnector error: ", err);
      const fallback = generateSimulatedPlaces(queryText, detectedCity || "your area", coords);
      onResultsFound(fallback.slice(0, 4));
    });
  }, [placesLib, map, coords, queryText, detectedCity]);

  return null;
}

export default function SymptomChecker({ selectedLanguage = "en" }: { selectedLanguage?: 'en' | 'hi' | 'te' }) {
  const labels: Record<string, any> = {
    en: {
      title: "Clinical Symptom Scoping Tester",
      subtitle: "Determine likely medical criteria, triage alerts, and consultation metrics within seconds.",
      formTitle: "Patient Presentation Form",
      descSymptoms: "Describe Symptoms",
      placeholderSymptoms: "e.g. Constant throbbing headache in the frontal lobe since yesterday, accompanied by slight nausea and light sensitivity.",
      age: "Age in Years",
      gender: "Gender",
      genderSelect: "Select",
      genderMale: "Male",
      genderFemale: "Female",
      genderOther: "Other",
      duration: "Duration Timeline",
      placeholderDuration: "e.g., 3 days, 1 week, since this morning",
      severity: "Clinical Severity",
      sevMild: "Mild",
      sevModerate: "Moderate",
      sevSevere: "Severe",
      geoTriage: "Geographic Triage",
      geoDesc: "Enable coordinates discovery to recommend physical clinics and matching medical specialists.",
      submitBtn: "Analyze Symptoms",
      runningBtn: "Compiling Assessment...",
      resetBtn: "Clear Form Data",
      disclaimer: "AI responses are informational only and are not a substitute for professional medical advice.",
    },
    hi: {
      title: "क्लीनिकल लक्षण स्कोपिंग परीक्षक",
      subtitle: "सेकंड के भीतर संभावित चिकित्सा मानदंड, ट्राइएज अलर्ट और परामर्श मेट्रिक्स का निर्धारण करें।",
      formTitle: "रोगी प्रस्तुति प्रपत्र",
      descSymptoms: "लक्षणों का वर्णन करें",
      placeholderSymptoms: "जैसे- कल से ललाट में लगातार धड़कने वाला सिरदर्द, साथ में हल्की मतली और प्रकाश के प्रति संवेदनशीलता।",
      age: "वर्षों में आयु",
      gender: "लिंग",
      genderSelect: "चुनें",
      genderMale: "पुरुष",
      genderFemale: "महिला",
      genderOther: "अन्य",
      duration: "अवधि समयरेखा",
      placeholderDuration: "जैसे- 3 दिन, 1 सप्ताह, आज सुबह से",
      severity: "नैदानिक ​​​​गंभीरता",
      sevMild: "हल्का",
      sevModerate: "मध्यम",
      sevSevere: "गंभीर",
      geoTriage: "भौगोलिक ट्राइएज",
      geoDesc: "अपने स्थान के आधार पर क्लीनिकों और मिलान करने वाले चिकित्सा विशेषज्ञों की सिफारिश करने के लिए सक्षम करें।",
      submitBtn: "लक्षणों का विश्लेषण करें",
      runningBtn: "आकलन संकलित हो रहा है...",
      resetBtn: "प्रपत्र डेटा साफ़ करें",
      disclaimer: "एआई प्रतिक्रियाएं केवल सूचनात्मक हैं और पेशेवर चिकित्सा सलाह का विकल्प नहीं हैं।",
    },
    te: {
      title: "క్లినికల్ లక్షణాల నిర్ధారణ పరీక్ష",
      subtitle: "కొద్ది సెకన్లలోనే సంభావ్య వైద్య ప్రమాణాలు, అత్యవసర హెచ్చరికలు మరియు సంప్రదింపు కొలతలను నిర్ణయించండి.",
      formTitle: "రోగి నివేదిక పత్రం",
      descSymptoms: "లక్షణాలను వివరించండి",
      placeholderSymptoms: "ఉదా. నిన్నటి నుండి నిరంతరంగా తలనొప్పి, స్వల్ప వికారం మరియు కాంతికి సున్నితత్వం.",
      age: "సంవత్సరాలలో వయస్సు",
      gender: "లింగం",
      genderSelect: "ఎంచుకోండి",
      genderMale: "పురుషుడు",
      genderFemale: "స్త్రీ",
      genderOther: "ఇతర",
      duration: "సమయ వ్యవధి",
      placeholderDuration: "ఉదా. 3 రోజులు, 1 వారం, ఈ ఉదయం నుండి",
      severity: "క్లినికల్ తీవ్రత",
      sevMild: "స్వల్పం",
      sevModerate: "మధ్యమం",
      sevSevere: "తీవ్రం",
      geoTriage: "భౌగోళిక ట్రయాజ్",
      geoDesc: "మీ స్థానం ఆధారంగా క్లినిక్‌లు మరియు సరిపోలే వైద్య నిపుణులను సిఫార్సు చేయడానికి అనుమతించండి.",
      submitBtn: "లక్షణాలను విశ్లేషించండి",
      runningBtn: "అంచనాను సేకరిస్తోంది...",
      resetBtn: "ఫారమ్ ఖాళీ చేయండి",
      disclaimer: "AI ప్రతిస్పందనలు సమాచారం కోసం మాత్రమే మరియు వృత్తిపరమైన వైద్య సలహాకు ప్రత్యామ్నాయం కాదు.",
    }
  };

  const currentLabels = labels[selectedLanguage] || labels.en;

  const [symptoms, setSymptoms] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState<"Male" | "Female" | "Other" | "">("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState<"Mild" | "Moderate" | "Severe" | "">("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<string | null>(null);
  const [successSaved, setSuccessSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Geographic recommendation states
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [useLocationEnabled, setUseLocationEnabled] = useState(false);
  const [gmpSearchQuery, setGmpSearchQuery] = useState("clinic");
  const [recommendedPlaces, setRecommendedPlaces] = useState<any[]>([]);
  const [detectedCity, setDetectedCity] = useState("your area");

  // Shortlisting databases sync states
  const [savedDoctorIds, setSavedDoctorIds] = useState<Record<string, string>>({});
  const [savedHospitalIds, setSavedHospitalIds] = useState<Record<string, string>>({});

  // Background IP auto locator run on mount
  useEffect(() => {
    const autoGeolocate = async () => {
      try {
        const ipRes = await fetch("https://ipapi.co/json/");
        const ipData = await ipRes.json();
        if (ipData && ipData.latitude && ipData.longitude) {
          const ipCoords = { lat: ipData.latitude, lng: ipData.longitude };
          const ipCity = ipData.city || "your area";
          setDetectedCity(ipCity);
          setUserCoords(ipCoords);
          setUseLocationEnabled(true);
        }
      } catch (err) {
        console.warn("SymptomChecker background IP geolocate bypassed:", err);
      }
    };
    autoGeolocate();
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported on browser context");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserCoords(coords);
        setIsLocating(false);
        setUseLocationEnabled(true);

        try {
          const revRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json&accept-language=en`
          );
          const revData = await revRes.json();
          const revCity = revData.address?.city || revData.address?.town || revData.address?.suburb || revData.address?.village || "your area";
          setDetectedCity(revCity);
        } catch (err) {
          console.warn("Reverse address lookup in Checker failed:", err);
        }
      },
      (err) => {
        console.warn("Geolocation access denied or failed, falling back to Hyderabad: ", err);
        setUserCoords({ lat: 17.385, lng: 78.4867 });
        setIsLocating(false);
        setUseLocationEnabled(true);
      }
    );
  };

  const fetchSavedShortlists = async () => {
    if (!auth.currentUser) return;

    if ((auth.currentUser as any).isGuest) {
      const storedDocs = JSON.parse(localStorage.getItem("guest_savedDoctors") || "[]");
      const docMapping: Record<string, string> = {};
      storedDocs.forEach((item: any) => {
        docMapping[item.doctorId] = item.id;
      });
      setSavedDoctorIds(docMapping);

      const storedHospitals = JSON.parse(localStorage.getItem("guest_savedHospitals") || "[]");
      const hospMapping: Record<string, string> = {};
      storedHospitals.forEach((item: any) => {
        hospMapping[item.hospitalId] = item.id;
      });
      setSavedHospitalIds(hospMapping);
      return;
    }

    try {
      const qDocs = query(collection(db, "savedDoctors"), where("userId", "==", auth.currentUser.uid));
      const snapDocs = await getDocs(qDocs);
      const docMapping: Record<string, string> = {};
      snapDocs.forEach(item => {
        const data = item.data();
        docMapping[data.doctorId] = item.id;
      });
      setSavedDoctorIds(docMapping);

      const qHosp = query(collection(db, "savedHospitals"), where("userId", "==", auth.currentUser.uid));
      const snapHosp = await getDocs(qHosp);
      const hospMapping: Record<string, string> = {};
      snapHosp.forEach(item => {
        const data = item.data();
        hospMapping[data.hospitalId] = item.id;
      });
      setSavedHospitalIds(hospMapping);
    } catch (err) {
      console.error("Failed to load saved lists in Symptom Checker: ", err);
    }
  };

  useEffect(() => {
    fetchSavedShortlists();
  }, [auth.currentUser]);

  // When user position or selected category changes, update simulated recommended positions
  useEffect(() => {
    if (userCoords) {
      // If there is no map API key, use the dynamic simulator to build matching places
      if (!hasValidKey) {
        const list = generateSimulatedPlaces(gmpSearchQuery, detectedCity, userCoords);
        setRecommendedPlaces(list.slice(0, 4));
      } else {
        // Fallback or initialization before maps SDK has responded
        const basePlaces = SIMULATED_PLACES.slice(0, 4);
        const relocated = basePlaces.map((p, idx) => {
          const dynamicAddress = p.address.replace(/Hyderabad/g, detectedCity);
          return {
            ...p,
            latitude: userCoords.lat + (idx * 0.007 - 0.01),
            longitude: userCoords.lng + (idx * 0.005 - 0.008),
            address: dynamicAddress,
            distance: Number((0.4 + idx * 0.6).toFixed(1))
          };
        });
        setRecommendedPlaces(relocated);
      }
    }
  }, [userCoords, detectedCity, gmpSearchQuery]);

  const toggleSaveDoctor = async (docProfile: any) => {
    if (!auth.currentUser) return;
    const existingId = savedDoctorIds[docProfile.id];

    if ((auth.currentUser as any).isGuest) {
      const stored = JSON.parse(localStorage.getItem("guest_savedDoctors") || "[]");
      if (existingId) {
        const filtered = stored.filter((item: any) => item.id !== existingId);
        localStorage.setItem("guest_savedDoctors", JSON.stringify(filtered));
        const updated = { ...savedDoctorIds };
        delete updated[docProfile.id];
        setSavedDoctorIds(updated);
      } else {
        const saveId = "savedoc_" + Math.random().toString(36).substring(2, 11);
        stored.push({
          id: saveId,
          userId: auth.currentUser.uid,
          doctorId: docProfile.id,
          doctorName: docProfile.name,
          specialization: docProfile.specialization,
          experience: docProfile.experience,
          rating: docProfile.rating,
          hospitalAffiliation: docProfile.hospitalAffiliation,
          availability: docProfile.availability,
          consultationFee: docProfile.consultationFee,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem("guest_savedDoctors", JSON.stringify(stored));
        setSavedDoctorIds(prev => ({ ...prev, [docProfile.id]: saveId }));
      }
      return;
    }

    if (existingId) {
      try {
        await deleteDoc(doc(db, "savedDoctors", existingId));
        const updated = { ...savedDoctorIds };
        delete updated[docProfile.id];
        setSavedDoctorIds(updated);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `savedDoctors/${existingId}`);
      }
    } else {
      const saveId = "savedoc_" + Math.random().toString(36).substring(2, 11);
      try {
        await setDoc(doc(db, "savedDoctors", saveId), {
          id: saveId,
          userId: auth.currentUser.uid,
          doctorId: docProfile.id,
          doctorName: docProfile.name,
          specialization: docProfile.specialization,
          experience: docProfile.experience,
          rating: docProfile.rating,
          hospitalAffiliation: docProfile.hospitalAffiliation,
          availability: docProfile.availability,
          consultationFee: docProfile.consultationFee,
          createdAt: serverTimestamp()
        });
        setSavedDoctorIds(prev => ({ ...prev, [docProfile.id]: saveId }));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `savedDoctors/${saveId}`);
      }
    }
  };

  const toggleSaveHospital = async (place: any) => {
    if (!auth.currentUser) return;
    const existingId = savedHospitalIds[place.placeId];

    if ((auth.currentUser as any).isGuest) {
      const stored = JSON.parse(localStorage.getItem("guest_savedHospitals") || "[]");
      if (existingId) {
        const filtered = stored.filter((item: any) => item.id !== existingId);
        localStorage.setItem("guest_savedHospitals", JSON.stringify(filtered));
        const updated = { ...savedHospitalIds };
        delete updated[place.placeId];
        setSavedHospitalIds(updated);
      } else {
        const saveId = "save_" + Math.random().toString(36).substring(2, 11);
        stored.push({
          id: saveId,
          userId: auth.currentUser.uid,
          hospitalId: place.placeId,
          name: place.name,
          rating: place.rating || 4.2,
          address: place.address || "",
          phone: place.phone || "",
          website: place.website || "",
          createdAt: new Date().toISOString()
        });
        localStorage.setItem("guest_savedHospitals", JSON.stringify(stored));
        setSavedHospitalIds(prev => ({ ...prev, [place.placeId]: saveId }));
      }
      return;
    }

    if (existingId) {
      try {
        await deleteDoc(doc(db, "savedHospitals", existingId));
        const updated = { ...savedHospitalIds };
        delete updated[place.placeId];
        setSavedHospitalIds(updated);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `savedHospitals/${existingId}`);
      }
    } else {
      const saveId = "save_" + Math.random().toString(36).substring(2, 11);
      try {
        await setDoc(doc(db, "savedHospitals", saveId), {
          id: saveId,
          userId: auth.currentUser.uid,
          hospitalId: place.placeId,
          name: place.name,
          rating: place.rating || 4.2,
          address: place.address || "",
          phone: place.phone || "",
          website: place.website || "",
          createdAt: serverTimestamp()
        });
        setSavedHospitalIds(prev => ({ ...prev, [place.placeId]: saveId }));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `savedHospitals/${saveId}`);
      }
    }
  };

  const getPredictedSpecialization = (symptomString: string) => {
    const text = symptomString.toLowerCase();
    if (text.includes("heart") || text.includes("chest") || text.includes("cardio") || text.includes("palpitation") || text.includes("breathing") || text.includes("pressure")) {
      return "Cardiologist";
    }
    if (text.includes("headache") || text.includes("migraine") || text.includes("brain") || text.includes("numbness") || text.includes("seizure") || text.includes("neurology") || text.includes("nerve")) {
      return "Neurologist";
    }
    if (text.includes("skin") || text.includes("rash") || text.includes("acne") || text.includes("itch") || text.includes("dry") || text.includes("spot") || text.includes("burn") || text.includes("dermatology")) {
      return "Dermatologist";
    }
    if (text.includes("bone") || text.includes("joint") || text.includes("fracture") || text.includes("spine") || text.includes("ortho") || text.includes("knee") || text.includes("back pain") || text.includes("arthritis")) {
      return "Orthopedic";
    }
    if (text.includes("pregnant") || text.includes("pregnancy") || text.includes("gyne") || text.includes("period") || text.includes("female")) {
      return "Gynecologist";
    }
    return "General Physician";
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!symptoms || !age || !gender || !duration || !severity || !auth.currentUser) return;

    setIsLoading(true);
    setAssessmentResult(null);
    setSuccessSaved(false);
    setError(null);

    try {
      // POST payload variables to clinical server
      const response = await fetch("/api/symptom-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms,
          age: Number(age),
          gender,
          duration,
          severity,
          language: selectedLanguage
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to compile symptom telemetry due to server error.");
      }

      if (!data.results) {
        throw new Error("No triage results obtained from Gemini API");
      }

      const resultsText = data.results;
      setAssessmentResult(resultsText);

      // Save complete record
      const checkId = "check_" + Math.random().toString(36).substring(2, 11);
      
      try {
        if ((auth.currentUser as any)?.isGuest) {
          const key = "guest_symptom_checks";
          const existingChecks = JSON.parse(localStorage.getItem(key) || "[]");
          existingChecks.push({
            id: checkId,
            userId: auth.currentUser.uid,
            symptoms,
            age: Number(age),
            gender,
            duration,
            severity,
            results: resultsText,
            createdAt: new Date().toISOString()
          });
          localStorage.setItem(key, JSON.stringify(existingChecks));
        } else {
          await setDoc(doc(db, "symptomChecks", checkId), {
            id: checkId,
            userId: auth.currentUser.uid,
            symptoms,
            age: Number(age),
            gender,
            duration,
            severity,
            results: resultsText,
            createdAt: serverTimestamp()
          });
        }
        setSuccessSaved(true);
      } catch (dbErr) {
        console.error("Failed to save checked symptoms to history: ", dbErr);
        handleFirestoreError(dbErr, OperationType.WRITE, "symptomChecks");
      }
    } catch (err: any) {
      console.error("Clinical symptoms scoping failed: ", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSymptoms("");
    setAge("");
    setGender("");
    setDuration("");
    setSeverity("");
    setAssessmentResult(null);
    setSuccessSaved(false);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 hover:no-underline">
      {/* 1. SECTION INTRO */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl shadow-sm border border-teal-100">
          <Activity className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-sans tracking-tight text-slate-900 border-none">{currentLabels.title}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{currentLabels.subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 2. FORM CONFIGURATION - LEFT SIDE */}
        <div className="lg:col-span-12 xl:col-span-5 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-950 mb-5 flex items-center gap-2 pb-3 border-b border-slate-100">
            <ClipboardList className="w-4 h-4 text-emerald-500" /> {currentLabels.formTitle}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Symptoms Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">{currentLabels.descSymptoms}</label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                required
                rows={3}
                placeholder={currentLabels.placeholderSymptoms}
                className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-sky-500 outline-none transition-colors shadow-inner"
              />
            </div>

            {/* Age & Gender Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">{currentLabels.age}</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                  required
                  min={1}
                  max={120}
                  placeholder="34"
                  className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-sky-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">{currentLabels.gender}</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  required
                  className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-sky-500 outline-none bg-white transition-colors"
                >
                  <option value="">{currentLabels.genderSelect}</option>
                  <option value="Male">{currentLabels.genderMale}</option>
                  <option value="Female">{currentLabels.genderFemale}</option>
                  <option value="Other">{currentLabels.genderOther}</option>
                </select>
              </div>
            </div>

            {/* Duration Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">{currentLabels.duration}</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                  placeholder={currentLabels.placeholderDuration}
                  className="w-full pl-10 pr-3.5 py-3 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-sky-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Severity Radio */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 text-left">{currentLabels.severity}</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(["Mild", "Moderate", "Severe"] as const).map((sev) => {
                  const colors = {
                    Mild: "peer-checked:bg-green-50 peer-checked:border-green-300 peer-checked:text-green-800 hover:bg-green-50/30",
                    Moderate: "peer-checked:bg-amber-50 peer-checked:border-amber-300 peer-checked:text-amber-800 hover:bg-amber-50/30",
                    Severe: "peer-checked:bg-red-50 peer-checked:border-red-300 peer-checked:text-red-800 hover:bg-red-50/30"
                  };
                  return (
                    <label key={sev} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="severity"
                        value={sev}
                        checked={severity === sev}
                        onChange={() => setSeverity(sev)}
                        required
                        className="sr-only peer"
                      />
                      <div className={`py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium text-center transition-all bg-white text-slate-600 ${colors[sev]}`}>
                        {sev === "Mild" ? currentLabels.sevMild : sev === "Moderate" ? currentLabels.sevModerate : currentLabels.sevSevere}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Geographic Triage locator */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{currentLabels.geoTriage}</span>
                <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-805 text-[9px] font-extrabold">LOCAL REFERRALS</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                {currentLabels.geoDesc}
              </p>
              {userCoords ? (
                <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-teal-200">
                  <span className="font-mono text-slate-700 flex items-center gap-1.5 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 animate-pulse" /> {userCoords.lat.toFixed(4)}° N, {userCoords.lng.toFixed(4)}° E
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setUserCoords(null);
                      setUseLocationEnabled(false);
                    }}
                    className="text-[10px] text-red-650 hover:text-red-500 font-bold cursor-pointer border-none bg-none"
                  >
                    Disconnect GPS
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={isLocating}
                  className="w-full py-2.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Compass className={`w-3.5 h-3.5 text-teal-650 ${isLocating ? "animate-spin" : ""}`} />
                  {isLocating ? "Detecting Satellite Coordinates..." : "Use My Current Geolocation"}
                </button>
              )}
            </div>

            {/* Submit / Load */}
            <div className="pt-3">
              {isLoading ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 rounded-xl bg-slate-100 text-slate-500 font-semibold border-none flex items-center justify-center gap-2 text-sm"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600" /> {currentLabels.runningBtn}
                </button>
              ) : (
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-500 transition-colors shadow-lg shadow-teal-500/10 text-sm cursor-pointer"
                >
                  {currentLabels.submitBtn} <ArrowRight className="w-4 h-4 inline ml-1.5" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* 3. REPORT ASSESSMENT RESULTS - RIGHT SIDE */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-6">
          {error && (
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-left space-y-3 shadow-sm">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h4 className="font-bold text-amber-950 text-sm border-none mb-0.5">Clinical Evaluation Temporary Interruption</h4>
                  <p className="mt-1 text-xs text-amber-900 leading-relaxed">
                    {error.includes("503") || error.includes("UNAVAILABLE") || error.includes("demand")
                      ? "The clinical diagnostic AI model is currently receiving an extremely high volume of outpatient requests. High demand is usually temporary."
                      : error}
                  </p>
                </div>
              </div>
              
              <div className="bg-amber-100/40 p-3.5 rounded-xl border border-amber-200/50 text-[11px] text-amber-950 leading-normal space-y-1">
                <span className="font-bold text-amber-950 uppercase tracking-widest text-[9px] block mb-1">Recommended Interventions:</span>
                <p>• Wait 5-10 seconds and click <strong className="font-semibold text-slate-800">Retry Analysis</strong> to invoke the model safely.</p>
                <p>• If your symptoms are distressing or represent an immediate danger, please refer to the emergency warning guidelines below or seek physical help immediately.</p>
              </div>

              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="flex-1 py-2.5 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs transition-colors shadow-sm cursor-pointer text-center"
                >
                  Retry Analysis
                </button>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-205 text-slate-705 rounded-xl font-semibold text-xs transition-colors cursor-pointer text-center"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {!assessmentResult && !isLoading && !error && (
            <div className="border border-dashed border-slate-300 bg-slate-50 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[360px] space-y-4">
              <div className="p-4 bg-teal-50 text-teal-600 rounded-full">
                <Cpu className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-md font-bold text-slate-900 mb-1">
                  {selectedLanguage === "hi" ? "टेलीमेट्री इनपुट की प्रतीक्षा है" : selectedLanguage === "te" ? "టెలిమెట్రీ ఇన్‌పుట్ కోసం వేచి ఉంది" : "Awaiting Telemetry Input"}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  {selectedLanguage === "hi" 
                    ? "हमारे मूल्यांकन मॉडल को सक्रिय करने के लिए बाईं ओर लक्षण पैरामीटर और आयु विवरण भरें।" 
                    : selectedLanguage === "te" 
                      ? "ఆరోగ్య నివేదికను రూపొందించడానికి ఎడమ వైపున ఉన్న ఫారమ్‌ను పూరించండి." 
                      : "Fill in the symptom parameters and age factors on the left to activate our triage diagnostic evaluator model."}
                </p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[360px] space-y-6">
              <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
              <div>
                <h4 className="text-md font-bold text-slate-950 mb-1">
                  {selectedLanguage === "hi" ? "जेमिनी एआई लक्षणों का विश्लेषण कर रहा है" : selectedLanguage === "te" ? "జెమిని మీ వివరాలను విశ్లేషిస్తోంది" : "Gemini AI is analyzing clinical variables"}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed animate-pulse">
                  {selectedLanguage === "hi" 
                    ? "मिलान नैदानिक श्रेणियों का परीक्षण, आत्मविश्वास की गणना और उपचार मार्गदर्शन तैयार करना।" 
                    : selectedLanguage === "te" 
                      ? "క్లినికల్ విభాగాలు మరియు గృహ చికిత్సా పద్ధతులను లెక్కిస్తోంది..." 
                      : "Mapping matching clinical categories, calculating confidence weightings, and creating home care guides."}
                </p>
              </div>
            </div>
          )}

          {assessmentResult && (
            <>
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
                {/* Report Header badge */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-5 h-5 text-teal-600" />
                    <span className="text-xs font-bold text-slate-900 tracking-wide font-sans capitalize">Generated triage report</span>
                  </div>
                  {successSaved && (
                    <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-semibold flex items-center gap-1.5 flex-row">
                      <CheckSquare className="w-3.5 h-3.5" /> Saved to Health History
                    </span>
                  )}
                </div>

                {/* Assessment text rendered elegantly */}
                <div className="prose max-w-none text-slate-800">
                  <MedicalMarkdownRenderer text={assessmentResult} />
                </div>

                {/* Report footprint Reset Actions */}
                <div className="pt-4 border-t border-slate-150 flex justify-end">
                  <button
                    onClick={handleReset}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Run New Assessment
                  </button>
                </div>
              </div>

              {/* Nearest physical clinics and specialists module based on coordinates */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-teal-600 animate-pulse" />
                      <h3 className="text-md font-bold text-slate-900 border-none m-0">Recommended Near Your Location</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Based on predicted specialization: <strong className="text-teal-700">{getPredictedSpecialization(symptoms)}</strong></p>
                  </div>
                  <div className="bg-slate-100 p-1 rounded-xl flex items-center self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setGmpSearchQuery("clinic")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-none transition-colors ${gmpSearchQuery === "clinic" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                    >
                      Clinics
                    </button>
                    <button
                      type="button"
                      onClick={() => setGmpSearchQuery("pharmacy")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-none transition-colors ${gmpSearchQuery === "pharmacy" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                    >
                      Pharmacies
                    </button>
                  </div>
                </div>

                {!userCoords && (
                  <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl text-xs text-amber-805 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <p className="font-medium">
                      GPS coordinates are currently disconnected. Showing standard regional recommendations. Click below to retrieve nearest locations.
                    </p>
                    <button
                      type="button"
                      onClick={detectLocation}
                      className="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-500 font-bold transition-colors text-[11px] shrink-0 cursor-pointer border-none"
                    >
                      Retrieve Geolocation
                    </button>
                  </div>
                )}

                {/* Split list and maps canvas */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Doctors and Clinics Lists column */}
                  <div className="lg:col-span-6 space-y-5 max-h-[460px] overflow-y-auto pr-2">
                    {/* Matching active specialists */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Matching Medical Specialist</h4>
                      {CLINICAL_DOCTORS.filter(doc => doc.specialization.toLowerCase() === getPredictedSpecialization(symptoms).toLowerCase()).map(docProfile => {
                        const isSaved = !!savedDoctorIds[docProfile.id];
                        return (
                          <div key={docProfile.id} className="p-4 bg-teal-50/20 border border-teal-100 rounded-xl relative hover:shadow-sm transition-all">
                            <div className="flex gap-3">
                              <div className="w-10 h-10 bg-teal-100/30 text-teal-650 rounded-xl flex items-center justify-center shrink-0">
                                <User className="w-5 h-5" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h5 className="font-bold text-slate-900 text-sm">{docProfile.name}</h5>
                                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 text-[8px] font-extrabold rounded border border-emerald-100 flex items-center gap-1">
                                    CERTIFIED
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium">{docProfile.specialization} • {docProfile.experience} Yrs Exp</p>
                                <p className="text-[11px] text-slate-500">{docProfile.hospitalAffiliation}</p>
                                <p className="text-[10px] text-teal-600 font-bold">Available: {docProfile.availability}</p>
                              </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                              <div>
                                <span className="text-[9px] text-slate-400 font-mono block">EST CONSULT FEE</span>
                                <span className="text-sm font-extrabold text-slate-900 font-mono">₹{docProfile.consultationFee}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleSaveDoctor(docProfile)}
                                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${isSaved ? "bg-red-50 text-red-600 border-red-100" : "bg-white hover:bg-slate-50 border-slate-200 text-slate-400"}`}
                                  title={isSaved ? "Remove from shortlist" : "Add to shortlists"}
                                >
                                  <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-red-500 text-red-500" : ""}`} />
                                </button>
                                <a
                                  href={`tel:${18005550100}`}
                                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl flex items-center transition-colors shadow-lg shadow-teal-505/10"
                                >
                                  Book Session
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Proximity hospitals pharmacies */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Closest Care Facilities ({gmpSearchQuery}s)</h4>
                      {(recommendedPlaces.length > 0 ? recommendedPlaces : SIMULATED_PLACES).slice(0, 4).map(place => {
                        const isSaved = !!savedHospitalIds[place.placeId];
                        return (
                          <div key={place.placeId} className="p-3.5 bg-white border border-slate-100 rounded-xl space-y-2 relative hover:shadow-sm transition-all">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h5 className="font-bold text-slate-900 text-sm leading-tight">{place.name}</h5>
                                <div className="flex items-center gap-2 text-[10px] text-slate-550 font-mono mt-0.5">
                                  <span>{place.distance} km away</span>
                                  <span>•</span>
                                  {place.rating && (
                                    <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {place.rating}
                                    </span>
                                  )}
                                  <span>•</span>
                                  <span className={`font-semibold uppercase ${place.openNow ? "text-green-650" : "text-amber-605"}`}>
                                    {place.openNow ? "OPEN" : "CLOSED"}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleSaveHospital(place)}
                                className={`p-2 rounded-lg border transition-colors cursor-pointer ${isSaved ? "bg-red-50 border-red-100 text-red-600" : "bg-white border-slate-200 text-slate-400"}`}
                              >
                                <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-red-500" : ""}`} />
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-normal">{place.address}</p>
                            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                              {place.phone ? (
                                <a href={`tel:${place.phone}`} className="font-bold text-slate-650 flex items-center gap-1 hover:text-sky-600">
                                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {place.phone}
                                </a>
                              ) : <span />}
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-slate-605 hover:text-sky-600 font-bold"
                              >
                                <Navigation className="w-3.5 h-3.5 text-sky-500" /> Navigate
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Google Map Panel Frame */}
                  <div className="lg:col-span-6 h-[460px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative shadow-sm">
                    {/* Render live map or coordinate simulator */}
                    {!hasValidKey ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-6 relative">
                        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-35" />
                        <div className="text-center z-10 space-y-4">
                          <div className="p-3 bg-slate-800 rounded-2xl text-amber-500 inline-block">
                            <MapIcon className="w-6 h-6 animate-bounce" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white mb-1">Simulated Care Placement GPS</h4>
                            <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-normal">
                              Local telemetry center set: <strong>{(userCoords || { lat: 17.385, lng: 78.4867 }).lat.toFixed(4)}° N, {(userCoords || { lat: 17.385, lng: 78.4867 }).lng.toFixed(4)}° E</strong>. Map vectors updated correctly.
                            </p>
                          </div>
                          <div className="bg-slate-850 p-3 rounded-xl border border-slate-700 text-left text-[10px] space-y-1">
                            <span className="font-extrabold text-white text-[9px] uppercase tracking-wider block mb-1">Local plotted markers:</span>
                            {(recommendedPlaces.length > 0 ? recommendedPlaces : SIMULATED_PLACES).slice(0, 3).map(p => (
                              <div key={p.placeId} className="flex justify-between text-slate-350">
                                <span className="truncate max-w-[160px] font-medium text-white">{p.name}</span>
                                <span className="font-mono text-[9px]">{p.distance} km</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <APIProvider apiKey={API_KEY} version="weekly">
                        <Map
                          center={userCoords || { lat: 17.385, lng: 78.4867 }}
                          zoom={13}
                          mapId="SYMPTOM_MAP_EMBED"
                          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                          style={{ width: "100%", height: "100%" }}
                        >
                          {/* Current Position Marker */}
                          <AdvancedMarker position={userCoords || { lat: 17.385, lng: 78.4867 }}>
                            <Pin background="#0ea5e9" glyphColor="#fff" />
                          </AdvancedMarker>

                          {/* Hospital Markers */}
                          {(recommendedPlaces.length > 0 ? recommendedPlaces : SIMULATED_PLACES).slice(0, 4).map(p => (
                            <AdvancedMarker
                              key={p.placeId}
                              position={{ lat: p.latitude, lng: p.longitude }}
                            >
                              <Pin background="#ef4444" glyphColor="#fff" />
                            </AdvancedMarker>
                          ))}

                          {userCoords && (
                            <MapPlacesConnector
                              coords={userCoords}
                              queryText={gmpSearchQuery}
                              detectedCity={detectedCity}
                              onResultsFound={(res) => setRecommendedPlaces(res)}
                            />
                          )}
                        </Map>
                      </APIProvider>
                    )}

                    <div className="absolute top-3 left-3 p-2 bg-white/95 backdrop-blur-sm shadow border border-slate-155 rounded-lg text-[9px] font-mono font-bold text-slate-800">
                      GPS: {(userCoords || { lat: 17.385, lng: 78.4867 }).lat.toFixed(4)}° N, {(userCoords || { lat: 17.385, lng: 78.4867 }).lng.toFixed(4)}° E
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Quick clinical warning node */}
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-800 flex gap-3 leading-relaxed">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="font-medium">
              <strong>CRITICAL WARNING TRIAGE NOTIFICATION:</strong> Clinical diagnostic screening evaluations compiled by Gemini represent simulated possibilities and confidence margins only. Seek emergency care immediately at a local trauma hospital if experiencing sharp breathing limits, radiating left shoulder chest pain, or fainting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
