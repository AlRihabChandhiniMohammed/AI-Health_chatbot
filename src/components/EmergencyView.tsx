/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { 
  ShieldAlert, Phone, MapPin, Check, Heart, Clipboard, HelpCircle, 
  Activity, Star, Loader2, Hospital, Radio, Flame, AlertCircle 
} from "lucide-react";
import HospitalFinder from "./HospitalFinder";

interface ContactRow {
  name: string;
  number: string;
  desc: string;
}

export default function EmergencyView() {
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const emergencyContacts: ContactRow[] = [
    { name: "Emergency Medical Services (Ambulance)", number: "102", desc: "National clinical dispatch fleet dispatch" },
    { name: "National Emergency Number", number: "112", desc: "Universal crisis hotlink routing" },
    { name: "Poison Control Center Helpline", number: "1800-116-117", desc: "Toxin clinical support laboratories" },
    { name: "Red Cross Blood Bank Repository", number: "108", desc: "Plasma and blood unit matching" }
  ];

  const triggerCopy = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 1500);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-8">
      {/* 1. SECTOR RED TAG */}
      <div className="bg-red-500 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg shadow-red-500/20">
        <div className="relative z-10 max-w-2xl space-y-4 text-left">
          <span className="px-3 py-1 rounded bg-red-600 font-bold text-[10px] uppercase font-mono tracking-widest border border-red-400">
            RAPID OUTREACH DISPATCH
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight m-0 border-none text-white leading-tight">
            24/7 Red Alert Assistance Hub
          </h2>
          <p className="text-red-100 text-xs md:text-sm leading-relaxed max-w-xl">
            Acquire instant ambulance coordinate dispatches, dial poison toxic helplines, or trace the closest active specialized Trauma ER centers instantly below.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <a 
              href="tel:102"
              className="px-4 py-2.5 bg-white text-red-700 hover:bg-red-50 font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-colors"
            >
              <Phone className="w-4 h-4 text-red-600 shrink-0" /> Dispatch Ambulance (102)
            </a>
            <a 
              href="tel:112"
              className="px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm hover:bg-red-750 transition-colors border border-red-400"
            >
              <Radio className="w-4 h-4 animate-ping shrink-0" /> Dial emergency crisis triage (112)
            </a>
          </div>
        </div>

        {/* Decorative alert icon absolute background */}
        <ShieldAlert className="absolute right-0 bottom-0 text-red-400/10 w-96 h-96 transform translate-x-12 translate-y-12 -z-0 pointer-events-none" />
      </div>

      {/* 2. RAPID DISPATCH CARDS & CONTACTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Urgent Contacts Lists */}
        <div className="lg:col-span-12 xl:col-span-5 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2 uppercase tracking-wide">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" /> Crucial Triage Helplines
          </h3>

          <div className="space-y-4">
            {emergencyContacts.map((contact, i) => (
              <div 
                key={i} 
                className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-950 leading-snug">{contact.name}</h4>
                  <p className="text-[10px] text-slate-450 mt-0.5 leading-snug">{contact.desc}</p>
                  <p className="text-md font-extrabold text-red-600 font-mono mt-1">{contact.number}</p>
                </div>

                <div className="flex gap-1.5">
                  <a
                    href={`tel:${contact.number}`}
                    className="p-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-700 transition-colors"
                    title="Initiate phone call"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => triggerCopy(contact.number)}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Copy number to clipboard"
                  >
                    {copiedNumber === contact.number ? <Check className="w-4 h-4 text-green-600" /> : <Clipboard className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Poison Alert warning details block */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-250 flex gap-2 text-[11px] text-amber-800 leading-relaxed">
            <Flame className="w-5 h-5 text-amber-600 shrink-0" />
            <p>
              <strong>POSON CONTROL ALERT:</strong> If a toxic chemical inhalation, skin reaction or pediatric intake hazard has occured, do not induce vomiting. Instantly read packaging warnings and call our Poison Control helpline above.
            </p>
          </div>
        </div>

        {/* Map visualization of local hospitals - Right panel */}
        <div className="lg:col-span-12 xl:col-span-7 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wide">
            <Hospital className="w-5 h-5 text-red-500 shrink-0" /> Real-time active ER Maps Tracking
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Toggle hospital filter flags or geolocation telemetry below to locate emergency units instantly on Google Maps. 
          </p>

          <HospitalFinder />
        </div>
      </div>
    </div>
  );
}
