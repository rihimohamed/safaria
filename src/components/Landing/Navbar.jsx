import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl transition-colors duration-300">
            <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 md:px-8 py-3 md:py-4">
                <Link to="/" className="flex items-center gap-2">
                    <img src="/logo.png" alt="SafarAI Logo" className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain" />
                    <span className="text-xl sm:text-2xl font-bold text-teal-700 tracking-tighter font-headline">SafarAI</span>
                </Link>

                <div className="hidden md:flex items-center gap-8">
                    <a className="text-teal-700 font-semibold border-b-2 border-teal-700 pb-1 font-headline tracking-tight" href="#">Exploration</a>
                    <a className="text-stone-500 hover:text-teal-700 transition-colors font-headline tracking-tight" href="#">Weather</a>
                    <a className="text-stone-500 hover:text-teal-700 transition-colors font-headline tracking-tight" href="#">Destinations</a>
                    <a className="text-stone-500 hover:text-teal-700 transition-colors font-headline tracking-tight" href="#">Packing</a>
                </div>

                <div className="flex items-center gap-3">
                    <Link 
                        to="/login" 
                        className="hidden sm:inline-flex bg-primary hover:bg-primary-container text-white px-5 md:px-6 py-2 md:py-2.5 rounded-full font-semibold transition-all active:scale-95 font-headline tracking-tight shadow-sm text-sm md:text-base"
                    >
                        Start Journey
                    </Link>
                    
                    {/* Mobile hamburger */}
                    <button 
                        className="md:hidden p-2 text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        <span className="material-symbols-outlined text-2xl">{mobileOpen ? 'close' : 'menu'}</span>
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileOpen && (
                <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-stone-100 px-6 py-6 space-y-4 animate-[fadeIn_0.2s_ease-out]">
                    <a className="block text-teal-700 font-semibold font-headline tracking-tight py-2" href="#">Exploration</a>
                    <a className="block text-stone-500 hover:text-teal-700 transition-colors font-headline tracking-tight py-2" href="#">Weather</a>
                    <a className="block text-stone-500 hover:text-teal-700 transition-colors font-headline tracking-tight py-2" href="#">Destinations</a>
                    <a className="block text-stone-500 hover:text-teal-700 transition-colors font-headline tracking-tight py-2" href="#">Packing</a>
                    <Link 
                        to="/login" 
                        className="block w-full text-center bg-primary text-white px-6 py-3 rounded-full font-semibold font-headline mt-4"
                    >
                        Start Journey
                    </Link>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
