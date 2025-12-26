import React, { useState } from 'react';
import {
  Users,
  Shield,
  Award,
  Calendar,
  Search,
  MapPin,
  ChevronRight,
  LogIn,
  Trees,
  Info
} from 'lucide-react';

import './App.css'

/**
 * HZD Website - Hauptkomponente
 * Enthält das Design-System "Vertrauen & Natur" (Blau/Grün/Beige)
 */
const App = () => {
  const [activeTab, setActiveTab] = useState('home');

  // Design Tokens (Farben & Branding)
  const colors = {
    primary: '#1E3A8A',    // HZD Blau (Tradition & Vertrauen)
    secondary: '#166534',  // Wiesen-Grün (Natur & Sport)
    highlight: '#D4AF37',  // Gold (Zuchtqualität)
    background: '#FDFBF7', // Blond/Sand (Emotionale Wärme)
    text: '#1F2937'        // Anthrazit für Lesbarkeit
  };

  // Hilfskomponente für das Logo (Platzhalter für hovawarte.com)
  const HZDLogo = ({ className = "w-12 h-12" }) => (
    <div className={`${className} bg-white rounded-full border-2 border-[#1E3A8A] flex items-center justify-center overflow-hidden shadow-sm`}>
      <div className="text-[#1E3A8A] font-black text-[10px] leading-none text-center">
        <img src="./logo.png" alt="HZD-Logo"/>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-12">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <HZDLogo className="w-14 h-14" />
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-black text-xl tracking-tighter text-[#1E3A8A]">hovawarte.com</span>
            </div>
            <span className="text-[10px] text-gray-400 uppercase tracking-[0.25em] block font-bold">
              Hovawart Zuchtgemeinschaft
            </span>
          </div>
        </div>

        {/* Hauptmenü */}
        <div className="hidden md:flex gap-8 text-sm font-bold uppercase tracking-widest text-slate-500">
          <button
            onClick={() => setActiveTab('home')}
            className={`transition-colors pb-1 ${activeTab === 'home' ? 'text-[#1E3A8A] border-b-2 border-[#1E3A8A]' : 'hover:text-[#166534]'}`}
          >
            Start
          </button>
          <button className="hover:text-[#166534] transition-colors pb-1 uppercase">Zucht</button>
          <button className="hover:text-[#166534] transition-colors pb-1 uppercase">Sport</button>
          <button className="hover:text-[#166534] transition-colors pb-1 uppercase">Verein</button>
        </div>

        <div className="flex items-center gap-4">
          <button className="bg-[#166534] text-white px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-green-800 transition-all shadow-lg shadow-green-900/20">
            <Search size={16} /> Welpenliste
          </button>
          <button className="p-2 text-gray-400 hover:text-blue-900">
            <LogIn size={20} />
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto mt-12 px-6">
        {/* Hero-Bereich mit emotionalem Fokus */}
        <section className="relative rounded-[2.5rem] overflow-hidden shadow-2xl h-[550px] border-8 border-white mb-16">
          <div className="absolute inset-0 bg-[#E2E8F0] flex flex-col items-center justify-center text-green-900/30">
            <Trees size={100} strokeWidth={1} className="mb-4" />
            <p className="font-bold text-3xl uppercase tracking-tighter">[Bild: Hovawarte auf einer grünen Wiese]</p>
          </div>

          <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/90 via-slate-900/30 to-transparent flex items-center p-16">
            <div className="max-w-xl text-white">
              <HZDLogo className="w-20 h-20 mb-8 shadow-2xl scale-110" />
              <h2 className="text-6xl font-black mb-6 leading-[1.1] tracking-tighter">
                Zucht mit Verstand. Leben mit Herz.
              </h2>
              <p className="text-xl text-slate-200 mb-10 leading-relaxed">
                Willkommen in der HZD. Wir züchten den Hovawart als gesunden Familien-, Wach- und Sporthund seit über 50 Jahren.
              </p>
              <div className="flex gap-5">
                <button className="bg-[#166534] text-white px-10 py-4 rounded-2xl font-black hover:bg-green-700 transition-all shadow-xl shadow-green-900/30">
                  Welpen suchen
                </button>
                <button className="bg-white/10 backdrop-blur-xl border-2 border-white/20 text-white px-10 py-4 rounded-2xl font-black hover:bg-white/20 transition-all">
                  Unsere Regionen
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Qualitäts-Versprechen */}
        <section className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-10 mb-16">
          <div className="w-32 h-32 flex-shrink-0 bg-slate-50 rounded-full flex items-center justify-center p-4">
             <HZDLogo className="w-full h-full" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-[#1E3A8A] mb-4 tracking-tight">
              Geprüfte Qualität in jedem Wurf
            </h3>
            <p className="text-slate-500 text-lg leading-relaxed max-w-3xl">
              Als Mitglied des VDH garantieren wir strengste Kontrollen. Jeder Hovawart-Welpe aus der HZD stammt von gesunden, wesensgeprüften Elterntieren ab.
            </p>
          </div>
        </section>

        {/* Die drei Säulen */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:border-green-200 transition-all group">
            <div className="w-14 h-14 bg-green-50 text-green-700 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-700 group-hover:text-white transition-all">
              <Users size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3">Familienhunde</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Sozialisierung und Alltagstauglichkeit stehen bei uns an erster Stelle.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all group">
            <div className="w-14 h-14 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-900 group-hover:text-white transition-all">
              <Shield size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3">Wachsame Begleiter</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Ein echter Hofwart – treu, instinktsicher und ein zuverlässiger Schützer.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:border-yellow-200 transition-all group">
            <div className="w-14 h-14 bg-yellow-50 text-yellow-700 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-yellow-600 group-hover:text-white transition-all">
              <Award size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3">Hundesport</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Ob IGP, Obedience oder Agility – unsere Hunde sind arbeitsfreudig und fit.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-24 py-20 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 border-b border-white/10 pb-12 mb-12">
            <div className="flex items-center gap-5">
              <HZDLogo className="w-16 h-16 grayscale brightness-200" />
              <div>
                <span className="font-black text-2xl tracking-tighter block">hovawarte.com</span>
                <span className="text-xs text-white/40 uppercase tracking-[0.3em] font-bold">
                  Hovawart Zuchtgemeinschaft
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <h5 className="font-black uppercase text-[10px] tracking-widest text-white/30 text-left">Verein</h5>
                <ul className="space-y-2 text-sm font-bold text-white/70 text-left">
                  <li className="hover:text-white cursor-pointer transition-colors list-none">Regionalgruppen</li>
                  <li className="hover:text-white cursor-pointer transition-colors list-none">Ortsgruppen</li>
                  <li className="hover:text-white cursor-pointer transition-colors list-none">Mitglied werden</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h5 className="font-black uppercase text-[10px] tracking-widest text-white/30 text-left">Service</h5>
                <ul className="space-y-2 text-sm font-bold text-white/70 text-left">
                  <li className="hover:text-white cursor-pointer transition-colors list-none">Welpenliste</li>
                  <li className="hover:text-white cursor-pointer transition-colors list-none">Züchtersuche</li>
                  <li className="hover:text-white cursor-pointer transition-colors list-none">Downloads</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/20">
            <span>&copy; 2024 HZD e.V. Deutschland</span>
            <div className="flex gap-8">
              <span className="hover:text-white cursor-pointer transition-colors">Datenschutz</span>
              <span className="hover:text-white cursor-pointer transition-colors">Impressum</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;