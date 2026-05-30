/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  Heart, Star, Clock, HeartPulse, ShieldCheck, Phone, Filter, 
  MapPin, CheckCircle2, User, HelpCircle, Loader2 
} from "lucide-react";
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { db, auth, OperationType, handleFirestoreError } from "../firebase";
import { DoctorProfile } from "../types";

export const CLINICAL_DOCTORS: DoctorProfile[] = [
  {
    id: "doc_ananya",
    name: "Dr. Ananya Rao",
    specialization: "Cardiologist",
    experience: 16,
    rating: 4.9,
    hospitalAffiliation: "Apollo Multispeciality Hospitals",
    availability: "Mon, Wed, Fri (10:00 AM - 02:00 PM)",
    consultationFee: 800
  },
  {
    id: "doc_vikram",
    name: "Dr. Vikram Dev",
    specialization: "Neurologist",
    experience: 14,
    rating: 4.8,
    hospitalAffiliation: "Yashoda Clinic Complex",
    availability: "Tue, Thu, Sat (11:00 AM - 04:00 PM)",
    consultationFee: 1200
  },
  {
    id: "doc_sneha",
    name: "Dr. Sneha Reddy",
    specialization: "Dermatologist",
    experience: 9,
    rating: 4.7,
    hospitalAffiliation: "Care Skin Clinics",
    availability: "Mon, Tue, Thu (04:00 PM - 07:00 PM)",
    consultationFee: 650
  },
  {
    id: "doc_rohan",
    name: "Dr. Rohan Mehta",
    specialization: "Orthopedic",
    experience: 18,
    rating: 4.9,
    hospitalAffiliation: "Star Trauma & Bone Centers",
    availability: "Wed, Fri (09:00 AM - 01:00 PM)",
    consultationFee: 1000
  },
  {
    id: "doc_farhan",
    name: "Dr. Farhan Ali",
    specialization: "General Physician",
    experience: 11,
    rating: 4.6,
    hospitalAffiliation: "City Wellness Laboratories",
    availability: "Daily (08:00 AM - 12:00 PM)",
    consultationFee: 400
  },
  {
    id: "doc_kavitha",
    name: "Dr. Kavitha J.",
    specialization: "Gynecologist",
    experience: 15,
    rating: 4.8,
    hospitalAffiliation: "Yashoda Clinic Complex",
    availability: "Mon, Wed, Thu (02:00 PM - 06:00 PM)",
    consultationFee: 850
  }
];

