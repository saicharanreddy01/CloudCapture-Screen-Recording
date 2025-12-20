
import React from 'react';
import { Recording } from '../types';
import { formatDate, formatTime } from '../utils/helpers';

interface PublicVideoViewProps {
  video: Recording | undefined;
  onClose: () => void;
}

const PublicVideoView: React.FC<PublicVideoViewProps> = ({ video, onClose }) => {
  if (!video) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20 text-red-500">
          <i className="fa-solid fa-circle-exclamation text-4xl"></i>
        </div>
        <h2 className="text-3xl font-black mb-4">Content Missing</h2>
        <p className="text-slate-500 max-w-sm">The video you're looking for was either deleted or never existed on this node.</p>
        <button 
          onClick={onClose}
          className="mt-10 px-8 py-3 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold transition-all btn-haptic"
        >
          Return to App
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500/30">
      <header className="p-8 flex items-center justify-between border-b border-slate-900 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <i className="fa-solid fa-bolt-lightning text-white text-xl"></i>
          </div>
          <h1 className="text-xl font-extrabold tracking-tighter">
            CloudCapture <span className="text-blue-500">AI</span>
          </h1>
        </div>
        <button 
          onClick={onClose}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all btn-haptic"
        >
          Login to Workspace
        </button>
      </header>

      <main className="container mx-auto max-w-5xl px-6 py-12">
        <div className="bg-slate-900 rounded-[3rem] border border-slate-800 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="aspect-video bg-black relative">
            <video 
              src={video.url} 
              controls 
              autoPlay 
              className="w-full h-full"
              poster={video.thumbnail}
            />
          </div>
          
          <div className="p-12">
            <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-4xl font-black tracking-tighter mb-2">{video.title}</h2>
                <div className="flex items-center gap-4 text-slate-500 text-sm font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-2">
                    <i className="fa-solid fa-calendar-day"></i>
                    {formatDate(video.timestamp)}
                  </span>
                  <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                  <span className="flex items-center gap-2">
                    <i className="fa-solid fa-clock"></i>
                    {formatTime(video.duration)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a 
                  href={video.url} 
                  download 
                  className="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all border border-slate-700 btn-haptic"
                  title="Download File"
                >
                  <i className="fa-solid fa-download"></i>
                </a>
                <button 
                  className="px-8 py-4 bg-white text-slate-950 font-black rounded-2xl hover:bg-slate-100 transition-all btn-haptic flex items-center gap-3"
                >
                  <i className="fa-solid fa-bolt"></i>
                  Create Your Own
                </button>
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 mb-4 flex items-center gap-2">
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                AI Intelligence Summary
              </h4>
              <p className="text-xl text-slate-400 leading-relaxed font-light">
                {video.description}
              </p>
            </div>
            
            <div className="mt-12 pt-12 border-t border-slate-800/50 flex flex-wrap gap-8 items-center">
               <div className="flex items-center gap-3 px-6 py-3 bg-slate-950 border border-slate-800 rounded-2xl">
                  <i className="fa-brands fa-google-drive text-blue-400 text-xl"></i>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Secured in Cloud Node</span>
               </div>
               <div className="flex items-center gap-3 px-6 py-3 bg-slate-950 border border-slate-800 rounded-2xl">
                  <i className="fa-solid fa-shield-halved text-green-500 text-xl"></i>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Verified Content</span>
               </div>
            </div>
          </div>
        </div>

        <div className="mt-20 text-center">
           <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-700 mb-6">Powered by Gemini Multi-Modal Engine</p>
           <div className="flex justify-center gap-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
             <i className="fa-brands fa-google text-2xl"></i>
             <i className="fa-brands fa-slack text-2xl"></i>
             <i className="fa-brands fa-microsoft text-2xl"></i>
           </div>
        </div>
      </main>
    </div>
  );
};

export default PublicVideoView;
