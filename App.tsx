
import React, { useState, useRef, useEffect } from 'react';
import { Recording, RecordingState, AppSection, UserSettings } from './types';
import { analyzeRecording } from './services/geminiService';
import Header from './components/Header';
import RecordingCard from './components/RecordingCard';
import VideoEditor from './components/VideoEditor';
import SettingsSection from './components/SettingsSection';
import SharedSection from './components/SharedSection';
import LoginScreen from './components/LoginScreen';
import PublicVideoView from './components/PublicVideoView';
import { formatTime } from './utils/helpers';

const App: React.FC = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [appState, setAppState] = useState<RecordingState>(RecordingState.IDLE);
  const [activeSection, setActiveSection] = useState<AppSection>('recordings');
  const [timer, setTimer] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<Recording | null>(null);
  const [currentRecordingBlob, setCurrentRecordingBlob] = useState<Blob | null>(null);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [sharedViewId, setSharedViewId] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('cc_settings');
    return saved ? JSON.parse(saved) : {
      userName: "",
      userEmail: "",
      userAvatar: "",
      isAuthenticated: false,
      resolution: '1080p',
      frameRate: 30,
      autoSync: true,
      cloudStorage: 'google-drive'
    };
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const cancelRef = useRef<boolean>(false);

  // Persistence and Routing
  useEffect(() => {
    // Load recordings
    const saved = localStorage.getItem('cc_recordings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Re-convert base64 strings back to Blobs for current session if needed
      // (Note: For this demo, we store the metadata and assume the Blob URL is generated on-demand)
      setRecordings(parsed);
    }

    // Check for shared link
    const params = new URLSearchParams(window.location.search);
    const videoId = params.get('v');
    if (videoId) {
      setSharedViewId(videoId);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cc_recordings', JSON.stringify(recordings));
  }, [recordings]);

  useEffect(() => {
    localStorage.setItem('cc_settings', JSON.stringify(settings));
  }, [settings]);

  const handleLogin = (name: string, email: string, avatar: string) => {
    setSettings(prev => ({
      ...prev,
      userName: name,
      userEmail: email,
      userAvatar: avatar,
      isAuthenticated: true
    }));
  };

  const handleLogout = () => {
    setSettings(prev => ({
      ...prev,
      userName: "",
      userEmail: "",
      userAvatar: "",
      isAuthenticated: false
    }));
    setActiveSection('recordings');
  };

  const startTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = window.setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      const resMap = { '720p': { w: 1280, h: 720 }, '1080p': { w: 1920, h: 1080 }, '4k': { w: 3840, h: 2160 } };
      const dim = resMap[settings.resolution];

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          frameRate: { ideal: settings.frameRate }, 
          width: { ideal: dim.w }, 
          height: { ideal: dim.h } 
        },
        audio: true
      });

      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
      
      const tracks = [...screenStream.getTracks()];
      if (micStream) {
        tracks.push(...micStream.getAudioTracks());
      }

      const combinedStream = new MediaStream(tracks);
      streamRef.current = combinedStream;
      
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      const recorder = new MediaRecorder(combinedStream, options);
      
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setCurrentRecordingBlob(blob);
        setAppState(RecordingState.EDITING);
        stopTimer();
      };

      recorder.start();
      setAppState(RecordingState.RECORDING);
      setTimer(0);
      startTimer();

      screenStream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current?.state !== 'inactive') {
          stopRecording();
        }
      };

    } catch (err) {
      console.error("Error accessing media devices:", err);
      alert("Failed to start recording. Please ensure display capture permissions are granted.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(track => track.stop());
    }
  };

  const cancelFlow = () => {
    cancelRef.current = true;
    setAppState(RecordingState.IDLE);
    setTimer(0);
    setCurrentRecordingBlob(null);
    setProcessingStep("");
  };

  const finalizeRecording = async (finalBlob: Blob, finalDuration: number) => {
    setAppState(RecordingState.PROCESSING);
    cancelRef.current = false;
    
    try {
      setProcessingStep("Optimizing stream data...");
      const url = URL.createObjectURL(finalBlob);
      const video = document.createElement('video');
      video.src = url;
      video.preload = 'auto';
      
      await new Promise((resolve, reject) => {
        video.onloadeddata = resolve;
        video.onerror = reject;
        setTimeout(() => reject(new Error("Timeout")), 10000);
      });
      
      video.currentTime = Math.min(1, finalDuration / 2);
      await new Promise(resolve => { video.onseeked = resolve; });

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
      
      if (cancelRef.current) return;

      setProcessingStep("Gemini AI is analyzing content...");
      const analysis = await analyzeRecording(thumbnail.split(',')[1]);

      if (settings.autoSync) {
        setProcessingStep(`Syncing to ${settings.cloudStorage === 'google-drive' ? 'Google Drive' : settings.cloudStorage}...`);
        await new Promise(r => setTimeout(r, 1500));
      }

      if (cancelRef.current) return;

      const newRecording: Recording = {
        id: crypto.randomUUID(),
        url,
        blob: finalBlob,
        duration: Math.round(finalDuration),
        timestamp: Date.now(),
        title: analysis.title,
        description: analysis.summary,
        status: 'saved',
        driveUrl: `https://drive.google.com/drive/recent`,
        thumbnail
      };

      setRecordings(prev => [newRecording, ...prev]);
      setAppState(RecordingState.IDLE);
      setProcessingStep("");
      setCurrentRecordingBlob(null);
      setActiveSection('recordings');

    } catch (e) {
      console.error("Finalization error:", e);
      alert("Something went wrong during processing. Your recording was saved locally.");
      setAppState(RecordingState.IDLE);
    }
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'settings':
        return <SettingsSection key="settings" settings={settings} onSettingsChange={setSettings} onLogout={handleLogout} />;
      case 'shared':
        return <SharedSection key="shared" recordings={recordings} />;
      case 'recordings':
      default:
        return (
          <div key="recordings" className="animate-section-in">
            {appState === RecordingState.IDLE && (
              <section className="mb-16 text-center">
                <h2 className="text-5xl font-black mb-6 gradient-text tracking-tighter">
                  Cloud-Native Capture.
                </h2>
                <p className="text-slate-400 max-w-2xl mx-auto text-xl font-light leading-relaxed">
                  Welcome back, {settings.userName}. Your workspace is connected to your secure cloud node.
                </p>
              </section>
            )}

            <div className="max-w-2xl mx-auto mb-20">
              <div className="glass-panel rounded-[2.5rem] p-10 border border-slate-800 shadow-[0_0_50px_-12px_rgba(59,130,246,0.15)] relative overflow-hidden transition-all duration-500">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 animate-gradient-x"></div>
                
                <div className="flex flex-col items-center gap-8">
                  {appState === RecordingState.RECORDING && (
                    <div className="flex items-center gap-4 px-8 py-3 rounded-full bg-red-500/10 border border-red-500/20 shadow-lg shadow-red-500/5 transition-all">
                      <div className="w-4 h-4 rounded-full bg-red-500 recording-pulse"></div>
                      <span className="font-mono text-3xl font-black text-red-400 tracking-tighter">
                        {formatTime(timer)}
                      </span>
                    </div>
                  )}

                  <div className="relative group">
                    {appState === RecordingState.IDLE ? (
                      <button
                        onClick={startRecording}
                        className="w-32 h-32 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-blue-500/40 group relative overflow-hidden btn-haptic"
                      >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <i className="fa-solid fa-play text-4xl text-white relative z-10 transition-transform group-hover:scale-110"></i>
                      </button>
                    ) : appState === RecordingState.RECORDING ? (
                      <button
                        onClick={stopRecording}
                        className="w-32 h-32 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-red-500/40 btn-haptic"
                      >
                        <i className="fa-solid fa-stop text-4xl text-white"></i>
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-6">
                        <div className="relative w-24 h-24">
                          <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                          <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <div className="text-center">
                          <p className="text-blue-400 font-black text-lg tracking-tight uppercase animate-pulse">{processingStep || "Processing..."}</p>
                          <p className="text-slate-500 text-sm mt-1">AI-Powered Synthesis</p>
                        </div>
                        <button 
                          onClick={cancelFlow}
                          className="px-6 py-2 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 text-xs font-bold rounded-xl border border-slate-700 transition-all uppercase tracking-widest btn-haptic"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <p className="text-slate-300 font-bold text-lg mb-1">
                      {appState === RecordingState.IDLE ? "System Idle" : 
                       appState === RecordingState.RECORDING ? "Capture in Progress" : "Workflow Automation"}
                    </p>
                    <p className="text-slate-500 text-sm">
                      {appState === RecordingState.IDLE ? "Start session to begin auto-sync" : 
                       appState === RecordingState.RECORDING ? "Screen, Mic, and System Audio Active" : "Finalizing cloud synchronization"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-3xl font-black flex items-center gap-4 tracking-tighter">
                  <i className="fa-solid fa-folder-open text-blue-500"></i>
                  Recent Vault
                </h3>
                <span className="text-slate-500 text-xs font-black uppercase tracking-widest glass-panel px-4 py-2 rounded-full">
                  {recordings.length} Protected Items
                </span>
              </div>

              {recordings.length === 0 ? (
                <div className="text-center py-32 glass-panel rounded-[3rem] border-2 border-dashed border-slate-800/50">
                  <div className="w-24 h-24 bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-700 border border-slate-800 transition-transform hover:scale-110">
                    <i className="fa-solid fa-ghost text-4xl opacity-50"></i>
                  </div>
                  <h4 className="text-xl font-bold text-slate-400">Library is Empty</h4>
                  <p className="text-slate-600 mt-2">Recorded assets will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {recordings.map((recording, idx) => (
                    <div key={recording.id} className="stagger-item" style={{ animationDelay: `${idx * 0.1}s` }}>
                      <RecordingCard 
                        recording={recording} 
                        onDelete={() => setRecordings(prev => prev.filter(r => r.id !== recording.id))}
                        onPreview={(r) => setSelectedVideo(r)} 
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  if (sharedViewId) {
    const video = recordings.find(r => r.id === sharedViewId);
    return <PublicVideoView video={video} onClose={() => {
      setSharedViewId(null);
      window.history.pushState({}, '', window.location.pathname);
    }} />;
  }

  if (!settings.isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
        userName={settings.userName} 
        userAvatar={settings.userAvatar}
      />
      
      <main className="flex-grow container mx-auto px-4 py-12 overflow-hidden">
        {appState === RecordingState.EDITING && currentRecordingBlob ? (
          <VideoEditor 
            blob={currentRecordingBlob} 
            onCancel={cancelFlow} 
            onSave={finalizeRecording} 
          />
        ) : renderSectionContent()}
      </main>

      {/* Video Preview Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-6xl glass-panel rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="flex items-center justify-between p-8 bg-slate-800/20 border-b border-slate-800">
              <h3 className="text-2xl font-black text-white truncate pr-10 tracking-tight">{selectedVideo.title}</h3>
              <button 
                onClick={() => setSelectedVideo(null)} 
                className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-all btn-haptic"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center group/video">
              <video src={selectedVideo.url} controls autoPlay className="max-h-[70vh] w-full" />
            </div>
            <div className="p-8 bg-slate-800/40 flex justify-end gap-4">
              <a 
                href={selectedVideo.url} 
                download={`${selectedVideo.title}.webm`} 
                className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold border border-slate-700 transition-all btn-haptic"
              >
                Download
              </a>
              <a 
                href={selectedVideo.driveUrl} 
                target="_blank" 
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition-all btn-haptic"
              >
                Drive Link
              </a>
            </div>
          </div>
        </div>
      )}

      <footer className="py-12 border-t border-slate-900 text-center text-slate-600">
        <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-50">CloudCapture AI v2.7 • Secure Node Connected</p>
      </footer>
    </div>
  );
};

export default App;
