
import React, { useState } from 'react';
import { Recording } from '../types';
import { formatDate } from '../utils/helpers';

interface SharedSectionProps {
  recordings: Recording[];
}

const SharedSection: React.FC<SharedSectionProps> = ({ recordings }) => {
  const [actionFeedback, setActionFeedback] = useState<{ id: string; type: 'link' | 'email' | 'slack' } | null>(null);

  const showFeedback = (id: string, type: 'link' | 'email' | 'slack') => {
    setActionFeedback({ id, type });
    setTimeout(() => setActionFeedback(null), 2000);
  };

  const getShareUrl = (id: string) => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('v', id);
    return url.toString();
  };

  const handleCopyLink = async (recording: Recording) => {
    const shareUrl = getShareUrl(recording.id);
    try {
      await navigator.clipboard.writeText(shareUrl);
      showFeedback(recording.id, 'link');
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const handleEmailShare = (recording: Recording) => {
    const shareUrl = getShareUrl(recording.id);
    const subject = encodeURIComponent(`Screen Recording: ${recording.title}`);
    const body = encodeURIComponent(`Hey, check out this recording from CloudCapture AI: ${shareUrl}\n\nSummary: ${recording.description}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    showFeedback(recording.id, 'email');
  };

  const handleSlackShare = (recording: Recording) => {
    const shareUrl = getShareUrl(recording.id);
    navigator.clipboard.writeText(shareUrl);
    showFeedback(recording.id, 'slack');
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-4xl font-black tracking-tight flex items-center gap-4">
          <i className="fa-solid fa-share-nodes text-slate-500"></i>
          Shared Workspace
        </h2>
        <span className="text-slate-500 text-xs font-black uppercase tracking-widest bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
          Public Assets: {recordings.length}
        </span>
      </div>

      {recordings.length === 0 ? (
        <div className="text-center py-32 glass-panel rounded-[3rem] border-2 border-dashed border-slate-800/50">
          <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-700">
             <i className="fa-solid fa-link-slash text-4xl"></i>
          </div>
          <h4 className="text-xl font-bold text-slate-400">No public links generated yet.</h4>
          <p className="text-slate-600 mt-2">Record something to start sharing with your team.</p>
        </div>
      ) : (
        <div className="bg-slate-900/40 rounded-[2.5rem] border border-slate-800 overflow-hidden backdrop-blur-xl">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/30">
                <th className="px-8 py-6 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Recording Name</th>
                <th className="px-8 py-6 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Status</th>
                <th className="px-8 py-6 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Created</th>
                <th className="px-8 py-6 text-xs font-black uppercase tracking-[0.2em] text-slate-500 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {recordings.map(recording => (
                <tr key={recording.id} className="group hover:bg-slate-800/20 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-16 h-10 rounded-lg overflow-hidden border border-slate-700 group-hover:border-blue-500/50 transition-colors bg-slate-950">
                          {recording.thumbnail ? (
                            <img src={recording.thumbnail} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <i className="fa-solid fa-film text-slate-700"></i>
                            </div>
                          )}
                       </div>
                       <div>
                         <p className="font-bold group-hover:text-blue-400 transition-colors">{recording.title}</p>
                         <p className="text-[10px] text-slate-500 font-mono">CC-{recording.id.slice(0, 8)}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Live Link
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm text-slate-400 font-medium">
                    {formatDate(recording.timestamp)}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => handleCopyLink(recording)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 btn-haptic ${
                          actionFeedback?.id === recording.id && actionFeedback?.type === 'link' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <i className={`fa-solid ${actionFeedback?.id === recording.id && actionFeedback?.type === 'link' ? 'fa-check' : 'fa-link'}`}></i>
                        {actionFeedback?.id === recording.id && actionFeedback?.type === 'link' ? 'Copied' : 'Copy Link'}
                      </button>
                      
                      <button 
                        onClick={() => handleEmailShare(recording)}
                        title="Share via Email"
                        className={`p-2.5 rounded-xl transition-all btn-haptic flex items-center justify-center ${
                          actionFeedback?.id === recording.id && actionFeedback?.type === 'email'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <i className={`fa-solid ${actionFeedback?.id === recording.id && actionFeedback?.type === 'email' ? 'fa-envelope-open' : 'fa-envelope'}`}></i>
                      </button>
                      
                      <button 
                        onClick={() => handleSlackShare(recording)}
                        title="Share to Slack"
                        className={`p-2.5 rounded-xl transition-all btn-haptic flex items-center justify-center relative ${
                          actionFeedback?.id === recording.id && actionFeedback?.type === 'slack'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <i className="fa-brands fa-slack"></i>
                        {actionFeedback?.id === recording.id && actionFeedback?.type === 'slack' && (
                          <span className="absolute -top-10 right-0 bg-purple-600 text-white text-[10px] font-black px-2 py-1 rounded animate-in fade-in slide-in-from-bottom-2 whitespace-nowrap">
                            Copied for Slack
                          </span>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SharedSection;
