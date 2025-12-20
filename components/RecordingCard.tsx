
import React from 'react';
import { Recording } from '../types';
import { formatTime, formatDate } from '../utils/helpers';

interface RecordingCardProps {
  recording: Recording;
  onDelete: (id: string) => void;
  onPreview: (recording: Recording) => void;
}

const RecordingCard: React.FC<RecordingCardProps> = ({ recording, onDelete, onPreview }) => {
  return (
    <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800 group hover:border-blue-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col">
      <div 
        className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer"
        onClick={() => onPreview(recording)}
      >
        {recording.thumbnail ? (
          <img 
            src={recording.thumbnail} 
            alt={recording.title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.2s] ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800">
            <i className="fa-solid fa-video text-slate-700 text-4xl animate-pulse"></i>
          </div>
        )}
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 transform scale-75 group-hover:scale-100 transition-all duration-500">
            <i className="fa-solid fa-play text-white text-xl translate-x-0.5"></i>
          </div>
        </div>

        <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border border-white/5 text-blue-400">
          {formatTime(recording.duration)}
        </div>
        
        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <span className="bg-blue-600/20 text-blue-400 text-[9px] uppercase font-black tracking-widest px-2.5 py-1.5 rounded-full border border-blue-500/30 backdrop-blur-md">
            <i className="fa-solid fa-shield-halved mr-1"></i> Encrypted
          </span>
        </div>
      </div>
      
      <div className="p-6 flex-grow flex flex-col">
        <h4 
          className="font-bold text-lg mb-2 truncate group-hover:text-blue-400 transition-colors cursor-pointer tracking-tight"
          onClick={() => onPreview(recording)}
        >
          {recording.title}
        </h4>
        <p className="text-slate-500 text-xs mb-6 line-clamp-2 min-h-[2.5rem] leading-relaxed font-medium">
          {recording.description}
        </p>
        
        <div className="mt-auto flex items-center justify-between pt-5 border-t border-slate-800/50">
          <div className="flex flex-col">
            <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest">
              Captured
            </span>
            <span className="text-slate-400 text-xs font-semibold">
              {formatDate(recording.timestamp)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onPreview(recording)}
              className="p-3 bg-slate-800/50 hover:bg-blue-600 rounded-xl text-slate-400 hover:text-white transition-all border border-slate-700/50 btn-haptic"
              title="Preview"
            >
              <i className="fa-solid fa-play text-sm"></i>
            </button>
            <a 
              href={recording.driveUrl} 
              target="_blank" 
              className="p-3 bg-slate-800/50 hover:bg-green-600 rounded-xl text-slate-400 hover:text-white transition-all border border-slate-700/50 btn-haptic"
              title="Cloud Sync"
            >
              <i className="fa-brands fa-google-drive text-sm"></i>
            </a>
            <button 
              onClick={() => onDelete(recording.id)}
              className="p-3 bg-slate-800/50 hover:bg-red-600 rounded-xl text-slate-400 hover:text-white transition-all border border-slate-700/50 btn-haptic"
              title="Delete"
            >
              <i className="fa-solid fa-trash-can text-sm"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordingCard;
