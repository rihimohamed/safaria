import React from 'react';

const Footer = () => {
    return (
        <footer className="w-full py-8 sm:py-10 md:py-12 px-4 sm:px-6 md:px-8 bg-surface-container-low dark:bg-stone-900">
            <div className="flex flex-col gap-6 md:flex-row md:justify-between md:items-center max-w-7xl mx-auto">
                <div className="flex items-center gap-3 justify-center md:justify-start">
                    <img src="/logo.png" alt="SafarAI Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                    <span className="text-base sm:text-lg font-bold text-teal-700 uppercase tracking-widest font-headline">SafarAI</span>
                </div>
                
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8">
                    <a className="text-stone-500 hover:text-teal-700 hover:underline transition-all font-headline text-xs sm:text-sm tracking-wide" href="#">Journal</a>
                    <a className="text-stone-500 hover:text-teal-700 hover:underline transition-all font-headline text-xs sm:text-sm tracking-wide" href="#">Contact</a>
                    <a className="text-stone-500 hover:text-teal-700 hover:underline transition-all font-headline text-xs sm:text-sm tracking-wide" href="#">Privacy Policy</a>
                    <a className="text-stone-500 hover:text-teal-700 hover:underline transition-all font-headline text-xs sm:text-sm tracking-wide" href="#">Terms of Service</a>
                </div>
                
                <div className="text-stone-500 font-headline text-xs sm:text-sm tracking-wide text-center md:text-right">
                    © 2024 SafarAI. The Art of Intelligent Travel.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
