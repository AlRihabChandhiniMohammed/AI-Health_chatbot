/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  onAuthStateChanged, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, updateProfile,
  GoogleAuthProvider, signInWithPopup
} from "firebase/auth";
import { 
  HeartPulse, ShieldCheck, Mail, Lock, User, Loader2, Sparkles, AlertCircle 
} from "lucide-react";
import { auth, realAuth, isFirebaseReady } from "./firebase";
import Layout from "./components/Layout";
import LandingView from "./components/LandingView";
import DashboardOverview from "./components/DashboardOverview";
import ChatView from "./components/ChatView";
import SymptomChecker from "./components/SymptomChecker";
import DoctorFinder from "./components/DoctorFinder";
import HospitalFinder from "./components/HospitalFinder";
import KnowledgeBase from "./components/KnowledgeBase";
import EmergencyView from "./components/EmergencyView";
import ProfileSettings from "./components/ProfileSettings";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Authentication states
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Global Navigation states
  const [activeView, setActiveView] = useState("landing");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'te'>("en");

  // 1. Listen for secure Firebase Auth context handshake
  useEffect(() => {
    // Check if there was an active guest session
    const storedGuest = localStorage.getItem("health_locker_guest_user");
    if (storedGuest) {
      try {
        const parsedGuest = JSON.parse(storedGuest);
        // Store guest user globally so auth proxy returns it
        (globalThis as any).__guestUser = parsedGuest;
        setUser(parsedGuest);
        setAuthLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem("health_locker_guest_user");
      }
    }

    // If Firebase auth is not available, skip auth listener
    if (!isFirebaseReady) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(realAuth!, (currentUser) => {
      if (!localStorage.getItem("health_locker_guest_user")) {
        setUser(currentUser);
        setAuthLoading(false);
        if (currentUser) {
          setAuthError("");
        } else {
          // Return to landing on sign out
          setActiveView("landing");
          setActiveSessionId(null);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGuestSignIn = (guestName?: string, guestEmail?: string) => {
    const guestUser = {
      uid: "guest_local_user",
      displayName: guestName || "Guest Patient",
      email: guestEmail || "guest@example.com",
      isAnonymous: true,
      emailVerified: true,
      photoURL: "",
      isGuest: true
    };
    
    // Persist this guest user details in localStorage
    localStorage.setItem("health_locker_guest_user", JSON.stringify(guestUser));

    // Store guest user globally so auth proxy returns it
    (globalThis as any).__guestUser = guestUser;

    setUser(guestUser);
    setAuthError("");
    setAuthLoading(false);
  };

  // 2. Auth handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSubmitting(true);

    if (!isFirebaseReady) {
      setAuthError("Firebase is not configured. Please use Guest mode.");
      setAuthSubmitting(false);
      return;
    }

    if (!email || !password) {
      setAuthError("Please fill in email and password credentials");
      setAuthSubmitting(false);
      return;
    }

    if (isSignUp && password.length < 6) {
      setAuthError("Password must be at least 6 characters in length");
      setAuthSubmitting(false);
      return;
    }

    try {
      if (isSignUp) {
        const credentials = await createUserWithEmailAndPassword(realAuth!, email, password);
        if (name) {
          await updateProfile(credentials.user, { displayName: name });
        }
      } else {
        await signInWithEmailAndPassword(realAuth!, email, password);
      }
    } catch (err: any) {
      console.error("Firebase authentication error: ", err);
      if (err.code === "auth/email-already-in-use") {
        setAuthError("Email is already registered. Try logging in.");
      } else if (err.code === "auth/invalid-credential") {
        setAuthError("Invalid email or password parameters.");
      } else if (err.code === "auth/weak-password") {
        setAuthError("Selected password is too weak.");
      } else if (err.code === "auth/operation-not-allowed") {
        setAuthError(
          "operation-not-allowed:email: Email & Password registration is not enabled in this Firebase project."
        );
      } else {
        setAuthError(err.message || "An authentication error occurred.");
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError("");
    setAuthSubmitting(true);
    try {
      if (!isFirebaseReady) {
        setAuthError("Firebase is not configured. Please use Guest mode.");
        setAuthSubmitting(false);
        return;
      }
      const provider = new GoogleAuthProvider();
      await signInWithPopup(realAuth!, provider);
    } catch (err: any) {
      console.error("Firebase Google Auth error: ", err);
      if (err.code === "auth/operation-not-allowed") {
        setAuthError(
          "operation-not-allowed:google: Google Sign-In is not enabled on this Firebase project."
        );
      } else if (err.code === "auth/popup-closed-by-user") {
        setAuthError("Google sign-in popup was closed before completion.");
      } else {
        setAuthError(err.message || "An error occurred during Google Sign-In.");
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Helper to handle navigation directly from dashboard clicks
  const handleNavigateFromDash = (view: string, sessionId?: string | null) => {
    setActiveView(view);
    if (view === "chat" && sessionId) {
      setActiveSessionId(sessionId);
    } else if (view === "chat" && !sessionId) {
      setActiveSessionId(null); // Fresh chat thread
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center space-y-4">
        <svg className="animate-spin h-10 w-10 text-sky-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-xs text-slate-500 font-medium">Validating clinical credential keys...</p>
      </div>
    );
  }

  // 3. Render Authentication Screen if user session is absent
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        
        {/* Background ambient medical decor */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-200/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl -z-10" />

        <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 shadow-xl text-center space-y-6">
          
          {/* Logo Badge */}
          <div className="flex flex-col items-center space-y-2">
            <div className="p-3 bg-sky-600 text-white rounded-2xl shadow-lg shadow-sky-500/20 inline-block animate-pulse">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight font-sans">AI Health Assistant</h1>
              <p className="text-[10px] text-sky-600 font-mono font-black tracking-widest uppercase">Secure Portal Access</p>
            </div>
          </div>

          <div className="pb-2">
            <h2 className="text-md font-bold text-slate-800">
              {isSignUp ? "Create Patient Health Locker" : "Sign In to Your Roster"}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isSignUp 
                ? "Register a secure credential to track clinical symptom histories and save doctors shortlists." 
                : "Sign in with your email credentials to access consultation disclaimers."}
            </p>
          </div>

          {authError && (
            authError.startsWith("operation-not-allowed:") ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 text-left space-y-3 shadow-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5 animate-pulse" />
                  <div>
                    <h3 className="font-bold text-amber-950 text-sm">Firebase Method Disabled</h3>
                    <p className="mt-1 text-xs text-amber-850 leading-relaxed">
                      {authError.includes(":email") 
                        ? "Email & Password registration/auth is not enabled on this Firebase project yet." 
                        : "Google Sign-In is not enabled on this Firebase project yet."}
                    </p>
                  </div>
                </div>
                
                <div className="bg-amber-100/40 p-3 rounded-xl border border-amber-200/50 space-y-2">
                  <p className="font-bold text-slate-800 text-[10px] uppercase tracking-wide">How to resolve in 30 seconds:</p>
                  <ol className="list-decimal pl-4 space-y-1 text-amber-950/90 text-xs">
                    <li>Open your <a href="https://console.firebase.google.com/u/0/project/health-chatbot-97bae/authentication" target="_blank" rel="noopener noreferrer" className="underline font-bold text-sky-700 hover:text-sky-600 inline-flex items-center gap-0.5">Firebase Console <svg className="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></a></li>
                    <li>Go to <strong className="font-semibold text-slate-800">Authentication</strong> → <strong className="font-semibold text-slate-800">Sign-in method</strong></li>
                    <li>Click <strong className="font-semibold text-slate-800">Add new provider</strong>, select <strong className="font-semibold text-slate-800">{authError.includes(":email") ? "Email/Password" : "Google"}</strong> and toggle <strong className="font-semibold text-slate-800">Enable</strong>!</li>
                  </ol>
                </div>

                <div className="pt-1 flex flex-col sm:flex-row gap-2">
                  <a
                    href="https://console.firebase.google.com/u/0/project/health-chatbot-97bae/authentication"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-2.5 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    Open Firebase Console
                  </a>
                  <button
                    type="button"
                    onClick={() => handleGuestSignIn(name, email)}
                    className="flex-1 py-2.5 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Bypass as Guest (Offline)
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-800 text-left flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <p className="leading-relaxed font-semibold whitespace-pre-wrap">{authError}</p>
              </div>
            )
          )}

          {/* Login / Registration form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-10 pr-3.5 py-3 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-sky-500 outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-10 pr-3.5 py-3 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-sky-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                  required
                  className="w-full pl-10 pr-3.5 py-3 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-sky-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              {authSubmitting ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 rounded-xl bg-slate-100 text-slate-400 border-none flex items-center justify-center gap-2 text-sm font-semibold"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-sky-600" /> Connecting to Firestore dispatches...
                </button>
              ) : (
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-500 transition-colors shadow-lg shadow-sky-500/20 text-sm cursor-pointer"
                >
                  {isSignUp ? "Register Account" : "Access Platform"}
                </button>
              )}
            </div>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2.5 text-slate-400 font-bold tracking-wider">Or</span>
            </div>
          </div>

          {/* Google Sign-in Option */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={authSubmitting}
            className="w-full py-3.5 px-4 border border-slate-100 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all focus:ring-2 focus:ring-sky-100 outline-none cursor-pointer flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.99] duration-100"
          >
            {/* Google G logo SVG */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative my-2.5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-100" strokeDasharray="4" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-slate-400">
              <span className="bg-white px-2.5">Or Skip Setup</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleGuestSignIn(name, email)}
            disabled={authSubmitting}
            className="w-full py-3.5 px-4 border border-teal-150 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-850 font-bold text-sm transition-all outline-none cursor-pointer flex items-center justify-center gap-2 shadow-sm"
          >
            <Sparkles className="w-4.5 h-4.5 text-teal-600 animate-pulse" />
            Try Guest Access (Local Offline Mode)
          </button>

          {/* Toggle button */}
          <div className="pt-2 text-xs text-slate-500">
            {isSignUp ? "Already registered clinical credentials?" : "New to the platform?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setAuthError("");
              }}
              className="font-bold text-sky-600 hover:text-sky-500 underline cursor-pointer"
            >
              {isSignUp ? "Access Account" : "Register Credentials here"}
            </button>
          </div>

        </div>

        {/* Global credentials footnote */}
        <p className="text-[10px] text-slate-400 text-center mt-6 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> End-to-end user privacy protected by Firebase encryption protocols.
        </p>
      </div>
    );
  }

  // 4. Render Layout & Dynamic Views Router once authenticated
  return (
    <Layout
      activeView={activeView}
      onNavigate={setActiveView}
      selectedLanguage={selectedLanguage}
      onChangeLanguage={setSelectedLanguage}
    >
      {activeView === "landing" && (
        <LandingView onNavigate={setActiveView} selectedLanguage={selectedLanguage} />
      )}
      
      {activeView === "dashboard" && (
        <DashboardOverview onNavigateToView={handleNavigateFromDash} selectedLanguage={selectedLanguage} />
      )}

      {activeView === "chat" && (
        <ChatView 
          activeSessionId={activeSessionId}
          onSessionCreated={setActiveSessionId}
          selectedLanguage={selectedLanguage}
        />
      )}

      {activeView === "symptoms" && (
        <SymptomChecker selectedLanguage={selectedLanguage} />
      )}

      {activeView === "doctors" && (
        <DoctorFinder selectedLanguage={selectedLanguage} />
      )}

      {activeView === "hospitals" && (
        <HospitalFinder selectedLanguage={selectedLanguage} />
      )}

      {activeView === "knowledge" && (
        <KnowledgeBase selectedLanguage={selectedLanguage} />
      )}

      {activeView === "emergency" && (
        <EmergencyView selectedLanguage={selectedLanguage} />
      )}

      {activeView === "settings" && (
        <ProfileSettings 
          selectedLanguage={selectedLanguage}
          onChangeLanguage={setSelectedLanguage}
        />
      )}
    </Layout>
  );
}
