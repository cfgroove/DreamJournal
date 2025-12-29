
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Recorder from './components/Recorder';
import DreamDetail from './components/DreamDetail';
import { Dream, ChatMessage, ImageSize } from './types';
import { transcribeAndAnalyzeDream, generateDreamImage } from './services/geminiService';
import { Key, Ghost, History, ChevronRight, Sparkles } from 'lucide-react';

// Fixing TypeScript conflict: Using the pre-defined AIStudio type and ensuring modifiers match.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const App: React.FC = () => {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [currentDreamId, setCurrentDreamId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'add' | 'detail'>('list');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkKey();
    
    // Load from local storage
    const saved = localStorage.getItem('oneiros_dreams');
    if (saved) {
      setDreams(JSON.parse(saved));
    }
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume the key selection was successful after triggering openSelectKey to mitigate race conditions
      setHasApiKey(true);
    }
  };

  const handleRecordingComplete = async (audioBase64: string, size: ImageSize) => {
    setIsProcessing(true);
    try {
      // 1. Transcription and Analysis
      const { transcript, analysis } = await transcribeAndAnalyzeDream(audioBase64);
      
      const newDream: Dream = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        transcript,
        analysis,
        chatHistory: [],
      };

      // 2. Initial state update to show transcript and entry
      setCurrentDreamId(newDream.id);
      setView('detail');
      
      setDreams(prev => {
        const next = [...prev, newDream];
        localStorage.setItem('oneiros_dreams', JSON.stringify(next));
        return next;
      });

      // 3. Generate Image (Pro Model)
      try {
        const imageUrl = await generateDreamImage(analysis, size);
        setDreams(prev => {
          const next = prev.map(d => d.id === newDream.id ? { ...d, imageUrl } : d);
          localStorage.setItem('oneiros_dreams', JSON.stringify(next));
          return next;
        });
      } catch (err) {
        console.error("Image generation failed:", err);
      }
    } catch (err: any) {
      console.error(err);
      // Reset key selection state if the requested entity was not found
      if (err.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
        alert("API Key error. Please re-select your key.");
      } else {
        alert("An error occurred while manifesting your dream.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const updateChat = (dreamId: string, newMessage: ChatMessage) => {
    setDreams(prev => {
      const next = prev.map(d => 
        d.id === dreamId ? { ...d, chatHistory: [...d.chatHistory, newMessage] } : d
      );
      localStorage.setItem('oneiros_dreams', JSON.stringify(next));
      return next;
    });
  };

  const currentDream = dreams.find(d => d.id === currentDreamId);

  if (!hasApiKey) {
    return (
      <div className="min-h-screen dream-gradient flex flex-col items-center justify-center p-6 text-center">
        <div className="glass p-12 rounded-[3rem] max-w-lg space-y-8 border-indigo-500/20 shadow-2xl">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-indigo-500/20 rounded-2xl">
              <Key className="w-12 h-12 text-indigo-400" />
            </div>
            <h1 className="text-4xl font-serif font-bold text-white">Unlock the Unconscious</h1>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Oneiros requires a Gemini Pro API key from a paid GCP project to generate high-resolution surrealist images and perform deep psychological analysis.
          </p>
          <div className="space-y-4">
            <button
              onClick={handleSelectKey}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/20 text-lg"
            >
              Select Pro API Key
            </button>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block text-xs text-indigo-400 hover:underline"
            >
              Learn about Gemini API billing
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      onAddClick={() => setView('add')} 
      onHomeClick={() => setView('list')}
    >
      {view === 'list' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h2 className="text-3xl font-serif font-bold text-slate-100 flex items-center gap-3">
                <History className="w-8 h-8 text-indigo-400" />
                Journal Entries
              </h2>
              <p className="text-slate-400 text-sm">Your subconscious library of {dreams.length} recorded visions.</p>
            </div>
          </div>

          {dreams.length === 0 ? (
            <div className="glass rounded-[3rem] p-16 flex flex-col items-center justify-center text-center gap-6 border-dashed border-2 border-indigo-500/10">
              <div className="p-6 bg-slate-800/50 rounded-full">
                <Ghost className="w-16 h-16 text-slate-700" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-300">No dreams recorded yet</h3>
                <p className="text-slate-500 max-w-sm">
                  Record your first dream immediately upon waking to start building your psychological map.
                </p>
              </div>
              <button 
                onClick={() => setView('add')}
                className="mt-4 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold shadow-lg shadow-indigo-500/20 transition-all"
              >
                Capture a Dream
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dreams.map((dream) => (
                <div 
                  key={dream.id}
                  onClick={() => {
                    setCurrentDreamId(dream.id);
                    setView('detail');
                  }}
                  className="glass rounded-3xl overflow-hidden border-white/5 group cursor-pointer hover:border-indigo-500/30 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10"
                >
                  <div className="aspect-video relative overflow-hidden bg-slate-900">
                    {dream.imageUrl ? (
                      <img src={dream.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Dream preview" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-indigo-500/30 animate-pulse" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-3 left-4 right-4 flex justify-between items-center">
                      <span className="text-[10px] text-slate-300 bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
                        {new Date(dream.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <h3 className="font-serif font-bold text-slate-100 line-clamp-1">
                      {dream.analysis?.emotionalTheme || "Unanalyzed Vision"}
                    </h3>
                    <p className="text-sm text-slate-400 line-clamp-2 italic leading-relaxed">
                      "{dream.transcript}"
                    </p>
                    <div className="flex items-center text-xs text-indigo-400 font-bold gap-1 group-hover:gap-2 transition-all">
                      View Interpretation <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'add' && (
        <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
          <Recorder 
            onRecordingComplete={handleRecordingComplete} 
            isProcessing={isProcessing} 
          />
        </div>
      )}

      {view === 'detail' && currentDream && (
        <DreamDetail 
          dream={currentDream} 
          onUpdateChat={updateChat} 
        />
      )}
    </Layout>
  );
};

export default App;
