
import React from 'react';
import { AppSection } from '../types';

interface HeaderProps {
  activeSection: AppSection;
  onSectionChange: (section: AppSection) => void;
  userName: string;
  userAvatar?: string;
}

const Header: React.FC<HeaderProps> = ({ activeSection, onSectionChange, userName, userAvatar }) => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-900 py-4 transition-all duration-300">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group btn-haptic" 
          onClick={() => onSectionChange('recordings')}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-110 group-hover:rotate-6">
            <i className="fa-solid fa-bolt-lightning text-white text-xl"></i>
          </div>
          <h1 className="text-xl font-extrabold tracking-tighter">
            CloudCapture <span className="text-blue-500">AI</span>
          </h1>
        </div>
        
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/50 p-1 rounded-2xl border border-slate-800">
          {(['recordings', 'shared', 'settings'] as AppSection[]).map((section) => (
            <button 
              key={section}
              onClick={() => onSectionChange(section)}
              className={`px-6 py-2 rounded-xl transition-all duration-300 text-xs font-black uppercase tracking-widest btn-haptic ${
                activeSection === section 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {section}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="text-sm font-black text-slate-100 tracking-tight">{userName}</span>
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Live Connection</span>
            </div>
          </div>
          <div 
            onClick={() => onSectionChange('settings')}
            className="w-11 h-11 rounded-2xl bg-slate-800 border-2 border-slate-700 overflow-hidden cursor-pointer hover:border-blue-500 transition-all duration-300 btn-haptic"
          >
            <img 
              src={userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} 
              alt="Avatar" 
              className="w-full h-full object-cover transition-transform hover:scale-110" 
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
