
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, Wand2 } from 'lucide-react';
import { ImageSize } from '../types';

interface RecorderProps {
  onRecordingComplete: (audioBase64: string, size: ImageSize) => void;
  isProcessing: boolean;
}

const Recorder: React.FC<RecorderProps> = ({ onRecordingComplete, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    if (isRecording || isProcessing) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          if (result && result.includes(',')) {
            const base64Audio = result.split(',')[1];
            onRecordingComplete(base64Audio, imageSize);
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Please grant microphone permissions to record your dream.");
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 py-12 px-6 glass rounded-3xl border-indigo-500/20 shadow-2xl">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-serif font-bold text-slate-100">Record Your Dream</h2>
        <p className="text-slate-400 max-w-md">
          Speak clearly about the events, emotions, and symbols you remember from your dream. 
          The fresh details are the most potent.
        </p>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center w-32 h-32">
          {isRecording && (
            <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping pointer-events-none" />
          )}
          <button
            onClick={handleToggle}
            disabled={isProcessing}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
            className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 ring-4 ring-red-500/20' 
                : 'bg-indigo-600 hover:bg-indigo-500 ring-4 ring-indigo-600/20'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
          >
            {isRecording ? (
              <Square className="w-10 h-10 text-white fill-current" />
            ) : (
              <Mic className="w-10 h-10 text-white" />
            )}
          </button>
        </div>

        {isRecording && (
          <div className="text-2xl font-mono text-red-400 font-bold">
            {formatTime(recordingTime)}
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center gap-3 text-indigo-300 font-medium bg-indigo-500/10 px-6 py-3 rounded-full border border-indigo-500/20">
            <Loader2 className="w-5 h-5 animate-spin" />
            Transcribing and manifesting your vision...
          </div>
        )}
      </div>

      {!isRecording && !isProcessing && (
        <div className="w-full max-w-sm space-y-4">
          <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            Visions Resolution (Image Size)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['1K', '2K', '4K'] as ImageSize[]).map((size) => (
              <button
                key={size}
                onClick={() => setImageSize(size)}
                className={`py-2 px-4 rounded-xl text-sm font-semibold transition-all border ${
                  imageSize === size 
                    ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 shadow-inner' 
                    : 'bg-slate-800/40 border-slate-700 text-slate-500 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 text-center">
            Higher resolutions provide more surreal detail but take longer to manifest.
          </p>
        </div>
      )}
    </div>
  );
};

export default Recorder;
