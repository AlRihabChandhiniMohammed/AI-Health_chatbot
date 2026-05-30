/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Bot, Clock, ShieldAlert, Activity, HeartPulse, User, 
  Menu, X, Home, BookOpen, MapPin, ClipboardList, AlertTriangle 
} from "lucide-react";
import { auth } from "../firebase";

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onNavigate: (view: string) => void;
  selectedLanguage: 'en' | 'hi' | 'te';
  onChangeLanguage: (lang: 'en' | 'hi' | 'te') => void;
}

export default function Layout({ 
  children, 
  activeView, 
  onNavigate, 
  selectedLanguage, 
  onChangeLanguage 
}: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "landing", label: "Home", icon: <Home className="w-5 h-5" /> },
    { id: "dashboard", label: "Dashboard", icon: <Activity className="w-5 h-5" /> },
    { id: "chat", label: "AI Consult", icon: <Bot className="w-5 h-5" /> },
    { id: "symptoms", label: "Symptom", icon: <ClipboardList className="w-5 h-5" /> },
    { id: "doctors", label: "Doctors", icon: <HeartPulse className="w-5 h-5" /> },
    { id: "hospitals", label: "Clinics", icon: <MapPin className="w-5 h-5" /> },
    { id: "knowledge", label: "Library", icon: <BookOpen className="w-5 h-5" /> },
    { id: "emergency", label: "Emergency", icon: <AlertTriangle className="w-5 h-5 text-rose-500" /> },
    { id: "settings", label: "Profile", icon: <User className="w-5 h-5" /> }
  ];

  const handleNavClick = (viewId: string) => {
    onNavigate(viewId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased text-slate-800">
      {/* 1. TOP HEADER NAVIGATION RAIL (Immersive UI Style) */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm h-20 flex items-center shrink-0">
        <div className="w-full px-6 md:px-8 flex items-center justify-between">
          
          {/* Logo element */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate("landing")}>
            <div className="p-2.5 rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-100 transition-transform hover:scale-105 duration-200">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-md font-extrabold text-slate-900 tracking-tight leading-tight">AI Health Assistant</h1>
            </div>
          </div>

          {/* Center segment language selector + desktop navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {/* Pill-based Language Bar */}
            <div className="flex bg-[#F1F5F9]/80 rounded-full p-1 border border-slate-200">
              {(["en", "hi", "te"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => onChangeLanguage(lang)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-full cursor-pointer transition-all ${
                    selectedLanguage === lang 
                      ? "bg-white text-sky-600 shadow-sm font-bold" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            <button 
              onClick={() => onNavigate("knowledge")}
              className="flex items-center px-4 py-2 border border-slate-205 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 mr-2 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              Global Knowledge Search
            </button>
          </div>

          {/* Account bubble */}
          <div className="hidden md:flex items-center gap-3">
            <span className="px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-bold tracking-wide rounded-lg border border-green-150 uppercase flex items-center gap-1">
              <span className="w-1 h-1 bg-green-500 rounded-full inline-block" /> Active
            </span>
            <div 
              onClick={() => handleNavClick("settings")}
              className="w-10 h-10 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer flex items-center justify-center font-bold text-slate-700 text-xs shadow-inner overflow-hidden transition-all hover:scale-105"
              title="View account parameters"
            >
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(auth.currentUser?.displayName || auth.currentUser?.email || 'User')}&background=0EA5E9&color=fff`} 
                className="w-10 h-10 rounded-2xl border-2 border-white shadow-sm" 
                alt="Profile" 
              />
            </div>
          </div>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-slate-700" />}
          </button>
        </div>
      </header>

      {/* 2. BODY LAYOUT WRAPPER (SIDEBAR + CONTENT FRAME) */}
      <div className="flex-1 flex w-full">
        
        {/* DESKTOP SIDEBAR NAVIGATION (Ultra-sleek Immersive UI theme) */}
        <aside className="hidden md:flex w-24 border-r border-slate-200/80 p-3 py-6 flex-col items-center justify-between shrink-0 bg-white shadow-sm sticky top-20 h-[calc(100vh-5rem)]">
          <div className="w-full space-y-3">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full py-3.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer relative group ${
                  activeView === item.id 
                    ? "bg-sky-50 text-sky-600 font-bold" 
                    : "text-slate-400 hover:text-sky-500 hover:bg-slate-50/50"
                }`}
              >
                {activeView === item.id && (
                  <span className="absolute left-1 top-4 bottom-4 w-1 bg-sky-500 rounded-full" />
                )}
                <div className={`transition-transform group-hover:scale-105 duration-150 shrink-0 ${activeView === item.id ? "text-sky-500" : "text-slate-450"}`}>
                  {item.icon}
                </div>
                <span className={`text-[9px] font-bold tracking-wider capitalize leading-none pt-0.5 truncate max-w-full ${activeView === item.id ? "text-sky-700" : "text-slate-400"}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          {/* Avatar indicator bottom */}
          <div className="mt-auto pt-4 border-t border-slate-100 w-full flex items-center justify-center">
            <div 
              onClick={() => handleNavClick("settings")}
              className="w-10 h-10 rounded-2xl cursor-pointer hover:scale-105 transition-transform" 
              title="Patient Settings"
            >
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(auth.currentUser?.displayName || auth.currentUser?.email || 'User')}&background=0EA5E9&color=fff`} 
                className="w-10 h-10 rounded-2xl border-2 border-white shadow-md shadow-slate-100" 
                alt="Profile" 
              />
            </div>
          </div>
        </aside>

        {/* CONTAINER HOLDING CENTRAL CONTENT + RIGHT PANEL */}
        <div className="flex-1 flex min-w-0 bg-[#F1F5F9]/40">
          
          {/* MAIN DYNAMIC CONTENT WINDOW */}
          <main className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8 shrink-0 min-h-[calc(100vh-5rem)]">
            {children}
          </main>

          {/* RIGHT SIDEBAR: Stats & Emergency (Shown on modern layouts for interior app views) */}
          {activeView !== "landing" && (
            <aside className="hidden lg:flex w-80 bg-white border-l border-slate-150 p-6 flex-col space-y-6 shrink-0 h-[calc(100vh-5rem)] sticky top-20 overflow-y-auto justify-start select-none">
              
              {/* Emergency dispatch trigger block */}
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-rose-700 font-bold text-xs tracking-wide">EMERGENCY DISPATCH</h2>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                </div>
                
                <button 
                  onClick={() => handleNavClick("emergency")}
                  className="w-full bg-rose-600 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-rose-200 text-xs hover:bg-rose-700 transition-all flex items-center justify-center cursor-pointer"
                >
                  <AlertTriangle className="w-4.5 h-4.5 mr-2 animate-bounce" />
                  Request Ambulance dispatch
                </button>
                
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleNavClick("emergency")} 
                    className="text-[10px] font-bold text-rose-600 bg-white hover:bg-rose-50/50 border border-rose-200 py-2.5 rounded-xl cursor-pointer transition-colors text-center"
                  >
                    Blood Bank
                  </button>
                  <button 
                    onClick={() => handleNavClick("emergency")} 
                    className="text-[10px] font-bold text-rose-600 bg-white hover:bg-rose-50/50 border border-rose-200 py-2.5 rounded-xl cursor-pointer transition-colors text-center"
                  >
                    Nearest ER Map
                  </button>
                </div>
              </div>

              {/* Patient vitals trends monitoring widget */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Clinical Vitals insights</h3>
                <div className="space-y-3">
                  
                  {/* Heart rate monitor */}
                  <div className="flex items-center p-3 bg-[#F8FAFC] border border-slate-100 rounded-xl shadow-xs">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mr-3 shrink-0">
                      <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Heart Rate index</p>
                      <p className="text-sm font-extrabold text-slate-800">72 <span className="text-[10px] font-normal text-slate-450">BPM</span></p>
                    </div>
                    <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">Normal</div>
                  </div>

                  {/* Sleep tracker */}
                  <div className="flex items-center p-3 bg-[#F8FAFC] border border-slate-100 rounded-xl shadow-xs">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mr-3 shrink-0">
                      <Clock className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metabolic Sleep Tracker</p>
                      <p className="text-sm font-extrabold text-slate-800">6h 45m</p>
                    </div>
                    <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full shrink-0">Low</div>
                  </div>

                </div>
              </div>

              {/* Partnership banner card - styled fully as Immersive UI dark slate aspect */}
              <div className="flex-1 bg-slate-900 rounded-3xl p-5 text-white relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-xl shadow-slate-900/10 mb-2">
                <div className="absolute -top-4 -right-4 p-4 opacity-5 pointer-events-none select-none">
                  <HeartPulse className="w-32 h-32" />
                </div>
                
                <div className="space-y-4">
                  <span className="text-[9px] font-black tracking-widest text-sky-400 bg-sky-500/10 border border-sky-450/20 px-2.5 py-1 rounded-md uppercase">
                    HIPAA Partner Hub
                  </span>
                  <div>
                    <h4 className="text-md font-extrabold mb-1 tracking-tight">Apollo 24/7 Clinic</h4>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-sky-400 shrink-0" /> Jubilee Hills, Hyderabad • 0.8 km away
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <span className="px-2 py-0.5 bg-emerald-550/20 text-emerald-300 border border-emerald-550/10 rounded text-[9px] font-semibold">Open Now 24/7</span>
                    <span className="px-2 py-0.5 bg-slate-800 rounded text-[9px] font-bold text-yellow-400">4.8 ★</span>
                  </div>
                </div>

                <button 
                  onClick={() => handleNavClick("hospitals")}
                  className="w-full mt-4 py-3 bg-sky-500 hover:bg-sky-400 text-white font-extrabold rounded-xl text-xs tracking-wide transition-colors cursor-pointer shadow-md shadow-sky-500/20 text-center"
                >
                  View Map & Directions
                </button>
              </div>

            </aside>
          )}

        </div>
      </div>

      {/* 3. MOBILE MENU BACKDROP DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
          <div className="w-72 bg-white h-full p-6 space-y-6 flex flex-col justify-between shadow-2xl relative">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-950 uppercase tracking-widest">Navigation</h3>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg border border-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Language mobile picker */}
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Language Translation</p>
                <div className="grid grid-cols-3 gap-1 bg-[#F1F5F9] rounded-xl p-1">
                  {(["en", "hi", "te"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        onChangeLanguage(lang);
                        setMobileMenuOpen(false);
                      }}
                      className={`py-2 text-[10px] font-bold rounded-lg cursor-pointer ${
                        selectedLanguage === lang ? "bg-white text-sky-600 shadow-xs" : "text-slate-500"
                      }`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-3">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-2">Modules Directories</p>
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold flex items-center gap-3 transition-colors cursor-pointer ${
                      activeView === item.id 
                        ? "bg-sky-600 text-white" 
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile login credentials indicator */}
            <div className="pt-4 border-t border-slate-100 text-left text-xs text-slate-500">
              <p className="font-bold text-slate-900 truncate">{auth.currentUser?.email}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">Authenticates Active Firestore Database Connection</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. CLINICAL SAFETY ANCHOR BANNER FOOTER */}
      <footer className="bg-rose-50 py-3 px-6 border-t border-rose-100 text-center shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-650 shrink-0" />
          <p className="text-[10px] text-rose-700 font-semibold leading-normal">
            AI responses are informational only and are not a substitute for professional medical advice. Call local emergency dispatches in life-threatening crises.
          </p>
        </div>
      </footer>
    </div>
  );
}
