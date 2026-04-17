import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGeminiResponse } from '../services/gemini';
import { supabase } from '../lib/supabase';

const FloatingChat = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    // Draggable State
    const [dragOffset, setDragPos] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });
    const dragHasMoved = useRef(false);

    const handlePointerDown = (e) => {
        isDragging.current = true;
        dragHasMoved.current = false;
        startPos.current = { 
            x: e.clientX - dragOffset.x, 
            y: e.clientY - dragOffset.y 
        };
        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
    };

    const handlePointerMove = (e) => {
        if (!isDragging.current) return;
        dragHasMoved.current = true;
        setDragPos({
            x: e.clientX - startPos.current.x,
            y: e.clientY - startPos.current.y
        });
    };

    const handlePointerUp = () => {
        isDragging.current = false;
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
    };

    const handleClickTrigger = (e) => {
        if (dragHasMoved.current) {
            e.preventDefault();
            e.stopPropagation();
            dragHasMoved.current = false;
            return;
        }
        setIsOpen(true);
    };

    const suggestions = [
        '🏔️ Things to do in Ifrane',
        '🕌 Explore Fes Medina',
        '🌅 Best beaches near Essaouira'
    ];

    // Check auth state on mount
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const loggedIn = !!session;
            setIsAuthenticated(loggedIn);
            setMessages([{
                id: 1,
                role: 'ai',
                text: loggedIn 
                    ? "Welcome back! I'm your SafarAI concierge. Where shall we venture next? I've been curating some spring escapes that match your preferences."
                    : "Merhba! 👋 I'm SafarAI, your Moroccan travel guide. Ask me anything about Morocco — I'll give you a taste of what's possible! Sign up for the full experience.",
                time: 'Just now'
            }]);
        };
        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session);
        });
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async (text) => {
        const messageText = text || input;
        if (!messageText.trim() || isLoading) return;

        // Add user message
        const userMsg = {
            id: Date.now(),
            role: 'user',
            text: messageText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const aiResponse = await getGeminiResponse(messageText, { isAuthenticated });
            
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'ai',
                text: aiResponse.text || `I've put together some thoughts on ${aiResponse.destination || 'your request'}.`,
                data: aiResponse,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } catch (error) {
            console.error('Chat Error:', error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'ai',
                text: `I'm sorry, I'm having a bit of trouble connecting to my travel databases. Reference: ${error.message}`,
                error: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const renderWeather = (weather) => {
        if (!weather || !weather.condition) return null;
        return (
            <div className="w-full mt-4 bg-secondary-container p-4 rounded-xl flex items-center justify-between border border-outline-variant/20">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-tertiary text-3xl font-light">partly_cloudy_day</span>
                    <div>
                        <p className="font-label text-[10px] uppercase tracking-widest text-on-secondary-container opacity-80">Weather Check</p>
                        <h3 className="font-headline font-bold text-on-secondary-container">{weather.condition}</h3>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-bold text-on-secondary-container">{weather.temperature}</span>
                </div>
            </div>
        );
    };

    const renderMonuments = (monuments) => {
        if (!monuments || monuments.length === 0) return null;
        return (
            <div className="mt-4 space-y-3">
                {monuments.map((monument, idx) => (
                    <div key={idx} className="w-full bg-white rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden transform hover:-translate-y-0.5 transition-transform duration-300">
                        {monument.image_url ? (
                            <img src={monument.image_url} alt={monument.name} className="w-full h-32 object-cover" />
                        ) : null}
                        <div className="p-4">
                            <h4 className="font-headline font-bold text-primary mb-1">{monument.name}</h4>
                            <p className="text-stone-500 text-xs leading-relaxed font-body">{monument.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderItinerary = (itinerary) => {
        if (!itinerary || itinerary.length === 0) return null;
        return (
            <div className="mt-4 space-y-4">
                {itinerary.map((day, idx) => (
                    <div key={idx} className="w-full bg-surface-container-low p-5 rounded-xl border border-outline-variant/20">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-tertiary">calendar_today</span>
                                <h4 className="font-headline font-bold text-sm text-on-surface">Day {day.day}</h4>
                            </div>
                            {day.estimated_cost && <span className="text-[10px] uppercase tracking-wider font-bold text-tertiary bg-tertiary/10 px-2 py-1 rounded-sm">{day.estimated_cost}</span>}
                        </div>
                        <div className="space-y-4 relative">
                            <div className="absolute left-[11px] top-4 bottom-2 w-px bg-outline-variant/40"></div>
                            {day.activities.map((act, i) => (
                                <div key={i} className="relative pl-8 flex flex-col">
                                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white ring-4 ring-surface-container-low relative z-10">{i + 1}</div>
                                    <span className="text-xs text-on-surface font-semibold leading-relaxed pt-1.5">{act}</span>
                                </div>
                            ))}
                        </div>
                        {day.notes && <p className="text-[11px] text-stone-500 mt-5 italic leading-relaxed border-t border-outline-variant/20 pt-3">{day.notes}</p>}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            {/* Overlay for mobile to close when clicking outside */}
            <div 
                className={`fixed inset-0 bg-stone-900/10 backdrop-blur-[2px] z-[59] md:hidden transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none delay-200'}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Chat Panel */}
            <div className={`fixed z-[60] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto shadow-2xl' : 'opacity-0 translate-y-[120%] md:translate-y-8 md:scale-95 pointer-events-none'} 
                bottom-0 right-0 w-full h-[90vh] md:h-[750px]
                md:bottom-6 md:right-6 lg:bottom-8 lg:right-8 md:w-[420px] md:max-h-[85vh]`}>
                
                <div className="relative w-full h-full flex flex-col bg-white/70 backdrop-blur-[40px] rounded-t-3xl md:rounded-2xl border border-white/20 overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)]">
                    
                    {/* Header */}
                    <header className="bg-gradient-to-r from-primary to-primary-container p-5 flex items-center justify-between shadow-lg relative z-20 flex-shrink-0">
                        {/* Decorative background shapes */}
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="absolute bottom-0 left-10 -mb-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                        
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="relative">
                                <img src="/avatar.png" alt="SafarAI" className="w-11 h-11 rounded-full border-2 border-primary-fixed-dim object-cover bg-primary/20" />
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-primary rounded-full"></div>
                            </div>
                            <div>
                                <h1 className="font-headline text-white text-base md:text-lg font-bold tracking-tight">SafarAI Concierge</h1>
                                <span className="font-label text-primary-fixed text-[10px] uppercase tracking-widest font-semibold flex items-center gap-1.5 mt-0.5">
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-fixed opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-fixed"></span>
                                    </span>
                                    Online & Ready
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)} 
                            className="p-2 text-white/80 hover:text-white transition-all transform hover:scale-110 active:scale-95"
                        >
                            <span className="material-symbols-outlined font-light">close</span>
                        </button>
                    </header>

                    {/* Messages Area */}
                    <main className="flex-1 overflow-y-auto px-5 py-6 space-y-6 bg-surface/30">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-full animate-fade-in group`}>
                                <div className={`max-w-[90%] md:max-w-[85%] flex flex-col space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`p-4 text-sm leading-relaxed ${
                                        msg.role === 'user' 
                                            ? 'bg-gradient-to-br from-primary to-primary-container text-white rounded-2xl rounded-tr-sm shadow-md' 
                                            : msg.error 
                                                ? 'bg-error-container text-error rounded-2xl rounded-tl-sm border border-error/20'
                                                : 'bg-white/90 text-on-surface rounded-2xl rounded-tl-sm shadow-sm border border-white/60'
                                    }`}>
                                        <div className="whitespace-pre-wrap font-body">{msg.text}</div>
                                        {msg.data && renderWeather(msg.data.weather)}
                                        {msg.data && renderMonuments(msg.data.monuments)}
                                        {msg.data && renderItinerary(msg.data.itinerary)}
                                    </div>
                                    <span className={`text-[9px] text-stone-400 font-medium uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>{msg.time}</span>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-2 justify-start max-w-[85%] animate-fade-in">
                                <div className="bg-white/90 shadow-sm border border-white/60 rounded-2xl rounded-tl-sm px-5 py-4 flex gap-1.5 items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{animationDelay: '0ms'}}></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{animationDelay: '150ms'}}></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{animationDelay: '300ms'}}></span>
                                </div>
                            </div>
                        )}

                        {/* Suggestion Chips — dynamic from last AI response or defaults */}
                        {messages.length === 1 && !isLoading && (
                            <div className="flex flex-wrap gap-2 pt-2 animate-fade-in-up" style={{animationDelay: '300ms', animationFillMode: 'both'}}>
                                {suggestions.map((s, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => handleSend(s)}
                                        className="bg-white border border-outline-variant/30 hover:border-primary px-4 py-2.5 rounded-full text-[12px] font-semibold text-on-surface transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Dynamic suggestion chips from last AI response */}
                        {messages.length > 1 && !isLoading && (() => {
                            const lastAi = [...messages].reverse().find(m => m.role === 'ai' && m.data?.suggestions?.length > 0);
                            if (!lastAi) return null;
                            return (
                                <div className="flex flex-wrap gap-2 pt-2 animate-fade-in-up">
                                    {lastAi.data.suggestions.map((s, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => handleSend(s)}
                                            className="bg-white border border-outline-variant/30 hover:border-primary px-4 py-2.5 rounded-full text-[12px] font-semibold text-on-surface transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            );
                        })()}

                        <div ref={messagesEndRef} className="h-6" />
                    </main>

                    {/* Signup CTA for guests */}
                    {!isAuthenticated && (
                        <div className="mx-4 mb-2 bg-tertiary/10 border border-tertiary/20 px-4 py-2.5 rounded-xl md:rounded-full flex items-center justify-between shadow-sm flex-shrink-0 animate-fade-in">
                            <div className="flex items-center gap-2.5">
                                <span className="material-symbols-outlined text-tertiary text-lg font-bold" style={{fontVariationSettings: "'FILL' 1"}}>lock</span>
                                <span className="text-[11px] font-bold text-on-tertiary-fixed-variant leading-tight">Unlock full itineraries & tips</span>
                            </div>
                            <button 
                                onClick={() => navigate('/login')}
                                className="text-[10px] font-black uppercase tracking-widest text-tertiary-container hover:text-tertiary hover:underline transition-colors whitespace-nowrap bg-white/50 px-3 py-1.5 rounded-full"
                            >
                                Sign Up Free
                            </button>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 md:p-6 pt-2 bg-white/40 backdrop-blur-md flex-shrink-0 border-t border-white/50 pb-[max(1rem,env(safe-area-inset-bottom))]">
                        <div className="relative flex items-center bg-surface-container-high rounded-full p-1.5 md:p-2 gap-2 shadow-inner border border-outline-variant/20 focus-within:bg-white focus-within:border-primary/30 transition-all duration-300">
                            <button className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full text-stone-400 hover:text-primary transition-colors flex-shrink-0">
                                <span className="material-symbols-outlined font-light">add</span>
                            </button>
                            <input 
                                className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-on-surface placeholder:text-stone-400 font-body py-2 min-w-0" 
                                placeholder="Message SafarAI..." 
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                            />
                            <button 
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading}
                                className="w-10 h-10 md:w-11 md:h-11 bg-primary hover:bg-primary-container text-white rounded-full flex items-center justify-center shadow-md disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 flex-shrink-0"
                            >
                                <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: "'FILL' 1", marginLeft: "2px"}}>send</span>
                            </button>
                        </div>
                        {/* Footer Text */}
                        <div className="mt-4 text-center">
                            <p className="text-[9px] text-stone-500 uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5 opacity-80">
                                <span className="material-symbols-outlined text-[12px]">info</span>
                                SafarAI can make mistakes. Verify important info.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Trigger */}
            <div className={`fixed bottom-[5.5rem] right-4 md:bottom-8 md:right-8 z-[61] transition-opacity duration-300 flex items-center gap-4
                ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                
                <div 
                    onClick={handleClickTrigger}
                    onPointerDown={handlePointerDown}
                    style={{ transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`, touchAction: 'none' }}
                    className="relative group flex items-center gap-3 cursor-grab active:cursor-grabbing hover:-translate-y-1 transition-transform"
                >
                    <div className="hidden lg:flex bg-white/90 backdrop-blur-md px-5 py-3 rounded-full shadow-[0_8px_32px_rgba(0,104,94,0.2)] border border-primary/20 mr-1 animate-fade-in pointer-events-none">
                        <span className="text-[13px] font-bold text-primary font-headline whitespace-nowrap">Plan Your Escape</span>
                    </div>

                    <div className="relative w-[65px] h-[65px] md:w-[72px] md:h-[72px] rounded-full bg-gradient-to-br from-primary via-primary-container to-secondary flex items-center justify-center text-white shadow-[0_12px_40px_rgba(0,104,94,0.4)] border-[3px] border-white/90 backdrop-blur-lg group-active:scale-95 transition-transform duration-300">
                        <span className="material-symbols-outlined text-[32px] md:text-[36px]" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
                        
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 overflow-hidden pointer-events-none"></div>
                        
                        {/* Notification Badge */}
                        <span className="absolute -top-1 -right-1 w-6 h-6 bg-[#D4A84B] text-white rounded-full border-[3px] border-white flex items-center justify-center shadow-md">
                            <span className="material-symbols-outlined text-[12px] font-bold">star</span>
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default FloatingChat;
