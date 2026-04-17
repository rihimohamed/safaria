import React, { useState } from 'react';
import { ArrowRight, Globe, Zap, Shield } from 'lucide-react';
import './Onboarding.css';

export default function Onboarding() {
  const [slide, setSlide] = useState(0);

  const slides = [
    { title: "Welcome to SafarAI", desc: "Your intelligent travel companion.", icon: <Globe size={64} style={{ color: "var(--primary)" }} /> },
    { title: "AI-Powered", desc: "Get smart recommendations and optimize itineraries.", icon: <Zap size={64} style={{ color: "var(--accent)" }} /> },
    { title: "Stress-Free", desc: "We plan. You pack. Explore the world effortlessly.", icon: <Shield size={64} style={{ color: "var(--secondary)" }} /> }
  ];

  const handleNext = () => {
    if (slide < slides.length - 1) setSlide(slide + 1);
    else window.location.href = '/login'; 
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-bg"></div>
      <div className="onboarding-content glass">
        <div className="slide-icon-wrapper">
          {slides[slide].icon}
        </div>
        <h1>{slides[slide].title}</h1>
        <p>{slides[slide].desc}</p>
        
        <div className="slide-indicators">
          {slides.map((_, i) => (
            <div key={i} className={`indicator ${i === slide ? 'active' : ''}`} />
          ))}
        </div>

        <button className="get-started-btn primary-btn" onClick={handleNext}>
          {slide === slides.length - 1 ? 'Get Started' : 'Continue'} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
