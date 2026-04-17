import React from 'react';
import { Link } from 'react-router-dom';

const MobileHeader = () => {
    return (
        <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur-md flex justify-between items-center px-4 h-16 shadow-sm border-b border-stone-200/30">
            <div className="flex items-center gap-3">
                <button className="text-stone-500 hover:bg-stone-200/50 p-2 rounded-full transition-transform active:scale-95">
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <Link to="/dashboard" className="flex items-center gap-2">
                    <img src="/logo.png" alt="SafarAI Logo" className="w-14 h-14 object-contain" />
                    <span className="text-xl font-bold text-teal-800 dark:text-teal-200 font-headline tracking-tight">SafarAI</span>
                </Link>
            </div>
            
            <div className="flex items-center gap-2">
                <button className="text-stone-500 p-2 rounded-full relative hover:bg-stone-200/50 transition-colors">
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/20 ml-1">
                    <img src="/avatar.png" alt="Profile" className="w-full h-full object-cover" />
                </div>
            </div>
        </header>
    );
};

export default MobileHeader;
