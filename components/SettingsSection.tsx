
import React from 'react';
import { UserSettings } from '../types';

interface SettingsSectionProps {
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
  onLogout: () => void;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ settings, onSettingsChange, onLogout }) => {
  const handleChange = (key: keyof UserSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-4xl font-black mb-10 tracking-tight flex items-center gap-4">
        <i className="fa-solid fa-gear text-slate-500"></i>
        Settings & Security
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <aside className="md:col-span-1 space-y-4">
          <nav className="flex flex-col gap-2">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-left flex items-center gap-3">
              <i className="fa-solid fa-user"></i> Account Identity
            </button>
            <button className="px-6 py-3 text-slate-500 hover:text-white hover:bg-slate-900 rounded-2xl font-bold text-left flex items-center gap-3 transition-all">
              <i className="fa-solid fa-video"></i> Video Standards
            </button>
            <button className="px-6 py-3 text-slate-500 hover:text-white hover:bg-slate-900 rounded-2xl font-bold text-left flex items-center gap-3 transition-all">
              <i className="fa-solid fa-cloud"></i> Storage Nodes
            </button>
            <button 
              onClick={onLogout}
              className="px-6 py-3 text-red-500 hover:bg-red-500/10 rounded-2xl font-bold text-left flex items-center gap-3 transition-all mt-4"
            >
              <i className="fa-solid fa-right-from-bracket"></i> Disconnect Account
            </button>
          </nav>
        </aside>

        <div className="md:col-span-2 space-y-8">
          {/* User Section */}
          <section className="bg-slate-900/40 p-8 rounded-[2rem] border border-slate-800">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-blue-400">Connected Account</h3>
              <span className="px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                Verified via Google
              </span>
            </div>
            
            <div className="flex items-center gap-6 mb-8 p-4 bg-slate-950 rounded-2xl border border-slate-800">
               <img src={settings.userAvatar} className="w-16 h-16 rounded-full border border-slate-700" alt="Profile" />
               <div>
                  <p className="text-lg font-bold">{settings.userName}</p>
                  <p className="text-slate-500 text-sm">{settings.userEmail}</p>
               </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-widest mb-2">Display Alias</label>
                <input 
                  type="text" 
                  value={settings.userName} 
                  onChange={(e) => handleChange('userName', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-widest mb-2">Primary Email</label>
                <input 
                  type="email" 
                  disabled
                  value={settings.userEmail} 
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </section>

          {/* Recording Section */}
          <section className="bg-slate-900/40 p-8 rounded-[2rem] border border-slate-800">
            <h3 className="text-xl font-bold mb-6 text-purple-400">Capture Optimization</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-widest mb-2">Resolution</label>
                <select 
                  value={settings.resolution} 
                  onChange={(e) => handleChange('resolution', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none"
                >
                  <option value="720p">720p High Def</option>
                  <option value="1080p">1080p Full HD</option>
                  <option value="4k">4K Extreme</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-widest mb-2">Frame Cap</label>
                <select 
                  value={settings.frameRate} 
                  onChange={(e) => handleChange('frameRate', parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none"
                >
                  <option value="30">30 FPS (Standard)</option>
                  <option value="60">60 FPS (High Motion)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Cloud Section */}
          <section className="bg-slate-900/40 p-8 rounded-[2rem] border border-slate-800">
            <h3 className="text-xl font-bold mb-6 text-green-400">Cloud Sync</h3>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="font-bold">Instant Workspace Upload</h4>
                <p className="text-xs text-slate-500">Automatically push new recordings to your Google Drive</p>
              </div>
              <button 
                onClick={() => handleChange('autoSync', !settings.autoSync)}
                className={`w-14 h-8 rounded-full transition-all relative ${settings.autoSync ? 'bg-blue-600' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings.autoSync ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <i className="fa-brands fa-google-drive text-blue-400 text-xl"></i>
                  <div>
                    <p className="text-sm font-bold">Google Drive Storage</p>
                    <p className="text-[10px] text-slate-500">Personal Account Node Connected</p>
                  </div>
               </div>
               <span className="text-green-500 text-[10px] font-black uppercase tracking-widest">Active</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsSection;
