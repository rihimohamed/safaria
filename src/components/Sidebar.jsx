import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
    return (
      <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 bg-stone-100 dark:bg-stone-900 flex-col p-6 gap-2 z-40">
            <div className="mb-10 px-2 flex items-center gap-3">
                <img src="/logo.png" alt="SafarAI Logo" className="w-24 h-24 object-contain" />
                <h1 className="text-xl font-extrabold text-teal-800 dark:text-teal-200 tracking-tighter font-headline">SafarAI</h1>
            </div>
            
            <nav className="flex-1 space-y-2">
                <NavLink 
                    to="/dashboard" 
                    className={({ isActive }) => 
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-transform hover:translate-x-1 ${isActive ? "bg-white dark:bg-stone-800 text-teal-900 dark:text-teal-100 shadow-sm font-semibold" : "text-stone-500 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800/50"}`
                    }>
                    <span className="material-symbols-outlined dropdown text-xl">dashboard</span>
                    <span className="font-headline text-sm">Overview</span>
                </NavLink>

                <NavLink 
                    to="/destinations" 
                    className={({ isActive }) => 
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-transform hover:translate-x-1 ${isActive ? "bg-white dark:bg-stone-800 text-teal-900 dark:text-teal-100 shadow-sm font-semibold" : "text-stone-500 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800/50"}`
                    }>
                    <span className="material-symbols-outlined text-xl">map</span>
                    <span className="font-headline text-sm">My Trips</span>
                </NavLink>

                <NavLink 
                    to="/activities" 
                    className={({ isActive }) => 
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-transform hover:translate-x-1 ${isActive ? "bg-white dark:bg-stone-800 text-teal-900 dark:text-teal-100 shadow-sm font-semibold" : "text-stone-500 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800/50"}`
                    }>
                    <span className="material-symbols-outlined text-xl">auto_awesome</span>
                    <span className="font-headline text-sm">AI Assistant</span>
                </NavLink>

                <NavLink 
                    to="/favorites" 
                    className={({ isActive }) => 
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-transform hover:translate-x-1 ${isActive ? "bg-white dark:bg-stone-800 text-teal-900 dark:text-teal-100 shadow-sm font-semibold" : "text-stone-500 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800/50"}`
                    }>
                    <span className="material-symbols-outlined text-xl">bookmark</span>
                    <span className="font-headline text-sm">Saved Places</span>
                </NavLink>
                
                <NavLink 
                    to="/trips" 
                    className={({ isActive }) => 
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-transform hover:translate-x-1 ${isActive ? "bg-white dark:bg-stone-800 text-teal-900 dark:text-teal-100 shadow-sm font-semibold" : "text-stone-500 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800/50"}`
                    }>
                    <span className="material-symbols-outlined text-xl">route</span>
                    <span className="font-headline text-sm">Roadtrip Planner</span>
                </NavLink>

                <NavLink 
                    to="/settings" 
                    className={({ isActive }) => 
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-transform hover:translate-x-1 ${isActive ? "bg-white dark:bg-stone-800 text-teal-900 dark:text-teal-100 shadow-sm font-semibold" : "text-stone-500 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800/50"}`
                    }>
                    <span className="material-symbols-outlined text-xl">settings</span>
                    <span className="font-headline text-sm">Settings</span>
                </NavLink>
            </nav>
            
            <div className="mt-auto pt-6 space-y-2 border-t border-stone-200 dark:border-stone-800">
                <button className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-xl font-bold text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all">
                    <span className="material-symbols-outlined text-xl">add</span>
                    New Adventure
                </button>
                <a className="flex items-center gap-3 px-4 py-3 text-stone-400 hover:text-teal-500 transition-colors text-sm" href="#">
                    <span className="material-symbols-outlined text-xl">help</span>
                    Support
                </a>
                <a className="flex items-center gap-3 px-4 py-3 text-stone-400 hover:text-red-500 transition-colors text-sm" href="#">
                    <span className="material-symbols-outlined text-xl">logout</span>
                    Log Out
                </a>
            </div>
        </aside>
    );
};

export default Sidebar;
