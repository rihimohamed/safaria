import React from 'react';

const CTASection = () => {
    return (
        <section className="py-16 sm:py-20 md:py-32 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 relative z-10 text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-on-surface font-headline tracking-tighter mb-4 sm:mb-6">Ready to start your next voyage?</h2>
                    <p className="text-base sm:text-lg md:text-xl text-on-surface-variant mb-8 sm:mb-12 px-4">Join an exclusive circle of intelligent travelers and redefine how you see the world.</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0">
                        <input 
                            className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-full border-none bg-surface-container text-on-surface w-full sm:w-80 focus:ring-2 focus:ring-primary/20 transition-all text-sm sm:text-base" 
                            placeholder="Enter your email" 
                            type="email"
                        />
                        <button className="bg-primary text-white px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg shadow-lg shadow-teal-900/20 hover:bg-primary-container transition-all">
                            Get Early Access
                        </button>
                    </div>
                    <p className="text-[10px] sm:text-xs text-on-surface-variant mt-6 sm:mt-8 opacity-60 uppercase tracking-widest font-label">Limited beta invitations sent weekly</p>
                </div>
            </div>
            
            {/* Abstract background shapes */}
            <div className="absolute -top-24 -left-24 w-64 sm:w-96 h-64 sm:h-96 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 w-64 sm:w-96 h-64 sm:h-96 bg-tertiary/5 rounded-full blur-3xl"></div>
        </section>
    );
};

export default CTASection;
