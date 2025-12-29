
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles, Brain, Image as ImageIcon, MessageSquare, Info } from 'lucide-react';
import { Dream, ChatMessage } from '../types';
import { chatAboutDream } from '../services/geminiService';

interface DreamDetailProps {
  dream: Dream;
  onUpdateChat: (id: string, newMessage: ChatMessage) => void;
}

const DreamDetail: React.FC<DreamDetailProps> = ({ dream, onUpdateChat }) => {
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [dream.chatHistory, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userMsg: ChatMessage = { role: 'user', parts: [{ text: chatInput }] };
    onUpdateChat(dream.id, userMsg);
    setChatInput('');
    setIsTyping(true);

    try {
      const responseText = await chatAboutDream(
        `Summary: ${dream.analysis?.summary}. Transcript: ${dream.transcript}`,
        dream.chatHistory,
        chatInput
      );
      const modelMsg: ChatMessage = { role: 'model', parts: [{ text: responseText }] };
      onUpdateChat(dream.id, modelMsg);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-8">
        {/* Surreal Image */}
        <div className="glass rounded-3xl overflow-hidden border-white/10 shadow-2xl aspect-square relative group">
          {dream.imageUrl ? (
            <img 
              src={dream.imageUrl} 
              alt="Dream visualization" 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 gap-4">
              <ImageIcon className="w-12 h-12 text-slate-700 animate-pulse" />
              <p className="text-slate-600 italic">Painting the vision...</p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
            <p className="text-white text-sm italic font-serif">"{dream.analysis?.emotionalTheme}"</p>
          </div>
        </div>

        {/* Interpretation Section */}
        <div className="glass rounded-3xl p-6 border-indigo-500/10 space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-4">
            <Brain className="w-6 h-6 text-indigo-400" />
            <h3 className="text-xl font-serif font-bold text-slate-100">Psychological Analysis</h3>
          </div>

          <section className="space-y-4">
            <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
              <h4 className="text-xs uppercase tracking-widest text-indigo-400 font-bold mb-2">Core Essence</h4>
              <p className="text-slate-300 leading-relaxed italic">{dream.analysis?.summary}</p>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-widest text-violet-400 font-bold mb-3 flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> Archetypes Present
              </h4>
              <div className="flex flex-wrap gap-2">
                {dream.analysis?.archetypes.map((arch, i) => (
                  <div key={i} className="group relative">
                    <span className="px-3 py-1 bg-slate-800/80 rounded-full text-xs font-medium text-slate-300 border border-slate-700 cursor-help">
                      {arch.name}
                    </span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-slate-900 rounded-xl text-[10px] text-slate-400 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                      {arch.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <h4 className="text-xs uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-2">
                <MessageSquare className="w-3 h-3" /> Key Symbols
              </h4>
              {dream.analysis?.keySymbols.map((item, i) => (
                <div key={i} className="flex gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/5">
                  <span className="text-lg text-emerald-400 font-serif font-bold">#</span>
                  <div>
                    <span className="font-bold text-slate-200 block text-sm">{item.symbol}</span>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1">{item.interpretation}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="flex flex-col h-[600px] lg:h-auto lg:max-h-screen sticky lg:top-24 gap-6">
        {/* Chat Interface */}
        <div className="glass rounded-3xl flex flex-col flex-1 overflow-hidden border-indigo-500/10 shadow-2xl">
          <div className="p-4 bg-slate-800/50 border-b border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Symbol Chat</h3>
              <p className="text-[10px] text-slate-500">Discuss specific symbols with the Analyst</p>
            </div>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
          >
            {dream.chatHistory.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-40">
                <Info className="w-8 h-8 text-indigo-400" />
                <p className="text-sm">Ask about a specific object, person, or feeling from your dream to uncover deeper meaning.</p>
              </div>
            )}
            {dream.chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-indigo-300" />}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-slate-800/80 text-slate-300 border border-white/5 rounded-tl-none'
                  }`}>
                    {msg.parts[0].text}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-indigo-300" />
                  </div>
                  <div className="bg-slate-800/80 p-4 rounded-2xl border border-white/5 rounded-tl-none">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-100" />
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-slate-800/30">
            <div className="relative flex items-center">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about a symbol..."
                className="w-full bg-slate-900 border border-white/10 rounded-full py-3 px-6 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isTyping}
                className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-all disabled:opacity-50 disabled:bg-slate-700"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Transcript Card */}
        <div className="glass rounded-3xl p-6 border-white/5">
          <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-3">Original Transcript</h4>
          <p className="text-sm text-slate-400 italic font-serif leading-relaxed line-clamp-4 hover:line-clamp-none transition-all cursor-pointer">
            "{dream.transcript}"
          </p>
        </div>
      </div>
    </div>
  );
};

export default DreamDetail;
