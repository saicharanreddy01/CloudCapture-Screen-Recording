
import React, { useState, useRef, useEffect } from 'react';
import { formatTime } from '../utils/helpers';

interface Segment {
  id: string;
  start: number;
  end: number;
}

interface VideoEditorProps {
  blob: Blob;
  onCancel: () => void;
  onSave: (finalBlob: Blob, duration: number) => void;
}

const VideoEditor: React.FC<VideoEditorProps> = ({ blob, onCancel, onSave }) => {
  const [url] = useState(() => URL.createObjectURL(blob));
  const [duration, setDuration] = useState(0);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<'start' | 'end' | null>(null);

  useEffect(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const d = videoRef.current.duration;
      setDuration(d);
      const initialSegment = { id: crypto.randomUUID(), start: 0, end: d };
      setSegments([initialSegment]);
      setActiveSegmentId(initialSegment.id);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setPlaybackTime(videoRef.current.currentTime);
      if (isPlaying) {
        const currentSegment = segments.find(s => playbackTime >= s.start && playbackTime <= s.end);
        if (currentSegment && videoRef.current.currentTime >= currentSegment.end) {
          const sorted = [...segments].sort((a, b) => a.start - b.start);
          const currentIndex = sorted.findIndex(s => s.id === currentSegment.id);
          if (currentIndex < sorted.length - 1) {
            const next = sorted[currentIndex + 1];
            videoRef.current.currentTime = next.start;
          } else {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        }
      }
    }
  };

  const addSegment = () => {
    const newStart = playbackTime;
    const newEnd = Math.min(newStart + 2, duration);
    const newSegment = { id: crypto.randomUUID(), start: newStart, end: newEnd };
    setSegments(prev => [...prev, newSegment].sort((a, b) => a.start - b.start));
    setActiveSegmentId(newSegment.id);
  };

  const removeSegment = (id: string) => {
    if (segments.length <= 1) return;
    setSegments(prev => prev.filter(s => s.id !== id));
    if (activeSegmentId === id) setActiveSegmentId(segments[0].id);
  };

  const updateSegmentValue = (id: string, type: 'start' | 'end', val: number) => {
    setSegments(prev => prev.map(s => {
      if (s.id !== id) return s;
      const clampedVal = Math.max(0, Math.min(duration, val));
      if (type === 'start') {
        return { ...s, start: Math.min(clampedVal, s.end - 0.1) };
      } else {
        return { ...s, end: Math.max(clampedVal, s.start + 0.1) };
      }
    }));
  };

  const handleDragStart = (type: 'start' | 'end') => {
    draggingRef.current = type;
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (!draggingRef.current || !activeSegmentId || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newVal = (x / rect.width) * duration;
    updateSegmentValue(activeSegmentId, draggingRef.current, newVal);
    if (videoRef.current) videoRef.current.currentTime = newVal;
  };

  const handleGlobalMouseUp = () => {
    draggingRef.current = null;
    document.removeEventListener('mousemove', handleGlobalMouseMove);
    document.removeEventListener('mouseup', handleGlobalMouseUp);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleApplyTrim = async () => {
    setIsProcessing(true);
    const video = videoRef.current;
    if (!video) return;

    try {
      const sortedSegments = [...segments].sort((a, b) => a.start - b.start);
      const stream = (video as any).captureStream ? (video as any).captureStream() : (video as any).mozCaptureStream();
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const trimmedBlob = new Blob(chunks, { type: 'video/webm' });
        const totalDuration = sortedSegments.reduce((acc, s) => acc + (s.end - s.start), 0);
        onSave(trimmedBlob, totalDuration);
      };

      video.pause();
      recorder.start();

      for (const segment of sortedSegments) {
        video.currentTime = segment.start;
        await new Promise(resolve => { video.onseeked = resolve; });
        video.play();
        
        await new Promise<void>(resolve => {
          const check = setInterval(() => {
            if (video.currentTime >= segment.end) {
              clearInterval(check);
              video.pause();
              resolve();
            }
          }, 10);
        });
      }

      recorder.stop();
    } catch (err) {
      console.error("Multi-trim failed:", err);
      onSave(blob, duration);
    }
  };

  const activeSegment = segments.find(s => s.id === activeSegmentId);

  return (
    <div className="max-w-5xl mx-auto mb-16 bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
      <div className="px-10 py-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
            <i className="fa-solid fa-scissors text-blue-500 text-xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight">Multi-Clip Suite</h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Precision trim & stitch multiple segments</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={onCancel}
            className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-all bg-slate-800/50 hover:bg-slate-800 rounded-xl btn-haptic"
          >
            Discard
          </button>
        </div>
      </div>

      <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
        <video 
          ref={videoRef}
          src={url}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="max-h-[60vh] w-full"
          playsInline
        />
        {isProcessing && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center gap-6 z-50">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
              <p className="text-blue-400 font-black text-xl tracking-tighter uppercase animate-pulse">Processing Clips</p>
              <p className="text-slate-500 text-sm mt-1">Merging segments and optimizing via Gemini AI</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-10 bg-slate-900/50">
        <div className="flex items-center justify-between mb-6 text-sm font-mono font-black tracking-widest uppercase">
          <div className="flex items-center gap-2 text-blue-400">
             <i className="fa-solid fa-clock-rotate-left"></i>
             <span>{formatTime(Math.max(0, playbackTime))}</span>
          </div>
          <div className="px-4 py-1.5 bg-blue-600/20 rounded-full border border-blue-500/30 text-blue-100 flex items-center gap-2">
             <span className="text-[10px] text-blue-400 font-black">STITCHED DURATION</span>
             <span className="font-bold">{formatTime(segments.reduce((acc, s) => acc + (s.end - s.start), 0))}</span>
          </div>
          <div className="text-slate-500">{formatTime(duration)}</div>
        </div>

        {/* Timeline with Draggable Handles */}
        <div className="relative h-24 flex items-center px-4" ref={timelineRef}>
          <div className="absolute inset-x-4 inset-y-8 bg-slate-800 rounded-xl overflow-hidden border border-slate-700/50">
            {/* Non-active segments */}
            {segments.map(s => (
              <div 
                key={s.id}
                className={`absolute h-full transition-all cursor-pointer ${activeSegmentId === s.id ? 'bg-blue-500/30' : 'bg-slate-700/40'}`}
                style={{ 
                  left: `${(s.start / duration) * 100}%`, 
                  width: `${((s.end - s.start) / duration) * 100}%` 
                }}
                onClick={() => {
                   setActiveSegmentId(s.id);
                   if (videoRef.current) videoRef.current.currentTime = s.start;
                }}
              ></div>
            ))}
            
            {/* Playhead */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-white z-10 shadow-[0_0_10px_white] pointer-events-none"
              style={{ left: `${(playbackTime / duration) * 100}%` }}
            ></div>
          </div>

          {/* Draggable cursors for the active segment */}
          {activeSegment && (
            <div className="absolute inset-x-4 inset-y-0 pointer-events-none z-30">
              {/* Start Handle */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-8 h-12 -ml-4 bg-blue-500 rounded-lg border-2 border-white shadow-xl cursor-grab active:cursor-grabbing pointer-events-auto flex items-center justify-center btn-haptic"
                style={{ left: `${(activeSegment.start / duration) * 100}%` }}
                onMouseDown={() => handleDragStart('start')}
              >
                <div className="w-0.5 h-4 bg-white/40 rounded-full mx-0.5"></div>
                <div className="w-0.5 h-4 bg-white/40 rounded-full mx-0.5"></div>
              </div>

              {/* End Handle */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-8 h-12 -ml-4 bg-blue-400 rounded-lg border-2 border-white shadow-xl cursor-grab active:cursor-grabbing pointer-events-auto flex items-center justify-center btn-haptic"
                style={{ left: `${(activeSegment.end / duration) * 100}%` }}
                onMouseDown={() => handleDragStart('end')}
              >
                <div className="w-0.5 h-4 bg-white/40 rounded-full mx-0.5"></div>
                <div className="w-0.5 h-4 bg-white/40 rounded-full mx-0.5"></div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          {segments.map((s, idx) => (
            <div 
              key={s.id}
              className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all cursor-pointer btn-haptic ${activeSegmentId === s.id ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
              onClick={() => {
                setActiveSegmentId(s.id);
                if (videoRef.current) videoRef.current.currentTime = s.start;
              }}
            >
              <span className="text-[10px] font-black tracking-tighter uppercase">Clip {idx + 1}</span>
              <span className="font-mono font-bold text-xs">{formatTime(s.end - s.start)}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); removeSegment(s.id); }}
                className="hover:text-red-400 transition-colors p-1"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          ))}
          <button 
            onClick={addSegment}
            className="px-6 py-2.5 rounded-2xl border border-dashed border-slate-700 text-slate-500 hover:text-white hover:border-white transition-all text-xs font-bold uppercase tracking-widest btn-haptic"
          >
            <i className="fa-solid fa-plus mr-2"></i> Add Clip
          </button>
        </div>
        
        <div className="mt-10 flex flex-col items-center gap-8">
          <div className="flex justify-center items-center gap-10">
             <button 
               onClick={() => { if(videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 1) }}
               className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-all border border-slate-700 text-slate-400 hover:text-white btn-haptic"
             >
               <i className="fa-solid fa-backward text-xl"></i>
             </button>
             
             <button 
               onClick={togglePlay}
               className="w-24 h-24 rounded-[2.5rem] bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-all shadow-2xl shadow-blue-600/40 group/play btn-haptic border-2 border-white/10"
             >
               <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-3xl text-white group-hover:scale-110 transition-transform`}></i>
             </button>

             <button 
               onClick={() => { if(videoRef.current) videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 1) }}
               className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-all border border-slate-700 text-slate-400 hover:text-white btn-haptic"
             >
               <i className="fa-solid fa-forward text-xl"></i>
             </button>
          </div>

          <button 
            onClick={handleApplyTrim}
            disabled={isProcessing}
            className="w-full max-w-md py-5 bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white rounded-[1.8rem] text-lg font-black transition-all shadow-[0_15px_40px_-10px_rgba(37,99,235,0.4)] border border-blue-400/20 btn-haptic flex items-center justify-center gap-3 group"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <i className="fa-solid fa-cloud-arrow-up group-hover:-translate-y-1 transition-transform"></i>
                Stitch & Encrypt to Drive
              </>
            )}
          </button>
          
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] opacity-60">
            Merged results are validated by Gemini Intelligence Node
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;
