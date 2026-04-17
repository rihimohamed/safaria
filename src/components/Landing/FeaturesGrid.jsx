import React from 'react';

const FeaturesGrid = () => {
    return (
        <>
            {/* Features Bento Grid */}
            <section className="py-16 sm:py-20 md:py-32 bg-surface relative">
                <div className="absolute inset-0 moroccan-pattern z-0 pointer-events-none"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-20 gap-6 md:gap-8">
                        <div className="max-w-xl">
                            <h2 className="text-sm font-bold text-tertiary tracking-widest uppercase mb-3 md:mb-4 font-label">The SafarAI Advantage</h2>
                            <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-on-surface font-headline tracking-tighter">Intelligent Exploration</h3>
                        </div>
                        <p className="text-on-surface-variant max-w-sm text-base md:text-lg leading-relaxed">
                            Moving beyond simple booking into the realm of hyper-personalized curation.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
                        {/* Feature 1 */}
                        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl shadow-[0_12px_32px_rgba(25,28,28,0.06)] flex flex-col h-full border-t-4 border-primary">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-5 sm:mb-6">
                                <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
                            </div>
                            <h4 className="text-lg sm:text-xl font-bold text-on-surface mb-3 sm:mb-4 font-headline tracking-tight">AI-Powered Planning</h4>
                            <p className="text-on-surface-variant leading-relaxed text-sm sm:text-base">Our neural networks craft itineraries that adapt to your mood and pace in real-time.</p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-surface-container-low p-6 sm:p-8 rounded-2xl flex flex-col h-full">
                            <div className="w-12 h-12 bg-teal-600/10 rounded-full flex items-center justify-center mb-5 sm:mb-6">
                                <span className="material-symbols-outlined text-teal-600 text-3xl">thermostat</span>
                            </div>
                            <h4 className="text-lg sm:text-xl font-bold text-on-surface mb-3 sm:mb-4 font-headline tracking-tight">Weather Intelligence</h4>
                            <p className="text-on-surface-variant leading-relaxed text-sm sm:text-base">Hyper-local climate predictions ensure your adventure never meets a rainy surprise.</p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl shadow-[0_12px_32px_rgba(25,28,28,0.06)] flex flex-col h-full border-t-4 border-tertiary">
                            <div className="w-12 h-12 bg-tertiary/10 rounded-full flex items-center justify-center mb-5 sm:mb-6">
                                <span className="material-symbols-outlined text-tertiary text-3xl">explore</span>
                            </div>
                            <h4 className="text-lg sm:text-xl font-bold text-on-surface mb-3 sm:mb-4 font-headline tracking-tight">Destination Discovery</h4>
                            <p className="text-on-surface-variant leading-relaxed text-sm sm:text-base">Uncover hidden gems that aren't on any public map, curated for your specific taste.</p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-surface-container-low p-6 sm:p-8 rounded-2xl flex flex-col h-full">
                            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-5 sm:mb-6">
                                <span className="material-symbols-outlined text-secondary text-3xl">inventory_2</span>
                            </div>
                            <h4 className="text-lg sm:text-xl font-bold text-on-surface mb-3 sm:mb-4 font-headline tracking-tight">Smart Packing</h4>
                            <p className="text-on-surface-variant leading-relaxed text-sm sm:text-base">AI-generated gear lists based on your destination's terrain and local events.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Secondary Visual Section */}
            <section className="py-16 sm:py-20 md:py-32 bg-surface-container-lowest overflow-hidden relative border-t border-stone-200/50">
                <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] z-0 pointer-events-none"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center relative z-10">
                    <div className="relative">
                        <img 
                            className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] object-cover moroccan-arch shadow-[0_20px_40px_rgba(0,104,94,0.15)] ring-4 ring-white" 
                            alt="Beautiful Moroccan Riad Courtyard" 
                            src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000&auto=format&fit=crop"
                        />
                        {/* Testimonial - visible on tablet+ */}
                        <div className="absolute -bottom-8 -right-8 bg-white p-6 sm:p-8 rounded-t-[2rem] rounded-b-xl shadow-[0_12px_32px_rgba(25,28,28,0.08)] max-w-xs hidden md:block border border-primary/10">
                            <div className="flex items-center gap-1 text-tertiary mb-2">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className="material-symbols-outlined text-lg" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                                ))}
                            </div>
                            <p className="text-on-surface font-semibold font-headline italic text-sm sm:text-base">"The AI recommended a tiny rooftop spot in the Fes Medina that wasn't on any blog. It was the absolute highlight of our trip."</p>
                            <p className="text-sm text-on-surface-variant mt-3 sm:mt-4">— Elena G., Professional Nomad</p>
                        </div>

                        {/* Testimonial - mobile only (below image) */}
                        <div className="md:hidden mt-6 bg-white p-5 rounded-t-[1.5rem] rounded-b-lg shadow-sm border border-stone-100">
                            <div className="flex items-center gap-1 text-tertiary mb-2">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className="material-symbols-outlined text-base" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                                ))}
                            </div>
                            <p className="text-on-surface font-semibold font-headline italic text-sm">"The AI recommended a tiny rooftop spot in the Fes Medina that wasn't on any blog. It was the absolute highlight of our trip."</p>
                            <p className="text-xs text-on-surface-variant mt-3">— Elena G., Professional Nomad</p>
                        </div>
                    </div>

                    <div className="mt-4 lg:mt-0">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-on-surface font-headline mb-6 sm:mb-8 leading-tight">The Future of Wandering is Already Here</h2>
                        <p className="text-base sm:text-lg text-on-surface-variant mb-6 sm:mb-8 leading-relaxed">
                            Traditional travel planning is static. SafarAI is dynamic. By analyzing global data trends, weather patterns, and your unique historical preferences, we don't just book a flight; we engineer a memory.
                        </p>
                        <ul className="space-y-5 sm:space-y-6">
                            <li className="flex gap-3 sm:gap-4 items-start">
                                <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                                <div>
                                    <span className="block font-bold text-on-surface font-headline text-sm sm:text-base">Zero-Friction Logistics</span>
                                    <span className="text-on-surface-variant text-sm sm:text-base">Real-time adjustments to your schedule based on transit delays.</span>
                                </div>
                            </li>
                            <li className="flex gap-3 sm:gap-4 items-start">
                                <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                                <div>
                                    <span className="block font-bold text-on-surface font-headline text-sm sm:text-base">Cultural Sensitivity AI</span>
                                    <span className="text-on-surface-variant text-sm sm:text-base">Instant tips on local etiquette and phrasing as you cross borders.</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>
        </>
    );
};

export default FeaturesGrid;
