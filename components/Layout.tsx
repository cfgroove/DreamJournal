
import React from 'react';
import { Moon, Star, Book, PlusCircle } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onAddClick: () => void;
  onHomeClick: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onAddClick, onHomeClick }) => {
  return (
    <div className="min-h-screen flex flex-col dream-gradient">
      <header className="sticky top-0 z-50 glass border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={onHomeClick}
        >
          <div className="p-2 bg-indigo-500/20 rounded-lg group-hover:bg-indigo-500/30 transition-colors">
            <Moon className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-serif font-bold tracking-tight bg-gradient-to-r from-indigo-200 to-violet-300 bg-clip-text text-transparent">
            Oneiros
          </h1>
        </div>
        
        <nav className="flex gap-4">
          <button 
            onClick={onHomeClick}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <Book className="w-6 h-6" />
          </button>
          <button 
            onClick={onAddClick}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-medium transition-all shadow-lg shadow-indigo-500/20"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="hidden sm:inline">New Dream</span>
          </button>
        </nav>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8">
        {children}
      </main>

      <footer className="p-8 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
        <Star className="w-4 h-4 text-indigo-500/40" />
        <span>Dive deep into your unconscious.</span>
        <Star className="w-4 h-4 text-indigo-500/40" />
      </footer>
    </div>
  );
};

export default Layout;
