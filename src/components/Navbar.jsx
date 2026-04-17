import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim() !== '') {
            navigate(`/activities?search=${encodeURIComponent(searchQuery)}`);
            setSearchQuery('');
        }
    };
    return (
        <header className="hidden md:flex justify-between items-center px-8 h-20 w-full bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-xl sticky top-0 z-30">
            <div className="flex items-center gap-8">
                <div className="hidden lg:flex gap-6">
                    <a className="text-teal-700 dark:text-teal-300 font-semibold border-b-2 border-teal-600 font-headline tracking-tight py-2" href="#">Explore</a>
                    <a className="text-stone-500 dark:text-stone-400 hover:text-teal-600 font-headline tracking-tight py-2" href="#">Concierge</a>
                    <a className="text-stone-500 dark:text-stone-400 hover:text-teal-600 font-headline tracking-tight py-2" href="#">Journal</a>
                    <a className="text-stone-500 dark:text-stone-400 hover:text-teal-600 font-headline tracking-tight py-2" href="#">Community</a>
                </div>
            </div>
            
            <div className="flex items-center gap-6">
                <div className="relative group hidden sm:block">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-stone-400 text-lg">search</span>
                    </div>
                    <input 
                        className="bg-surface-container border-none rounded-full py-2 pl-10 pr-4 text-sm w-64 focus:ring-1 focus:ring-primary/20 transition-all font-body" 
                        placeholder="Search destinations..." 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                    />
                </div>
                
                <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-stone-500 cursor-pointer hover:text-teal-600">notifications</span>
                    <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary-container cursor-pointer select-none">
                        <img 
                            alt="User profile avatar" 
                            className="h-full w-full object-cover" 
                            src="/avatar.png"
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
