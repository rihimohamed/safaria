import React from 'react';
import Navbar from '../components/Landing/Navbar';
import HeroSection from '../components/Landing/HeroSection';
import FeaturesGrid from '../components/Landing/FeaturesGrid';
import CTASection from '../components/Landing/CTASection';
import Footer from '../components/Landing/Footer';

export default function Landing() {
    return (
        <div className="bg-surface font-body text-on-background selection:bg-primary-container/30">
            <Navbar />
            <main>
                <HeroSection />
                <FeaturesGrid />
                <CTASection />
            </main>
            <Footer />
        </div>
    );
}
