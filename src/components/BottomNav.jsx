import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const BottomNav = () => {
    const location = useLocation();
    
    // Helper function for active state logic
    const getLinkClasses = (path) => {
        const isActive = location.pathname === path;
        return `flex flex-col items-center justify-center p-2 pt-3 w-[4.5rem] relative transition-all duration-300 ease-out ${
            isActive ? "text-primary" : "text-stone-400 hover:text-stone-600"
        }`;
    };

    return (
        <nav className="md:hidden fixed bottom-0 w-full z-50 bg-surface/80 dark:bg-stone-900/80 backdrop-blur-xl border-t border-white/50 dark:border-white/5 shadow-[0_-10px_40px_rgba(0,104,94,0.08)] flex justify-between items-center px-4 pb-6 pt-1">
            <Link to="/dashboard" className={getLinkClasses('/dashboard')}>
                <span className="material-symbols-outlined dropdown" style={{fontVariationSettings: location.pathname === '/dashboard' ? "'FILL' 1" : "'FILL' 0", fontSize: '24px'}}>dashboard</span>
                <span className={`text-[10px] font-headline tracking-wide mt-1 ${location.pathname === '/dashboard' ? 'font-bold' : 'font-medium'}`}>Home</span>
            </Link>
            
            <Link to="/trips" className={getLinkClasses('/trips')}>
                <span className="material-symbols-outlined" style={{fontVariationSettings: location.pathname === '/trips' ? "'FILL' 1" : "'FILL' 0", fontSize: '24px'}}>route</span>
                <span className={`text-[10px] font-headline tracking-wide mt-1 ${location.pathname === '/trips' ? 'font-bold' : 'font-medium'}`}>Plan</span>
            </Link>

            <Link to="/activities" className={getLinkClasses('/activities')}>
                <span className="material-symbols-outlined" style={{fontVariationSettings: location.pathname === '/activities' ? "'FILL' 1" : "'FILL' 0", fontSize: '24px'}}>auto_awesome</span>
                <span className={`text-[10px] font-headline tracking-wide mt-1 ${location.pathname === '/activities' ? 'font-bold' : 'font-medium'}`}>AI</span>
            </Link>
            
            <Link to="/favorites" className={getLinkClasses('/favorites')}>
                 <span className="material-symbols-outlined" style={{fontVariationSettings: location.pathname === '/favorites' ? "'FILL' 1" : "'FILL' 0", fontSize: '24px'}}>bookmark</span>
                <span className={`text-[10px] font-headline tracking-wide mt-1 ${location.pathname === '/favorites' ? 'font-bold' : 'font-medium'}`}>Saved</span>
            </Link>
            
            <Link to="/settings" className={getLinkClasses('/settings')}>
                <span className="material-symbols-outlined" style={{fontVariationSettings: location.pathname === '/settings' ? "'FILL' 1" : "'FILL' 0", fontSize: '24px'}}>settings</span>
                <span className={`text-[10px] font-headline tracking-wide mt-1 ${location.pathname === '/settings' ? 'font-bold' : 'font-medium'}`}>Settings</span>
            </Link>
        </nav>
    );
};

export default BottomNav;