export default function DoctorFinder() {
  const [selectedSpec, setSelectedSpec] = useState("");
  const [maxFee, setMaxFee] = useState<number>(1500);
  const [minExp, setMinExp] = useState<number>(0);
  const [savedIds, setSavedIds] = useState<Record<string, string>>({}); // Maps doctorId to saved doc ID in Firestore
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Fetch user's saved doctors from Firestore
  useEffect(() => {
    const fetchSavedDoctors = async () => {
      if (!auth.currentUser) return;
      setIsSyncing(true);

      if ((auth.currentUser as any).isGuest) {
        const stored = JSON.parse(localStorage.getItem("guest_savedDoctors") || "[]");
        const mapping: Record<string, string> = {};
        stored.forEach((item: any) => {
          mapping[item.doctorId] = item.id;
        });
        setSavedIds(mapping);
        setIsSyncing(false);
        return;
      }

      try {
        const q = query(collection(db, "savedDoctors"), where("userId", "==", auth.currentUser.uid));
        const snap = await getDocs(q);
        const mapping: Record<string, string> = {};
        snap.forEach(doc => {
          const data = doc.data();
          mapping[data.doctorId] = doc.id;
        });
        setSavedIds(mapping);
      } catch (err) {
        console.error("Failed to load saved doctors shortlist: ", err);
      } finally {
        setIsSyncing(false);
      }
    };
    fetchSavedDoctors();
  }, []);

  // 2. Shortlist/save doctor event handler
  const toggleSaveDoctor = async (docProfile: DoctorProfile) => {
    if (!auth.currentUser) return;
    const existingId = savedIds[docProfile.id];

    if ((auth.currentUser as any).isGuest) {
      const stored = JSON.parse(localStorage.getItem("guest_savedDoctors") || "[]");
      if (existingId) {
        const filtered = stored.filter((item: any) => item.id !== existingId);
        localStorage.setItem("guest_savedDoctors", JSON.stringify(filtered));
        const updated = { ...savedIds };
        delete updated[docProfile.id];
        setSavedIds(updated);
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
        setSavedIds(prev => ({ ...prev, [docProfile.id]: saveId }));
      }
      return;
    }

    if (existingId) {
      // Remove from Firestore
      try {
        await deleteDoc(doc(db, "savedDoctors", existingId));
        const updated = { ...savedIds };
        delete updated[docProfile.id];
        setSavedIds(updated);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `savedDoctors/${existingId}`);
      }
    } else {
      // Add to Firestore
      const saveId = "savedoc_" + Math.random().toString(36).substring(2, 11);
      const savePath = `savedDoctors/${saveId}`;
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
        setSavedIds(prev => ({ ...prev, [docProfile.id]: saveId }));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, savePath);
      }
    }
  };

  // Filter clinical listing
  const filteredDoctors = CLINICAL_DOCTORS.filter((d) => {
    const specMatch = !selectedSpec || d.specialization.toLowerCase() === selectedSpec.toLowerCase();
    const feeMatch = d.consultationFee <= maxFee;
    const expMatch = d.experience >= minExp;
    return specMatch && feeMatch && expMatch;
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-6">
      {/* 1. HERO DESCRIPTION */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100 shadow-sm">
          <HeartPulse className="w-6 h-6 shrink-0 animate-bounce" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-910 m-0 border-none">Doctor & Specialist Discovery</h2>
          <p className="text-sm text-slate-500 mt-0.5">Filter based on clinical specialization, ratings index, experience, and fee tiers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 2. FILTER COLUMN PANEL */}
        <div className="lg:col-span-12 xl:col-span-4 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2 pb-3 border-b border-slate-100 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-sky-500" /> Refine Registry Search
          </h3>

          <div className="space-y-6">
            {/* Specialization selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Specialization</label>
              <select
                value={selectedSpec}
                onChange={(e) => setSelectedSpec(e.target.value)}
                className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-sky-500 outline-none bg-white transition-colors"
              >
                <option value="">All Specializations</option>
                <option value="Cardiologist">Cardiologist</option>
                <option value="Neurologist">Neurologist</option>
                <option value="Dermatologist">Dermatologist</option>
                <option value="Orthopedic">Orthopedic Surgeon</option>
                <option value="General Physician">General Physician</option>
                <option value="Gynecologist">Gynecologist</option>
              </select>
            </div>

            {/* Price Fee range */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-705 uppercase tracking-wider mb-2">
                <span>Max Consultation Fee</span>
                <span className="font-mono text-sky-600 font-bold">₹{maxFee}</span>
              </div>
              <input
                type="range"
                min={200}
                max={1500}
                step={50}
                value={maxFee}
                onChange={(e) => setMaxFee(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold font-mono mt-1">
                <span>₹200</span>
                <span>₹1500</span>
              </div>
            </div>

            {/* Experience range */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-705 uppercase tracking-wider mb-2">
                <span>Min Experience (Years)</span>
                <span className="font-mono text-teal-600 font-bold">{minExp}+ yr</span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={minExp}
                onChange={(e) => setMinExp(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold font-mono mt-1">
                <span>0 yr</span>
                <span>20 yr</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. CLINICAL REGISTRY LISTS */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-4">
          {isSyncing && (
            <div className="text-center py-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-sky-500" /> Syncing credentials with database registries...
            </div>
          )}

          {filteredDoctors.length === 0 ? (
            <div className="p-12 border border-dashed border-slate-300 rounded-2xl text-center bg-slate-50 text-slate-500 text-xs">
              <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              No clinical specialists match your specific filter metrics. Try sliding criteria sliders.
            </div>
          ) : (
            filteredDoctors.map((doc) => {
              const isSaved = !!savedIds[doc.id];

              return (
                <div
                  key={doc.id}
                  className="bg-white border border-slate-100 hover:border-slate-200 p-5 rounded-2xl shadow-sm transition-all hover:shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative"
                >
                  <div className="flex gap-4">
                    {/* Fake avatar generator */}
                    <div className="w-12 h-12 bg-sky-50 rounded-2xl border border-sky-150 text-sky-600 shrink-0 flex items-center justify-center relative">
                      <User className="w-6 h-6" />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-md font-bold text-slate-900 leading-snug">{doc.name}</h4>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-110 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> CERTIFIED
                        </span>
                      </div>

                      <p className="text-xs text-slate-550 font-semibold mt-0.5">{doc.specialization} • {doc.experience} Years Experience</p>
                      
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{doc.hospitalAffiliation}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-450 mt-1.5 font-sans leading-relaxed">
                        <Clock className="w-3.5 h-3.5 text-slate-350" />
                        <span className="font-semibold text-slate-500">Hours: {doc.availability}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions column panel */}
                  <div className="w-full md:w-auto shrink-0 pt-4 md:pt-0 border-t md:border-none border-slate-50 flex items-center justify-between md:flex-col md:items-end gap-3">
                    <div className="text-left md:text-right">
                      <p className="text-[10px] text-slate-400 font-bold tracking-wider font-mono">EST CONSULT FEE</p>
                      <p className="text-lg font-extrabold text-slate-900 font-mono">₹{doc.consultationFee}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Shortlist heart button */}
                      <button
                        onClick={() => toggleSaveDoctor(doc)}
                        className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${isSaved ? "bg-red-50 text-red-600 border-red-100" : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-400"}`}
                        title={isSaved ? "Remove from shortlisted roster" : "Add to shortlists"}
                      >
                        <Heart className={`w-4 h-4 ${isSaved ? "fill-red-500 text-red-500" : ""}`} />
                      </button>

                      <a
                        href={`tel:${18005550000 + filteredDoctors.indexOf(doc)}`}
                        className="p-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-sky-500/10"
                      >
                        <Phone className="w-3.5 h-3.5" /> Book Consultation
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
